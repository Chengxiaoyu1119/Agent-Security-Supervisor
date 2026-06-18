import os
from hmac import compare_digest

from fastapi import Header, HTTPException


def require_api_token(
    authorization: str | None = Header(default=None),
    x_zhian_api_token: str | None = Header(default=None, alias="X-Zhian-Api-Token"),
) -> None:
    expected_token = os.getenv("ZHIAN_API_TOKEN", "").strip()
    if not expected_token:
        return

    bearer_token = ""
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization[7:].strip()

    supplied_token = bearer_token or (x_zhian_api_token or "").strip()
    if not supplied_token or not compare_digest(supplied_token, expected_token):
        raise HTTPException(status_code=401, detail="Invalid or missing API token")
