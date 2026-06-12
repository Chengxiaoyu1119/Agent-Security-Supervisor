from __future__ import annotations

from html import escape
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .data import get_attack_surfaces, get_policies, get_scenarios
from .datasets import build_attack_case_dataset
from .supervisor import decide


BASE_DIR = Path(__file__).resolve().parents[1]
REPORT_ROOT = BASE_DIR / "sandbox" / "reports"
CONTROL_DECISIONS = {"拒绝", "询问", "隔离"}


def build_surface_evidence_pack(surface_id: str, runs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    surface = _find_surface(surface_id)
    scenarios = [scenario for scenario in get_scenarios() if scenario["surface_id"] == surface_id]
    policies = {policy["id"]: policy for policy in get_policies()}
    dataset = build_attack_case_dataset(surface_id)
    scenario_ids = {scenario["id"] for scenario in scenarios}
    relevant_runs = _runs_for_surface(runs or [], surface_id, scenario_ids)
    attack_runs = [run for run in relevant_runs if run.get("scenario", {}).get("id") in scenario_ids]
    scenario_cards = [_scenario_card(surface, scenario, relevant_runs) for scenario in scenarios]
    guarded_runs = [run for run in attack_runs if run.get("guard_enabled")]
    controlled_runs = [run for run in guarded_runs if _is_controlled_run(run)]
    latest_guarded_results = [
        card["latest_guarded_result"]
        for card in scenario_cards
        if card["latest_guarded_result"]["status"] != "暂无运行证据"
    ]
    latest_controlled_results = [
        result
        for result in latest_guarded_results
        if result["status"] == "已控制"
    ]
    policy_counter = Counter(
        expectation["policy_id"]
        for card in scenario_cards
        for expectation in card["expected_decisions"]
        if expectation["policy_id"] != "guard-disabled"
    )
    tool_counter = Counter(
        tool_call["tool"]
        for scenario in scenarios
        for tool_call in scenario.get("tool_calls", [])
    )

    coverage_checks = {
        "has_surface_profile": bool(surface.get("entry_points") and surface.get("protected_assets") and surface.get("detection_signals")),
        "has_adversarial_samples": dataset["summary"]["adversarial_sample_count"] > 0,
        "has_jailbreak_cases": dataset["summary"]["jailbreak_case_count"] > 0,
        "has_agent_scripts": dataset["summary"]["agent_script_count"] > 0,
        "has_policy_expectations": bool(policy_counter),
        "has_runtime_evidence": bool(relevant_runs),
    }
    readiness_score = round(
        sum(1 for value in coverage_checks.values() if value) / max(1, len(coverage_checks)) * 100
    )
    summary = {
        "scenario_count": len(scenarios),
        "sample_count": dataset["summary"]["adversarial_sample_count"],
        "jailbreak_case_count": dataset["summary"]["jailbreak_case_count"],
        "agent_script_count": dataset["summary"]["agent_script_count"],
        "tool_call_count": dataset["summary"]["tool_call_count"],
        "unique_tool_count": len(tool_counter),
        "expected_policy_count": len(policy_counter),
        "run_count": len(relevant_runs),
        "attack_run_count": len(attack_runs),
        "external_run_count": len(relevant_runs) - len(attack_runs),
        "guarded_run_count": len(guarded_runs),
        "controlled_run_count": len(controlled_runs),
        "latest_guarded_scenario_count": len(latest_guarded_results),
        "latest_controlled_scenario_count": len(latest_controlled_results),
        "control_rate": round((len(latest_controlled_results) / len(latest_guarded_results)) * 100) if latest_guarded_results else 0,
        "guarded_attack_success_rate": _rate([run for run in guarded_runs if run.get("attack_success")], guarded_runs),
        "readiness_score": readiness_score,
    }
    gaps = _evidence_gaps(surface, scenario_cards, summary, coverage_checks)
    summary["gap_count"] = len(gaps)

    return {
        "name": f"智安哨攻击面证据包：{surface['name']}",
        "version": "0.4.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "surface": surface,
        "summary": summary,
        "coverage_checks": coverage_checks,
        "gaps": gaps,
        "threat_chain": _threat_chain(surface, scenarios, policy_counter),
        "policy_distribution": [
            {
                "policy_id": policy_id,
                "policy_name": policies.get(policy_id, {}).get("name", policy_id),
                "count": count,
                "decision": policies.get(policy_id, {}).get("decision", "未记录"),
            }
            for policy_id, count in policy_counter.most_common()
        ],
        "tool_coverage": [
            {"tool": tool, "count": count}
            for tool, count in tool_counter.most_common()
        ],
        "replay_commands": _replay_commands(surface_id, [scenario["id"] for scenario in scenarios]),
        "scenarios": scenario_cards,
        "dataset_summary": dataset["summary"],
    }


def build_surface_evidence_pack_markdown(surface_id: str, runs: list[dict[str, Any]] | None = None) -> str:
    pack = build_surface_evidence_pack(surface_id, runs)
    surface = pack["surface"]
    summary = pack["summary"]
    lines = [
        f"# 攻击面证据包：{surface['name']}",
        "",
        "该文件把单个攻击面的攻击样本、越狱用例、智能体脚本、预期监督策略、运行证据和复现入口汇总到一起，用于答辩时说明该攻击面可复现、可审计、可防御。",
        "",
        "## 证据概览",
        "",
        f"- 攻击面编号：`{surface['id']}`",
        f"- 风险等级：{surface['risk']}",
        f"- 剧本数量：{summary['scenario_count']}",
        f"- 对抗样本：{summary['sample_count']}",
        f"- 越狱用例：{summary['jailbreak_case_count']}",
        f"- 智能体脚本：{summary['agent_script_count']}",
        f"- 运行记录：{summary['run_count']}（攻击剧本 {summary['attack_run_count']}，外部事件 {summary['external_run_count']}），有防护控制率：{summary['control_rate']}%",
        f"- 证据完整度：{summary['readiness_score']}%",
        f"- 待补强项：{summary['gap_count']}",
        "",
        "## 威胁链路",
        "",
        "| 阶段 | 内容 |",
        "|---|---|",
    ]
    for node in pack["threat_chain"]:
        lines.append(f"| {node['stage']} | {node['text']} |")

    lines.extend(["", "## 策略与工具覆盖", "", "| 类型 | 明细 |", "|---|---|"])
    lines.append("| 预期命中策略 | " + " / ".join(item["policy_id"] for item in pack["policy_distribution"]) + " |")
    lines.append("| 目标工具 | " + " / ".join(item["tool"] for item in pack["tool_coverage"]) + " |")
    lines.append("| 防御加固 | " + " / ".join(surface.get("mitigations") or [surface.get("defense", "")]) + " |")

    lines.extend(["", "## 可复现实验入口", ""])
    for command in pack["replay_commands"]:
        lines.append(f"- {command['label']}：`{command['value']}`")

    lines.extend(["", "## 证据缺口提示", ""])
    if pack["gaps"]:
        lines.extend(["| 优先级 | 缺口 | 当前证据 | 建议动作 |", "|---|---|---|---|"])
        for gap in pack["gaps"]:
            action = gap["action"]
            if gap.get("command"):
                action = f"{action} `{gap['command']}`"
            lines.append(f"| {gap['severity']} | {gap['title']} | {gap['evidence']} | {action} |")
    else:
        lines.append("当前攻击面的样本、脚本、策略和运行证据已形成闭环，暂无高优先级补强项。")

    lines.extend(["", "## 剧本证据明细", ""])
    for card in pack["scenarios"]:
        lines.extend(
            [
                f"### {card['id']}：{card['title']}",
                "",
                f"- 目标工具：`{card['target']}`",
                f"- 风险等级：{card['severity']}",
                f"- 攻击路径：{' -> '.join(card['attack_path']) if card['attack_path'] else '待补充'}",
                f"- 最近有防护结果：{card['latest_guarded_result']['status']}",
                "",
                "| 预期工具 | 决策 | 策略 | 风险分 |",
                "|---|---|---|---:|",
            ]
        )
        for item in card["expected_decisions"]:
            lines.append(f"| {item['tool']} | {item['decision']} | {item['policy_id']} | {item['risk_score']} |")
        lines.append("")
    return "\n".join(lines)


def build_surface_evidence_index(runs: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    packs = [build_surface_evidence_pack(surface["id"], runs) for surface in get_attack_surfaces()]
    summaries = [
        {
            "surface_id": pack["surface"]["id"],
            "surface_name": pack["surface"]["name"],
            "risk": pack["surface"]["risk"],
            "scenario_count": pack["summary"]["scenario_count"],
            "sample_count": pack["summary"]["sample_count"],
            "agent_script_count": pack["summary"]["agent_script_count"],
            "expected_policy_count": pack["summary"]["expected_policy_count"],
            "unique_tool_count": pack["summary"]["unique_tool_count"],
            "run_count": pack["summary"]["run_count"],
            "control_rate": pack["summary"]["control_rate"],
            "readiness_score": pack["summary"]["readiness_score"],
            "gap_count": pack["summary"]["gap_count"],
            "top_policies": [item["policy_id"] for item in pack["policy_distribution"][:4]],
            "tools": [item["tool"] for item in pack["tool_coverage"]],
            "gaps": pack["gaps"],
        }
        for pack in packs
    ]
    total_scenarios = sum(item["scenario_count"] for item in summaries)
    total_samples = sum(item["sample_count"] for item in summaries)
    total_scripts = sum(item["agent_script_count"] for item in summaries)
    total_gaps = sum(item["gap_count"] for item in summaries)
    return {
        "name": "智安哨全部攻击面证据包索引",
        "version": "0.4.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "surface_count": len(packs),
            "scenario_count": total_scenarios,
            "sample_count": total_samples,
            "agent_script_count": total_scripts,
            "avg_readiness_score": round(sum(item["readiness_score"] for item in summaries) / len(summaries)) if summaries else 0,
            "avg_control_rate": round(sum(item["control_rate"] for item in summaries) / len(summaries)) if summaries else 0,
            "gap_count": total_gaps,
            "runtime_evidence_surface_count": sum(1 for item in summaries if item["run_count"] > 0),
            "complete_surface_count": sum(1 for item in summaries if item["gap_count"] == 0),
        },
        "surfaces": summaries,
    }


def build_surface_evidence_index_markdown(runs: list[dict[str, Any]] | None = None) -> str:
    index = build_surface_evidence_index(runs)
    lines = [
        "# 攻击面证据包索引",
        "",
        "该索引用于快速检查 7 类攻击面的证据成熟度、策略覆盖和运行证据。每个攻击面均可通过 API 或 CLI 单独导出完整证据包。",
        "",
        "## 总览",
        "",
        f"- 攻击面数量：{index['summary']['surface_count']}",
        f"- 攻击剧本数量：{index['summary']['scenario_count']}",
        f"- 对抗样本数量：{index['summary']['sample_count']}",
        f"- 智能体脚本数量：{index['summary']['agent_script_count']}",
        f"- 平均证据完整度：{index['summary']['avg_readiness_score']}%",
        f"- 平均控制率：{index['summary']['avg_control_rate']}%",
        f"- 待补强项：{index['summary']['gap_count']}",
        "",
        "| 攻击面 | 风险 | 剧本 | 样本 | 脚本 | 策略数 | 控制率 | 完整度 | 缺口 |",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for surface in index["surfaces"]:
        lines.append(
            f"| {surface['surface_name']} | {surface['risk']} | {surface['scenario_count']} | {surface['sample_count']} | {surface['agent_script_count']} | {surface['expected_policy_count']} | {surface['control_rate']}% | {surface['readiness_score']}% | {surface['gap_count']} |"
        )
    lines.extend(
        [
            "",
            "## 待补强项",
            "",
            "| 攻击面 | 优先级 | 缺口 | 建议动作 |",
            "|---|---|---|---|",
        ]
    )
    gap_rows = [
        (surface["surface_name"], gap)
        for surface in index["surfaces"]
        for gap in surface["gaps"]
    ]
    if gap_rows:
        for surface_name, gap in gap_rows:
            lines.append(f"| {surface_name} | {gap['severity']} | {gap['title']} | {gap['action']} |")
    else:
        lines.append("| 全部攻击面 | low | 暂无高优先级缺口 | 保持当前证据链并补充最终截图即可 |")
    lines.extend(
        [
            "",
            "## 导出方式",
            "",
            "- JSON API：`GET /api/attack_surfaces/{surface_id}/evidence_pack`",
            "- Markdown API：`GET /api/attack_surfaces/{surface_id}/evidence_pack.md`",
            "- CLI：`npm run cli -- surface-pack --surface prompt-injection --output backend/sandbox/reports`",
            "- 全量导出 CLI：`npm run cli -- surface-packs --output backend/sandbox/reports`",
        ]
    )
    return "\n".join(lines)


def build_surface_briefing_sheet_html(surface_id: str, runs: list[dict[str, Any]] | None = None) -> str:
    pack = build_surface_evidence_pack(surface_id, runs)
    surface = pack["surface"]
    summary = pack["summary"]
    main_scenario = pack["scenarios"][0] if pack["scenarios"] else None
    guarded = main_scenario["latest_guarded_result"] if main_scenario else {}
    risk_name = {
        "critical": "极高",
        "high": "高",
        "medium": "中",
        "low": "低",
    }.get(surface.get("risk"), surface.get("risk", "未知"))
    coverage_labels = {
        "has_surface_profile": "攻击面画像",
        "has_adversarial_samples": "对抗样本",
        "has_jailbreak_cases": "越狱用例",
        "has_agent_scripts": "攻击脚本",
        "has_policy_expectations": "策略预期",
        "has_runtime_evidence": "运行证据",
    }
    threat_nodes = "".join(
        f"""
        <article class="route-node">
          <b>{index:02d}</b>
          <div><span>{_html(node["stage"])}</span><strong>{_html(node["text"])}</strong></div>
        </article>
        """
        for index, node in enumerate(pack["threat_chain"][:4], start=1)
    )
    policies = "".join(
        f"<span>{_html(item['policy_id'])} · {_html(item['decision'])}</span>"
        for item in pack["policy_distribution"][:5]
    ) or "<span>等待策略证据</span>"
    tools = "".join(
        f"<b>{_html(item['tool'])}<small>{item['count']}</small></b>"
        for item in pack["tool_coverage"][:6]
    ) or "<b>等待工具证据<small>0</small></b>"
    checks = "".join(
        f"<span class=\"{'done' if checked else 'todo'}\">{_html(coverage_labels.get(key, key))}</span>"
        for key, checked in pack["coverage_checks"].items()
    )
    scenarios = "".join(
        f"""
        <tr>
          <td><strong>{_html(card['id'])}</strong><small>{_html(card['target'])}</small></td>
          <td>{_html(' / '.join(item['policy_id'] for item in card['expected_decisions']) or '未记录')}</td>
          <td><span class="pill">{_html(card['latest_guarded_result']['status'])}</span></td>
        </tr>
        """
        for card in pack["scenarios"]
    )
    gaps = "".join(
        f"<li><b>{_html(gap['severity'])}</b><span>{_html(gap['title'])}</span><small>{_html(gap['action'])}</small></li>"
        for gap in pack["gaps"]
    ) or "<li><b>ok</b><span>样本、脚本、策略和运行证据已闭环</span><small>可作为当前攻击面的答辩证据</small></li>"
    html = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>攻击面答辩单页 - {_html(surface['name'])}</title>
  <style>
    :root {{
      color-scheme: light;
      --ink: #0e171a;
      --panel: #19282b;
      --panel-2: #223336;
      --line: rgba(255, 255, 255, 0.1);
      --text: #f5fbfa;
      --muted: rgba(245, 251, 250, 0.66);
      --brand: #49b88f;
      --teal: #00897c;
      --amber: #c88416;
      --red: #d6464d;
      --paper: #f2f6f5;
      font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-width: 1120px;
      background: #e9efed;
      color: var(--text);
    }}
    .sheet {{
      width: 1120px;
      min-height: 760px;
      margin: 0 auto;
      padding: 34px;
      background:
        radial-gradient(circle at 86% 14%, rgba(73, 184, 143, 0.18), transparent 25%),
        linear-gradient(135deg, #0d171a 0%, #172528 55%, #0a1113 100%);
      overflow: hidden;
    }}
    .topline {{
      height: 6px;
      margin: -34px -34px 28px;
      background: linear-gradient(90deg, var(--teal), var(--brand), var(--amber), var(--red));
    }}
    header {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) 168px;
      gap: 28px;
      align-items: start;
    }}
    .eyebrow {{
      display: inline-flex;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      color: #a8e8dc;
      padding: 7px 11px;
      font-size: 13px;
      font-weight: 900;
    }}
    h1 {{
      margin: 18px 0 12px;
      color: #fff;
      font-size: 60px;
      line-height: 1;
      letter-spacing: 0;
    }}
    .summary {{
      max-width: 720px;
      margin: 0;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.7;
    }}
    .score {{
      display: grid;
      aspect-ratio: 1;
      place-items: center;
      align-content: center;
      border-radius: 50%;
      background:
        radial-gradient(circle at center, #112023 0 58%, transparent 59%),
        conic-gradient(var(--brand) 0 {summary['readiness_score']}%, rgba(255,255,255,.14) {summary['readiness_score']}% 100%);
      box-shadow: inset 0 0 0 1px var(--line);
    }}
    .score strong {{ color: #fff; font-size: 42px; line-height: 1; }}
    .score span {{ margin-top: 8px; color: var(--muted); font-size: 13px; font-weight: 800; }}
    .metrics {{
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      margin-top: 28px;
      overflow: hidden;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.08);
    }}
    .metrics div {{ padding: 18px; border-right: 1px solid var(--line); }}
    .metrics div:last-child {{ border-right: 0; }}
    .metrics span, .section-title span, td small {{ display: block; color: var(--muted); font-size: 13px; font-weight: 800; }}
    .metrics strong {{ display: block; margin-top: 8px; color: #fff; font-size: 30px; line-height: 1; }}
    .grid {{
      display: grid;
      grid-template-columns: 1.05fr 1fr .95fr;
      gap: 18px;
      margin-top: 20px;
    }}
    .block {{
      min-width: 0;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      padding: 20px;
    }}
    .section-title {{
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 16px;
    }}
    .section-title strong {{ color: #fff; font-size: 18px; }}
    .route-node {{
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 12px;
      margin-top: 13px;
    }}
    .route-node b {{
      display: grid;
      width: 34px;
      height: 34px;
      place-items: center;
      border-radius: 999px;
      background: rgba(168, 232, 220, 0.14);
      color: #a8e8dc;
      font-size: 13px;
    }}
    .route-node span {{ display: block; color: var(--muted); font-size: 13px; font-weight: 800; }}
    .route-node strong {{ display: block; margin-top: 4px; color: #fff; font-size: 15px; line-height: 1.45; }}
    .decision {{
      display: inline-flex;
      border-radius: 999px;
      background: #dff6eb;
      color: #166846;
      padding: 7px 10px;
      font-weight: 900;
      font-size: 13px;
    }}
    .scenario-line {{ margin: 12px 0 14px; color: var(--muted); font-weight: 800; }}
    .chips, .checks {{ display: flex; flex-wrap: wrap; gap: 8px; }}
    .chips span, .checks span {{
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      color: #dff6f1;
      padding: 7px 10px;
      font-size: 13px;
      font-weight: 900;
    }}
    .checks .done {{ background: rgba(73, 184, 143, 0.2); color: #bff4de; }}
    .checks .todo {{ background: rgba(200, 132, 22, 0.18); color: #ffdca3; }}
    .tools {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }}
    .tools b {{
      display: flex;
      min-width: 0;
      justify-content: space-between;
      gap: 10px;
      border-radius: 13px;
      background: rgba(255, 255, 255, 0.09);
      padding: 12px;
      color: #fff;
      overflow-wrap: anywhere;
    }}
    .tools small {{
      display: grid;
      min-width: 28px;
      height: 28px;
      place-items: center;
      border-radius: 999px;
      background: rgba(168, 232, 220, 0.14);
      color: #a8e8dc;
    }}
    .gaps {{ margin: 14px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }}
    .gaps li {{ display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 10px; }}
    .gaps b {{ color: #a8e8dc; font-size: 13px; }}
    .gaps span {{ display: block; grid-column: 2; color: #fff; font-size: 14px; font-weight: 900; }}
    .gaps small {{ display: block; grid-column: 2; margin-top: 3px; color: var(--muted); line-height: 1.45; }}
    table {{
      width: 100%;
      margin-top: 20px;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 18px;
      background: rgba(255,255,255,.07);
    }}
    th, td {{ padding: 14px 16px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }}
    th {{ color: var(--muted); font-size: 13px; }}
    td {{ color: #eef8f6; font-size: 14px; }}
    td strong {{ display: block; color: #fff; }}
    .pill {{ display: inline-flex; border-radius: 999px; background: #dff6eb; color: #166846; padding: 6px 9px; font-weight: 900; }}
    footer {{
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 18px;
      color: rgba(245, 251, 250, .54);
      font-size: 13px;
      font-weight: 800;
    }}
    @media print {{
      body {{ background: #fff; }}
      .sheet {{ width: 1120px; margin: 0; }}
    }}
  </style>
</head>
<body>
  <main class="sheet">
    <div class="topline"></div>
    <header>
      <div>
        <span class="eyebrow">攻击面答辩单页 · {risk_name}风险</span>
        <h1>{_html(surface['name'])}</h1>
        <p class="summary">{_html(surface['summary'])}</p>
      </div>
      <div class="score"><strong>{summary['readiness_score']}%</strong><span>证据完整度</span></div>
    </header>
    <section class="metrics">
      <div><span>剧本</span><strong>{summary['scenario_count']}</strong></div>
      <div><span>样本/脚本</span><strong>{summary['sample_count']}/{summary['agent_script_count']}</strong></div>
      <div><span>控制率</span><strong>{summary['control_rate']}%</strong></div>
      <div><span>运行证据</span><strong>{summary['run_count']}</strong></div>
      <div><span>缺口</span><strong>{summary['gap_count']}</strong></div>
    </section>
    <section class="grid">
      <article class="block">
        <div class="section-title"><strong>攻击链路</strong><span>{_html(surface['id'])}</span></div>
        {threat_nodes}
      </article>
      <article class="block">
        <div class="section-title"><strong>监督命中</strong><span>{_html(guarded.get('run_id', '等待运行证据'))}</span></div>
        <span class="decision">{_html(guarded.get('status', '待验证'))}</span>
        <p class="scenario-line">{_html(main_scenario['id'] if main_scenario else '暂无剧本')} · {_html(main_scenario['target'] if main_scenario else '暂无目标工具')}</p>
        <div class="chips">{policies}</div>
        <div class="tools">{tools}</div>
      </article>
      <article class="block">
        <div class="section-title"><strong>验收闭环</strong><span>{sum(1 for value in pack['coverage_checks'].values() if value)}/{len(pack['coverage_checks'])}</span></div>
        <div class="checks">{checks}</div>
        <ul class="gaps">{gaps}</ul>
      </article>
    </section>
    <table>
      <thead><tr><th>剧本</th><th>预期策略</th><th>最近有防护结果</th></tr></thead>
      <tbody>{scenarios}</tbody>
    </table>
    <footer>
      <span>智安哨 · 大模型智能体攻击面研究与行为监督平台</span>
      <span>生成时间：{_html(pack['generated_at'])}</span>
    </footer>
  </main>
</body>
</html>"""
    return html


def write_surface_briefing_sheet(
    surface_id: str,
    output_root: str | Path | None = None,
    runs: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    root = Path(output_root) if output_root else REPORT_ROOT
    root.mkdir(parents=True, exist_ok=True)
    pack = build_surface_evidence_pack(surface_id, runs)
    html_path = root / f"攻击面答辩单页-{surface_id}.html"
    html_path.write_text(build_surface_briefing_sheet_html(surface_id, runs), encoding="utf-8")
    return {
        "surface_id": surface_id,
        "surface_name": pack["surface"]["name"],
        "html_path": str(html_path.resolve()),
        "summary": pack["summary"],
    }


def write_all_surface_briefing_sheets(
    output_root: str | Path | None = None,
    runs: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    root = Path(output_root) if output_root else REPORT_ROOT
    root.mkdir(parents=True, exist_ok=True)
    sheets = [
        write_surface_briefing_sheet(surface["id"], root, runs)
        for surface in get_attack_surfaces()
    ]
    index_path = root / "攻击面答辩单页索引.html"
    index_path.write_text(_briefing_sheet_index_html(sheets), encoding="utf-8")
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "output_dir": str(root.resolve()),
        "index_html_path": str(index_path.resolve()),
        "surface_count": len(sheets),
        "file_count": len(sheets) + 1,
        "sheets": sheets,
    }


def _briefing_sheet_index_html(sheets: list[dict[str, Any]]) -> str:
    rows = "".join(
        f"""
        <a class="sheet-link" href="{_html(Path(sheet['html_path']).name)}">
          <span>{_html(sheet['surface_name'])}</span>
          <b>{sheet['summary']['readiness_score']}%</b>
          <small>{sheet['summary']['scenario_count']} 剧本 · {sheet['summary']['sample_count']} 样本 · 缺口 {sheet['summary']['gap_count']}</small>
        </a>
        """
        for sheet in sheets
    )
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>攻击面答辩单页索引</title>
  <style>
    :root {{
      --bg: #eef4f2;
      --ink: #10181b;
      --muted: #63757a;
      --brand: #007c70;
      --line: #d8e4e1;
      font-family: "Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background:
        radial-gradient(circle at 8% 0%, rgba(0, 124, 112, .12), transparent 28%),
        var(--bg);
      color: var(--ink);
    }}
    main {{ width: min(1080px, calc(100vw - 40px)); margin: 0 auto; padding: 56px 0; }}
    h1 {{ margin: 0; font-size: clamp(34px, 5vw, 58px); line-height: 1; }}
    p {{ max-width: 760px; color: var(--muted); font-size: 16px; line-height: 1.7; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-top: 28px; }}
    .sheet-link {{
      display: grid;
      min-height: 154px;
      align-content: space-between;
      border-radius: 18px;
      background: #fff;
      color: inherit;
      padding: 18px;
      text-decoration: none;
      box-shadow: 0 18px 44px rgba(22, 38, 43, .08);
    }}
    .sheet-link span {{ color: var(--ink); font-size: 20px; font-weight: 950; }}
    .sheet-link b {{ color: var(--brand); font-size: 38px; line-height: 1; }}
    .sheet-link small {{ color: var(--muted); font-weight: 800; }}
  </style>
</head>
<body>
  <main>
    <h1>攻击面答辩单页索引</h1>
    <p>每个 HTML 文件对应一类攻击面，可直接用浏览器打开、截图或打印，用于 PPT 和现场答辩。</p>
    <section class="grid">{rows}</section>
  </main>
</body>
</html>"""


def _html(value: Any) -> str:
    return escape(str(value), quote=True)


def write_surface_evidence_pack(
    surface_id: str,
    output_root: str | Path | None = None,
    runs: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    root = Path(output_root) if output_root else REPORT_ROOT
    root.mkdir(parents=True, exist_ok=True)
    data = build_surface_evidence_pack(surface_id, runs)
    json_path = root / f"攻击面证据包-{surface_id}.json"
    markdown_path = root / f"攻击面证据包-{surface_id}.md"
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown_path.write_text(build_surface_evidence_pack_markdown(surface_id, runs), encoding="utf-8")
    return {
        "surface_id": surface_id,
        "json_path": str(json_path.resolve()),
        "markdown_path": str(markdown_path.resolve()),
        "summary": data["summary"],
    }


def write_all_surface_evidence_packs(
    output_root: str | Path | None = None,
    runs: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    root = Path(output_root) if output_root else REPORT_ROOT
    root.mkdir(parents=True, exist_ok=True)
    written = []
    for surface in get_attack_surfaces():
        written.append(write_surface_evidence_pack(surface["id"], root, runs))
    index = build_surface_evidence_index(runs)
    index_json_path = root / "攻击面证据包索引.json"
    index_markdown_path = root / "攻击面证据包索引.md"
    index_json_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    index_markdown_path.write_text(build_surface_evidence_index_markdown(runs), encoding="utf-8")
    return {
        "generated_at": index["generated_at"],
        "output_dir": str(root.resolve()),
        "index_json_path": str(index_json_path.resolve()),
        "index_markdown_path": str(index_markdown_path.resolve()),
        "surface_count": len(written),
        "file_count": len(written) * 2 + 2,
        "summary": index["summary"],
        "packs": written,
    }


def _find_surface(surface_id: str) -> dict[str, Any]:
    for surface in get_attack_surfaces():
        if surface["id"] == surface_id:
            return surface
    raise KeyError(surface_id)


def _runs_for_surface(runs: list[dict[str, Any]], surface_id: str, scenario_ids: set[str]) -> list[dict[str, Any]]:
    return [
        run
        for run in runs
        if run.get("scenario", {}).get("id") in scenario_ids
        or run.get("scenario", {}).get("surface_id") == surface_id
    ]


def _scenario_card(surface: dict[str, Any], scenario: dict[str, Any], runs: list[dict[str, Any]]) -> dict[str, Any]:
    scenario_runs = [run for run in runs if run.get("scenario", {}).get("id") == scenario["id"]]
    guarded_runs = [run for run in scenario_runs if run.get("guard_enabled")]
    unguarded_runs = [run for run in scenario_runs if not run.get("guard_enabled")]
    expectations = []
    for index, tool_call in enumerate(scenario.get("tool_calls", []), start=1):
        decision = decide(tool_call, True, scenario["adversarial_prompt"])
        expectations.append(
            {
                "step": index,
                "tool": tool_call["tool"],
                "risk_hint": tool_call.get("risk_hint", ""),
                "decision": decision.decision,
                "policy_id": decision.policy_id,
                "risk_level": decision.risk_level,
                "risk_score": decision.risk_score,
                "anomaly_score": decision.anomaly_score,
                "reason": decision.reason,
            }
        )
    return {
        "id": scenario["id"],
        "surface_id": surface["id"],
        "title": scenario["title"],
        "severity": scenario["severity"],
        "target": scenario["target"],
        "attack_path": scenario.get("attack_path", []),
        "detection_points": scenario.get("detection_points", []),
        "success_criteria": scenario.get("success_criteria", []),
        "safety_boundary": scenario.get("safety_boundary", "仅在本地沙箱靶场复现。"),
        "tool_calls": scenario.get("tool_calls", []),
        "script_steps": scenario.get("script_steps", []),
        "expected_decisions": expectations,
        "latest_guarded_result": _latest_run_summary(guarded_runs),
        "latest_unguarded_result": _latest_run_summary(unguarded_runs),
    }


def _evidence_gaps(
    surface: dict[str, Any],
    scenario_cards: list[dict[str, Any]],
    summary: dict[str, Any],
    coverage_checks: dict[str, bool],
) -> list[dict[str, str]]:
    gaps: list[dict[str, str]] = []
    if not coverage_checks["has_surface_profile"]:
        gaps.append(
            {
                "severity": "high",
                "title": "攻击面画像不完整",
                "evidence": "入口、保护资产或检测信号字段缺失。",
                "action": "补齐攻击入口、保护资产、攻击目标和检测信号，避免只有剧本没有研究说明。",
            }
        )
    if summary["sample_count"] < max(3, summary["scenario_count"] * 3):
        gaps.append(
            {
                "severity": "medium",
                "title": "对抗样本数量偏少",
                "evidence": f"当前 {summary['sample_count']} 条样本，剧本 {summary['scenario_count']} 个。",
                "action": "为每个剧本保留原始输入、间接注入包装和多 Agent 转述包装。",
                "command": f"npm run cli -- samples --surface {surface['id']} --format md",
            }
        )
    if summary["run_count"] == 0:
        gaps.append(
            {
                "severity": "high",
                "title": "缺少运行证据",
                "evidence": "当前攻击面还没有写入实验运行记录。",
                "action": "在页面选择该攻击面并点击“验证当前攻击面”，或运行批量对比命令。",
                "command": "npm run cli -- batch --guard compare",
            }
        )
    if summary["guarded_run_count"] < summary["scenario_count"]:
        missing = summary["scenario_count"] - summary["guarded_run_count"]
        gaps.append(
            {
                "severity": "medium",
                "title": "有防护运行覆盖不足",
                "evidence": f"剧本 {summary['scenario_count']} 个，有防护运行记录 {summary['guarded_run_count']} 条，至少还需补 {max(0, missing)} 条。",
                "action": "对该攻击面的所有剧本执行有防护验证，补齐最近运行证据。",
            }
        )
    if summary["guarded_run_count"] and summary["control_rate"] < 100:
        gaps.append(
            {
                "severity": "high",
                "title": "防护控制率未达满分",
                "evidence": f"当前有防护控制率为 {summary['control_rate']}%。",
                "action": "检查未控制剧本的策略命中，补充规则或异常检测兜底。",
            }
        )
    missing_guarded = [
        card["id"]
        for card in scenario_cards
        if card["latest_guarded_result"]["status"] == "暂无运行证据"
    ]
    if missing_guarded:
        gaps.append(
            {
                "severity": "medium",
                "title": "部分剧本缺少最近有防护结果",
                "evidence": "缺少：" + " / ".join(missing_guarded[:5]),
                "action": "优先运行这些剧本，保证答辩时每张证据卡都有最近结果。",
            }
        )
    return gaps


def _latest_run_summary(runs: list[dict[str, Any]]) -> dict[str, Any]:
    if not runs:
        return {"status": "暂无运行证据", "run_id": "", "decision": "未记录", "policy_id": "未记录", "attack_success": None}
    run = sorted(runs, key=lambda item: item.get("created_at", ""), reverse=True)[0]
    first_log = (run.get("audit_logs") or [{}])[0]
    controlled = _is_controlled_run(run)
    return {
        "status": "已控制" if controlled else ("攻击成功" if run.get("attack_success") else "已运行"),
        "run_id": run.get("run_id", ""),
        "created_at": run.get("created_at", ""),
        "decision": first_log.get("decision", "未记录"),
        "policy_id": first_log.get("policy_id", "未记录"),
        "risk_score": first_log.get("risk_score"),
        "audit_hash": first_log.get("audit_hash", ""),
        "attack_success": run.get("attack_success"),
    }


def _is_controlled_run(run: dict[str, Any]) -> bool:
    metrics = run.get("metrics", {})
    return bool(metrics.get("blocked_count") or metrics.get("asked_count") or metrics.get("isolated_count"))


def _rate(numerator: list[Any], denominator: list[Any]) -> int:
    return round((len(numerator) / len(denominator)) * 100) if denominator else 0


def _threat_chain(surface: dict[str, Any], scenarios: list[dict[str, Any]], policies: Counter[str]) -> list[dict[str, str]]:
    first_scenario = scenarios[0] if scenarios else {}
    tools = sorted({tool_call["tool"] for scenario in scenarios for tool_call in scenario.get("tool_calls", [])})
    return [
        {"stage": "攻击入口", "text": " / ".join((surface.get("entry_points") or [])[:3]) or "待补充"},
        {"stage": "保护资产", "text": " / ".join((surface.get("protected_assets") or [])[:3]) or "待补充"},
        {"stage": "攻击目标", "text": " / ".join((surface.get("attacker_goals") or [])[:3]) or first_scenario.get("expected_risk", "待补充")},
        {"stage": "工具调用", "text": " / ".join(tools) or "待补充"},
        {"stage": "监督策略", "text": " / ".join(policy_id for policy_id, _ in policies.most_common(4)) or "待补充"},
        {"stage": "防御加固", "text": " / ".join((surface.get("mitigations") or [surface.get("defense", "")])[:3])},
    ]


def _replay_commands(surface_id: str, scenario_ids: list[str]) -> list[dict[str, str]]:
    return [
        {
            "label": "页面验证",
            "value": f"在攻击面研究台选择 {surface_id}，点击“验证当前攻击面”",
        },
        {
            "label": "批量对比 CLI",
            "value": "npm run cli -- batch --guard compare",
        },
        {
            "label": "攻击样本导出",
            "value": f"npm run cli -- samples --surface {surface_id} --format md --output backend/sandbox/reports/攻击样本-{surface_id}.md",
        },
        {
            "label": "证据包导出",
            "value": f"npm run cli -- surface-pack --surface {surface_id} --output backend/sandbox/reports",
        },
        {
            "label": "JSON API",
            "value": f"GET /api/attack_surfaces/{surface_id}/evidence_pack",
        },
        {
            "label": "Markdown API",
            "value": f"GET /api/attack_surfaces/{surface_id}/evidence_pack.md",
        },
        {
            "label": "关联剧本",
            "value": ", ".join(scenario_ids) or "暂无",
        },
    ]
