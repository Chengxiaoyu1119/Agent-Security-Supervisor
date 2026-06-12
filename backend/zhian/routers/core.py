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


@router.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "zhian-shao"}


@router.get("/api/overview")
def overview() -> dict:
    runs = latest_runs(12)
    alerts = [alert for run in runs for alert in run.get("alerts", [])][:8]
    audit_logs = [log for run in runs for log in run.get("audit_logs", [])][:12]
    total = len(runs)
    blocked = sum(1 for run in runs if run["metrics"]["blocked_count"] > 0)
    attack_successes = sum(1 for run in runs if run["attack_success"])
    return {
        "attack_surfaces": get_attack_surfaces(),
        "student_competition_attack_map": get_student_competition_attack_map(),
        "scenarios": get_scenarios(),
        "models": provider_status(),
        "recent_runs": runs,
        "alerts": alerts,
        "audit_logs": audit_logs,
        "summary": {
            "surface_count": len(get_attack_surfaces()),
            "scenario_count": len(get_scenarios()),
            "recent_run_count": total,
            "block_rate": round((blocked / total) * 100) if total else 0,
            "attack_success_rate": round((attack_successes / total) * 100) if total else 0,
            "avg_latency_ms": round(sum(run["metrics"]["detection_latency_ms"] for run in runs) / total) if total else 0,
        },
    }


@router.get("/api/student_competition_attack_map")
def student_competition_attack_map() -> list[dict]:
    return get_student_competition_attack_map()


@router.get("/api/policies")
def policies() -> list[dict]:
    return get_policies()


@router.patch("/api/policies/{policy_id}")
def update_policy(policy_id: str, request: PolicyUpdate) -> dict:
    try:
        return set_policy_enabled(policy_id, request.enabled)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"未知策略：{policy_id}") from exc


@router.get("/api/models")
def models() -> list[dict]:
    return provider_status()


@router.get("/api/audit_logs")
def audit_logs(limit: int = 100) -> list[dict]:
    return latest_audit_logs(limit)


@router.get("/api/alerts")
def alerts(limit: int = 100) -> list[dict]:
    runs = latest_runs(limit)
    enriched = []
    for run in runs:
        scenario = run.get("scenario", {})
        audit_logs = run.get("audit_logs", [])
        for alert in run.get("alerts", []):
            matched_log = next(
                (
                    log
                    for log in audit_logs
                    if log.get("decision") == alert.get("decision")
                    and log.get("reason") == alert.get("evidence")
                ),
                audit_logs[0] if audit_logs else {},
            )
            enriched.append(
                {
                    **alert,
                    "scenario_id": scenario.get("id", ""),
                    "scenario_title": scenario.get("title", ""),
                    "surface_id": scenario.get("surface_id", ""),
                    "target": scenario.get("target", ""),
                    "policy_id": matched_log.get("policy_id", "unknown"),
                    "tool": matched_log.get("tool", ""),
                    "arguments": matched_log.get("arguments", {}),
                    "recommendation": matched_log.get("recommendation", ""),
                    "tool_output": matched_log.get("tool_output", {}),
                }
            )
    return enriched[:limit]


@router.get("/api/deliverables")
def deliverables() -> dict:
    return build_competition_package(latest_runs(50))

