from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from ..ablation import build_policy_ablation_markdown, load_policy_ablation_report
from ..approvals import build_approval_review_markdown
from ..attack_chains import build_attack_chain_catalog_markdown
from ..benign import build_benign_cases_markdown
from ..benign_workflows import build_benign_workflow_markdown
from ..calibration import build_anomaly_calibration_markdown
from ..data import get_attack_surfaces, get_policies, get_scenarios
from ..demo_drill import build_judge_demo_drill_markdown
from ..evidence import build_output_filter_markdown, build_surface_conclusions_markdown
from ..openclaw_plugin_package import build_openclaw_plugin_package_markdown, build_openclaw_plugin_validation_markdown
from ..readiness import build_competition_readiness_markdown
from ..roadmap import build_project_roadmap_markdown
from ..surface_pack import build_surface_evidence_index_markdown
from .package_content import (
    _checklist,
    _experiment_report,
    _file,
    _real_model_evaluation_material,
    _risk_report,
    _sample_set,
    _script_library,
    _supervisor_spec,
)
from .package_docs import _adapter_schema


def build_competition_package(runs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    runs = runs or []
    surfaces = get_attack_surfaces()
    scenarios = get_scenarios()
    policies = get_policies()
    surface_name = {surface["id"]: surface["name"] for surface in surfaces}

    files = [
        _file("01_安全风险分析报告.md", "安全风险分析报告", "按 7 类攻击面组织攻击原理、复现方式、危害和防御策略。", _risk_report(surfaces, scenarios)),
        _file("02_对抗样本与越狱用例集.json", "模型对抗样本与越狱测试用例集", "每个攻击脚本对应一条可复现实验样本。", _sample_set(scenarios, surface_name)),
        _file("03_智能体攻击脚本库.json", "智能体攻击脚本库", "记录多 agent 复现步骤、目标工具和工具调用参数。", _script_library(scenarios, surface_name)),
        _file("04_行为监督原型说明.md", "行为监督原型说明", "说明旁路监督器、策略决策、本地靶场业务工具和 OpenClaw 适配接口。", _supervisor_spec(policies)),
        _file("05_实验评测结果.md", "实验评测结果", "汇总无防护/有防护实验、策略命中和检测延迟。", _experiment_report(runs)),
        _file("06_正常比赛任务误报评测.md", "正常比赛任务误报评测", "验证监督器对正常比赛任务的放行能力、误报率和期望决策匹配率。", build_benign_cases_markdown()),
        _file("07_攻击面实验结论.md", "攻击面实验结论", "按 7 类攻击面沉淀实验结论、代表脚本、关键发现和防御结论。", build_surface_conclusions_markdown(runs)),
        _file("08_模型输出过滤证据.md", "模型输出过滤证据", "展示关闭防护和开启防护时模型输出风险的决策差异。", build_output_filter_markdown()),
        _file(
            "09_策略消融实验结果.md",
            "策略消融实验结果",
            "临时关闭关键防护层，验证各策略对控制率、风险暴露和兜底控制的贡献。",
            build_policy_ablation_markdown(load_policy_ablation_report()),
        ),
        _file("10_攻击面证据包索引.md", "攻击面证据包索引", "按单个攻击面汇总样本、脚本、策略、工具和运行证据。", build_surface_evidence_index_markdown(runs)),
        _file("11_项目成熟度与缺口路线图.md", "项目成熟度与缺口路线图", "自动判断当前项目方向、成熟度、未完成功能和下一轮优先级。", build_project_roadmap_markdown(runs)),
        _file("12_异常检测阈值校准报告.md", "异常检测阈值校准报告", "用攻击样本和正常比赛任务样本解释 anomaly_score 阈值、召回率和误报率。", build_anomaly_calibration_markdown()),
        _file("13_OpenClaw源码级插件包说明.md", "OpenClaw 源码级插件包说明", "提供可安装到 OpenClaw 的 native plugin 包，使用 before_tool_call 作为工具调用前置闸门。", build_openclaw_plugin_package_markdown()),
        _file("14_OpenClaw源码级插件包验收报告.md", "OpenClaw 源码级插件包验收报告", "检查插件包文件完整性、Hook 静态结构和 JavaScript 运行入口语法。", build_openclaw_plugin_validation_markdown()),
        _file("15_连续正常比赛任务流程误报评测.md", "连续正常比赛任务流程误报评测", "验证多步正常比赛任务流程中的工具调用误报率、边界控制和审计 hash 链。", build_benign_workflow_markdown()),
        _file("16_赛前一键体检报告.md", "赛前一键体检报告", "自动检查攻击面、误报、连续流程、OpenClaw 插件和报告证据。", build_competition_readiness_markdown()),
        _file("17_人工复核队列与审批闭环.md", "人工复核队列与审批闭环", "展示询问决策如何生成复核单、人工批准/驳回和 review_hash 证据。", build_approval_review_markdown()),
        _file("18_答辩复现闭环报告.md", "答辩复现闭环报告", "把正常放行、外发复核、批量导出审批和记忆隔离串成现场复现流程。", build_judge_demo_drill_markdown()),
        _file("19_组合攻击链评测.md", "组合攻击链评测", "把提示注入、工具劫持、数据外泄、记忆中毒等单点脚本串成多步红队路径。", build_attack_chain_catalog_markdown()),
        _file("20_真实模型工具调用盲测报告.md", "真实模型工具调用盲测报告", "验证工具调用来自模型结构化输出，且监督器输入不包含 risk_hint。", _real_model_evaluation_material()),
    ]

    demo_ready = sum(1 for surface in surfaces if surface["status"] in {"可演示", "可复现"})
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
