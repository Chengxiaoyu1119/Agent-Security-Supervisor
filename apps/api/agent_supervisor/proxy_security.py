from __future__ import annotations

import ipaddress
import os
import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import Header, HTTPException, Request

from .auth import require_api_token

_REQUEST_BUCKETS: dict[str, Deque[float]] = defaultdict(deque)


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int, *, minimum: int = 0, maximum: int = 10_000) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    return max(minimum, min(maximum, value))


def _client_host(request: Request) -> str:
    if _env_bool("AGENT_SUPERVISOR_TRUST_PROXY_HEADERS", False):
        forwarded_for = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if forwarded_for:
            return forwarded_for
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _is_local_or_private(host: str) -> bool:
    lowered = host.strip().lower()
    if lowered in {"localhost", "127.0.0.1", "::1"}:
        return True
    try:
        ip = ipaddress.ip_address(lowered)
    except ValueError:
        return False
    return ip.is_loopback or ip.is_private or ip.is_link_local


def _rate_limit_key(host: str, token: str) -> str:
    if token:
        return f"token:{token[:12]}"
    return f"ip:{host}"


def _enforce_rate_limit(key: str) -> None:
    limit = _env_int("AGENT_SUPERVISOR_PROXY_RATE_LIMIT_PER_MINUTE", 30, minimum=0, maximum=5000)
    if limit <= 0:
        return
    now = time.time()
    bucket = _REQUEST_BUCKETS[key]
    while bucket and now - bucket[0] >= 60:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="OpenAI 兼容代理请求过于频繁，请稍后再试。")
    bucket.append(now)


def proxy_security_snapshot() -> dict:
    auth_disabled = _env_bool("AGENT_SUPERVISOR_AUTH_DISABLED")
    return {
        "enabled": _env_bool("AGENT_SUPERVISOR_PROXY_ENABLED", True),
        "endpoint": "/v1/chat/completions",
        "auth_required": not auth_disabled,
        "local_unauthenticated_allowed": _env_bool("AGENT_SUPERVISOR_PROXY_ALLOW_LOCAL_UNAUTHENTICATED", True),
        "public_unauthenticated_allowed": _env_bool("AGENT_SUPERVISOR_PROXY_ALLOW_UNAUTHENTICATED_PUBLIC", False),
        "trust_proxy_headers": _env_bool("AGENT_SUPERVISOR_TRUST_PROXY_HEADERS", False),
        "rate_limit_per_minute": _env_int("AGENT_SUPERVISOR_PROXY_RATE_LIMIT_PER_MINUTE", 30, minimum=0, maximum=5000),
        "tracked_client_count": len(_REQUEST_BUCKETS),
    }


def reset_proxy_rate_limits() -> None:
    _REQUEST_BUCKETS.clear()


def require_openai_proxy_access(
    request: Request,
    authorization: str | None = Header(default=None),
    x_agent_supervisor_api_token: str | None = Header(default=None, alias="X-Agent-Supervisor-Api-Token"),
) -> dict:
    if not _env_bool("AGENT_SUPERVISOR_PROXY_ENABLED", True):
        raise HTTPException(status_code=404, detail="OpenAI 兼容代理未启用。")

    host = _client_host(request)
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    token = token or (x_agent_supervisor_api_token or "").strip()

    if _env_bool("AGENT_SUPERVISOR_AUTH_DISABLED"):
        local_or_private = _is_local_or_private(host)
        if local_or_private and not _env_bool("AGENT_SUPERVISOR_PROXY_ALLOW_LOCAL_UNAUTHENTICATED", True):
            raise HTTPException(status_code=401, detail="OpenAI 兼容代理未允许本地免鉴权访问。")
        if not local_or_private and not _env_bool("AGENT_SUPERVISOR_PROXY_ALLOW_UNAUTHENTICATED_PUBLIC", False):
            raise HTTPException(status_code=401, detail="公网访问 OpenAI 兼容代理必须开启 API Token 鉴权。")
    else:
        require_api_token(authorization=authorization, x_agent_supervisor_api_token=x_agent_supervisor_api_token)

    _enforce_rate_limit(_rate_limit_key(host, token))
    return {
        "client": host,
        "authenticated": bool(token) and not _env_bool("AGENT_SUPERVISOR_AUTH_DISABLED"),
    }
