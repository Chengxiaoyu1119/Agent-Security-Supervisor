from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .assessment import build_attack_effectiveness, build_requirement_alignment
from .benign_workflows import evaluate_benign_workflows
from .calibration import build_anomaly_calibration
from .data import get_attack_surfaces, get_scenarios
from .openclaw_adapter import build_openclaw_plugin_package_summary
from .surface_pack import build_surface_evidence_index


BASE_DIR = Path(__file__).resolve().parents[1]
REPORT_ROOT = BASE_DIR / "sandbox" / "reports"


def build_project_roadmap(runs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    runs = runs or []
    surfaces = get_attack_surfaces()
    scenarios = get_scenarios()
    surface_index = build_surface_evidence_index(runs)
    effectiveness = build_attack_effectiveness(runs)
    calibration = build_anomaly_calibration()
    openclaw_plugin = build_openclaw_plugin_package_summary()
    openclaw_validation = _load_openclaw_validation()
    benign_workflows = evaluate_benign_workflows()
    requirements = build_requirement_alignment(effectiveness["cases"])
    dimensions = _maturity_dimensions(
        surface_index,
        effectiveness,
        requirements,
        runs,
        calibration,
        openclaw_plugin,
        openclaw_validation,
        benign_workflows,
    )
    overall_score = round(sum(item["score"] for item in dimensions) / len(dimensions)) if dimensions else 0
    completed = [item for item in dimensions if item["status"] == "已完成"]
    partial = [item for item in dimensions if item["status"] == "需完善"]
    weak = [item for item in dimensions if item["status"] == "高优先级缺口"]
    backlog = _feature_backlog(surface_index, effectiveness, requirements, calibration, openclaw_plugin, openclaw_validation)
    p0 = [item for item in backlog if item["priority"] == "P0" and item["status"] != "已完成"]
    verdict = "方向正确，已具备可复现实验、行为监督、证据包和答辩材料闭环"
    if weak:
        verdict = "方向基本正确，但存在会影响真实性或答辩说服力的高优先级缺口"
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "direction": {
            "verdict": verdict,
            "score": overall_score,
            "reason": "项目已经覆盖赛题要求的攻击场景、对抗样本、智能体脚本、监督器、审计、告警和提交材料；下一阶段重点应从原型演示走向真实接入、可部署和多模型实测。",
            "competition_fit": _competition_fit(requirements),
        },
        "summary": {
            "overall_score": overall_score,
            "dimension_count": len(dimensions),
            "completed_count": len(completed),
            "partial_count": len(partial),
            "high_priority_gap_count": len(weak),
            "p0_backlog_count": len(p0),
            "surface_count": len(surfaces),
            "scenario_count": len(scenarios),
            "run_count": len(runs),
            "evidence_gap_count": surface_index["summary"]["gap_count"],
        },
        "dimensions": dimensions,
        "feature_backlog": backlog,
        "next_sprint": _next_sprint(backlog),
        "risk_register": _risk_register(backlog, effectiveness),
    }


def _load_openclaw_validation() -> dict[str, Any] | None:
    path = REPORT_ROOT / "OpenClaw源码级插件包验收报告.json"
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    validation = data.get("validation")
    return validation if isinstance(validation, dict) else None


def build_project_roadmap_markdown(runs: list[dict[str, Any]] | None = None) -> str:
    roadmap = build_project_roadmap(runs)
    lines = [
        "# 项目成熟度与缺口路线图",
        "",
        f"- 方向判断：{roadmap['direction']['verdict']}",
        f"- 综合成熟度：{roadmap['summary']['overall_score']}%",
        f"- 高优先级缺口：{roadmap['summary']['high_priority_gap_count']} 项",
        f"- P0 待办：{roadmap['summary']['p0_backlog_count']} 项",
        "",
        "## 成熟度维度",
        "",
        "| 维度 | 状态 | 分数 | 当前证据 | 下一步 |",
        "|---|---|---:|---|---|",
    ]
    for item in roadmap["dimensions"]:
        lines.append(
            f"| {item['name']} | {item['status']} | {item['score']} | {item['evidence']} | {'；'.join(item['next_actions']) or '保持'} |"
        )
    lines.extend(["", "## 功能缺口 Backlog", "", "| 优先级 | 功能 | 为什么要做 | 验收标准 |", "|---|---|---|---|"])
    for item in roadmap["feature_backlog"]:
        lines.append(f"| {item['priority']} | {item['title']} | {item['why']} | {item['acceptance']} |")
    lines.extend(["", "## 下一轮建议", ""])
    for item in roadmap["next_sprint"]:
        lines.append(f"- **{item['title']}**：{item['acceptance']}")
    lines.extend(["", "## 风险登记", "", "| 风险 | 影响 | 缓解方式 |", "|---|---|---|"])
    for item in roadmap["risk_register"]:
        lines.append(f"| {item['risk']} | {item['impact']} | {item['mitigation']} |")
    return "\n".join(lines)


def write_project_roadmap(output_root: str | Path | None = None, runs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    root = Path(output_root) if output_root else REPORT_ROOT
    root.mkdir(parents=True, exist_ok=True)
    data = build_project_roadmap(runs)
    json_path = root / "项目成熟度与缺口路线图.json"
    markdown_path = root / "项目成熟度与缺口路线图.md"
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown_path.write_text(build_project_roadmap_markdown(runs), encoding="utf-8")
    return {
        "generated_at": data["generated_at"],
        "json_path": str(json_path.resolve()),
        "markdown_path": str(markdown_path.resolve()),
        "summary": data["summary"],
    }


def _maturity_dimensions(
    surface_index: dict[str, Any],
    effectiveness: dict[str, Any],
    requirements: list[dict[str, Any]],
    runs: list[dict[str, Any]],
    calibration: dict[str, Any],
    openclaw_plugin: dict[str, Any],
    openclaw_validation: dict[str, Any] | None,
    benign_workflows: dict[str, Any],
) -> list[dict[str, Any]]:
    requirement_status = {item["id"]: item["status"] for item in requirements}
    summary = surface_index["summary"]
    effectiveness_summary = effectiveness["summary"]
    tool_surfaces = {tool for scenario in get_scenarios() for tool in [call["tool"] for call in scenario["tool_calls"]]}
    openclaw_static_validated = bool(
        openclaw_validation
        and openclaw_validation.get("static_passed")
        and openclaw_validation.get("files_passed")
        and openclaw_validation.get("node_syntax_passed")
    )
    openclaw_runtime_validated = bool(openclaw_validation and openclaw_validation.get("runtime_inspect_passed"))
    workflow_fp_rate = benign_workflows["summary"]["false_positive_rate"]
    workflow_match_rate = benign_workflows["summary"]["expected_match_rate"]
    return [
        _dimension(
            "赛题方向匹配",
            95 if all(item["status"] in {"满足", "基本满足"} for item in requirements[:3]) else 80,
            "已覆盖大模型/智能体安全研究，核心成果围绕红队样本、工具调用监督和防御策略。",
            ["继续把叙事聚焦在真实智能体工具调用安全，而不是泛泛数据安全平台。"],
        ),
        _dimension(
            "攻击面与样本覆盖",
            100 if summary["surface_count"] >= 7 and summary["scenario_count"] >= 17 else 75,
            f"{summary['surface_count']} 类攻击面、{summary['scenario_count']} 个剧本、{summary['sample_count']} 个样本。",
            ["保持 7 类攻击面闭环，新增样本时优先补真实比赛任务上下文。"],
        ),
        _dimension(
            "行为监督闭环",
            min(100, effectiveness_summary["defense_effective_rate"]),
            f"有防护控制率 {effectiveness_summary['defense_effective_rate']}%，证据完整率 {effectiveness_summary['evidence_complete_rate']}%。",
            ["补充一键补跑缺口剧本，避免历史数据不足时页面只展示静态结论。"],
        ),
        _dimension(
            "模拟比赛工具真实性",
            95 if {"mail.send", "file.read", "file.write", "api.call", "code.run"}.issubset(tool_surfaces) and workflow_fp_rate == 0 else 78,
            f"当前攻击剧本工具覆盖：{', '.join(sorted(tool_surfaces))}；连续正常比赛任务流程 {benign_workflows['summary']['workflow_count']} 条、{benign_workflows['summary']['step_count']} 个步骤，误报率 {workflow_fp_rate}%，期望匹配率 {workflow_match_rate}%。",
            ["继续补跨模型、跨赛道和跨角色的长流程样本，验证边界控制稳定性。"],
        ),
        _dimension(
            "OpenClaw/外部 Agent 接入",
            94 if openclaw_runtime_validated else 89 if openclaw_static_validated else 86 if openclaw_plugin["runtime_checks"]["has_before_tool_call"] else 72,
            "已提供 OpenClaw 兼容事件入口、最小外部 Agent 演示和可安装 native plugin 包；插件使用 before_tool_call 作为工具调用前置闸门，且已补充文件完整性、Hook 结构和 JS 语法静态验收。",
            ["在真实 OpenClaw 环境执行 plugins install/inspect/runtime 验收，保留一次端到端运行证据。"]
            if not openclaw_runtime_validated
            else ["保留真实 runtime inspect 输出和端到端工具调用截图。"],
        ),
        _dimension(
            "模型检测与异常检测",
            92 if calibration["summary"]["benign_false_alarm_rate"] <= 10 else 75,
            f"已有输入过滤、输出过滤、上下文隔离、风险评分和异常分字段；推荐异常阈值 {calibration['summary']['recommended_threshold']}，攻击召回率 {calibration['summary']['attack_recall_rate']}%，正常误报率 {calibration['summary']['benign_false_alarm_rate']}%。",
            ["继续扩充正常比赛任务样本和跨模型样本，验证阈值在更多比赛任务上下文中稳定。"],
        ),
        _dimension(
            "多模型实测能力",
            45,
            "已有模型适配层和本地兜底，但缺少多模型批量对比结果。",
            ["增加 DeepSeek/智谱/本地模拟三类模型的批量评测矩阵。"],
        ),
        _dimension(
            "答辩材料与可视化",
            96,
            "已有全量证据索引、攻击面答辩单页、HTML 导出、截图归档和提交包。",
            ["继续补一键 PNG/PDF 导出，减少手动截图。"],
        ),
        _dimension(
            "部署与可复现",
            62,
            "已有 npm、CLI、API 和干净提交包流程。",
            ["补 Docker Compose 或一键启动脚本，降低评委复现成本。"],
        ),
        _dimension(
            "项目工程化",
            70 if runs else 58,
            f"当前有 {len(runs)} 条运行证据，SQLite 持久化和 CLI 可用。",
            ["补自动测试和 CI 检查，防止后续改页面时破坏接口。"],
        ),
    ]


def _dimension(name: str, score: int, evidence: str, next_actions: list[str]) -> dict[str, Any]:
    if score >= 90:
        status = "已完成"
    elif score >= 65:
        status = "需完善"
    else:
        status = "高优先级缺口"
    return {
        "name": name,
        "score": score,
        "status": status,
        "evidence": evidence,
        "next_actions": next_actions,
    }


def _feature_backlog(
    surface_index: dict[str, Any],
    effectiveness: dict[str, Any],
    requirements: list[dict[str, Any]],
    calibration: dict[str, Any],
    openclaw_plugin: dict[str, Any],
    openclaw_validation: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    calibration_done = (
        calibration["summary"]["attack_sample_count"] > 0
        and calibration["summary"]["benign_sample_count"] > 0
        and calibration["summary"]["benign_false_alarm_rate"] <= 10
    )
    openclaw_static_validated = bool(
        openclaw_validation
        and openclaw_validation.get("static_passed")
        and openclaw_validation.get("files_passed")
        and openclaw_validation.get("node_syntax_passed")
    )
    return [
        {
            "id": "real-openclaw-hook",
            "priority": "P0",
            "title": "真实 OpenClaw 源码级工具调用 Hook",
            "why": "赛题明确提到开源智能化应用，源码级接入比兼容样例更有说服力。",
            "scope": "接入 OpenClaw 或同类 Agent 的工具调用前后置事件。",
            "acceptance": "能从真实 OpenClaw Agent 操作触发监督 API、审计日志和告警记录。",
            "status": "部分完成" if openclaw_static_validated or openclaw_plugin["runtime_checks"]["has_before_tool_call"] else "未完成",
        },
        {
            "id": "anomaly-calibration",
            "priority": "P0",
            "title": "异常检测阈值校准报告",
            "why": "当前 anomaly_score 已存在，但需要解释分数来源和误报控制。",
            "scope": "用攻击样本和正常比赛任务样本生成阈值、召回率、误报率。",
            "acceptance": "输出 Markdown/JSON 报告，并在报告页展示异常检测曲线。",
            "status": "已完成" if calibration_done else "未完成",
        },
        {
            "id": "multi-model-eval",
            "priority": "P1",
            "title": "多模型批量对比评测",
            "why": "大模型安全题需要证明机制不绑定单一模型。",
            "scope": "对 DeepSeek、智谱、本地模拟或其他可用模型运行同一批剧本。",
            "acceptance": "输出模型维度的攻击成功率、控制率、输出过滤率对比表。",
            "status": "未完成",
        },
        {
            "id": "gap-rerun",
            "priority": "P1",
            "title": "缺口一键补跑",
            "why": "证据包有缺口提示，但还缺自动补证据动作。",
            "scope": "从缺口列表定位剧本，自动运行 compare 或外部事件演示。",
            "acceptance": "点击按钮后刷新证据包，缺口数和运行记录同步变化。",
            "status": "未完成",
        },
        {
            "id": "brief-export-pdf",
            "priority": "P1",
            "title": "答辩单页 PNG/PDF 导出",
            "why": "HTML 已可打开，但最终 PPT 仍需要图片或 PDF。",
            "scope": "用 Playwright 或浏览器打印生成图片/PDF。",
            "acceptance": "提交包自动包含每类攻击面 PNG 或 PDF 单页。",
            "status": "未完成",
        },
        {
            "id": "one-command-run",
            "priority": "P2",
            "title": "一键启动与 Docker 化",
            "why": "评委复现时越少命令越稳。",
            "scope": "提供 Windows 脚本和 Docker Compose。",
            "acceptance": "一条命令启动 API、前端和初始化演示数据。",
            "status": "未完成",
        },
        {
            "id": "demo-video-evidence",
            "priority": "P2",
            "title": "演示视频与截图索引",
            "why": "比赛提交和答辩需要快速证明系统可运行。",
            "scope": "补录制脚本、截图清单、视频路径归档。",
            "acceptance": "提交包包含截图索引和视频占位说明。",
            "status": "未完成",
        },
    ]


def _next_sprint(backlog: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [item for item in backlog if item["priority"] == "P0" and item["status"] != "已完成"][:3]


def _risk_register(backlog: list[dict[str, Any]], effectiveness: dict[str, Any]) -> list[dict[str, str]]:
    backlog_status = {item["id"]: item["status"] for item in backlog}
    risks = [
        {
            "risk": "真实接入证据不足",
            "impact": "评委可能认为系统仍偏模拟演示。",
            "mitigation": "优先完成真实 OpenClaw 或同类 Agent 的工具调用 Hook。",
        },
        {
            "risk": "复现步骤偏多",
            "impact": "现场环境不稳定时影响展示。",
            "mitigation": "补一键启动脚本、Docker 化和最终截图/PDF 兜底材料。",
        },
    ]
    if backlog_status.get("anomaly-calibration") != "已完成":
        risks.insert(
            1,
            {
                "risk": "异常检测解释不足",
                "impact": "anomaly_score 容易被质疑为规则字段而非检测模型。",
                "mitigation": "补正常样本/攻击样本阈值校准和误报率报告。",
            },
        )
    if effectiveness["summary"]["evidence_complete_rate"] < 90:
        risks.append(
            {
                "risk": "运行证据不完整",
                "impact": "部分攻击剧本无法形成无防护/有防护对照。",
                "mitigation": "增加缺口一键补跑，提交前固定跑 clean-package。",
            }
        )
    return risks


def _competition_fit(requirements: list[dict[str, Any]]) -> int:
    satisfied = sum(1 for item in requirements if item["status"] in {"满足", "基本满足"})
    return round(satisfied / max(1, len(requirements)) * 100)
