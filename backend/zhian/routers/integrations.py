from fastapi import APIRouter, HTTPException, Response, Body
from pydantic import BaseModel
from typing import Any
from .. import data
from ..database import latest_runs, load_run, latest_audit_logs
from ..model_adapter import provider_status
from ..agents import *
from ..attack_chains import *
from ..supervisor import *
from ..events import *
from ..readiness import *
from ..roadmap import *
from ..demo_drill import *
from ..calibration import *
from ..ablation import *
from ..assessment import *
from ..services.package_service import *
from ..openclaw_adapter import *
from ..surface_pack import *
from ..benign import *
from ..benign_workflows import *
from ..datasets import *
from ..approvals import *
from ..integrity import *
from ..main_models import *

router = APIRouter()

@router.get("/api/integrations/openclaw/schema")
def openclaw_schema() -> dict:
    return build_competition_package([])["adapter_schema"]


@router.get("/api/integrations/openclaw/adapter.py")
def openclaw_adapter_code() -> Response:
    return Response(build_openclaw_hook_example(), media_type="text/x-python; charset=utf-8")


@router.get("/api/integrations/openclaw/bundle")
def openclaw_integration_bundle() -> dict:
    return build_openclaw_integration_bundle()


@router.get("/api/integrations/openclaw/plugin_package")
def openclaw_plugin_package() -> dict:
    return build_openclaw_plugin_package_summary()


@router.get("/api/integrations/openclaw/plugin_package.md")
def openclaw_plugin_package_markdown() -> Response:
    return Response(build_openclaw_plugin_package_markdown(), media_type="text/markdown; charset=utf-8")


@router.post("/api/integrations/openclaw/plugin_package/write")
def write_openclaw_plugin_package_endpoint() -> dict:
    return write_openclaw_plugin_package()


@router.get("/api/integrations/openclaw/plugin_package/validation")
def openclaw_plugin_package_validation() -> dict:
    return validate_openclaw_plugin_package()


@router.get("/api/integrations/openclaw/plugin_package/validation.md")
def openclaw_plugin_package_validation_markdown() -> Response:
    return Response(build_openclaw_plugin_validation_markdown(), media_type="text/markdown; charset=utf-8")


@router.post("/api/integrations/openclaw/plugin_package/validation/write")
def write_openclaw_plugin_package_validation_endpoint(inspect_runtime: bool = False) -> dict:
    return write_openclaw_plugin_validation_report(inspect_runtime=inspect_runtime)


@router.post("/api/integrations/openclaw/minimal_agent_demo")
def openclaw_minimal_agent_demo() -> dict:
    return run_minimal_external_agent_demo()


@router.post("/api/integrations/openclaw/events")
def openclaw_event(event: AgentToolEvent) -> dict:
    try:
        result = evaluate_agent_event(event.dict(), guard_enabled=True, execute_in_sandbox=event.execute_in_sandbox)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "conversation_id": event.conversation_id,
        "agent_id": event.agent_id,
        "agent_role": event.agent_role,
        "tool_call": event.tool_call,
        **result,
    }


@router.post("/api/supervisor/evaluate")
def supervisor_evaluate(event: AgentToolEvent) -> dict:
    try:
        return evaluate_agent_event(
            event.dict(),
            guard_enabled=event.guard_enabled,
            execute_in_sandbox=event.execute_in_sandbox,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/supervisor/batch_evaluate")
def supervisor_batch_evaluate(request: Any = Body(...)) -> dict:
    if isinstance(request, list):
        batch = BatchAgentToolEvents(events=[AgentToolEvent(**event) for event in request])
    elif isinstance(request, dict):
        batch = BatchAgentToolEvents(**request)
    else:
        raise HTTPException(status_code=400, detail="批量事件必须是 JSON 数组，或包含 events 字段的对象。")
    results = []
    for event in batch.events:
        try:
            results.append(
                evaluate_agent_event(
                    event.dict(),
                    guard_enabled=batch.guard_enabled and event.guard_enabled,
                    execute_in_sandbox=batch.execute_in_sandbox or event.execute_in_sandbox,
                )
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    controlled = [item for item in results if item["decision"] in {"拒绝", "询问", "隔离"}]
    return {
        "total": len(results),
        "controlled": len(controlled),
        "control_rate": round((len(controlled) / len(results)) * 100) if results else 0,
        "results": results,
    }

