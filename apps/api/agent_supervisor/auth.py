import os
from hmac import compare_digest

from fastapi import Header, HTTPException

ROLE_ORDER = {"observer": 1, "analyst": 2, "admin": 3}

def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def require_api_token(
    authorization: str | None = Header(default=None),
    x_agent_supervisor_api_token: str | None = Header(default=None, alias="X-Agent-Supervisor-Api-Token"),
) -> None:
    if _env_bool("AGENT_SUPERVISOR_AUTH_DISABLED"):
        return

    expected_token = (os.getenv("AGENT_SUPERVISOR_API_TOKEN") or "").strip()
    if not expected_token:
        raise HTTPException(
            status_code=503,
            detail=(
                "API token is not configured. Set AGENT_SUPERVISOR_API_TOKEN, "
                "or set AGENT_SUPERVISOR_AUTH_DISABLED=true for local demos only."
            ),
        )

    bearer_token = ""
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization[7:].strip()

    supplied_token = bearer_token or (x_agent_supervisor_api_token or "").strip()
    if not supplied_token or not compare_digest(supplied_token, expected_token):
        raise HTTPException(status_code=401, detail="Invalid or missing API token")


def current_security_role(
    x_agent_supervisor_role: str | None = Header(default=None, alias="X-Agent-Supervisor-Role"),
) -> str:
    if _env_bool("AGENT_SUPERVISOR_AUTH_DISABLED"):
        return "admin"
    role = (x_agent_supervisor_role or os.getenv("AGENT_SUPERVISOR_DEFAULT_ROLE", "observer") or "observer").strip().lower()
    return role if role in ROLE_ORDER else "observer"


def require_role(role: str, current_role: str) -> None:
    required = ROLE_ORDER.get(role, ROLE_ORDER["admin"])
    actual = ROLE_ORDER.get(current_role, ROLE_ORDER["observer"])
    if actual < required:
        raise HTTPException(status_code=403, detail=f"当前角色 {current_role} 无权执行该操作，需要 {role}")
