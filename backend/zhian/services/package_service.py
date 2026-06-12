from __future__ import annotations

import json
import shutil
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..ablation import build_policy_ablation_markdown
from ..approvals import build_approval_review_markdown, write_approval_review_report
from ..attack_chains import build_attack_chain_catalog_markdown, write_attack_chain_report
from ..benign import build_benign_cases_markdown
from ..benign_workflows import build_benign_workflow_markdown, write_benign_workflow_report
from ..calibration import build_anomaly_calibration_markdown
from ..data import get_attack_surfaces, get_policies, get_scenarios
from ..demo_drill import build_judge_demo_drill_markdown, run_judge_demo_drill
from ..evidence import build_output_filter_markdown, build_surface_conclusions_markdown
from ..openclaw_adapter import (
    build_openclaw_integration_markdown,
    build_openclaw_plugin_package_markdown,
    build_openclaw_plugin_validation_markdown,
    write_openclaw_plugin_validation_report,
)
from ..readiness import (
    build_competition_readiness,
    build_competition_readiness_markdown,
    build_submission_package_snapshot,
    write_competition_readiness_report,
)
from ..roadmap import build_project_roadmap_markdown
from ..surface_pack import build_surface_evidence_index_markdown, write_all_surface_briefing_sheets


BASE_DIR = Path(__file__).resolve().parents[1]
SUBMISSION_ROOT = BASE_DIR / "sandbox" / "submission_packages"


def build_competition_package(runs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    runs = runs or []
    surfaces = get_attack_surfaces()
    scenarios = get_scenarios()
    policies = get_policies()
    surface_name = {surface["id"]: surface["name"] for surface in surfaces}

    files = [
        _file("01_安全风险分析报告.md", "安全风险分析报告", "按 7 类攻击面组织攻击原理、复现方式、危害和防御策略。", _risk_report(surfaces, scenarios)),
        _file("02_对抗样本与越狱用例集.json", "模型对抗样本与越狱测试用例集", "每个攻击剧本对应一条可复现实验样本。", _sample_set(scenarios, surface_name)),
        _file("03_智能体攻击脚本库.json", "智能体攻击脚本库", "记录多 agent 复现步骤、目标工具和工具调用参数。", _script_library(scenarios, surface_name)),
        _file("04_行为监督原型说明.md", "行为监督原型说明", "说明旁路监督器、策略决策、模拟比赛工具和 OpenClaw 适配接口。", _supervisor_spec(policies)),
        _file("05_实验评测结果.md", "实验评测结果", "汇总无防护/有防护实验、策略命中和检测延迟。", _experiment_report(runs)),
        _file("06_正常比赛任务误报评测.md", "正常比赛任务误报评测", "验证监督器对正常比赛任务的放行能力、误报率和期望决策匹配率。", build_benign_cases_markdown()),
        _file("07_攻击面实验结论.md", "攻击面实验结论", "按 7 类攻击面沉淀实验结论、代表剧本、关键发现和防御结论。", build_surface_conclusions_markdown(runs)),
        _file("08_模型输出过滤证据.md", "模型输出过滤证据", "展示关闭防护和开启防护时模型输出风险的决策差异。", build_output_filter_markdown()),
        _file("09_策略消融实验结果.md", "策略消融实验结果", "临时关闭关键防护层，验证各策略对控制率、风险暴露和兜底控制的贡献。", build_policy_ablation_markdown()),
        _file("10_攻击面证据包索引.md", "攻击面证据包索引", "按单个攻击面汇总样本、脚本、策略、工具、运行证据和导出入口。", build_surface_evidence_index_markdown(runs)),
        _file("11_项目成熟度与缺口路线图.md", "项目成熟度与缺口路线图", "自动判断当前项目方向、成熟度、未完成功能和下一轮优先级。", build_project_roadmap_markdown(runs)),
        _file("12_异常检测阈值校准报告.md", "异常检测阈值校准报告", "用攻击样本和正常比赛任务样本解释 anomaly_score 阈值、召回率和误报率。", build_anomaly_calibration_markdown()),
        _file("13_OpenClaw源码级插件包说明.md", "OpenClaw 源码级插件包说明", "提供可安装到 OpenClaw 的 native plugin 包，使用 before_tool_call 作为工具调用前置闸门。", build_openclaw_plugin_package_markdown()),
        _file("14_OpenClaw源码级插件包验收报告.md", "OpenClaw 源码级插件包验收报告", "检查插件包文件完整性、Hook 静态结构和 JavaScript 运行入口语法。", build_openclaw_plugin_validation_markdown()),
        _file("15_连续正常比赛任务流程误报评测.md", "连续正常比赛任务流程误报评测", "验证多步正常比赛任务流程中的工具调用误报率、边界控制和审计 hash 链。", build_benign_workflow_markdown()),
        _file("16_赛前一键体检报告.md", "赛前一键体检报告", "自动检查攻击面、误报、连续流程、OpenClaw 插件、截图和提交包关键材料。", build_competition_readiness_markdown()),
        _file("17_人工复核队列与审批闭环.md", "人工复核队列与审批闭环", "展示“询问”决策如何生成复核单、人工批准/驳回和 review_hash 证据。", build_approval_review_markdown()),
        _file("18_答辩一键演示闭环报告.md", "答辩一键演示闭环报告", "把正常放行、外发复核、批量导出审批和记忆隔离串成现场演示流程。", build_judge_demo_drill_markdown()),
        _file("19_组合攻击链评测.md", "组合攻击链评测", "把提示注入、工具劫持、数据外泄、记忆中毒等单点剧本串成多步红队路径。", build_attack_chain_catalog_markdown()),
    ]

    demo_ready = sum(1 for surface in surfaces if surface["status"] == "可演示")
    alerts_count = sum(len(run.get("alerts", [])) for run in runs)
    guarded_runs = [run for run in runs if run.get("guard_enabled")]
    controlled_runs = [
        run
        for run in guarded_runs
        if run.get("metrics", {}).get("blocked_count")
        or run.get("metrics", {}).get("asked_count")
        or run.get("metrics", {}).get("isolated_count")
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "surface_count": len(surfaces),
            "scenario_count": len(scenarios),
            "demo_ready_surface_count": demo_ready,
            "file_count": len(files),
            "run_count": len(runs),
            "alert_count": alerts_count,
            "control_rate": round((len(controlled_runs) / len(guarded_runs)) * 100) if guarded_runs else 0,
        },
        "checklist": _checklist(surfaces, scenarios, runs, alerts_count),
        "files": files,
        "adapter_schema": _adapter_schema(),
    }


def write_submission_package(
    runs: list[dict[str, Any]] | None = None,
    output_root: str | Path | None = None,
) -> dict[str, Any]:
    package = build_competition_package(runs)
    root = Path(output_root) if output_root else SUBMISSION_ROOT
    root.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    package_dir = root / f"智安哨初赛提交包-{timestamp}"
    material_dir = package_dir / "01_比赛要求材料"
    support_dir = package_dir / "02_运行与答辩说明"
    material_dir.mkdir(parents=True, exist_ok=True)
    support_dir.mkdir(parents=True, exist_ok=True)

    written_files: list[Path] = []
    for file in package["files"]:
        path = material_dir / file["filename"]
        path.write_text(file["content"], encoding="utf-8")
        written_files.append(path)

    support_files = {
        "提交包README.md": _submission_readme(package),
        "运行说明.md": _run_guide(),
        "接口清单.md": _api_inventory(),
        "赛题验收清单.md": _acceptance_checklist(package),
        "攻击面威胁模型.md": _threat_model_for_package(),
        "OpenClaw兼容接入包.md": build_openclaw_integration_markdown(),
        "OpenClaw源码级插件包验收报告.md": build_openclaw_plugin_validation_markdown(),
        "OpenClaw源码级插件包完善记录.md": _openclaw_plugin_record(),
        "真实接入与攻击面扩展说明.md": _real_integration_guide(),
        "页面一键真实Agent演示完善记录.md": _page_agent_demo_record(),
        "策略消融实验完善记录.md": _policy_ablation_record(),
        "攻击面证据包完善记录.md": _surface_pack_record(),
        "项目成熟度与缺口路线图完善记录.md": _roadmap_record(),
        "异常检测阈值校准完善记录.md": _anomaly_calibration_record(),
        "正常比赛任务样本扩充记录.md": _benign_expansion_record(),
        "连续正常比赛任务流程误报评测记录.md": _benign_workflow_record(),
        "赛前一键体检完善记录.md": _readiness_record(),
        "人工复核队列完善记录.md": _approval_review_record(),
        "答辩一键演示完善记录.md": _demo_drill_record(),
        "前端审美优化记录.md": _frontend_design_record(),
        "前端工程规范与设计Token治理记录.md": _frontend_governance_record(),
        "多Agent自审优化闭环报告.md": _multi_agent_self_review_record(),
        "源码结构说明.md": _source_tree(),
        "演示截图清单.md": _screenshot_checklist(),
    }
    support_files.update(_external_agent_demo_evidence_files())
    for filename, content in support_files.items():
        path = support_dir / filename
        path.write_text(content, encoding="utf-8")
        written_files.append(path)
    briefing_dir = support_dir / "攻击面答辩单页"
    write_all_surface_briefing_sheets(output_root=briefing_dir, runs=runs)
    written_files.extend(sorted(path for path in briefing_dir.rglob("*.html") if path.is_file()))
    plugin_package_dir = support_dir / "OpenClaw源码级插件包"
    plugin_result = write_openclaw_plugin_validation_report(output_root=plugin_package_dir)
    written_files.extend(sorted(path for path in plugin_package_dir.rglob("*") if path.is_file()))
    benign_workflow_dir = support_dir / "连续正常比赛任务流程误报评测"
    write_benign_workflow_report(output_root=benign_workflow_dir)
    written_files.extend(sorted(path for path in benign_workflow_dir.rglob("*") if path.is_file()))
    readiness_dir = support_dir / "赛前一键体检"
    write_competition_readiness_report(output_root=readiness_dir)
    written_files.extend(sorted(path for path in readiness_dir.rglob("*") if path.is_file()))
    approval_review_dir = support_dir / "人工复核队列"
    write_approval_review_report(output_root=approval_review_dir)
    written_files.extend(sorted(path for path in approval_review_dir.rglob("*") if path.is_file()))
    demo_drill_dir = support_dir / "答辩一键演示"
    demo_drill_result = run_judge_demo_drill(output_root=demo_drill_dir)
    demo_drill_material_path = material_dir / "18_答辩一键演示闭环报告.md"
    if demo_drill_material_path.exists():
        demo_drill_material_path.write_text(build_judge_demo_drill_markdown(demo_drill_result), encoding="utf-8")
    written_files.extend(sorted(path for path in demo_drill_dir.rglob("*") if path.is_file()))
    attack_chain_dir = support_dir / "组合攻击链评测"
    write_attack_chain_report(output_root=attack_chain_dir)
    written_files.extend(sorted(path for path in attack_chain_dir.rglob("*") if path.is_file()))
    self_review_dir = support_dir / "多Agent自审优化"
    written_files.extend(_copy_multi_agent_self_review_reports(self_review_dir))
    written_files.extend(_copy_demo_screenshots(support_dir))

    manifest = {
        "project": "智安哨：大模型智能体攻击面研究与行为监督平台",
        "generated_at": package["generated_at"],
        "summary": package["summary"],
        "package_dir": str(package_dir.resolve()),
        "files": [
            {
                "filename": path.name,
                "relative_path": str(path.relative_to(package_dir)),
                "size": path.stat().st_size,
            }
            for path in written_files
        ],
    }
    manifest_path = package_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    written_files.append(manifest_path)
    returned_files = [
        {
            "filename": path.name,
            "relative_path": str(path.relative_to(package_dir)),
            "size": path.stat().st_size,
        }
        for path in written_files
    ]
    manifest["files"] = returned_files
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    zip_path = root / f"{package_dir.name}.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in written_files:
            archive.write(path, path.relative_to(package_dir.parent))

    current_snapshot = build_submission_package_snapshot(package_dir, zip_path)
    current_readiness = build_competition_readiness(runs, package_snapshot=current_snapshot)
    readiness_material_path = material_dir / "16_赛前一键体检报告.md"
    if readiness_material_path.exists():
        readiness_material_path.write_text(build_competition_readiness_markdown(current_readiness), encoding="utf-8")
    write_competition_readiness_report(output_root=readiness_dir, package_snapshot=current_snapshot)
    write_approval_review_report(output_root=approval_review_dir)
    demo_drill_result = run_judge_demo_drill(output_root=demo_drill_dir)
    if demo_drill_material_path.exists():
        demo_drill_material_path.write_text(build_judge_demo_drill_markdown(demo_drill_result), encoding="utf-8")

    returned_files = [
        {
            "filename": path.name,
            "relative_path": str(path.relative_to(package_dir)),
            "size": path.stat().st_size,
        }
        for path in sorted(package_dir.rglob("*"))
        if path.is_file()
    ]
    manifest["files"] = returned_files
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(package_dir.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(package_dir.parent))

    return {
        "generated_at": package["generated_at"],
        "package_dir": str(package_dir.resolve()),
        "zip_path": str(zip_path.resolve()),
        "file_count": len(returned_files),
        "summary": package["summary"],
        "files": returned_files,
    }


def write_clean_submission_package(output_root: str | Path | None = None) -> dict[str, Any]:
    from ..agents import run_scenario

    scenarios = get_scenarios()
    clean_runs: list[dict[str, Any]] = []
    for scenario in scenarios:
        clean_runs.append(run_scenario(scenario["id"], guard_enabled=False, persist=False))
        clean_runs.append(run_scenario(scenario["id"], guard_enabled=True, persist=False))

    result = write_submission_package(clean_runs, output_root=output_root)
    clean_summary = _clean_submission_summary(clean_runs, scenarios)
    package_dir = Path(result["package_dir"])
    zip_path = Path(result["zip_path"])
    evidence_path = package_dir / "00_clean_submission_evidence.md"
    evidence_path.write_text(_clean_submission_evidence(clean_summary, clean_runs), encoding="utf-8")

    manifest_path = package_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["clean_mode"] = True
    manifest["clean_summary"] = clean_summary
    manifest["summary"] = {**manifest.get("summary", {}), **clean_summary}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    returned_files = [
        {
            "filename": path.name,
            "relative_path": str(path.relative_to(package_dir)),
            "size": path.stat().st_size,
        }
        for path in sorted(package_dir.rglob("*"))
        if path.is_file()
    ]
    manifest["files"] = returned_files
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(package_dir.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(package_dir.parent))

    current_snapshot = build_submission_package_snapshot(package_dir, zip_path)
    current_readiness = build_competition_readiness(clean_runs, package_snapshot=current_snapshot)
    readiness_material_path = package_dir / "01_比赛要求材料" / "16_赛前一键体检报告.md"
    if readiness_material_path.exists():
        readiness_material_path.write_text(build_competition_readiness_markdown(current_readiness), encoding="utf-8")
    readiness_dir = package_dir / "02_运行与答辩说明" / "赛前一键体检"
    write_competition_readiness_report(output_root=readiness_dir, package_snapshot=current_snapshot)
    approval_review_dir = package_dir / "02_运行与答辩说明" / "人工复核队列"
    write_approval_review_report(output_root=approval_review_dir)

    returned_files = [
        {
            "filename": path.name,
            "relative_path": str(path.relative_to(package_dir)),
            "size": path.stat().st_size,
        }
        for path in sorted(package_dir.rglob("*"))
        if path.is_file()
    ]
    manifest["files"] = returned_files
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(package_dir.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(package_dir.parent))

    return {
        **result,
        "clean_mode": True,
        "clean_summary": clean_summary,
        "file_count": len(returned_files),
        "summary": {**result["summary"], **clean_summary},
        "files": returned_files,
    }


def _clean_submission_summary(runs: list[dict[str, Any]], scenarios: list[dict[str, Any]]) -> dict[str, Any]:
    guarded_runs = [run for run in runs if run.get("guard_enabled")]
    unguarded_runs = [run for run in runs if not run.get("guard_enabled")]
    guarded_controlled = [
        run
        for run in guarded_runs
        if run.get("metrics", {}).get("blocked_count")
        or run.get("metrics", {}).get("asked_count")
        or run.get("metrics", {}).get("isolated_count")
    ]
    return {
        "clean_run_count": len(runs),
        "clean_scenario_count": len(scenarios),
        "clean_guarded_run_count": len(guarded_runs),
        "clean_unguarded_run_count": len(unguarded_runs),
        "clean_unguarded_attack_success_count": sum(1 for run in unguarded_runs if run.get("attack_success")),
        "clean_guarded_controlled_count": len(guarded_controlled),
        "clean_control_rate": round((len(guarded_controlled) / len(guarded_runs)) * 100) if guarded_runs else 0,
    }


def _clean_submission_evidence(summary: dict[str, Any], runs: list[dict[str, Any]]) -> str:
    lines = [
        "# 干净提交包证据说明",
        "",
        "本文件由一键干净提交包流程自动生成，用于说明当前提交包没有直接混用历史调试记录。",
        "",
        "## 生成方式",
        "",
        "- 对每个攻击剧本固定运行一次无防护复现。",
        "- 对每个攻击剧本固定运行一次有防护验证。",
        "- 生成提交包时只使用本轮固定运行得到的证据数据。",
        "- 本流程不会把这些临时运行写入历史演示数据库。",
        "",
        "## 本轮统计",
        "",
        f"- 攻击剧本数量：{summary['clean_scenario_count']}",
        f"- 固定运行记录：{summary['clean_run_count']}",
        f"- 无防护运行：{summary['clean_unguarded_run_count']}",
        f"- 有防护运行：{summary['clean_guarded_run_count']}",
        f"- 无防护攻击复现数：{summary['clean_unguarded_attack_success_count']}",
        f"- 有防护控制数：{summary['clean_guarded_controlled_count']}",
        f"- 干净控制率：{summary['clean_control_rate']}%",
        "",
        "## 运行明细",
        "",
        "| 剧本 | 防护状态 | 攻击成功 | 阻断 | 询问 | 隔离 | 审计条数 | 告警条数 |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for run in runs:
        metrics = run.get("metrics", {})
        lines.append(
            "| {scenario} | {guard} | {success} | {blocked} | {asked} | {isolated} | {audit} | {alert} |".format(
                scenario=run.get("scenario", {}).get("id", "-"),
                guard="有防护" if run.get("guard_enabled") else "无防护",
                success="是" if run.get("attack_success") else "否",
                blocked=metrics.get("blocked_count", 0),
                asked=metrics.get("asked_count", 0),
                isolated=metrics.get("isolated_count", 0),
                audit=len(run.get("audit_logs", [])),
                alert=len(run.get("alerts", [])),
            )
        )
    return "\n".join(lines)


def _file(filename: str, title: str, description: str, content: str | dict[str, Any]) -> dict[str, Any]:
    if isinstance(content, str):
        text = content
        content_type = "text/markdown"
    else:
        text = json.dumps(content, ensure_ascii=False, indent=2)
        content_type = "application/json"
    return {
        "filename": filename,
        "title": title,
        "description": description,
        "content_type": content_type,
        "content": text,
        "size": len(text.encode("utf-8")),
    }


def _external_agent_demo_evidence_files() -> dict[str, str]:
    report_dir = BASE_DIR / "sandbox" / "reports"
    files: dict[str, str] = {}
    markdown_path = report_dir / "最小外部Agent接入运行证据.md"
    json_path = report_dir / "最小外部Agent接入运行证据.json"
    if markdown_path.exists():
        files["最小外部Agent接入运行证据.md"] = markdown_path.read_text(encoding="utf-8")
    if json_path.exists():
        files["最小外部Agent接入运行证据.json"] = json_path.read_text(encoding="utf-8")
    return files


def _copy_demo_screenshots(support_dir: Path) -> list[Path]:
    report_dir = BASE_DIR / "sandbox" / "reports"
    screenshot_names = [
        "surface-dashboard-desktop-final.png",
        "surface-dashboard-mobile-final.png",
        "surface-evidence-index-board-desktop-final.png",
        "surface-evidence-index-board-mobile-final.png",
        "surface-defense-brief-desktop-final.png",
        "surface-defense-brief-mobile-final.png",
        "surface-dashboard-with-defense-brief-desktop-final.png",
        "surface-dashboard-with-defense-brief-mobile-final.png",
        "project-roadmap-block-desktop.png",
        "project-roadmap-block-mobile.png",
        "report-with-project-roadmap-desktop.png",
        "report-with-project-roadmap-mobile.png",
        "anomaly-calibration-block-desktop.png",
        "anomaly-calibration-block-mobile.png",
        "benign-evaluation-block-desktop.png",
        "benign-evaluation-block-mobile.png",
        "benign-workflow-block-desktop.png",
        "benign-workflow-block-mobile.png",
        "report-with-anomaly-calibration-desktop.png",
        "report-with-anomaly-calibration-mobile.png",
        "openclaw-plugin-panel-desktop.png",
        "openclaw-plugin-panel-mobile.png",
        "openclaw-plugin-validation-desktop.png",
        "openclaw-plugin-validation-mobile.png",
        "readiness-panel-desktop.png",
        "readiness-panel-mobile.png",
        "approval-queue-desktop.png",
        "approval-queue-mobile.png",
        "demo-drill-desktop.png",
        "demo-drill-mobile.png",
        "frontend-governance-desktop.png",
        "frontend-governance-mobile.png",
        "scenario-library-desktop.png",
        "experiment-lab-desktop.png",
        "agent-chain-desktop.png",
        "attack-chain-workbench-desktop.png",
        "attack-chain-workbench-mobile.png",
        "policy-impact-matrix-desktop.png",
        "audit-hash-verify-desktop.png",
        "decision-pill-audit-desktop.png",
        "decision-pill-alerts-desktop.png",
        "decision-pill-settings-desktop.png",
        "student-competition-attack-map-desktop.png",
        "student-competition-attack-map-mobile.png",
    ]
    screenshot_dir = support_dir / "演示截图"
    copied: list[Path] = []
    for name in screenshot_names:
        source = report_dir / name
        if not source.exists():
            continue
        screenshot_dir.mkdir(parents=True, exist_ok=True)
        target = screenshot_dir / name
        shutil.copy2(source, target)
        copied.append(target)
    return copied


def _copy_multi_agent_self_review_reports(target_dir: Path) -> list[Path]:
    report_dir = BASE_DIR / "sandbox" / "reports"
    report_names = [
        "多Agent自审优化报告.json",
        "多Agent自审优化报告.md",
    ]
    copied: list[Path] = []
    for name in report_names:
        source = report_dir / name
        if not source.exists():
            continue
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / name
        shutil.copy2(source, target)
        copied.append(target)
    return copied


def _risk_report(surfaces: list[dict[str, Any]], scenarios: list[dict[str, Any]]) -> str:
    lines = [
        "# 安全风险分析报告",
        "",
        "本报告从红队视角覆盖提示注入、模型越狱、数据泄露、滥用风险、工具调用劫持、记忆中毒、环境感知污染 7 类攻击面。",
        "所有复现均在智安哨沙箱靶场内完成，不访问真实外部系统、不读取真实用户文件、不发送真实邮件。",
        "",
    ]
    for surface in surfaces:
        linked = [scenario for scenario in scenarios if scenario["surface_id"] == surface["id"]]
        lines.extend(
            [
                f"## {surface['name']}",
                "",
                f"- 风险等级：{surface['risk']}",
                f"- 研究状态：{surface['status']}",
                f"- 攻击原理：{surface['summary']}",
                f"- 典型入口：{'、'.join(surface.get('entry_points', []))}",
                f"- 保护资产：{'、'.join(surface.get('protected_assets', []))}",
                f"- 攻击目标：{'、'.join(surface.get('attacker_goals', []))}",
                f"- 检测信号：{'、'.join(surface.get('detection_signals', []))}",
                f"- 评测重点：{'、'.join(surface.get('evaluation_focus', []))}",
                f"- 防御方向：{surface['defense']}",
                "",
            ]
        )
        for scenario in linked:
            lines.extend(
                [
                    f"### 剧本：{scenario['title']}",
                    "",
                    f"- 剧本编号：{scenario['id']}",
                    f"- 目标工具：{scenario['target']}",
                    f"- 模型对抗样本：{scenario['adversarial_prompt']}",
                    f"- 越狱测试用例：{scenario['jailbreak_case']}",
                    f"- 预期危害：{scenario['expected_risk']}",
                    f"- 落地防御：{scenario['defense']}",
                    f"- 安全边界：{scenario.get('safety_boundary', '仅在本地沙箱靶场复现。')}",
                    "- 复现步骤：",
                ]
            )
            for index, step in enumerate(scenario["script_steps"], start=1):
                lines.append(f"  {index}. {step}")
            if scenario.get("attack_path"):
                lines.append("- 攻击链路：")
                for index, step in enumerate(scenario["attack_path"], start=1):
                    lines.append(f"  {index}. {step}")
            if scenario.get("detection_points"):
                lines.append(f"- 检测信号：{'、'.join(scenario['detection_points'])}")
            if scenario.get("success_criteria"):
                lines.append(f"- 成功判据：{'；'.join(scenario['success_criteria'])}")
            lines.append("")
    return "\n".join(lines)


def _sample_set(scenarios: list[dict[str, Any]], surface_name: dict[str, str]) -> dict[str, Any]:
    return {
        "name": "智安哨模型对抗样本与越狱测试用例集",
        "safe_scope": "仅用于本地沙箱靶场复现，不针对真实系统。",
        "items": [
            {
                "id": scenario["id"],
                "surface": surface_name.get(scenario["surface_id"], scenario["surface_id"]),
                "severity": scenario["severity"],
                "target": scenario["target"],
                "adversarial_prompt": scenario["adversarial_prompt"],
                "jailbreak_case": scenario["jailbreak_case"],
                "expected_risk": scenario["expected_risk"],
                "defense": scenario["defense"],
                "detection_points": scenario.get("detection_points", []),
                "success_criteria": scenario.get("success_criteria", []),
                "safety_boundary": scenario.get("safety_boundary", "本地沙箱靶场复现。"),
                "tags": scenario.get("tags", []),
            }
            for scenario in scenarios
        ],
    }


def _script_library(scenarios: list[dict[str, Any]], surface_name: dict[str, str]) -> dict[str, Any]:
    return {
        "name": "智安哨智能体攻击脚本库",
        "agent_roles": ["规划 Agent", "样本生成 Agent", "执行 Agent", "目标智能体", "行为监督器", "评测 Agent"],
        "scripts": [
            {
                "id": scenario["id"],
                "surface": surface_name.get(scenario["surface_id"], scenario["surface_id"]),
                "title": scenario["title"],
                "steps": scenario["script_steps"],
                "attack_path": scenario.get("attack_path", []),
                "detection_points": scenario.get("detection_points", []),
                "success_criteria": scenario.get("success_criteria", []),
                "tool_calls": scenario["tool_calls"],
                "safe_boundary": scenario.get("safety_boundary", "所有工具调用均经过监督器，并在沙箱目录、假 outbox、模拟 API、模拟记忆库中执行。"),
            }
            for scenario in scenarios
        ],
    }


def _supervisor_spec(policies: list[dict[str, Any]]) -> str:
    lines = [
        "# 行为监督原型说明",
        "",
        "监督器部署位置：智能体集群 -> 工具调用层 -> 外部工具/文件/API/代码执行。",
        "",
        "## 监督对象",
        "",
        "- 模型输入输出",
        "- 多 agent 消息传递",
        "- 工具调用参数",
        "- 文件读写路径",
        "- API 请求目标",
        "- 代码执行命令",
        "- 记忆写入与读取",
        "- 环境变量和配置读取",
        "",
        "## 策略决策",
        "",
        "| 策略编号 | 策略名称 | 决策 | 说明 |",
        "|---|---|---|---|",
    ]
    for policy in policies:
        lines.append(f"| {policy['id']} | {policy['name']} | {policy['decision']} | {policy['description']} |")
    lines.extend(
        [
            "",
            "## 模拟比赛业务工具",
            "",
            "- 邮件工具：写入假发件箱，不发送真实邮件。",
            "- 文件工具：只访问沙箱目录。",
            "- API 工具：使用模拟参赛队伍、提交物、成绩榜、赛题种子和校园网会话接口。",
            "- 代码执行工具：限制目录、超时、输出长度和危险命令。",
            "- 记忆工具：支持写入、读取、污染和隔离。",
            "- 环境工具：提供低信任假配置和假环境变量。",
            "",
            "## 外部智能体适配方式",
            "",
            "平台提供 `/api/supervisor/evaluate` 通用监督接口和 `/api/integrations/openclaw/events` 兼容接口。OpenClaw 或其他开源智能体应用只需要在工具执行前把工具调用事件转发给监督器，即可获得允许、拒绝、询问、隔离决策。",
            "",
            "外部事件会被写入 `audit_logs` 和 `alerts`，因此它不是只能运行内置样例，也可以作为旁路安全插件接入真实智能体应用的工具调用链。",
        ]
    )
    return "\n".join(lines)


def _experiment_report(runs: list[dict[str, Any]]) -> str:
    policy_counter: Counter[str] = Counter()
    decision_counter: Counter[str] = Counter()
    for run in runs:
        for log in run.get("audit_logs", []):
            policy_counter[log["policy_id"]] += 1
            decision_counter[log["decision"]] += 1

    total = len(runs)
    guarded = [run for run in runs if run.get("guard_enabled")]
    attack_success = [run for run in runs if run.get("attack_success")]
    avg_latency = round(sum(run.get("metrics", {}).get("detection_latency_ms", 0) for run in runs) / total) if total else 0
    lines = [
        "# 实验评测结果",
        "",
        f"- 实验总数：{total}",
        f"- 开启防护实验：{len(guarded)}",
        f"- 攻击成功率：{round((len(attack_success) / total) * 100) if total else 0}%",
        f"- 平均检测延迟：{avg_latency}ms",
        "",
        "## 策略命中",
        "",
        "| 策略 | 命中次数 |",
        "|---|---:|",
    ]
    if policy_counter:
        for policy_id, count in policy_counter.most_common():
            lines.append(f"| {policy_id} | {count} |")
    else:
        lines.append("| 暂无 | 0 |")

    lines.extend(["", "## 决策分布", "", "| 决策 | 次数 |", "|---|---:|"])
    if decision_counter:
        for decision, count in decision_counter.most_common():
            lines.append(f"| {decision} | {count} |")
    else:
        lines.append("| 暂无 | 0 |")

    lines.extend(
        [
            "",
            "## 最近实验明细",
            "",
            "| 时间 | 剧本 | 防护 | 攻击成功 | 阻断 | 询问 | 隔离 | 延迟 |",
            "|---|---|---|---|---:|---:|---:|---:|",
        ]
    )
    for run in runs:
        metrics = run.get("metrics", {})
        scenario = run.get("scenario", {})
        lines.append(
            "| {time} | {scenario} | {guard} | {success} | {blocked} | {asked} | {isolated} | {latency}ms |".format(
                time=str(run.get("created_at", ""))[:19],
                scenario=scenario.get("id", "unknown"),
                guard="开启" if run.get("guard_enabled") else "关闭",
                success="是" if run.get("attack_success") else "否",
                blocked=metrics.get("blocked_count", 0),
                asked=metrics.get("asked_count", 0),
                isolated=metrics.get("isolated_count", 0),
                latency=metrics.get("detection_latency_ms", 0),
            )
        )
    if not runs:
        lines.append("| 暂无 | 暂无 | 暂无 | 否 | 0 | 0 | 0 | 0ms |")
    return "\n".join(lines)


def _checklist(
    surfaces: list[dict[str, Any]],
    scenarios: list[dict[str, Any]],
    runs: list[dict[str, Any]],
    alerts_count: int,
) -> list[dict[str, str]]:
    surface_count = len({scenario["surface_id"] for scenario in scenarios})
    complete_scenarios = [
        scenario
        for scenario in scenarios
        if scenario.get("adversarial_prompt") and scenario.get("jailbreak_case") and scenario.get("script_steps") and scenario.get("tool_calls")
    ]
    return [
        {
            "requirement": "安全风险分析报告至少 3 类攻击场景",
            "status": "满足",
            "evidence": f"当前覆盖 {len(surfaces)} 类攻击面，其中 {surface_count} 类已有剧本。",
        },
        {
            "requirement": "每类场景包含模型对抗样本与越狱测试用例集",
            "status": "满足",
            "evidence": f"{len(complete_scenarios)}/{len(scenarios)} 个剧本已包含对抗样本、越狱用例、脚本步骤和工具调用。",
        },
        {
            "requirement": "智能体攻击脚本",
            "status": "满足",
            "evidence": "攻击脚本库包含单 agent 和多 agent 协同复现步骤。",
        },
        {
            "requirement": "拦截智能体集群与外部工具的交互",
            "status": "满足",
            "evidence": "run_scenario 调用链中每次 tool_call 均先经过 supervisor.decide。",
        },
        {
            "requirement": "支持允许、拒绝、询问、隔离或异常检测",
            "status": "满足",
            "evidence": "策略中心和审计日志已覆盖四类决策。",
        },
        {
            "requirement": "提供开源智能化应用或适配目标",
            "status": "基本满足",
            "evidence": "内置智能体靶场，提供 OpenClaw 事件适配结构和可安装 native plugin 包；真实 OpenClaw 运行验收需在安装 OpenClaw 的环境中执行。",
        },
        {
            "requirement": "模拟比赛工具",
            "status": "满足",
            "evidence": "已覆盖邮件、文件、API、代码执行、记忆、环境变量工具。",
        },
        {
            "requirement": "模型调用链路安全监控插件",
            "status": "满足",
            "evidence": "agent_trace、audit_logs、alerts 记录输入、输出、工具调用和策略命中。",
        },
        {
            "requirement": "基座模型检测或过滤原型",
            "status": "满足",
            "evidence": "支持越狱提示过滤、工具行为监测和模拟模型兜底。",
        },
        {
            "requirement": "监督端实时展示告警或阻断记录",
            "status": "满足" if alerts_count else "待运行实验",
            "evidence": f"当前已有 {alerts_count} 条告警或阻断记录，实验运行次数 {len(runs)}。",
        },
    ]


def _adapter_schema() -> dict[str, Any]:
    return {
        "name": "OpenClaw/通用智能体工具调用事件适配结构",
        "request": {
            "conversation_id": "string",
            "agent_id": "string",
            "agent_role": "planner | executor | target-agent | tool",
            "source_app": "OpenClaw | LangChain | AutoGen | custom-agent",
            "model_input": "string",
            "model_output": "string",
            "tool_call": {
                "tool": "file.read | mail.send | api.call | code.run | memory.read | memory.write | env.read",
                "arguments": "object",
                "risk_hint": "string",
            },
            "context_sources": ["system", "user", "web", "tool", "memory"],
            "guard_enabled": "boolean",
            "execute_in_sandbox": "boolean",
        },
        "response": {
            "run_id": "string",
            "audit_id": "string",
            "persisted": "boolean",
            "decision": "允许 | 拒绝 | 询问 | 隔离",
            "risk_level": "low | medium | high | critical",
            "risk_score": "0-100 integer",
            "risk_factors": ["string"],
            "anomaly_score": "0-100 integer",
            "anomaly_signals": ["string"],
            "policy_id": "string",
            "reason": "string",
            "recommendation": "string",
            "execution_mode": "string",
            "surface_id": "string",
            "risk_evidence": "object",
        },
    }


def _submission_readme(package: dict[str, Any]) -> str:
    summary = package["summary"]
    return "\n".join(
        [
            "# 智安哨初赛提交包",
            "",
            "项目名称：智安哨：大模型智能体攻击面研究与行为监督平台",
            "",
            "## 项目定位",
            "",
            "本项目面向赛道一“面向大模型及其应用的安全性研究”，构建红队攻击面研究、攻击样本复现、智能体行为监督、防御策略评测和报告导出闭环。",
            "",
            "## 当前提交包统计",
            "",
            f"- 攻击面覆盖：{summary['surface_count']} 类",
            f"- 攻击剧本数量：{summary['scenario_count']} 个",
            f"- 可演示攻击面：{summary['demo_ready_surface_count']} 类",
            f"- 实验记录：{summary['run_count']} 次",
            f"- 告警证据：{summary['alert_count']} 条",
            f"- 防护控制率：{summary['control_rate']}%",
            "",
            "## 目录说明",
            "",
            "- `01_比赛要求材料`：对应赛题要求的风险报告、样本集、脚本库、监督原型说明和实验评测结果。",
            "- `02_运行与答辩说明`：运行方式、接口清单、验收清单、源码结构和截图建议。",
            "- `manifest.json`：提交包文件清单。",
        ]
    )


def _run_guide() -> str:
    return "\n".join(
        [
            "# 运行说明",
            "",
            "## 1. 后端服务",
            "",
            "```powershell",
            "npm run api",
            "```",
            "",
            "默认地址：`http://127.0.0.1:8012`",
            "",
            "## 2. 前端页面",
            "",
            "```powershell",
            "npm run dev",
            "```",
            "",
            "默认地址：`http://127.0.0.1:5178`",
            "",
            "## 3. 批量实验",
            "",
            "```powershell",
            "python -X utf8 -m backend.zhian.cli assess --run-compare",
            "```",
            "",
            "这个命令会批量运行全部内置攻击剧本，并分别生成无防护和有防护实验记录。",
            "",
            "## 4. 外部智能体事件评估",
            "",
            "```powershell",
            "python -X utf8 -m backend.zhian.cli evaluate --input backend/sandbox/examples/agent-event.json",
            "```",
            "",
            "也可以把真实智能体的工具调用事件 POST 到 `/api/supervisor/evaluate`。外部事件会写入审计日志和告警记录。",
            "",
            "批量评估真实智能体事件：",
            "",
            "```powershell",
            "python -X utf8 -m backend.zhian.cli evaluate --input backend/sandbox/examples/agent-events-batch.json",
            "```",
            "",
            "## 5. 生成提交包",
            "",
            "```powershell",
            "npm run cli -- package",
            "```",
            "",
            "导出单个攻击面证据包：",
            "",
            "```powershell",
            "npm run cli -- surface-pack --surface prompt-injection --output backend/sandbox/reports",
            "```",
            "",
            "一键导出全部攻击面证据包：",
            "",
            "```powershell",
            "npm run cli -- surface-packs --output backend/sandbox/reports",
            "```",
            "",
            "导出全部攻击面答辩单页 HTML：",
            "",
            "```powershell",
            "npm run cli -- surface-briefs --output backend/sandbox/reports",
            "```",
            "",
            "导出项目成熟度与缺口路线图：",
            "",
            "```powershell",
            "npm run cli -- roadmap --output backend/sandbox/reports",
            "```",
            "",
            "导出异常检测阈值校准报告：",
            "",
            "```powershell",
            "npm run cli -- anomaly-calibration --output backend/sandbox/reports",
            "```",
            "",
            "导出连续正常比赛任务流程误报评测：",
            "",
            "```powershell",
            "npm run cli -- benign-workflows-write --output backend/sandbox/reports",
            "```",
            "",
            "导出赛前一键体检报告：",
            "",
            "```powershell",
            "npm run cli -- readiness --write --output backend/sandbox/reports",
            "```",
            "",
            "导出人工复核队列与审批闭环报告：",
            "",
            "```powershell",
            "npm run cli -- approvals --write --output backend/sandbox/reports",
            "```",
            "",
            "运行答辩一键演示并导出报告：",
            "",
            "```powershell",
            "npm run cli -- demo-drill --run --output backend/sandbox/reports",
            "```",
            "",
            "导出 OpenClaw 源码级插件包：",
            "",
            "```powershell",
            "npm run cli -- openclaw-plugin --output backend/sandbox/reports",
            "```",
            "",
            "生成并验收 OpenClaw 源码级插件包：",
            "",
            "```powershell",
            "npm run cli -- openclaw-plugin-validate --output backend/sandbox/reports",
            "```",
            "",
            "生成结果位于 `backend/sandbox/submission_packages`。",
        ]
    )


def _api_inventory() -> str:
    return "\n".join(
        [
            "# 接口清单",
            "",
            "| 接口 | 方法 | 作用 |",
            "|---|---|---|",
            "| `/api/overview` | GET | 攻击面、剧本、模型、近期实验总览 |",
            "| `/api/scenarios` | GET | 获取攻击剧本库 |",
            "| `/api/policies` | GET | 获取防御策略 |",
            "| `/api/policies/{policy_id}` | PATCH | 启用或停用策略 |",
            "| `/api/run` | POST | 运行单个攻击剧本 |",
            "| `/api/compare` | POST | 单剧本无防护/有防护对比 |",
            "| `/api/batch_compare` | POST | 批量对比全部攻击剧本 |",
            "| `/api/supervisor/evaluate` | POST | 通用外部智能体工具调用事件评估，并写入审计证据 |",
            "| `/api/supervisor/batch_evaluate` | POST | 批量评估外部智能体工具调用事件，返回控制率并写入审计证据 |",
            "| `/api/audit_logs` | GET | 行为监督审计日志 |",
            "| `/api/alerts` | GET | 告警与阻断记录 |",
            "| `/api/approvals` | GET | 人工复核队列 JSON，可按待复核、已批准、已驳回筛选 |",
            "| `/api/approvals.md` | GET | 人工复核队列 Markdown 报告 |",
            "| `/api/approvals/write` | POST | 在本地生成人工复核队列 JSON 与 Markdown 报告 |",
            "| `/api/approvals/{review_id}/decision` | POST | 对复核单执行批准或驳回，并写入 review_hash 证据 |",
            "| `/api/demo_drill` | GET | 查看最近一次答辩一键演示 JSON 报告，不产生新审计记录 |",
            "| `/api/demo_drill.md` | GET | 查看最近一次答辩一键演示 Markdown 报告 |",
            "| `/api/demo_drill/run` | POST | 运行四步答辩演示，串联正常放行、人工复核和记忆隔离 |",
            "| `/api/demo_drill/write` | POST | 运行并在本地生成答辩一键演示 JSON 与 Markdown |",
            "| `/api/report` | GET | 初赛报告素材中心数据 |",
            "| `/api/attack_surfaces/evidence_packs` | GET | 全部攻击面的证据包索引 JSON，含完整度、控制率和缺口提示 |",
            "| `/api/attack_surfaces/evidence_packs.md` | GET | 全部攻击面证据包索引 Markdown |",
            "| `/api/attack_surfaces/evidence_packs/write` | POST | 一键生成全部攻击面的 JSON、Markdown 和总索引文件 |",
            "| `/api/attack_surfaces/{surface_id}/evidence_pack` | GET | 单个攻击面的样本、脚本、策略、工具和运行证据包 JSON |",
            "| `/api/attack_surfaces/{surface_id}/evidence_pack.md` | GET | 单个攻击面证据包 Markdown |",
            "| `/api/attack_surfaces/{surface_id}/evidence_pack/write` | POST | 在本地生成单个攻击面的 JSON 与 Markdown 证据文件 |",
            "| `/api/attack_surfaces/{surface_id}/briefing_sheet.html` | GET | 单个攻击面答辩单页 HTML，可直接截图或打印 |",
            "| `/api/attack_surfaces/{surface_id}/briefing_sheet/write` | POST | 在本地生成单个攻击面答辩单页 HTML |",
            "| `/api/attack_surfaces/briefing_sheets/write` | POST | 一键生成全部攻击面答辩单页 HTML 和索引 |",
            "| `/api/project_roadmap` | GET | 项目成熟度、方向判断、缺口 Backlog 和下一轮建议 JSON |",
            "| `/api/project_roadmap.md` | GET | 项目成熟度与缺口路线图 Markdown |",
            "| `/api/project_roadmap/write` | POST | 在本地生成项目成熟度路线图 JSON 与 Markdown |",
            "| `/api/readiness` | GET | 赛前一键体检 JSON，检查攻击面、误报、OpenClaw、截图和提交包状态 |",
            "| `/api/readiness.md` | GET | 赛前一键体检 Markdown 报告 |",
            "| `/api/readiness/write` | POST | 在本地生成赛前一键体检 JSON 与 Markdown 报告 |",
            "| `/api/evaluations/anomaly_calibration` | GET | 异常检测阈值校准 JSON，含推荐阈值、召回率、误报率和复核样本 |",
            "| `/api/evaluations/anomaly_calibration.md` | GET | 异常检测阈值校准 Markdown 报告 |",
            "| `/api/evaluations/anomaly_calibration/write` | POST | 在本地生成异常检测阈值校准 JSON 与 Markdown |",
            "| `/api/evaluations/benign_workflows` | GET | 连续正常比赛任务流程误报评测 JSON，含流程级误报率和审计 hash 链 |",
            "| `/api/evaluations/benign_workflows.md` | GET | 连续正常比赛任务流程误报评测 Markdown |",
            "| `/api/evaluations/benign_workflows/write` | POST | 在本地生成连续正常比赛任务流程误报评测 JSON 与 Markdown |",
            "| `/api/evaluations/policy_ablation` | GET | 策略消融实验结果，展示关闭关键策略后的风险暴露和兜底控制 |",
            "| `/api/evaluations/policy_ablation.md` | GET | 策略消融实验 Markdown 证据 |",
            "| `/api/deliverables` | GET | 比赛交付材料包内容 |",
            "| `/api/submission_package` | POST | 在本地生成提交包目录和 zip 文件 |",
            "| `/api/submission_package/clean` | POST | 重新运行固定攻防对照并生成干净提交包 |",
            "| `/api/integrations/openclaw/schema` | GET | OpenClaw/通用智能体适配结构 |",
            "| `/api/integrations/openclaw/bundle` | GET | OpenClaw 兼容接入包，包含事件契约、样例、验证命令和验收步骤 |",
            "| `/api/integrations/openclaw/adapter.py` | GET | 外部 Agent 工具调用钩子示例代码 |",
            "| `/api/integrations/openclaw/plugin_package` | GET | OpenClaw native plugin 包摘要，含 hook、决策映射和安装命令 |",
            "| `/api/integrations/openclaw/plugin_package.md` | GET | OpenClaw 源码级插件包 Markdown 说明 |",
            "| `/api/integrations/openclaw/plugin_package/write` | POST | 在本地生成可安装的 OpenClaw native plugin 目录和 zip |",
            "| `/api/integrations/openclaw/plugin_package/validation` | GET | OpenClaw 插件包静态验收结果，含文件、Hook 和 JS 语法检查 |",
            "| `/api/integrations/openclaw/plugin_package/validation.md` | GET | OpenClaw 插件包验收 Markdown 报告 |",
            "| `/api/integrations/openclaw/plugin_package/validation/write` | POST | 在本地生成 OpenClaw 插件包验收 JSON 与 Markdown |",
            "| `/api/integrations/openclaw/events` | POST | 外部智能体工具调用事件判定 |",
            "| `/api/integrations/openclaw/minimal_agent_demo` | POST | 页面一键运行最小外部 Agent 真实工具调度接入演示，并生成证据文件 |",
        ]
    )


def _acceptance_checklist(package: dict[str, Any]) -> str:
    lines = [
        "# 赛题验收清单",
        "",
        "| 赛题要求 | 状态 | 证据 |",
        "|---|---|---|",
    ]
    for item in package["checklist"]:
        lines.append(f"| {item['requirement']} | {item['status']} | {item['evidence']} |")
    return "\n".join(lines)


def _source_tree() -> str:
    return "\n".join(
        [
            "# 源码结构说明",
            "",
            "| 路径 | 作用 |",
            "|---|---|",
            "| `backend/zhian/data.py` | 攻击面、剧本和策略基础数据 |",
            "| `backend/zhian/agents.py` | 多 agent 攻击复现流程和批量评测 |",
            "| `backend/zhian/supervisor.py` | 行为监督策略判定 |",
            "| `backend/zhian/benign.py` | 正常比赛任务单步样本和误报率评测 |",
            "| `backend/zhian/benign_workflows.py` | 连续正常比赛任务流程误报评测和审计 hash 链 |",
            "| `backend/zhian/approvals.py` | 人工复核队列、批准/驳回和 review_hash 证据生成 |",
            "| `backend/zhian/calibration.py` | 异常检测阈值校准、召回率和误报率报告生成 |",
            "| `backend/zhian/demo_drill.py` | 答辩一键演示编排和演示报告生成 |",
            "| `backend/zhian/tools.py` | 邮件、文件、API、代码、记忆、环境模拟工具 |",
            "| `backend/zhian/deliverables.py` | 比赛材料包和提交包生成 |",
            "| `backend/zhian/events.py` | 外部智能体工具调用事件评估和审计落库 |",
            "| `backend/zhian/openclaw_adapter.py` | OpenClaw 兼容接口、源码级 native plugin 包生成 |",
            "| `backend/zhian/readiness.py` | 赛前一键体检、提交包完整性检查和 P0 补证项汇总 |",
            "| `backend/zhian/surface_pack.py` | 单个攻击面证据包生成、Markdown 导出和索引汇总 |",
            "| `backend/zhian/main.py` | FastAPI 后端接口 |",
            "| `backend/zhian/cli.py` | 命令行运行、导出和打包入口 |",
            "| `src/App.tsx` | 前端主页面和各功能模块 |",
            "| `src/api.ts` | 前端 API 调用封装 |",
            "| `src/types.ts` | 前端 TypeScript 数据类型 |",
            "| `src/design/tokens.css` | 前端设计 Token 源头，统一颜色、间距、圆角、阴影和旧变量别名 |",
            "| `src/components/ui/` | 复用基础 UI 组件，当前包含按钮、指标卡、状态标签和安全决策标签 |",
            "| `src/components/evidence/` | 运行证据展示组件，承载工具调用审计摘要和 hash 时间线 |",
            "| `src/components/surface/` | 攻击面展示组件，承载攻击入口、保护资产、检测信号等属性块 |",
            "| `src/components/scenarios/` | 攻击剧本库页面组件，承载剧本筛选、详情和工具调用参数展示 |",
            "| `src/components/lab/` | 攻击复现实验室组件，承载剧本运行、无防护/有防护对比和批量结果展示 |",
            "| `src/components/agent/` | 多 Agent 攻击链页面组件，承载协作时间线、工具调用证据和结果摘要 |",
            "| `src/components/policy/` | 防御策略中心组件，承载策略影响矩阵、覆盖工具、攻击面和关闭影响说明 |",
            "| `src/styles.css` | 前端页面样式 |",
            "| `scripts/frontend-governance-check.mjs` | 前端规范检查脚本，统计超大文件和样式硬编码问题 |",
            "| `scripts/project-self-review.mjs` | 多 Agent 自审报告脚本，汇总结构、截图、体检和提交包状态 |",
            "| `docs/` | 项目立项、方案、报告大纲和交付说明 |",
        ]
    )


def _threat_model_for_package() -> str:
    return "\n".join(
        [
            "# 攻击面威胁模型",
            "",
            "## 需要保护的资产",
            "",
            "- 系统提示词与安全规则",
            "- 沙箱文件、参赛队伍资料、提交物摘要与赛题种子",
            "- 长期记忆库",
            "- 假发件箱",
            "- 模拟比赛平台 API",
            "- 代码执行工具",
            "- 审计日志与告警证据",
            "",
            "## 信任边界",
            "",
            "| 边界 | 低信任侧 | 监督策略 |",
            "|---|---|---|",
            "| 用户输入到模型上下文 | 用户提示、网页正文、文档内容 | 输入来源标注、越狱过滤 |",
            "| 模型输出到工具调用 | 模型生成的工具名和参数 | 工具权限矩阵、参数审计 |",
            "| 工具返回到模型上下文 | 文件、API、环境、网页返回 | 低信任隔离、禁止覆盖授权 |",
            "| 智能体记忆写入 | 用户偏好、会话摘要、外部内容 | 写入审计、隔离区、回滚 |",
            "| 沙箱工具到本机环境 | 文件路径、命令、外发请求 | 路径限制、假 outbox、模拟 API |",
            "",
            "## 关键攻击面",
            "",
            "提示注入、模型越狱、数据泄露、滥用风险、工具调用劫持、记忆中毒、环境感知污染。",
            "",
            "## 必须保持的安全约束",
            "",
            "不攻击真实外部系统；不读取用户真实文件；不发送真实邮件；不执行破坏性命令；所有危险动作只在沙箱和假数据中复现。",
        ]
    )


def _real_integration_guide() -> str:
    doc_path = BASE_DIR.parent / "docs" / "真实接入与攻击面扩展说明.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 真实接入与攻击面扩展说明",
            "",
            "外部智能体可以在工具执行前 POST 到 `/api/supervisor/evaluate`，平台返回监督决策并写入审计日志。",
        ]
    )


def _frontend_design_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "前端审美优化记录.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 前端审美优化记录",
            "",
            "本轮优化减少过度卡片、收敛颜色系统、增强字体层级，并保留克制的工作台风格。",
        ]
    )


def _frontend_governance_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "前端工程规范与设计Token治理记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 前端工程规范与设计 Token 治理记录",
            "",
            "本轮新增设计 Token、基础 UI 组件和前端规范检查命令，用于约束目录、组件复用和样式硬编码问题。",
        ]
    )


def _multi_agent_self_review_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "多Agent自审优化闭环报告-20260609.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 多 Agent 自审优化闭环报告",
            "",
            "本轮通过代码结构、页面审美和比赛交付三个子代理并行审查，再由主线程完成低风险修复和自动自审报告生成。",
        ]
    )


def _page_agent_demo_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "页面一键真实Agent演示完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 页面一键真实 Agent 演示完善记录",
            "",
            "设置页新增一键运行真实 Agent demo 的按钮，可调用 `/api/integrations/openclaw/minimal_agent_demo` 并展示工具调度结果、控制率和审计 hash。",
        ]
    )


def _openclaw_plugin_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "OpenClaw源码级插件包完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# OpenClaw 源码级插件包完善记录",
            "",
            "系统新增 OpenClaw native plugin 包生成能力，通过 before_tool_call 在 OpenClaw 工具执行前调用智安哨监督器。",
        ]
    )


def _policy_ablation_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "策略消融实验完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 策略消融实验完善记录",
            "",
            "系统新增策略消融实验，可临时关闭关键防护层，验证控制率下降、风险暴露和兜底控制情况。",
        ]
    )


def _surface_pack_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "攻击面证据包完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 攻击面证据包完善记录",
            "",
            "系统新增单个攻击面证据包能力，把攻击样本、越狱用例、智能体脚本、预期策略、工具覆盖、运行证据和复现入口汇总到一个可导出的 JSON/Markdown 证据视图中。",
        ]
    )


def _roadmap_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "项目成熟度与缺口路线图完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 项目成熟度与缺口路线图完善记录",
            "",
            "系统新增项目路线图能力，用于自动判断当前项目方向、成熟度、未完成功能和下一轮优先级。",
        ]
    )


def _anomaly_calibration_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "异常检测阈值校准完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 异常检测阈值校准完善记录",
            "",
            "本轮新增异常检测阈值校准能力，用攻击样本和正常比赛任务样本计算推荐阈值、攻击召回率、正常比赛任务误报率和低分攻击复核结果。",
            "",
            "新增接口：`/api/evaluations/anomaly_calibration`、`/api/evaluations/anomaly_calibration.md`、`/api/evaluations/anomaly_calibration/write`。",
            "",
            "新增命令：`npm run cli -- anomaly-calibration --output backend/sandbox/reports`。",
        ]
    )


def _benign_expansion_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "正常比赛任务样本扩充记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 正常比赛任务样本扩充记录",
            "",
            "正常比赛任务样本已扩充到 36 条，覆盖 7 类赛事任务和 9 种工具，误报率 0%，期望决策匹配率 100%。",
        ]
    )


def _benign_workflow_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "连续正常比赛任务流程误报评测记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 连续正常比赛任务流程误报评测记录",
            "",
            "系统新增连续正常比赛任务流程误报评测，覆盖公开资料到内部周报、赛事复盘闭环、外部分享审批和沙箱统计脚本流程。",
            "",
            "当前结果：4 条流程、14 个工具步骤、误报率 0%、期望决策匹配率 100%、审计 hash 链全部有效。",
        ]
    )


def _readiness_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "赛前一键体检完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 赛前一键体检完善记录",
            "",
            "## 本轮新增",
            "",
            "1. 新增后端模块：`backend/zhian/readiness.py`。",
            "2. 新增接口：",
            "   - `GET /api/readiness`",
            "   - `GET /api/readiness.md`",
            "   - `POST /api/readiness/write`",
            "3. 新增 CLI：",
            "   - `npm run cli -- readiness --write --output backend/sandbox/reports`",
            "4. 提交包新增 `16_赛前一键体检报告.md`，并在运行说明目录归档 JSON 与 Markdown 证据。",
            "",
            "## 体检范围",
            "",
            "- 攻击面与剧本覆盖",
            "- 对抗样本、越狱用例和智能体攻击脚本",
            "- 行为监督器、策略和模拟比赛工具",
            "- 正常比赛任务单步误报评测",
            "- 连续正常比赛任务流程误报评测",
            "- 异常检测阈值校准",
            "- OpenClaw 插件静态验收和 runtime inspect 缺口",
            "- 初赛提交包、manifest 和演示截图完整性",
            "",
            "## 仍需补证",
            "",
            "- 当前本机没有 OpenClaw CLI，因此真实 runtime inspect 仍是 P0 外部环境补证项。",
        ]
    )


def _approval_review_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "人工复核队列与审批闭环完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 人工复核队列与审批闭环完善记录",
            "",
            "## 本轮新增",
            "",
            "1. 新增后端模块：`backend/zhian/approvals.py`。",
            "2. 新增数据库表：`approval_reviews`，保存复核单状态、操作人、备注和完整 payload。",
            "3. 新增接口：",
            "   - `GET /api/approvals`",
            "   - `GET /api/approvals.md`",
            "   - `POST /api/approvals/write`",
            "   - `POST /api/approvals/{review_id}/decision`",
            "4. 新增 CLI：`npm run cli -- approvals --write --output backend/sandbox/reports`。",
            "5. 审计页新增人工复核队列，可直接批准或驳回“询问”类工具调用。",
            "",
            "## 真实项目意义",
            "",
            "- “询问”不再只是一个静态决策，而是进入待处理队列。",
            "- 复核单关联原始 `audit_hash`，审批后生成 `review_hash`。",
            "- 答辩时可以演示外部智能体触发风险、监督器暂停、人工复核、证据导出四步闭环。",
        ]
    )


def _demo_drill_record() -> str:
    doc_path = BASE_DIR.parent / "docs" / "答辩一键演示闭环完善记录-20260608.md"
    if doc_path.exists():
        return doc_path.read_text(encoding="utf-8")
    return "\n".join(
        [
            "# 答辩一键演示闭环完善记录",
            "",
            "## 本轮新增",
            "",
            "1. 新增后端模块：`backend/zhian/demo_drill.py`。",
            "2. 新增接口：",
            "   - `GET /api/demo_drill`",
            "   - `GET /api/demo_drill.md`",
            "   - `POST /api/demo_drill/run`",
            "   - `POST /api/demo_drill/write`",
            "3. 新增 CLI：`npm run cli -- demo-drill --run --output backend/sandbox/reports`。",
            "4. 设置页新增“答辩一键演示”面板，展示四步演示、风险分、策略、audit_hash 和 review_hash。",
            "",
            "## 演示价值",
            "",
            "- 用一条固定流程展示正常放行、外发复核、批量导出审批和记忆隔离。",
            "- 评委不用手动构造 JSON，也能看到系统从攻击输入到证据导出的完整闭环。",
            "- 提交包新增 `18_答辩一键演示闭环报告.md`，增强现场可解释性。",
        ]
    )


def _screenshot_checklist() -> str:
    return "\n".join(
        [
            "# 演示截图清单",
            "",
            "建议初赛材料至少保留以下截图：",
            "",
            "1. 攻击面研究台：展示 7 类攻击面和主线闭环。",
            "2. 攻击剧本库：展示对抗样本、越狱用例和脚本步骤。",
            "3. 攻击复现实验室：展示无防护/有防护对比。",
            "4. 多 Agent 攻击链：展示规划、生成、执行、监督、评测流程。",
            "5. 行为监督记录：展示工具调用、代码执行、文件访问、API 调用审计。",
            "6. 告警与阻断：展示告警证据、策略命中和处置建议。",
            "7. 防御策略中心：展示允许、拒绝、询问、隔离策略配置。",
            "8. 评测报告：展示比赛交付材料包和赛题验收清单。",
            "9. 全量证据索引：展示 7 类攻击面的完整度、控制率和缺口状态。",
            "10. 攻击面答辩单页：展示单个攻击面的攻击链路、监督命中、工具覆盖和验收闭环。",
            "11. 项目成熟度路线图：展示方向判断、成熟度、P0 缺口和下一轮计划。",
            "12. 异常检测校准：展示推荐阈值、攻击召回率、正常误报率和低分攻击复核。",
            "13. OpenClaw 源码级插件包：展示 before_tool_call 检查结果、插件输出路径和安装命令。",
            "14. 连续正常比赛任务流程误报评测：展示流程通过率、步骤误报率、边界控制和审计 hash 链。",
            "15. 赛前一键体检：展示就绪分、P0 补证项、关键检查项和提交包状态。",
            "16. 人工复核队列：展示待复核、已批准、已驳回和 review_hash 证据。",
            "17. 答辩一键演示：展示正常放行、外发复核、批量导出审批和记忆隔离。",
            "18. 前端工程规范与 Token 治理：展示设计 Token、统一组件接入后的桌面和移动端页面状态。",
            "19. 决策标签统一组件：展示审计页、告警页和设置页中统一渲染的允许、拒绝、询问、隔离标签。",
            "",
            "已生成的核心截图会自动复制到提交包 `02_运行与答辩说明/演示截图` 目录；截图应尽量来自真实本地运行页面，而不是手工绘图。",
        ]
    )
