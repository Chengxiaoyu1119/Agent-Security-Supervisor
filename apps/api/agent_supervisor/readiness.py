from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .approvals import list_approval_reviews
from .attack_chains import list_attack_chains
from .benign import evaluate_benign_cases
from .benign_workflows import evaluate_benign_workflows
from .calibration import build_anomaly_calibration
from .data import get_attack_surfaces, get_policies, get_scenarios, get_student_competition_attack_map
from .database import latest_runs
from .datasets import build_attack_case_dataset
from .demo_drill import load_judge_demo_drill_report
from .openclaw_plugin_package import validate_openclaw_plugin_package
from .paths import SANDBOX_REPORTS_DIR, SUBMISSION_PACKAGES_DIR
from .readiness_checks import (
    _approval_review_check,
    _attack_dataset_check,
    _attack_surface_check,
    _benign_check,
    _benign_workflow_check,
    _calibration_check,
    _demo_drill_check,
    _latest_submission_package,
    _next_actions,
    _openclaw_runtime_check,
    _openclaw_static_check,
    _screenshot_evidence_check,
    _student_competition_domain_check,
    _submission_package_check,
    _supervisor_check,
)
from .roadmap import build_project_roadmap

REPORT_ROOT = SANDBOX_REPORTS_DIR
SUBMISSION_ROOT = SUBMISSION_PACKAGES_DIR


def build_competition_readiness(
    runs: list[dict[str, Any]] | None = None,
    package_snapshot: dict[str, Any] | None = None,
) -> dict[str, Any]:
    runs = runs if runs is not None else latest_runs(500)
    surfaces = get_attack_surfaces()
    scenarios = get_scenarios()
    policies = get_policies()
    student_profiles = get_student_competition_attack_map()
    attack_chains = list_attack_chains()
    attack_dataset = build_attack_case_dataset()
    benign = evaluate_benign_cases()
    workflows = evaluate_benign_workflows()
    calibration = build_anomaly_calibration()
    roadmap = build_project_roadmap(runs)
    approvals = list_approval_reviews(limit=200)
    demo_drill = load_judge_demo_drill_report()
    openclaw_validation = _openclaw_validation_for_readiness()
    latest_package = package_snapshot or _latest_submission_package()

    checks = [
        _attack_surface_check(surfaces, scenarios),
        _student_competition_domain_check(student_profiles, scenarios, attack_chains),
        _attack_dataset_check(attack_dataset),
        _supervisor_check(policies, scenarios, runs),
        _benign_check(benign),
        _benign_workflow_check(workflows),
        _calibration_check(calibration),
        _approval_review_check(approvals),
        _demo_drill_check(demo_drill),
        _openclaw_static_check(openclaw_validation),
        _openclaw_runtime_check(openclaw_validation),
        _submission_package_check(latest_package),
        _screenshot_evidence_check(latest_package),
    ]
    total_weight = sum(item["weight"] for item in checks)
    readiness_score = round(sum(item["earned_score"] for item in checks) / total_weight * 100) if total_weight else 0
    blockers = [item for item in checks if item["status"] == "blocked"]
    warnings = [item for item in checks if item["status"] == "warning"]
    passed = [item for item in checks if item["status"] == "passed"]

    if blockers:
        overall_status = "has-p0-proof-gap"
        status_label = "有 P0 补证项"
        verdict = "项目主体已经可演示、可打包，但还缺真实 OpenClaw runtime inspect 这类外部环境证明。"
    elif warnings:
        overall_status = "ready-with-warning"
        status_label = "可提交但建议补强"
        verdict = "核心材料已经成型，剩余问题不影响本地演示，但会影响答辩说服力。"
    else:
        overall_status = "ready"
        status_label = "可提交"
        verdict = "核心功能、证据、提交包和截图链路均已通过本地体检。"

    next_actions = _next_actions(checks)
    return {
        "project": "智安哨：大模型智能体攻击面研究与行为监督平台",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "overall_status": overall_status,
        "status_label": status_label,
        "verdict": verdict,
        "readiness_score": readiness_score,
        "summary": {
            "check_count": len(checks),
            "passed_count": len(passed),
            "warning_count": len(warnings),
            "blocker_count": len(blockers),
            "surface_count": len(surfaces),
            "scenario_count": len(scenarios),
            "student_profile_count": len(student_profiles),
            "student_scenario_count": sum(
                1 for scenario in scenarios if str(scenario.get("id", "")).startswith(("TEAM-", "SUBMISSION-", "CHALLENGE-", "JUDGE-", "CAMPUS-"))
            ),
            "attack_chain_count": len(attack_chains),
            "student_attack_chain_ready": any(chain.get("id") == "student-competition-portal-chain" for chain in attack_chains),
            "policy_count": len(policies),
            "benign_case_count": benign["summary"]["case_count"],
            "benign_false_positive_rate": benign["summary"]["false_positive_rate"],
            "benign_workflow_count": workflows["summary"]["workflow_count"],
            "benign_workflow_false_positive_rate": workflows["summary"]["false_positive_rate"],
            "recommended_threshold": calibration["summary"]["recommended_threshold"],
            "approval_review_count": approvals["summary"]["total"],
            "pending_approval_count": approvals["summary"]["pending_count"],
            "resolved_approval_count": approvals["summary"]["approved_count"] + approvals["summary"]["rejected_count"],
            "demo_drill_stage_count": demo_drill["summary"]["stage_count"],
            "demo_drill_review_hash_count": demo_drill["summary"]["review_hash_count"],
            "roadmap_score": roadmap["summary"]["overall_score"],
            "roadmap_p0_backlog_count": roadmap["summary"]["p0_backlog_count"],
            "latest_package_zip": latest_package.get("zip_path", ""),
            "latest_package_dir": latest_package.get("package_dir", ""),
            "latest_package_file_count": latest_package.get("file_count", 0),
            "screenshot_count": latest_package.get("screenshot_count", 0),
        },
        "checks": checks,
        "blockers": [
            {
                "id": item["id"],
                "title": item["title"],
                "severity": item["severity"],
                "evidence": item["evidence"],
                "next_action": item["next_action"],
            }
            for item in blockers
        ],
        "next_actions": next_actions,
        "acceptance_commands": [
            "node scripts/agent-supervisor-cli.mjs readiness --write --output apps/api/sandbox/reports",
            "node scripts/agent-supervisor-cli.mjs clean-package --output apps/api/sandbox/submission_packages",
            "node scripts/agent-supervisor-cli.mjs openclaw-plugin-validate --output apps/api/sandbox/reports --inspect-runtime",
            "npm run build",
        ],
        "latest_package": latest_package,
    }


def _openclaw_validation_for_readiness() -> dict[str, Any]:
    validation_report = REPORT_ROOT / "OpenClaw源码级插件包验收报告.json"
    if validation_report.exists():
        try:
            payload = json.loads(validation_report.read_text(encoding="utf-8"))
            validation = payload.get("validation", payload)
            if validation.get("runtime_inspect_passed") is True:
                return validation
        except (OSError, json.JSONDecodeError):
            pass
    return validate_openclaw_plugin_package(output_root=REPORT_ROOT, inspect_runtime=False)


def build_competition_readiness_markdown(data: dict[str, Any] | None = None) -> str:
    data = data or build_competition_readiness()
    summary = data["summary"]
    lines = [
        "# 赛前一键体检报告",
        "",
        f"- 总体状态：{data['status_label']}",
        f"- 就绪分：{data['readiness_score']}%",
        f"- 结论：{data['verdict']}",
        f"- 通过/警告/阻塞：{summary['passed_count']} / {summary['warning_count']} / {summary['blocker_count']}",
        f"- 攻击面/脚本：{summary['surface_count']} / {summary['scenario_count']}",
        f"- 正常比赛任务误报率：{summary['benign_false_positive_rate']}%",
        f"- 连续流程误报率：{summary['benign_workflow_false_positive_rate']}%",
        f"- 人工复核闭环：{summary['approval_review_count']} 条复核单，待处理 {summary['pending_approval_count']}，已处理 {summary['resolved_approval_count']}",
        f"- 答辩一键演示：{summary['demo_drill_stage_count']} 步，复核 hash {summary['demo_drill_review_hash_count']} 个",
        f"- 最新提交包：`{summary['latest_package_zip'] or '未找到'}`",
        "",
        "## 检查项",
        "",
        "| 检查项 | 状态 | 权重 | 证据 | 下一步 |",
        "|---|---|---:|---|---|",
    ]
    for item in data["checks"]:
        lines.append(
            "| {title} | {status} | {weight} | {evidence} | {next_action} |".format(
                title=item["title"],
                status=item["status_label"],
                weight=item["weight"],
                evidence=item["evidence"],
                next_action=item["next_action"],
            )
        )

    if data["blockers"]:
        lines.extend(["", "## P0 补证项", ""])
        for item in data["blockers"]:
            lines.append(f"- {item['title']}：{item['next_action']}")

    lines.extend(["", "## 建议命令", ""])
    lines.extend(f"```powershell\n{command}\n```" for command in data["acceptance_commands"])
    return "\n".join(lines)


def write_competition_readiness_report(
    output_root: str | Path | None = None,
    package_snapshot: dict[str, Any] | None = None,
) -> dict[str, Any]:
    root = Path(output_root) if output_root else REPORT_ROOT
    root.mkdir(parents=True, exist_ok=True)
    data = build_competition_readiness(package_snapshot=package_snapshot)
    json_path = root / "赛前一键体检报告.json"
    markdown_path = root / "赛前一键体检报告.md"
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown_path.write_text(build_competition_readiness_markdown(data), encoding="utf-8")
    return {
        "generated_at": data["generated_at"],
        "json_path": str(json_path.resolve()),
        "markdown_path": str(markdown_path.resolve()),
        "summary": data["summary"],
        "readiness_score": data["readiness_score"],
        "overall_status": data["overall_status"],
        "blockers": data["blockers"],
        "readiness": data,
    }
