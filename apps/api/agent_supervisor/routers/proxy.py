from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import StreamingResponse

from ..openai_proxy import run_openai_proxy_completion, stream_openai_proxy_completion
from ..proxy_security import require_openai_proxy_access

router = APIRouter()


@router.post("/v1/chat/completions")
def openai_compatible_chat_completion(
    request: Any = Body(...),
    _security_context: dict = Depends(require_openai_proxy_access),
) -> Any:
    if not isinstance(request, dict):
        raise HTTPException(status_code=400, detail="OpenAI 兼容请求必须是 JSON 对象。")
    if request.get("stream") is True:
        return StreamingResponse(
            stream_openai_proxy_completion(request),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Agent-Supervisor-Proxy": "openai-compatible",
            },
        )
    return run_openai_proxy_completion(request)
