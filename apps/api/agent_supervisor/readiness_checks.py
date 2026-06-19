from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .paths import SUBMISSION_PACKAGES_DIR

SUBMISSION_ROOT = SUBMISSION_PACKAGES_DIR

def _check(
    *,
    check_id: str,
    title: str,
    category: str,
    status: str,
    severity: str,
    weight: int,
    evidence: str,
    details: dict[str, Any],
    next_action: str,
    artifact_paths: list[str] | None = None,
) -> dict[str, Any]:
    factor = {"passed": 1.0, "warning": 0.65, "blocked": 0.0}[status]
    status_label = {"passed": "通过", "warning": "需补强", "blocked": "阻塞"}[status]
    return {
        "id": check_id,
        "title": title,
        "category": category,
        "status": status,
        "status_label": status_label,
        "severity": severity,
        "weight": weight,
        "earned_score": round(weight * factor, 2),
        "evidence": evidence,
        "details": details,
        "next_action": next_action,
        "artifact_paths": artifact_paths or [],
    }


def _attack_surface_check(surfaces: list[dict[str, Any]], scenarios: list[dict[str, Any]]) -> dict[str, Any]:
    surface_count = len(surfaces)
    scenario_count = len(scenarios)
    passed = surface_count >= 7 and scenario_count >= 22
    return _check(
        check_id="attack-surface-coverage",
        title="攻击面与剧本覆盖",
        category="赛题成果",
        status="passed" if passed else "blocked",
        severity="P0",
        weight=12,
        evidence=f"已覆盖 {surface_count} 类攻击面、{scenario_count} 个攻击剧本。",
        details={"surface_count": surface_count, "scenario_count": scenario_count},
        next_action="保持 7 类攻击面口径；答辩时优先演示工具劫持、提示注入、记忆中毒和环境污染。",
    )


def _student_competition_domain_check(
    profiles: list[dict[str, Any]],
    scenarios: list[dict[str, Any]],
    attack_chains: list[dict[str, Any]],
) -> dict[str, Any]:
    required_profile_ids = {
        "team-account-portal",
        "challenge-materials",
        "submission-review",
        "scoreboard-judge",
        "training-camp-net",
    }
    required_scenario_ids = {
        "TEAM-ACCOUNT-001",
        "SUBMISSION-EXFIL-001",
        "CHALLENGE-ATTACHMENT-001",
        "JUDGE-SEED-001",
        "CAMPUS-SESSION-001",
    }
    profile_ids = {profile.get("id") for profile in profiles}
    scenario_ids = {scenario.get("id") for scenario in scenarios}
    chain_ids = {chain.get("id") for chain in attack_chains}
    missing_profiles = sorted(required_profile_ids - profile_ids)
    missing_scenarios = sorted(required_scenario_ids - scenario_ids)
    has_student_chain = "student-competition-portal-chain" in chain_ids
    passed = not missing_profiles and not missing_scenarios and has_student_chain and len(attack_chains) >= 4
    return _check(
        check_id="student-competition-domain",
        title="学生比赛攻击面对象化覆盖",
        category="赛题成果",
        status="passed" if passed else "blocked",
        severity="P0",
        weight=10,
        evidence=(
            f"学生对象画像 {len(profile_ids & required_profile_ids)}/5，"
            f"专项剧本 {len(scenario_ids & required_scenario_ids)}/5，"
            f"组合攻击链 {len(attack_chains)} 条，学生平台链 {_yes_no(has_student_chain)}。"
        ),
        details={
            "required_profile_ids": sorted(required_profile_ids),
            "missing_profiles": missing_profiles,
            "required_scenario_ids": sorted(required_scenario_ids),
            "missing_scenarios": missing_scenarios,
            "attack_chain_count": len(attack_chains),
            "has_student_competition_chain": has_student_chain,
        },
        next_action="补齐队伍账号、赛题附件、提交物、私有榜单和训练平台会话 5 类对象画像，并保持学生比赛平台对象组合链可导出。",
    )


def _attack_dataset_check(dataset: dict[str, Any]) -> dict[str, Any]:
    summary = dataset["summary"]
    passed = (
        summary.get("adversarial_sample_count", 0) >= 30
        and summary.get("jailbreak_case_count", 0) >= 30
        and summary.get("agent_script_count", 0) >= summary.get("scenario_count", 0)
    )
    return _check(
        check_id="attack-sample-dataset",
        title="对抗样本、越狱用例与攻击脚本",
        category="赛题成果",
        status="passed" if passed else "blocked",
        severity="P0",
        weight=10,
        evidence=(
            f"对抗样本 {summary.get('adversarial_sample_count', 0)} 条，"
            f"越狱用例 {summary.get('jailbreak_case_count', 0)} 条，"
            f"攻击脚本 {summary.get('agent_script_count', 0)} 条。"
        ),
        details=summary,
        next_action="继续把新增攻击面按同一数据结构沉淀，保证每个剧本都有可复现输入和工具调用脚本。",
    )


def _supervisor_check(
    policies: list[dict[str, Any]],
    scenarios: list[dict[str, Any]],
    runs: list[dict[str, Any]],
) -> dict[str, Any]:
    tools = {
        call.get("tool")
        for scenario in scenarios
        for call in scenario.get("tool_calls", [])
        if isinstance(call, dict) and call.get("tool")
    }
    guarded_runs = [run for run in runs if run.get("guard_enabled")]
    controlled = [
        run
        for run in guarded_runs
        if run.get("metrics", {}).get("blocked_count")
        or run.get("metrics", {}).get("asked_count")
        or run.get("metrics", {}).get("isolated_count")
    ]
    control_rate = round(len(controlled) / len(guarded_runs) * 100) if guarded_runs else 0
    passed = len(policies) >= 6 and len(tools) >= 5 and (control_rate >= 70 or not guarded_runs)
    return _check(
        check_id="supervisor-policy-runtime",
        title="行为监督器与模拟比赛工具",
        category="原型系统",
        status="passed" if passed else "warning",
        severity="P1",
        weight=10,
        evidence=f"策略 {len(policies)} 条，工具 {len(tools)} 类，近期有防护运行控制率 {control_rate}%。",
        details={"policy_count": len(policies), "tool_count": len(tools), "guarded_run_count": len(guarded_runs), "control_rate": control_rate},
        next_action="答辩前运行一次全量 compare，让审计页有最新阻断、询问、隔离记录。",
    )


def _benign_check(benign: dict[str, Any]) -> dict[str, Any]:
    summary = benign["summary"]
    passed = summary["case_count"] >= 30 and summary["false_positive_rate"] == 0 and summary["expected_match_rate"] >= 95
    return _check(
        check_id="benign-single-step",
        title="正常比赛任务单步误报评测",
        category="误报控制",
        status="passed" if passed else "warning",
        severity="P1",
        weight=10,
        evidence=f"{summary['case_count']} 条正常比赛任务样本，误报率 {summary['false_positive_rate']}%，期望匹配率 {summary['expected_match_rate']}%。",
        details=summary,
        next_action="继续补充真实比赛任务动作，例如审批、周报、赛事复盘和公开材料分享，避免系统只会拦截不会放行。",
    )


def _benign_workflow_check(workflows: dict[str, Any]) -> dict[str, Any]:
    summary = workflows["summary"]
    passed = (
        summary["workflow_count"] >= 4
        and summary["false_positive_rate"] == 0
        and summary["workflow_pass_rate"] == 100
        and summary["audit_chain_valid_count"] == summary["workflow_count"]
    )
    return _check(
        check_id="benign-workflows",
        title="连续正常比赛任务流程验收",
        category="误报控制",
        status="passed" if passed else "warning",
        severity="P1",
        weight=10,
        evidence=(
            f"{summary['workflow_count']} 条流程、{summary['step_count']} 个步骤，"
            f"流程通过率 {summary['workflow_pass_rate']}%，误报率 {summary['false_positive_rate']}%。"
        ),
        details=summary,
        next_action="保留连续流程演示截图；评委问误报时优先展示这一块。",
    )


def _calibration_check(calibration: dict[str, Any]) -> dict[str, Any]:
    summary = calibration["summary"]
    passed = (
        summary["recommended_threshold"] > 0
        and summary["benign_false_alarm_rate"] == 0
        and summary["attack_recall_rate"] >= 60
    )
    return _check(
        check_id="anomaly-calibration",
        title="异常检测阈值校准",
        category="检测模型",
        status="passed" if passed else "warning",
        severity="P1",
        weight=10,
        evidence=(
            f"推荐阈值 {summary['recommended_threshold']}，攻击召回 {summary['attack_recall_rate']}%，"
            f"正常误报 {summary['benign_false_alarm_rate']}%。"
        ),
        details=summary,
        next_action="后续接真实模型日志后，重新跑阈值校准并保留阈值曲线截图。",
    )


def _approval_review_check(approvals: dict[str, Any]) -> dict[str, Any]:
    summary = approvals["summary"]
    total = summary["total"]
    hash_valid = summary["hash_valid_count"] == total if total else False
    passed = total >= 1 and hash_valid
    return _check(
        check_id="human-approval-loop",
        title="人工复核与审批闭环",
        category="原型系统",
        status="passed" if passed else "warning",
        severity="P1",
        weight=8,
        evidence=(
            f"复核单 {total} 条，待复核 {summary['pending_count']}，"
            f"已批准 {summary['approved_count']}，已驳回 {summary['rejected_count']}，"
            f"hash 有效 {summary['hash_valid_count']} 条。"
        ),
        details=summary,
        next_action="答辩前通过外部邮件或批量导出样例触发一次“询问”，并在审计页执行批准/驳回，保留截图和报告。",
    )


def _demo_drill_check(demo_drill: dict[str, Any]) -> dict[str, Any]:
    summary = demo_drill["summary"]
    passed = (
        summary["stage_count"] >= 4
        and summary["controlled_count"] >= 3
        and summary["audit_hash_count"] >= 4
        and summary["review_hash_count"] >= 2
    )
    return _check(
        check_id="judge-demo-drill",
        title="答辩一键演示闭环",
        category="演示验收",
        status="passed" if passed else "warning",
        severity="P1",
        weight=8,
        evidence=(
            f"演示步骤 {summary['stage_count']}，监督控制 {summary['controlled_count']}，"
            f"审计 hash {summary['audit_hash_count']}，复核 hash {summary['review_hash_count']}。"
        ),
        details=summary,
        next_action="答辩前点击设置页“运行答辩演示”，重新生成报告并保留桌面/移动端截图。",
        artifact_paths=[path for path in [demo_drill.get("json_path"), demo_drill.get("markdown_path")] if path],
    )


def _openclaw_static_check(validation: dict[str, Any]) -> dict[str, Any]:
    passed = validation["static_passed"] and validation["files_passed"] and validation["node_syntax_passed"]
    return _check(
        check_id="openclaw-static-plugin",
        title="OpenClaw 源码级插件静态验收",
        category="开源应用适配",
        status="passed" if passed else "blocked",
        severity="P0",
        weight=12,
        evidence=(
            f"插件状态 {validation['overall_status']}；文件完整 {_yes_no(validation['files_passed'])}，"
            f"Hook 结构 {_yes_no(validation['static_passed'])}，JS 语法 {_yes_no(validation['node_syntax_passed'])}。"
        ),
        details={
            "overall_status": validation["overall_status"],
            "file_checks": validation["file_checks"],
            "static_checks": validation["static_checks"],
            "node_check": validation["node_check"],
        },
        next_action="静态包已可交付；保持 README、安装命令和 before_tool_call 入口一致。",
        artifact_paths=[validation["package_dir"], validation["zip_path"], validation["markdown_path"]],
    )


def _openclaw_runtime_check(validation: dict[str, Any]) -> dict[str, Any]:
    runtime = validation["openclaw_runtime_check"]
    install = validation.get("openclaw_install_check", {})
    enable = validation.get("openclaw_enable_check", {})
    passed = validation["runtime_inspect_passed"]
    return _check(
        check_id="openclaw-runtime-inspect",
        title="OpenClaw 真实 runtime inspect",
        category="开源应用适配",
        status="passed" if passed else "blocked",
        severity="P0",
        weight=8,
        evidence=runtime.get("skipped_reason") or runtime.get("stderr") or "OpenClaw runtime inspect 已通过。",
        details={
            "openclaw_cli_path": validation.get("openclaw_cli_path", ""),
            "install_check": install,
            "enable_check": enable,
            "runtime_check": runtime,
        },
        next_action="在安装 OpenClaw CLI 的环境执行：node scripts/agent-supervisor-cli.mjs openclaw-plugin-validate --output apps/api/sandbox/reports --inspect-runtime；该命令会自动安装、启用并 runtime inspect 插件。",
        artifact_paths=[validation["package_dir"]],
    )


def _submission_package_check(package: dict[str, Any]) -> dict[str, Any]:
    exists = bool(package.get("zip_exists")) and bool(package.get("manifest_exists"))
    required_ok = package.get("required_file_passed", False)
    file_count = package.get("file_count", 0)
    passed = exists and required_ok and file_count >= 70
    return _check(
        check_id="submission-package",
        title="初赛提交包完整性",
        category="交付材料",
        status="passed" if passed else "warning",
        severity="P1",
        weight=10,
        evidence=f"最新提交包文件数 {file_count}，关键文件通过 {_yes_no(package.get('required_file_passed', False))}。",
        details=package,
        next_action="每轮重大功能完成后重新运行 clean-package，确保 zip、manifest 和关键材料同步。",
        artifact_paths=[path for path in [package.get("package_dir"), package.get("zip_path")] if path],
    )


def _screenshot_evidence_check(package: dict[str, Any]) -> dict[str, Any]:
    screenshot_count = package.get("screenshot_count", 0)
    required_screenshots = package.get("required_screenshot_checks", {})
    passed = screenshot_count >= 14 and all(required_screenshots.values()) if required_screenshots else False
    return _check(
        check_id="demo-screenshots",
        title="页面演示截图证据",
        category="交付材料",
        status="passed" if passed else "warning",
        severity="P2",
        weight=8,
        evidence=f"最新提交包内截图 {screenshot_count} 张，关键截图通过 {_yes_no(all(required_screenshots.values()) if required_screenshots else False)}。",
        details={"screenshot_count": screenshot_count, "required_screenshot_checks": required_screenshots},
        next_action="赛前用浏览器重新截桌面和移动端关键页，重点覆盖报告页、OpenClaw 验收和赛前体检面板。",
    )


def _latest_submission_package() -> dict[str, Any]:
    if not SUBMISSION_ROOT.exists():
        return _empty_package_snapshot()

    zips = sorted((path for path in SUBMISSION_ROOT.glob("*.zip") if path.is_file()), key=lambda path: path.stat().st_mtime)
    if not zips:
        return _empty_package_snapshot()

    zip_path = zips[-1]
    return build_submission_package_snapshot(SUBMISSION_ROOT / zip_path.stem, zip_path)


def build_submission_package_snapshot(package_dir: str | Path, zip_path: str | Path | None = None) -> dict[str, Any]:
    package_path = Path(package_dir)
    zip_file = Path(zip_path) if zip_path else package_path.with_suffix(".zip")
    result: dict[str, Any] = {
        "package_dir": "",
        "zip_path": "",
        "zip_exists": False,
        "manifest_exists": False,
        "file_count": 0,
        "screenshot_count": 0,
        "required_file_checks": {},
        "required_file_passed": False,
        "required_screenshot_checks": {},
        "required_content_checks": {},
    }
    manifest_path = package_path / "manifest.json"
    result.update(
        {
            "package_dir": str(package_path.resolve()) if package_path.exists() else "",
            "zip_path": str(zip_file.resolve()),
            "zip_exists": zip_file.exists(),
            "manifest_exists": manifest_path.exists(),
        }
    )
    manifest_files: list[str] = []
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest_files = [
                str(item.get("relative_path", "")) + " " + str(item.get("filename", ""))
                for item in manifest.get("files", [])
                if isinstance(item, dict)
            ]
            result["file_count"] = len(manifest_files)
            result["manifest_summary"] = manifest.get("summary", {})
        except (OSError, json.JSONDecodeError):
            result["manifest_error"] = "manifest.json 读取失败"

    if package_path.exists():
        pngs = [path for path in package_path.rglob("*.png") if path.is_file()]
        result["screenshot_count"] = len(pngs)

    required_keywords = {
        "risk_report": "安全风险分析报告",
        "benign_workflow_report": "连续正常比赛任务流程误报评测",
        "approval_review_report": "人工复核队列",
        "demo_drill_report": "答辩一键演示",
        "openclaw_plugin_runtime": "OpenClaw源码级插件包",
        "openclaw_plugin_dist": "dist\\index.js",
        "attack_chain_report": "19_",
        "manifest": "manifest.json",
    }
    required_screenshots = {
        "benign_workflow_desktop": "benign-workflow-block-desktop.png",
        "approval_queue_desktop": "approval-queue-desktop.png",
        "demo_drill_desktop": "demo-drill-desktop.png",
        "openclaw_validation_desktop": "openclaw-plugin-validation-desktop.png",
        "roadmap_desktop": "project-roadmap-block-desktop.png",
        "student_competition_map_desktop": "student-competition-attack-map-desktop.png",
        "student_competition_map_mobile": "student-competition-attack-map-mobile.png",
    }
    result["required_file_checks"] = {
        key: _manifest_contains(manifest_files, keyword) for key, keyword in required_keywords.items()
    }
    if manifest_path.exists():
        result["required_file_checks"]["manifest"] = True
    result["required_screenshot_checks"] = {
        key: _manifest_contains(manifest_files, keyword) for key, keyword in required_screenshots.items()
    }
    required_content = {
        "student_attack_chain": "student-competition-portal-chain",
        "student_team_profile": "team-account-portal",
        "student_submission_scenario": "SUBMISSION-EXFIL-001",
    }
    result["required_content_checks"] = {
        key: _package_contains_text(package_path, keyword) for key, keyword in required_content.items()
    }
    result["required_file_passed"] = all(result["required_file_checks"].values()) and all(result["required_content_checks"].values())
    return result


def _empty_package_snapshot() -> dict[str, Any]:
    return {
        "package_dir": "",
        "zip_path": "",
        "zip_exists": False,
        "manifest_exists": False,
        "file_count": 0,
        "screenshot_count": 0,
        "required_file_checks": {},
        "required_file_passed": False,
        "required_screenshot_checks": {},
        "required_content_checks": {},
    }


def _package_contains_text(package_path: Path, keyword: str) -> bool:
    if not package_path.exists():
        return False
    for path in package_path.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".md", ".json", ".txt", ".html"}:
            continue
        try:
            if keyword in path.read_text(encoding="utf-8", errors="ignore"):
                return True
        except OSError:
            continue
    return False


def _manifest_contains(entries: list[str], keyword: str) -> bool:
    normalized_keyword = keyword.replace("/", "\\")
    return any(normalized_keyword in entry.replace("/", "\\") for entry in entries)


def _yes_no(value: Any) -> str:
    return "是" if bool(value) else "否"


def _next_actions(checks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ordered = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    pending = [item for item in checks if item["status"] != "passed"]
    pending.sort(key=lambda item: (ordered.get(item["severity"], 9), -item["weight"], item["id"]))
    return [
        {
            "id": item["id"],
            "severity": item["severity"],
            "title": item["title"],
            "action": item["next_action"],
        }
        for item in pending[:6]
    ]
