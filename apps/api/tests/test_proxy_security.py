from __future__ import annotations

import os
import unittest
from types import SimpleNamespace
from typing import Any

from fastapi import HTTPException

from apps.api.agent_supervisor.proxy_security import require_openai_proxy_access, reset_proxy_rate_limits


class ProxySecurityTest(unittest.TestCase):
    def setUp(self) -> None:
        self._env = {
            key: os.environ.get(key)
            for key in [
                "AGENT_SUPERVISOR_AUTH_DISABLED",
                "AGENT_SUPERVISOR_API_TOKEN",
                "AGENT_SUPERVISOR_PROXY_ALLOW_UNAUTHENTICATED_PUBLIC",
                "AGENT_SUPERVISOR_PROXY_ALLOW_LOCAL_UNAUTHENTICATED",
                "AGENT_SUPERVISOR_PROXY_RATE_LIMIT_PER_MINUTE",
                "AGENT_SUPERVISOR_PROXY_ENABLED",
                "AGENT_SUPERVISOR_TRUST_PROXY_HEADERS",
            ]
        }
        reset_proxy_rate_limits()

    def tearDown(self) -> None:
        for key, value in self._env.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        reset_proxy_rate_limits()

    def _request(self, host: str, forwarded_for: str = "") -> Any:
        headers = {"x-forwarded-for": forwarded_for} if forwarded_for else {}
        return SimpleNamespace(headers=headers, client=SimpleNamespace(host=host))

    def test_public_proxy_is_rejected_when_auth_is_disabled(self) -> None:
        os.environ["AGENT_SUPERVISOR_AUTH_DISABLED"] = "true"
        os.environ["AGENT_SUPERVISOR_PROXY_ALLOW_UNAUTHENTICATED_PUBLIC"] = "false"

        with self.assertRaises(HTTPException) as ctx:
            require_openai_proxy_access(
                self._request("8.8.8.8"),
                authorization=None,
                x_agent_supervisor_api_token=None,
            )

        self.assertEqual(ctx.exception.status_code, 401)

    def test_proxy_does_not_trust_spoofed_forwarded_for_by_default(self) -> None:
        os.environ["AGENT_SUPERVISOR_AUTH_DISABLED"] = "true"
        os.environ["AGENT_SUPERVISOR_PROXY_ALLOW_UNAUTHENTICATED_PUBLIC"] = "false"
        os.environ["AGENT_SUPERVISOR_TRUST_PROXY_HEADERS"] = "false"

        with self.assertRaises(HTTPException) as ctx:
            require_openai_proxy_access(
                self._request("8.8.8.8", forwarded_for="127.0.0.1"),
                authorization=None,
                x_agent_supervisor_api_token=None,
            )

        self.assertEqual(ctx.exception.status_code, 401)

    def test_proxy_can_trust_forwarded_for_when_explicitly_enabled(self) -> None:
        os.environ["AGENT_SUPERVISOR_AUTH_DISABLED"] = "true"
        os.environ["AGENT_SUPERVISOR_PROXY_ALLOW_LOCAL_UNAUTHENTICATED"] = "true"
        os.environ["AGENT_SUPERVISOR_TRUST_PROXY_HEADERS"] = "true"
        os.environ["AGENT_SUPERVISOR_PROXY_RATE_LIMIT_PER_MINUTE"] = "0"

        result = require_openai_proxy_access(
            self._request("8.8.8.8", forwarded_for="127.0.0.1"),
            authorization=None,
            x_agent_supervisor_api_token=None,
        )

        self.assertEqual(result["client"], "127.0.0.1")

    def test_local_proxy_allows_local_demo_when_auth_is_disabled(self) -> None:
        os.environ["AGENT_SUPERVISOR_AUTH_DISABLED"] = "true"
        os.environ["AGENT_SUPERVISOR_PROXY_ALLOW_LOCAL_UNAUTHENTICATED"] = "true"
        os.environ["AGENT_SUPERVISOR_PROXY_RATE_LIMIT_PER_MINUTE"] = "0"

        result = require_openai_proxy_access(
            self._request("127.0.0.1"),
            authorization=None,
            x_agent_supervisor_api_token=None,
        )

        self.assertEqual(result["client"], "127.0.0.1")

    def test_proxy_requires_token_when_auth_is_enabled(self) -> None:
        os.environ["AGENT_SUPERVISOR_AUTH_DISABLED"] = "false"
        os.environ["AGENT_SUPERVISOR_API_TOKEN"] = "proxy-token"

        result = require_openai_proxy_access(self._request("8.8.8.8"), authorization="Bearer proxy-token")

        self.assertTrue(result["authenticated"])

    def test_proxy_rate_limit_blocks_repeated_calls(self) -> None:
        os.environ["AGENT_SUPERVISOR_AUTH_DISABLED"] = "true"
        os.environ["AGENT_SUPERVISOR_PROXY_ALLOW_LOCAL_UNAUTHENTICATED"] = "true"
        os.environ["AGENT_SUPERVISOR_PROXY_RATE_LIMIT_PER_MINUTE"] = "1"
        request = self._request("127.0.0.1")

        require_openai_proxy_access(request, authorization=None, x_agent_supervisor_api_token=None)
        with self.assertRaises(HTTPException) as ctx:
            require_openai_proxy_access(request, authorization=None, x_agent_supervisor_api_token=None)

        self.assertEqual(ctx.exception.status_code, 429)


if __name__ == "__main__":
    unittest.main()
