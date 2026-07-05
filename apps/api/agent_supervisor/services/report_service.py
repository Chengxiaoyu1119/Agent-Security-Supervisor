from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import Any, cast

from ..ablation import load_policy_ablation_report
from ..assessment import build_attack_effectiveness
from ..benign import evaluate_benign_cases
from ..benign_workflows import evaluate_benign_workflows
from ..calibration import build_anomaly_calibration
from ..data import get_attack_surfaces, get_policies, get_scenarios
from ..database import latest_runs
from ..domains.reports.roadmap import build_project_roadmap
from ..evidence import build_output_filter_evidence, build_surface_conclusions
from .package_service import build_competition_package


def build_report() -> dict:
    runs = latest_runs(500)
    surfaces = get_attack_surfaces()
    scenarios = get_scenarios()
    policies = get_policies()
    benign_eval = evaluate_benign_cases()
    benign_workflow_eval = evaluate_benign_workflows()
    surface_conclusion_eval = build_surface_conclusions(runs)
    output_filter_eval = build_output_filter_evidence()
    attack_effectiveness_eval = build_attack_effectiveness(runs)
    policy_ablation_eval = load_policy_ablation_report()
    project_roadmap_eval = build_project_roadmap(runs)
    anomaly_calibration_eval = build_anomaly_calibration()
    surface_name = {surface["id"]: surface["name"] for surface in surfaces}
    scenario_name = {scenario["id"]: scenario["title"] for scenario in scenarios}

    total = len(runs)
    guarded_runs = [run for run in runs if run["guard_enabled"]]
    controlled_runs = [
        run
        for run in guarded_runs
        if run["metrics"]["blocked_count"] or run["metrics"]["asked_count"] or run["metrics"]["isolated_count"]
    ]
    attack_successes = [run for run in runs if run["attack_success"]]
    avg_latency = round(sum(run["metrics"]["detection_latency_ms"] for run in runs) / total) if total else 0

    policy_counter: Counter[str] = Counter()
    decision_counter: Counter[str] = Counter()
    for run in runs:
      for log in run.get("audit_logs", []):
          policy_counter[log["policy_id"]] += 1
          decision_counter[log["decision"]] += 1

    surface_coverage = []
    for surface in surfaces:
        linked = [scenario for scenario in scenarios if scenario["surface_id"] == surface["id"]]
        surface_coverage.append(
            {
                "id": surface["id"],
                "name": surface["name"],
                "risk": surface["risk"],
                "status": surface["status"],
                "samples": surface["samples"],
                "scripts": surface["scripts"],
                "scenario_count": len(linked),
                "demo_ready": surface["status"] in {"可演示", "可复现"},
                "defense": surface["defense"],
            }
        )

    scenario_matrix = []
    for scenario in scenarios:
        latest = next((run for run in runs if run["scenario"]["id"] == scenario["id"]), None)
        scenario_matrix.append(
            {
                "id": scenario["id"],
                "surface": surface_name.get(scenario["surface_id"], scenario["surface_id"]),
                "title": scenario["title"],
                "severity": scenario["severity"],
                "target": scenario["target"],
                "has_adversarial_prompt": bool(scenario["adversarial_prompt"]),
                "has_jailbreak_case": bool(scenario["jailbreak_case"]),
                "script_steps": len(scenario["script_steps"]),
                "tool_calls": len(scenario["tool_calls"]),
                "last_attack_success": latest["attack_success"] if latest else None,
                "last_decision": latest["audit_logs"][0]["decision"] if latest and latest.get("audit_logs") else "未运行",
            }
        )

    deliverables = [
        {
            "name": "安全风险分析报告",
            "status": "已覆盖",
            "evidence": f"{len(surfaces)} 类攻击面，{len(scenarios)} 个攻击脚本。",
        },
        {
            "name": "模型对抗样本与越狱测试用例集",
            "status": "已覆盖",
            "evidence": "每个脚本均包含 adversarial_prompt 与 jailbreak_case。",
        },
        {
            "name": "智能体攻击脚本",
            "status": "已覆盖",
            "evidence": "每个脚本均包含 script_steps 与 tool_calls。",
        },
        {
            "name": "行为监督原型系统",
            "status": "已实现",
            "evidence": "监督器拦截工具调用并输出允许、拒绝、询问、隔离。",
        },
        {
            "name": "本地受控环境业务工具",
            "status": "已实现",
            "evidence": "覆盖邮件、文件、API、代码执行、记忆、环境变量工具。",
        },
        {
            "name": "模型调用链监控插件",
            "status": "已实现",
            "evidence": "记录 agent_trace、audit_logs、alerts 与模型输出。",
        },
        {
            "name": "OpenClaw 源码级工具调用 Hook",
            "status": "已提供插件包",
            "evidence": "可生成 OpenClaw native plugin 包，使用 before_tool_call 接入智安哨监督器；真实运行验收需在 OpenClaw 环境执行。",
        },
        {
            "name": "基座模型检测或过滤原型",
            "status": "已实现",
            "evidence": f"支持越狱过滤、输出过滤、策略判定、异常检测；校准阈值 {anomaly_calibration_eval['summary']['recommended_threshold']}，正常业务任务误报率 {anomaly_calibration_eval['summary']['benign_false_alarm_rate']}%。",
        },
        {
            "name": "异常检测阈值校准报告",
            "status": "已实现",
            "evidence": f"攻击召回率 {anomaly_calibration_eval['summary']['attack_recall_rate']}%，正常业务任务误报率 {anomaly_calibration_eval['summary']['benign_false_alarm_rate']}%。",
        },
        {
            "name": "正常业务任务误报评测",
            "status": "已实现",
            "evidence": f"{benign_eval['summary']['case_count']} 个正常业务任务样本，误报率 {benign_eval['summary']['false_positive_rate']}%。",
        },
        {
            "name": "连续正常业务任务流程误报评测",
            "status": "已实现",
            "evidence": f"{benign_workflow_eval['summary']['workflow_count']} 条比赛任务流程，{benign_workflow_eval['summary']['step_count']} 个工具步骤，误报率 {benign_workflow_eval['summary']['false_positive_rate']}%。",
        },
        {
            "name": "监督端实时告警或阻断记录",
            "status": "已实现",
            "evidence": f"当前日志中有 {sum(len(run.get('alerts', [])) for run in runs)} 条告警或阻断记录。",
        },
    ]

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "surface_count": len(surfaces),
        "scenario_count": len(scenarios),
        "run_count": total,
        "guarded_run_count": len(guarded_runs),
        "attack_success_rate": round((len(attack_successes) / total) * 100) if total else 0,
        "control_rate": round((len(controlled_runs) / len(guarded_runs)) * 100) if guarded_runs else 0,
        "avg_latency_ms": avg_latency,
        "enabled_policy_count": sum(1 for policy in policies if policy.get("enabled")),
        "policy_count": len(policies),
        "benign_sample_count": benign_eval["summary"]["case_count"],
        "benign_workflow_count": benign_workflow_eval["summary"]["workflow_count"],
        "benign_workflow_step_count": benign_workflow_eval["summary"]["step_count"],
        "benign_workflow_false_positive_rate": benign_workflow_eval["summary"]["false_positive_rate"],
        "false_positive_count": benign_eval["summary"]["false_positive_count"],
        "false_positive_rate": benign_eval["summary"]["false_positive_rate"],
        "expected_match_rate": benign_eval["summary"]["expected_match_rate"],
        "surface_conclusion_count": surface_conclusion_eval["summary"]["conclusion_count"],
        "output_filter_case_count": output_filter_eval["summary"]["case_count"],
        "output_filter_block_rate": output_filter_eval["summary"]["block_rate"],
        "attack_reproduced_rate": attack_effectiveness_eval["summary"]["attack_reproduced_rate"],
        "defense_effective_rate": attack_effectiveness_eval["summary"]["defense_effective_rate"],
        "evidence_complete_rate": attack_effectiveness_eval["summary"]["evidence_complete_rate"],
        "policy_ablation_control_drop": policy_ablation_eval["summary"]["control_drop"],
        "policy_ablation_risk_exposed_count": policy_ablation_eval["summary"]["risk_exposed_count"],
        "anomaly_recommended_threshold": anomaly_calibration_eval["summary"]["recommended_threshold"],
        "anomaly_attack_recall_rate": anomaly_calibration_eval["summary"]["attack_recall_rate"],
        "anomaly_false_alarm_rate": anomaly_calibration_eval["summary"]["benign_false_alarm_rate"],
    }

    lines = [
        "# 智安哨初赛报告素材",
        "",
        "## 1. 作品定位",
        "",
        "本作品面向“面向大模型及其应用的安全性研究”方向，构建红队攻击面研究、智能体受控实验环境复现、行为监督拦截和防御评测闭环。",
        "",
        "## 2. 核心统计",
        "",
        f"- 攻击面覆盖：{summary['surface_count']} 类",
        f"- 攻击脚本数量：{summary['scenario_count']} 个",
        f"- 已记录实验：{summary['run_count']} 次",
        f"- 防护开启实验：{summary['guarded_run_count']} 次",
        f"- 防护控制率：{summary['control_rate']}%",
        f"- 正常业务任务误报率：{summary['false_positive_rate']}%",
        f"- 连续比赛任务流程误报率：{summary['benign_workflow_false_positive_rate']}%",
        f"- 期望决策匹配率：{summary['expected_match_rate']}%",
        f"- 输出过滤阻断率：{summary['output_filter_block_rate']}%",
        f"- 无防护攻击复现率：{summary['attack_reproduced_rate']}%",
        f"- 有防护有效控制率：{summary['defense_effective_rate']}%",
            f"- 证据完整率：{summary['evidence_complete_rate']}%",
            f"- 异常检测推荐阈值：{summary['anomaly_recommended_threshold']}",
            f"- 异常检测攻击召回率：{summary['anomaly_attack_recall_rate']}%",
            f"- 异常检测正常误报率：{summary['anomaly_false_alarm_rate']}%",
            f"- 平均检测延迟：{summary['avg_latency_ms']}ms",
        "",
        "## 3. 攻击面覆盖",
        "",
        "| 攻击面 | 风险 | 状态 | 样本 | 脚本 | 防御策略 |",
        "|---|---|---|---:|---:|---|",
    ]
    for surface in surface_coverage:
        lines.append(
            f"| {surface['name']} | {surface['risk']} | {surface['status']} | {surface['samples']} | {surface['scripts']} | {surface['defense']} |"
        )

    lines.extend(
        [
            "",
            "## 4. 攻击脚本矩阵",
            "",
            "| 脚本 | 攻击面 | 目标 | 风险 | 对抗样本 | 越狱用例 | 脚本步骤 | 工具调用 |",
            "|---|---|---|---|---|---|---:|---:|",
        ]
    )
    for scenario in scenario_matrix:
        lines.append(
            "| {id} | {surface} | {target} | {severity} | {prompt} | {jailbreak} | {steps} | {tools} |".format(
                id=scenario["id"],
                surface=scenario["surface"],
                target=scenario["target"],
                severity=scenario["severity"],
                prompt="有" if scenario["has_adversarial_prompt"] else "缺失",
                jailbreak="有" if scenario["has_jailbreak_case"] else "缺失",
                steps=scenario["script_steps"],
                tools=scenario["tool_calls"],
            )
        )

    lines.extend(
        [
            "",
            "## 5. 成果能力对齐",
            "",
            "| 要求 | 状态 | 证据 |",
            "|---|---|---|",
        ]
    )
    for item in deliverables:
        lines.append(f"| {item['name']} | {item['status']} | {item['evidence']} |")

    lines.extend(
        [
            "",
            "## 6. 策略命中统计",
            "",
            "| 策略 | 命中次数 |",
            "|---|---:|",
        ]
    )
    if policy_counter:
        for policy_id, count in policy_counter.most_common():
            lines.append(f"| {policy_id} | {count} |")
    else:
        lines.append("| 暂无 | 0 |")

    lines.extend(
        [
            "",
            "## 7. 正常业务任务误报评测",
            "",
            "| 样本 | 类别 | 工具 | 期望 | 实际 | 误报 | 策略 |",
            "|---|---|---|---|---|---|---|",
        ]
    )
    for item in cast(list[dict[str, Any]], benign_eval["cases"]):
        tool_call = cast(dict[str, Any], item["tool_call"])
        lines.append(
            "| {id} | {category} | {tool} | {expected} | {actual} | {fp} | {policy} |".format(
                id=item["id"],
                category=item["category"],
                tool=tool_call["tool"],
                expected=item["expected_decision"],
                actual=item["decision"],
                fp="是" if item["is_false_positive"] else "否",
                policy=item["policy_id"],
            )
        )

    lines.extend(
        [
            "",
            "## 8. 连续正常业务任务流程误报评测",
            "",
            f"- 流程数量：{benign_workflow_eval['summary']['workflow_count']}",
            f"- 工具步骤：{benign_workflow_eval['summary']['step_count']}",
            f"- 流程通过率：{benign_workflow_eval['summary']['workflow_pass_rate']}%",
            f"- 步骤误报率：{benign_workflow_eval['summary']['false_positive_rate']}%",
            f"- 审计 hash 链通过流程：{benign_workflow_eval['summary']['audit_chain_valid_count']}",
            "",
            "| 流程 | 步骤 | 通过 | 误报 | 控制步骤 | 审计链 |",
            "|---|---:|---|---:|---:|---|",
        ]
    )
    for workflow in benign_workflow_eval["workflows"]:
        lines.append(
            "| {title} | {steps} | {passed} | {fp} | {controlled} | {chain} |".format(
                title=workflow["title"],
                steps=workflow["step_count"],
                passed="是" if workflow["passed"] else "否",
                fp=workflow["false_positive_count"],
                controlled=workflow["controlled_count"],
                chain="有效" if workflow["audit_chain_valid"] else "异常",
            )
        )

    lines.extend(
        [
            "",
            "## 9. 攻击面实验结论",
            "",
            "| 攻击面 | 脚本 | 运行证据 | 控制率 | 关键策略 |",
            "|---|---:|---:|---:|---|",
        ]
    )
    for item in cast(list[dict[str, Any]], surface_conclusion_eval["conclusions"]):
        expected_policies = cast(dict[str, Any], item["expected_policies"])
        lines.append(
            "| {name} | {scenario_count} | {run_count} | {control_rate}% | {policies} |".format(
                name=item["surface_name"],
                scenario_count=item["scenario_count"],
                run_count=item["run_count"],
                control_rate=item["control_rate"],
                policies="、".join(expected_policies.keys()) or "default-allow",
            )
        )

    lines.extend(
        [
            "",
            "## 10. 模型输出过滤前后对比",
            "",
            "| 脚本 | 类型 | 关闭防护 | 开启防护 | 策略 |",
            "|---|---|---|---|---|",
        ]
    )
    for case in output_filter_eval["cases"]:
        lines.append(
            "| {scenario} | {filter_type} | {before} | {after} | {policy} |".format(
                scenario=case["scenario_id"],
                filter_type=case["filter_type"],
                before=case["without_guard"]["decision"],
                after=case["with_guard"]["decision"],
                policy=case["with_guard"]["policy_id"],
            )
        )

    lines.extend(
        [
            "",
            "## 11. 攻防有效性评测矩阵",
            "",
            "| 脚本 | 无防护复现 | 有防护控制 | 策略匹配 | 证据完整 | 缺口 |",
            "|---|---|---|---|---|---|",
        ]
    )
    for case in attack_effectiveness_eval["cases"]:
        lines.append(
            "| {scenario} | {attack} | {defense} | {match} | {complete} | {gaps} |".format(
                scenario=case["scenario_id"],
                attack="是" if case["attack_reproduced_without_guard"] else "否",
                defense="是" if case["defense_effective_with_guard"] else "否",
                match="是" if case["expected_decision_match"] else "否",
                complete="是" if case["evidence_complete"] else "否",
                gaps="；".join(case["evidence_gaps"]) or "无",
            )
        )

    lines.extend(
        [
            "",
            "## 12. 异常检测阈值校准",
            "",
            f"- 推荐阈值：anomaly_score >= {anomaly_calibration_eval['summary']['recommended_threshold']}",
            f"- 攻击样本召回率：{anomaly_calibration_eval['summary']['attack_recall_rate']}%",
            f"- 正常业务任务误报率：{anomaly_calibration_eval['summary']['benign_false_alarm_rate']}%",
            f"- 低于异常阈值但被固定策略控制：{anomaly_calibration_eval['summary']['policy_controlled_missed_count']} 个",
            "",
            "| 阈值 | 攻击召回率 | 正常误报率 | 精确率 |",
            "|---:|---:|---:|---:|",
        ]
    )
    for item in anomaly_calibration_eval["threshold_curve"]:
        if item["threshold"] in {45, 50, 55, 60, 65, 70, 75}:
            lines.append(
                f"| {item['threshold']} | {item['attack_recall_rate']}% | {item['benign_false_alarm_rate']}% | {item['precision_rate']}% |"
            )

    lines.extend(
        [
            "",
            "## 13. 项目成熟度与缺口路线图",
            "",
            f"- 方向判断：{project_roadmap_eval['direction']['verdict']}",
            f"- 综合成熟度：{project_roadmap_eval['summary']['overall_score']}%",
            f"- P0 待办：{project_roadmap_eval['summary']['p0_backlog_count']} 项",
            "",
            "| 维度 | 状态 | 分数 | 下一步 |",
            "|---|---|---:|---|",
        ]
    )
    for item in project_roadmap_eval["dimensions"]:
        lines.append(f"| {item['name']} | {item['status']} | {item['score']} | {'；'.join(item['next_actions'])} |")

    lines.extend(
        [
            "",
            "## 14. 近期实验记录",
        "",
        "| 时间 | 脚本 | 防护 | 攻击成功 | 阻断 | 询问 | 隔离 | 延迟 |",
        "|---|---|---|---|---|---|---|---|",
        ]
    )
    for run in runs:
        lines.append(
            "| {time} | {scenario} | {guard} | {success} | {blocked} | {asked} | {isolated} | {latency}ms |".format(
                time=run["created_at"][:19],
                scenario=f"{run['scenario']['id']} / {scenario_name.get(run['scenario']['id'], '')}",
                guard="开启" if run["guard_enabled"] else "关闭",
                success="是" if run["attack_success"] else "否",
                blocked=run["metrics"]["blocked_count"],
                asked=run["metrics"]["asked_count"],
                isolated=run["metrics"]["isolated_count"],
                latency=run["metrics"]["detection_latency_ms"],
            )
        )
    if not runs:
        lines.append("| 暂无 | 暂无 | 暂无 | 暂无 | 0 | 0 | 0 | 0ms |")

    return {
        "markdown": "\n".join(lines),
        "summary": summary,
        "surface_coverage": surface_coverage,
        "scenario_matrix": scenario_matrix,
        "deliverables": deliverables,
        "policy_hits": [{"policy_id": key, "count": value} for key, value in policy_counter.most_common()],
        "decision_counts": [{"decision": key, "count": value} for key, value in decision_counter.most_common()],
        "benign_evaluation": benign_eval,
        "benign_workflow_evaluation": benign_workflow_eval,
        "surface_conclusions": surface_conclusion_eval,
        "output_filter_evidence": output_filter_eval,
        "attack_effectiveness": attack_effectiveness_eval,
        "policy_ablation": policy_ablation_eval,
        "anomaly_calibration": anomaly_calibration_eval,
        "project_roadmap": project_roadmap_eval,
        "runs": runs,
        "competition_package": build_competition_package(runs),
    }
