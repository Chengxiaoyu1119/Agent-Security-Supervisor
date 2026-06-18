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
from ..services.report_service import build_report
from ..openclaw_adapter import *
from ..surface_pack import *
from ..benign import *
from ..benign_workflows import *
from ..datasets import *
from ..approvals import *
from ..integrity import *
from ..main_models import *
from ..evidence import *

router = APIRouter()

@router.get("/api/approvals")
def approval_reviews(status: str = "全部", limit: int = 100) -> dict:
    try:
        return list_approval_reviews(status=status, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/approvals.md")
def approval_reviews_markdown(status: str = "全部", limit: int = 100) -> Response:
    try:
        data = list_approval_reviews(status=status, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(build_approval_review_markdown(data), media_type="text/markdown; charset=utf-8")


@router.post("/api/approvals/write")
def write_approval_reviews() -> dict:
    return write_approval_review_report()


@router.post("/api/approvals/{review_id}/decision")
def approval_review_decision(review_id: str, request: ApprovalDecisionRequest) -> dict:
    try:
        return decide_approval_review(
            review_id,
            action=request.action,
            operator=request.operator,
            comment=request.comment,
            execute_in_sandbox=request.execute_in_sandbox,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"未知复核单：{review_id}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/datasets/attack_cases")
def attack_cases_dataset(surface_id: str | None = None) -> dict:
    return build_attack_case_dataset(surface_id)


@router.get("/api/datasets/attack_cases.md")
def attack_cases_markdown(surface_id: str | None = None) -> Response:
    return Response(build_attack_case_markdown(surface_id), media_type="text/markdown; charset=utf-8")


@router.get("/api/project_roadmap")
def project_roadmap() -> dict:
    return build_project_roadmap(latest_runs(500))


@router.get("/api/project_roadmap.md")
def project_roadmap_markdown() -> Response:
    return Response(build_project_roadmap_markdown(latest_runs(500)), media_type="text/markdown; charset=utf-8")


@router.post("/api/project_roadmap/write")
def write_project_roadmap_report() -> dict:
    return write_project_roadmap(runs=latest_runs(500))


@router.get("/api/readiness")
def competition_readiness() -> dict:
    return build_competition_readiness(latest_runs(500))


@router.get("/api/readiness.md")
def competition_readiness_markdown() -> Response:
    return Response(build_competition_readiness_markdown(build_competition_readiness(latest_runs(500))), media_type="text/markdown; charset=utf-8")


@router.post("/api/readiness/write")
def write_competition_readiness() -> dict:
    return write_competition_readiness_report()


@router.get("/api/demo_drill")
def judge_demo_drill_preview() -> dict:
    return load_judge_demo_drill_report()


@router.get("/api/demo_drill.md")
def judge_demo_drill_markdown() -> Response:
    return Response(build_judge_demo_drill_markdown(load_judge_demo_drill_report()), media_type="text/markdown; charset=utf-8")


@router.post("/api/demo_drill/run")
def run_judge_demo_drill_endpoint() -> dict:
    return run_judge_demo_drill()


@router.post("/api/demo_drill/write")
def write_judge_demo_drill_endpoint() -> dict:
    return run_judge_demo_drill()


@router.get("/api/evaluations/anomaly_calibration")
def anomaly_calibration() -> dict:
    return build_anomaly_calibration()


@router.get("/api/evaluations/anomaly_calibration.md")
def anomaly_calibration_markdown() -> Response:
    return Response(build_anomaly_calibration_markdown(), media_type="text/markdown; charset=utf-8")


@router.post("/api/evaluations/anomaly_calibration/write")
def write_anomaly_calibration() -> dict:
    return write_anomaly_calibration_report()


@router.get("/api/attack_surfaces/evidence_packs")
def attack_surface_evidence_packs() -> dict:
    return build_surface_evidence_index(latest_runs(500))


@router.get("/api/attack_surfaces/evidence_packs.md")
def attack_surface_evidence_packs_markdown() -> Response:
    return Response(build_surface_evidence_index_markdown(latest_runs(500)), media_type="text/markdown; charset=utf-8")


@router.post("/api/attack_surfaces/evidence_packs/write")
def write_attack_surface_evidence_packs() -> dict:
    return write_all_surface_evidence_packs(runs=latest_runs(500))


@router.post("/api/attack_surfaces/briefing_sheets/write")
def write_attack_surface_briefing_sheets() -> dict:
    return write_all_surface_briefing_sheets(runs=latest_runs(500))


@router.get("/api/attack_surfaces/{surface_id}/evidence_pack")
def attack_surface_evidence_pack(surface_id: str) -> dict:
    try:
        return build_surface_evidence_pack(surface_id, latest_runs(500))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"未知攻击面：{surface_id}") from exc


@router.get("/api/attack_surfaces/{surface_id}/evidence_pack.md")
def attack_surface_evidence_pack_markdown(surface_id: str) -> Response:
    try:
        return Response(build_surface_evidence_pack_markdown(surface_id, latest_runs(500)), media_type="text/markdown; charset=utf-8")
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"未知攻击面：{surface_id}") from exc


@router.post("/api/attack_surfaces/{surface_id}/evidence_pack/write")
def write_attack_surface_evidence_pack(surface_id: str) -> dict:
    try:
        return write_surface_evidence_pack(surface_id, runs=latest_runs(500))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"未知攻击面：{surface_id}") from exc


@router.get("/api/attack_surfaces/{surface_id}/briefing_sheet.html")
def attack_surface_briefing_sheet(surface_id: str) -> Response:
    try:
        return Response(build_surface_briefing_sheet_html(surface_id, latest_runs(500)), media_type="text/html; charset=utf-8")
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"未知攻击面：{surface_id}") from exc


@router.post("/api/attack_surfaces/{surface_id}/briefing_sheet/write")
def write_attack_surface_briefing_sheet(surface_id: str) -> dict:
    try:
        return write_surface_briefing_sheet(surface_id, runs=latest_runs(500))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"未知攻击面：{surface_id}") from exc


@router.get("/api/datasets/benign_cases")
def benign_cases_dataset(category: str | None = None) -> dict:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filter": {"category": category},
        "cases": get_benign_cases(category),
    }


@router.get("/api/datasets/benign_cases.md")
def benign_cases_markdown(category: str | None = None) -> Response:
    return Response(build_benign_cases_markdown(category), media_type="text/markdown; charset=utf-8")


@router.get("/api/evaluations/benign")
def benign_evaluation(category: str | None = None, guard_enabled: bool = True) -> dict:
    return evaluate_benign_cases(category, guard_enabled=guard_enabled)


@router.get("/api/evaluations/benign_workflows")
def benign_workflow_evaluation(guard_enabled: bool = True) -> dict:
    return evaluate_benign_workflows(guard_enabled=guard_enabled)


@router.get("/api/evaluations/benign_workflows.md")
def benign_workflow_markdown() -> Response:
    return Response(build_benign_workflow_markdown(), media_type="text/markdown; charset=utf-8")


@router.post("/api/evaluations/benign_workflows/write")
def write_benign_workflow_report_endpoint() -> dict:
    return write_benign_workflow_report()


@router.get("/api/evaluations/surface_conclusions")
def surface_conclusions() -> dict:
    return build_surface_conclusions(latest_runs(50))


@router.get("/api/evaluations/surface_conclusions.md")
def surface_conclusions_markdown() -> Response:
    return Response(build_surface_conclusions_markdown(latest_runs(50)), media_type="text/markdown; charset=utf-8")


@router.get("/api/evaluations/output_filter")
def output_filter_evidence() -> dict:
    return build_output_filter_evidence()


@router.get("/api/evaluations/output_filter.md")
def output_filter_markdown() -> Response:
    return Response(build_output_filter_markdown(), media_type="text/markdown; charset=utf-8")


@router.get("/api/evaluations/attack_effectiveness")
def attack_effectiveness() -> dict:
    return build_attack_effectiveness(latest_runs(500))


@router.get("/api/evaluations/policy_ablation")
def policy_ablation() -> dict:
    return build_policy_ablation()


@router.get("/api/evaluations/policy_ablation.md")
def policy_ablation_markdown() -> Response:
    return Response(build_policy_ablation_markdown(), media_type="text/markdown; charset=utf-8")


@router.get("/api/evaluations/requirements")
def requirement_alignment() -> list[dict]:
    return build_attack_effectiveness(latest_runs(500))["requirement_alignment"]


@router.post("/api/submission_package")
def submission_package() -> dict:
    return write_submission_package(latest_runs(50))


@router.post("/api/submission_package/clean")
def clean_submission_package() -> dict:
    return write_clean_submission_package()


@router.get("/api/report")
def report() -> dict:
    return build_report()