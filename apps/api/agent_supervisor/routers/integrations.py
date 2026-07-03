from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse

from ..agent_integrations import build_agent_integration_bundle, build_agent_integration_markdown
from ..attack_lab import list_attack_lab_modules, run_attack_lab_module
from ..attack_testsets import list_attack_testsets, run_attack_testset
from ..auth import require_api_token
from ..capability_replay import run_capability_replay
from ..event_stream import stream_runtime_events
from ..events import evaluate_agent_event
from ..external_agent_demo import run_minimal_external_agent_demo
from ..main_models import (
    AgentToolEvent,
    AttackLabRunRequest,
    AttackTestsetRunRequest,
    AuthorizedTargetRunRequest,
    BatchAgentToolEvents,
    DualModelJailbreakRequest,
    JailbreakRedteamRequest,
    LearningLabRunRequest,
)
from ..openclaw_adapter import build_openclaw_hook_example, build_openclaw_integration_bundle
from ..openclaw_plugin_package import (
    build_openclaw_plugin_package_markdown,
    build_openclaw_plugin_package_summary,
    build_openclaw_plugin_validation_markdown,
    validate_openclaw_plugin_package,
    write_openclaw_plugin_package,
    write_openclaw_plugin_validation_report,
)
from ..penetration_lab import list_learning_scenarios, run_learning_attack
from ..redteam_lab import run_authorized_target_test, run_dual_model_jailbreak, run_jailbreak_redteam
from ..services.package_service import build_competition_package
from ..target_lab import reset_target_lab, target_lab_snapshot

router = APIRouter(dependencies=[Depends(require_api_token)])


@router.get("/api/events/stream")
def runtime_event_stream() -> StreamingResponse:
    return StreamingResponse(
        stream_runtime_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/api/integrations/openclaw/schema")
def openclaw_schema() -> dict:
    return build_competition_package([])["adapter_schema"]


@router.get("/api/integrations/agents/bundle")
def agent_integration_bundle() -> dict:
    return build_agent_integration_bundle()


@router.get("/api/integrations/agents/bundle.md")
def agent_integration_bundle_markdown() -> Response:
    return Response(build_agent_integration_markdown(), media_type="text/markdown; charset=utf-8")


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


@router.get("/api/attack_lab/modules")
def attack_lab_modules() -> dict:
    return list_attack_lab_modules()


@router.post("/api/attack_lab/run")
def attack_lab_run(request: AttackLabRunRequest) -> dict:
    try:
        return run_attack_lab_module(request.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/attack_lab/testsets")
def attack_lab_testsets() -> dict:
    return list_attack_testsets()


@router.post("/api/attack_lab/testsets/run")
def attack_lab_testset_run(request: AttackTestsetRunRequest) -> dict:
    try:
        return run_attack_testset(request.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/capability_replay/run")
def capability_replay_run() -> dict:
    return run_capability_replay()


@router.get("/api/learning_lab/scenarios")
def learning_lab_scenarios() -> dict:
    return list_learning_scenarios()


@router.post("/api/learning_lab/run")
def learning_lab_run(request: LearningLabRunRequest) -> dict:
    try:
        return run_learning_attack(request.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/redteam_lab/jailbreak/run")
def redteam_jailbreak_run(request: JailbreakRedteamRequest) -> dict:
    try:
        return run_jailbreak_redteam(request.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/redteam_lab/jailbreak/dual_model/run")
def redteam_dual_model_jailbreak_run(request: DualModelJailbreakRequest) -> dict:
    try:
        return run_dual_model_jailbreak(request.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/api/redteam_lab/authorized_target/run")
def redteam_authorized_target_run(request: AuthorizedTargetRunRequest) -> dict:
    try:
        return run_authorized_target_test(request.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/target_lab/state")
def target_lab_state() -> dict:
    return target_lab_snapshot()


@router.post("/api/target_lab/reset")
def target_lab_reset() -> dict:
    return reset_target_lab()


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

