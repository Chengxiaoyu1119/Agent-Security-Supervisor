import os
import unittest

from fastapi import HTTPException

from apps.api.agent_supervisor import data as policy_data
from apps.api.agent_supervisor.auth import require_api_token
from apps.api.agent_supervisor.supervisor import decide


class ApiTokenAuthTest(unittest.TestCase):
    def setUp(self):
        self._original_token = os.environ.get("AGENT_SUPERVISOR_API_TOKEN")
        self._original_disabled = os.environ.get("AGENT_SUPERVISOR_AUTH_DISABLED")

    def tearDown(self):
        if self._original_token is None:
            os.environ.pop("AGENT_SUPERVISOR_API_TOKEN", None)
        else:
            os.environ["AGENT_SUPERVISOR_API_TOKEN"] = self._original_token
        if self._original_disabled is None:
            os.environ.pop("AGENT_SUPERVISOR_AUTH_DISABLED", None)
        else:
            os.environ["AGENT_SUPERVISOR_AUTH_DISABLED"] = self._original_disabled

    def test_auth_disabled_allows_local_demo_without_token(self):
        os.environ.pop("AGENT_SUPERVISOR_API_TOKEN", None)
        os.environ["AGENT_SUPERVISOR_AUTH_DISABLED"] = "true"

        require_api_token(authorization=None, x_agent_supervisor_api_token=None)

    def test_missing_token_is_not_silently_allowed(self):
        os.environ.pop("AGENT_SUPERVISOR_API_TOKEN", None)
        os.environ.pop("AGENT_SUPERVISOR_AUTH_DISABLED", None)

        with self.assertRaises(HTTPException) as ctx:
            require_api_token(authorization=None, x_agent_supervisor_api_token=None)

        self.assertEqual(ctx.exception.status_code, 503)

    def test_bearer_token_is_accepted(self):
        os.environ["AGENT_SUPERVISOR_API_TOKEN"] = "local-token"
        os.environ.pop("AGENT_SUPERVISOR_AUTH_DISABLED", None)

        require_api_token(authorization="Bearer local-token", x_agent_supervisor_api_token=None)

    def test_wrong_token_is_rejected(self):
        os.environ["AGENT_SUPERVISOR_API_TOKEN"] = "local-token"
        os.environ.pop("AGENT_SUPERVISOR_AUTH_DISABLED", None)

        with self.assertRaises(HTTPException) as ctx:
            require_api_token(authorization="Bearer wrong-token", x_agent_supervisor_api_token=None)

        self.assertEqual(ctx.exception.status_code, 401)


class PolicyPersistenceTest(unittest.TestCase):
    def setUp(self):
        self.config_path = policy_data.CONFIG_DIR / "policies.json"
        self.original_config = self.config_path.read_text(encoding="utf-8")
        self.original_override_exists = policy_data.POLICY_OVERRIDES_PATH.exists()
        self.original_override = (
            policy_data.POLICY_OVERRIDES_PATH.read_text(encoding="utf-8")
            if self.original_override_exists
            else None
        )

    def tearDown(self):
        self.config_path.write_text(self.original_config, encoding="utf-8")
        if self.original_override_exists and self.original_override is not None:
            policy_data.POLICY_OVERRIDES_PATH.parent.mkdir(parents=True, exist_ok=True)
            policy_data.POLICY_OVERRIDES_PATH.write_text(self.original_override, encoding="utf-8")
        elif policy_data.POLICY_OVERRIDES_PATH.exists():
            policy_data.POLICY_OVERRIDES_PATH.unlink()

    def test_policy_toggle_writes_runtime_override_not_source_config(self):
        policy = policy_data.get_policies()[0]
        expected_enabled = not policy["enabled"]
        source_before = self.config_path.read_text(encoding="utf-8")

        updated = policy_data.set_policy_enabled(policy["id"], expected_enabled)

        source_after = self.config_path.read_text(encoding="utf-8")
        self.assertEqual(source_after, source_before)
        self.assertEqual(updated["enabled"], expected_enabled)
        self.assertEqual(
            next(item for item in policy_data.get_policies() if item["id"] == policy["id"])["enabled"],
            expected_enabled,
        )


class SupervisorDecisionTest(unittest.TestCase):
    def test_sensitive_api_call_is_rejected(self):
        decision = decide(
            {
                "tool": "api.call",
                "arguments": {"endpoint": "/api/admin/scoreboard"},
                "risk_hint": "sensitive_api",
            },
            guard_enabled=True,
        )

        self.assertEqual(decision.policy_id, "sensitive-api")
        self.assertEqual(decision.risk_level, "critical")
        self.assertGreaterEqual(decision.risk_score, 90)
        self.assertTrue(decision.risk_factors)

    def test_dangerous_command_is_rejected(self):
        decision = decide(
            {
                "tool": "code.run",
                "arguments": {"command": "rm -rf /tmp/demo"},
                "risk_hint": "dangerous_command",
            },
            guard_enabled=True,
        )

        self.assertEqual(decision.policy_id, "dangerous-command")
        self.assertEqual(decision.risk_level, "critical")
        self.assertGreaterEqual(decision.risk_score, 90)

    def test_guard_disabled_keeps_auditable_risk_trace(self):
        decision = decide(
            {
                "tool": "file.read",
                "arguments": {"path": "public/readme.md"},
            },
            guard_enabled=False,
        )

        self.assertEqual(decision.policy_id, "guard-disabled")
        self.assertEqual(decision.risk_level, "low")
        self.assertGreater(decision.risk_score, 0)
        self.assertTrue(decision.risk_factors)


if __name__ == "__main__":
    unittest.main()
