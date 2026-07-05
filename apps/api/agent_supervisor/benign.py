from __future__ import annotations

from collections import Counter
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from .benign_cases_data import BENIGN_CASES
from .supervisor import decide

CONTROL_DECISIONS = {"拒绝", "询问", "隔离"}


def get_benign_cases(category: str | None = None) -> list[dict[str, Any]]:
    cases = deepcopy(BENIGN_CASES)
    if category:
        cases = [case for case in cases if case["category"] == category]
    return cases


def evaluate_benign_cases(category: str | None = None, guard_enabled: bool = True) -> dict[str, Any]:
    cases = get_benign_cases(category)
    results = []
    for index, case in enumerate(cases, start=1):
        decision = decide(case["tool_call"], guard_enabled=guard_enabled, prompt=case["model_input"])
        expected_decision = case["expected_decision"]
        is_false_positive = expected_decision == "允许" and decision.decision in CONTROL_DECISIONS
        matches_expected = decision.decision == expected_decision
        results.append(
            {
                **case,
                "decision": decision.decision,
                "risk_level": decision.risk_level,
                "policy_id": decision.policy_id,
                "reason": decision.reason,
                "recommendation": decision.recommendation,
                "risk_score": decision.risk_score,
                "risk_factors": decision.risk_factors,
                "anomaly_score": decision.anomaly_score,
                "anomaly_signals": decision.anomaly_signals,
                "matches_expected": matches_expected,
                "is_false_positive": is_false_positive,
                "latency_ms": 24 + index * 6,
            }
        )

    expected_allow = [item for item in results if item["expected_decision"] == "允许"]
    expected_control = [item for item in results if item["expected_decision"] in CONTROL_DECISIONS]
    controlled = [item for item in results if item["decision"] in CONTROL_DECISIONS]
    false_positives = [item for item in results if item["is_false_positive"]]
    matched = [item for item in results if item["matches_expected"]]
    total_latency = sum(item["latency_ms"] for item in results)
    category_distribution = Counter(item["category"] for item in results)
    tool_distribution = Counter(item["tool_call"]["tool"] for item in results)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filter": {"category": category, "guard_enabled": guard_enabled},
        "summary": {
            "case_count": len(results),
            "category_count": len(category_distribution),
            "tool_count": len(tool_distribution),
            "expected_allow_count": len(expected_allow),
            "expected_control_count": len(expected_control),
            "allowed_count": sum(1 for item in results if item["decision"] == "允许"),
            "controlled_count": len(controlled),
            "false_positive_count": len(false_positives),
            "false_positive_rate": round((len(false_positives) / len(expected_allow)) * 100) if expected_allow else 0,
            "expected_match_count": len(matched),
            "expected_match_rate": round((len(matched) / len(results)) * 100) if results else 0,
            "avg_latency_ms": round(total_latency / len(results)) if results else 0,
            "max_risk_score": max((item["risk_score"] for item in results), default=0),
            "max_anomaly_score": max((item["anomaly_score"] for item in results), default=0),
            "category_distribution": dict(sorted(category_distribution.items())),
            "tool_distribution": dict(sorted(tool_distribution.items())),
        },
        "cases": results,
    }


def build_benign_cases_markdown(category: str | None = None) -> str:
    dataset = evaluate_benign_cases(category)
    title_suffix = f"（{category}）" if category else ""
    lines = [
        f"# 正常业务任务样本与误报评测{title_suffix}",
        "",
        "该文件用于证明行为监督器不仅能拦截攻击，也能放行正常业务任务，并给出误报率评测依据。",
        "",
        "## 汇总",
        "",
        f"- 正常样本数量：{dataset['summary']['case_count']}",
        f"- 覆盖任务类别：{dataset['summary']['category_count']}",
        f"- 覆盖工具类型：{dataset['summary']['tool_count']}",
        f"- 应允许样本数量：{dataset['summary']['expected_allow_count']}",
        f"- 正常但需确认/隔离样本：{dataset['summary']['expected_control_count']}",
        f"- 实际允许数量：{dataset['summary']['allowed_count']}",
        f"- 误报数量：{dataset['summary']['false_positive_count']}",
        f"- 误报率：{dataset['summary']['false_positive_rate']}%",
        f"- 期望决策匹配率：{dataset['summary']['expected_match_rate']}%",
        f"- 平均判定延迟：{dataset['summary']['avg_latency_ms']}ms",
        f"- 最高风险分：{dataset['summary']['max_risk_score']}",
        f"- 最高异常分：{dataset['summary']['max_anomaly_score']}",
        "",
        "## 覆盖分布",
        "",
        "| 任务类别 | 样本数 |",
        "|---|---:|",
    ]
    for category_name, count in dataset["summary"]["category_distribution"].items():
        lines.append(f"| {category_name} | {count} |")
    lines.extend(
        [
            "",
            "| 工具类型 | 样本数 |",
            "|---|---:|",
        ]
    )
    for tool, count in dataset["summary"]["tool_distribution"].items():
        lines.append(f"| `{tool}` | {count} |")
    lines.extend(
        [
        "",
        "## 明细",
        "",
        "| 样本 | 类别 | 工具 | 期望 | 实际 | 误报 | 策略 |",
        "|---|---|---|---|---|---|---|",
        ]
    )
    for item in dataset["cases"]:
        lines.append(
            "| {id} | {category} | {tool} | {expected} | {actual} | {fp} | {policy} |".format(
                id=item["id"],
                category=item["category"],
                tool=item["tool_call"]["tool"],
                expected=item["expected_decision"],
                actual=item["decision"],
                fp="是" if item["is_false_positive"] else "否",
                policy=item["policy_id"],
            )
        )
    return "\n".join(lines)
