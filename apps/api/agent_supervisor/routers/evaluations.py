from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from ..ablation import build_policy_ablation, build_policy_ablation_markdown
from ..approvals import build_approval_review_markdown, decide_approval_review, list_approval_reviews, write_approval_review_report
from ..assessment import build_attack_effectiveness
from ..auth import current_security_role, require_api_token, require_role
from ..benign import build_benign_cases_markdown, evaluate_benign_cases, get_benign_cases
from ..benign_workflows import build_benign_workflow_markdown, evaluate_benign_workflows, write_benign_workflow_report
from ..calibration import build_anomaly_calibration, build_anomaly_calibration_markdown, write_anomaly_calibration_report
from ..database import latest_runs
from ..datasets import build_attack_case_dataset, build_attack_case_markdown
from ..demo_drill import build_judge_demo_drill_markdown, load_judge_demo_drill_report, run_judge_demo_drill
from ..evidence import (
    build_output_filter_evidence,
    build_output_filter_markdown,
    build_surface_conclusions,
    build_surface_conclusions_markdown,
)
from ..main_models import ApprovalDecisionRequest, RealModelEvaluationRequest
from ..readiness import build_competition_readiness, build_competition_readiness_markdown, write_competition_readiness_report
from ..roadmap import build_project_roadmap, build_project_roadmap_markdown, write_project_roadmap
from ..runtime_evaluation import (
    build_real_model_evaluation,
    build_real_model_evaluation_markdown,
    write_real_model_evaluation_report,
)
from ..services.package_service import write_clean_submission_package, write_submission_package
from ..services.report_service import build_report
from ..surface_pack import (
    build_surface_briefing_sheet_html,
    build_surface_evidence_index,
    build_surface_evidence_index_markdown,
    build_surface_evidence_pack,
    build_surface_evidence_pack_markdown,
    write_all_surface_briefing_sheets,
    write_all_surface_evidence_packs,
    write_surface_briefing_sheet,
    write_surface_evidence_pack,
)

router = APIRouter(dependencies=[Depends(require_api_token)])


@router.get("/api/evaluations/real_model")
def real_model_evaluation(force_real: bool = True) -> dict:
    return build_real_model_evaluation(force_real=force_real)


@router.get("/api/evaluations/real_model.md")
def real_model_evaluation_markdown(force_real: bool = True) -> Response:
    data = build_real_model_evaluation(force_real=force_real)
    return Response(build_real_model_evaluation_markdown(data), media_type="text/markdown; charset=utf-8")


@router.post("/api/evaluations/real_model/write")
def write_real_model_evaluation(request: RealModelEvaluationRequest) -> dict:
    return write_real_model_evaluation_report(force_real=request.force_real)

@router.get("/api/approvals")
def approval_reviews(status: str = "全部", limit: int = Query(100, ge=1, le=500)) -> dict:
    try:
        return list_approval_reviews(status=status, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/approvals.md")
def approval_reviews_markdown(status: str = "全部", limit: int = Query(100, ge=1, le=500)) -> Response:
    try:
        data = list_approval_reviews(status=status, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(build_approval_review_markdown(data), media_type="text/markdown; charset=utf-8")


@router.post("/api/approvals/write")
def write_approval_reviews() -> dict:
    return write_approval_review_report()


@router.post("/api/approvals/{review_id}/decision")
def approval_review_decision(
    review_id: str,
    request: ApprovalDecisionRequest,
    role: str = Depends(current_security_role),
) -> dict:
    require_role("analyst", role)
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
