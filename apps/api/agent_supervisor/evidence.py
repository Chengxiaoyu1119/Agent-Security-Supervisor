from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import Any

from .data import get_attack_surfaces, get_scenarios
from .supervisor import decide


CONTROL_DECISIONS = {"拒绝", "询问", "隔离"}


def build_surface_conclusions(runs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    runs = runs or []
    surfaces = get_attack_surfaces()
    scenarios = get_scenarios()
    conclusions = []
    for surface in surfaces:
        linked = [scenario for scenario in scenarios if scenario["surface_id"] == surface["id"]]
        surface_runs = [run for run in runs if run.get("scenario", {}).get("surface_id") == surface["id"]]
        guarded_runs = [run for run in surface_runs if run.get("guard_enabled")]
        controlled_runs = [run for run in guarded_runs if _is_controlled(run)]
        attack_successes = [run for run in surface_runs if run.get("attack_success")]
        avg_latency = _avg_latency(surface_runs)
        expected_policy_counter: Counter[str] = Counter()
        expected_decision_counter: Counter[str] = Counter()
        for scenario in linked:
            for tool_call in scenario.get("tool_calls", []):
                decision = decide(tool_call, True, scenario.get("adversarial_prompt", ""))
                expected_policy_counter[decision.policy_id] += 1
                expected_decision_counter[decision.decision] += 1
        tools = sorted({call["tool"] for scenario in linked for call in scenario.get("tool_calls", [])})
        conclusions.append(
            {
                "surface_id": surface["id"],
                "surface_name": surface["name"],
                "risk": surface["risk"],
                "status": surface["status"],
                "attack_principle": surface["summary"],
                "entry_points": surface.get("entry_points", []),
                "protected_assets": surface.get("protected_assets", []),
                "scenario_count": len(linked),
                "sample_count": surface["samples"],
                "script_count": surface["scripts"],
                "tool_coverage": tools,
                "run_count": len(surface_runs),
                "guarded_run_count": len(guarded_runs),
                "controlled_run_count": len(controlled_runs),
                "attack_success_count": len(attack_successes),
                "control_rate": round((len(controlled_runs) / len(guarded_runs)) * 100) if guarded_runs else 0,
                "attack_success_rate": round((len(attack_successes) / len(surface_runs)) * 100) if surface_runs else 0,
                "avg_latency_ms": avg_latency,
                "expected_decisions": dict(expected_decision_counter),
                "expected_policies": dict(expected_policy_counter),
                "representative_scenarios": [
                    {
                        "id": scenario["id"],
                        "title": scenario["title"],
                        "target": scenario["target"],
                        "severity": scenario["severity"],
                        "tool_calls": len(scenario.get("tool_calls", [])),
                    }
                    for scenario in linked[:3]
                ],
                "key_findings": _surface_findings(surface, linked, surface_runs, guarded_runs, controlled_runs),
                "defense_conclusion": _defense_conclusion(surface, expected_policy_counter),
                "experiment_status": "已有运行证据" if surface_runs else "待运行复现",
            }
        )
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "surface_count": len(surfaces),
            "conclusion_count": len(conclusions),
            "with_run_evidence_count": sum(1 for item in conclusions if item["run_count"]),
            "scenario_count": sum(item["scenario_count"] for item in conclusions),
            "tool_count": len({tool for item in conclusions for tool in item["tool_coverage"]}),
        },
        "conclusions": conclusions,
    }


def build_surface_conclusions_markdown(runs: list[dict[str, Any]] | None = None) -> str:
    data = build_surface_conclusions(runs)
    lines = [
        "# 攻击面实验结论",
        "",
        "本文档按 7 类攻击面沉淀实验结论，用于初赛报告和答辩说明。",
        "",
        "## 汇总",
        "",
        f"- 攻击面数量：{data['summary']['surface_count']}",
        f"- 已形成结论：{data['summary']['conclusion_count']}",
        f"- 有运行证据的攻击面：{data['summary']['with_run_evidence_count']}",
        f"- 剧本数量：{data['summary']['scenario_count']}",
        f"- 覆盖工具类型：{data['summary']['tool_count']}",
        "",
    ]
    for item in data["conclusions"]:
        lines.extend(
            [
                f"## {item['surface_name']}",
                "",
                f"- 风险等级：{item['risk']}",
                f"- 实验状态：{item['experiment_status']}",
                f"- 剧本数量：{item['scenario_count']}",
                f"- 工具覆盖：{'、'.join(item['tool_coverage'])}",
                f"- 控制率：{item['control_rate']}%",
                f"- 平均延迟：{item['avg_latency_ms']}ms",
                f"- 攻击原理：{item['attack_principle']}",
                f"- 防御结论：{item['defense_conclusion']}",
                "",
                "### 关键发现",
                "",
            ]
        )
        for finding in item["key_findings"]:
            lines.append(f"- {finding}")
        lines.extend(["", "### 代表剧本", "", "| 剧本 | 目标 | 风险 |", "|---|---|---|"])
        for scenario in item["representative_scenarios"]:
            lines.append(f"| {scenario['id']} | {scenario['target']} | {scenario['severity']} |")
        lines.append("")
    return "\n".join(lines)


def build_output_filter_evidence() -> dict[str, Any]:
    scenarios = [
        scenario
        for scenario in get_scenarios()
        if any(call.get("tool") == "model.respond" for call in scenario.get("tool_calls", []))
        or "output-filter" in scenario.get("tags", [])
    ]
    cases = []
    for scenario in scenarios:
        for tool_call in scenario.get("tool_calls", []):
            if tool_call.get("tool") != "model.respond":
                continue
            without_guard = decide(tool_call, False, scenario["adversarial_prompt"])
            with_guard = decide(tool_call, True, scenario["adversarial_prompt"])
            cases.append(
                {
                    "scenario_id": scenario["id"],
                    "surface_id": scenario["surface_id"],
                    "title": scenario["title"],
                    "severity": scenario["severity"],
                    "risk_hint": tool_call.get("risk_hint", ""),
                    "filter_type": _filter_type(tool_call.get("risk_hint", ""), scenario["surface_id"]),
                    "adversarial_prompt": scenario["adversarial_prompt"],
                    "jailbreak_case": scenario["jailbreak_case"],
                    "without_guard": {
                        "decision": without_guard.decision,
                        "policy_id": without_guard.policy_id,
                        "risk_level": without_guard.risk_level,
                        "evidence": "关闭监督器时，模型输出请求会被放行，用于复现风险暴露。",
                    },
                    "with_guard": {
                        "decision": with_guard.decision,
                        "policy_id": with_guard.policy_id,
                        "risk_level": with_guard.risk_level,
                        "reason": with_guard.reason,
                        "recommendation": with_guard.recommendation,
                    },
                    "blocked": with_guard.decision in CONTROL_DECISIONS,
                    "comparison": f"关闭防护：{without_guard.decision}；开启防护：{with_guard.decision} / {with_guard.policy_id}",
                }
            )
    blocked = [case for case in cases if case["blocked"]]
    policy_counter = Counter(case["with_guard"]["policy_id"] for case in cases)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "case_count": len(cases),
            "blocked_count": len(blocked),
            "block_rate": round((len(blocked) / len(cases)) * 100) if cases else 0,
            "policy_distribution": dict(policy_counter),
        },
        "cases": cases,
    }


def build_output_filter_markdown() -> str:
    data = build_output_filter_evidence()
    lines = [
        "# 模型输出过滤前后对比证据",
        "",
        "本文档用于证明基座模型检测或过滤原型能够处理模型越狱输出、训练数据抽取和高风险绕过输出。",
        "",
        "## 汇总",
        "",
        f"- 输出过滤样本：{data['summary']['case_count']}",
        f"- 已阻断样本：{data['summary']['blocked_count']}",
        f"- 阻断率：{data['summary']['block_rate']}%",
        "",
        "## 对比明细",
        "",
        "| 剧本 | 类型 | 关闭防护 | 开启防护 | 策略 |",
        "|---|---|---|---|---|",
    ]
    for case in data["cases"]:
        lines.append(
            "| {scenario} | {filter_type} | {before} | {after} | {policy} |".format(
                scenario=case["scenario_id"],
                filter_type=case["filter_type"],
                before=case["without_guard"]["decision"],
                after=case["with_guard"]["decision"],
                policy=case["with_guard"]["policy_id"],
            )
        )
    return "\n".join(lines)


def _is_controlled(run: dict[str, Any]) -> bool:
    metrics = run.get("metrics", {})
    return bool(metrics.get("blocked_count") or metrics.get("asked_count") or metrics.get("isolated_count"))


def _avg_latency(runs: list[dict[str, Any]]) -> int:
    if not runs:
        return 0
    return round(sum(run.get("metrics", {}).get("detection_latency_ms", 0) for run in runs) / len(runs))


def _surface_findings(
    surface: dict[str, Any],
    scenarios: list[dict[str, Any]],
    surface_runs: list[dict[str, Any]],
    guarded_runs: list[dict[str, Any]],
    controlled_runs: list[dict[str, Any]],
) -> list[str]:
    tools = sorted({call["tool"] for scenario in scenarios for call in scenario.get("tool_calls", [])})
    findings = [
        f"该攻击面内置 {len(scenarios)} 个可复现实验剧本，覆盖 {'、'.join(tools)} 等工具调用。",
        f"主要保护资产包括：{'、'.join(surface.get('protected_assets', [])[:4]) or '模型上下文和工具权限'}。",
    ]
    if guarded_runs:
        rate = round((len(controlled_runs) / len(guarded_runs)) * 100)
        findings.append(f"已有 {len(guarded_runs)} 次开启防护的实验记录，控制率 {rate}%。")
    else:
        findings.append("当前可直接通过攻击复现实验室运行该攻击面，生成有防护和无防护对比证据。")
    findings.append(f"防御重点应围绕：{surface['defense']}。")
    return findings


def _defense_conclusion(surface: dict[str, Any], policies: Counter[str]) -> str:
    top_policies = [policy for policy, _ in policies.most_common(3)]
    policy_text = "、".join(top_policies) if top_policies else "default-allow"
    return f"该攻击面应以“{surface['defense']}”为主线，并重点验证 {policy_text} 等策略命中是否稳定。"


def _filter_type(risk_hint: str, surface_id: str) -> str:
    if risk_hint == "training_data_extraction":
        return "训练数据抽取过滤"
    if risk_hint == "jailbreak_output" or surface_id == "jailbreak":
        return "越狱输出过滤"
    return "模型输出风险过滤"

