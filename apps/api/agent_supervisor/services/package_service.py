from __future__ import annotations

import json
import zipfile
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
from ..openclaw_adapter import build_openclaw_integration_markdown
from ..openclaw_plugin_package import (
    build_openclaw_plugin_package_markdown,
    build_openclaw_plugin_validation_markdown,
    write_openclaw_plugin_validation_report,
)
from ..paths import SUBMISSION_PACKAGES_DIR
from ..readiness import (
    build_competition_readiness,
    build_competition_readiness_markdown,
    write_competition_readiness_report,
)
from ..readiness_checks import build_submission_package_snapshot
from ..roadmap import build_project_roadmap_markdown
from ..surface_pack import build_surface_evidence_index_markdown, write_all_surface_briefing_sheets
from .package_content import (
    _checklist,
    _clean_submission_evidence,
    _clean_submission_summary,
    _copy_demo_screenshots,
    _copy_formal_submission_documents,
    _copy_multi_agent_self_review_reports,
    _copy_release_artifacts,
    _dependency_security_evidence_files,
    _experiment_report,
    _external_agent_demo_evidence_files,
    _file,
    _openclaw_runtime_attempt_evidence_files,
    _real_model_evaluation_evidence_files,
    _real_model_evaluation_material,
    _risk_report,
    _sample_set,
    _script_library,
    _supervisor_spec,
)
from .package_docs import (
    _acceptance_checklist,
    _adapter_schema,
    _anomaly_calibration_record,
    _api_inventory,
    _approval_review_record,
    _benign_expansion_record,
    _benign_workflow_record,
    _demo_drill_record,
    _frontend_design_record,
    _frontend_governance_record,
    _multi_agent_self_review_record,
    _openclaw_plugin_record,
    _page_agent_demo_record,
    _policy_ablation_record,
    _readiness_record,
    _real_integration_guide,
    _roadmap_record,
    _run_guide,
    _screenshot_checklist,
    _source_tree,
    _submission_readme,
    _surface_pack_record,
    _threat_model_for_package,
)

SUBMISSION_ROOT = SUBMISSION_PACKAGES_DIR


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
        _file("20_真实模型工具调用盲测报告.md", "真实模型工具调用盲测报告", "验证工具调用来自模型结构化输出，且监督器输入不包含 risk_hint。", _real_model_evaluation_material()),
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
    support_files.update(_dependency_security_evidence_files())
    support_files.update(_openclaw_runtime_attempt_evidence_files())
    support_files.update(_real_model_evaluation_evidence_files())
    for filename, content in support_files.items():
        path = support_dir / filename
        path.write_text(content, encoding="utf-8")
        written_files.append(path)
    briefing_dir = support_dir / "攻击面答辩单页"
    write_all_surface_briefing_sheets(output_root=briefing_dir, runs=runs)
    written_files.extend(sorted(path for path in briefing_dir.rglob("*.html") if path.is_file()))
    plugin_package_dir = support_dir / "OpenClaw源码级插件包"
    write_openclaw_plugin_validation_report(output_root=plugin_package_dir)
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
    written_files.extend(_copy_release_artifacts(support_dir))
    written_files.extend(_copy_formal_submission_documents(package_dir))

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
