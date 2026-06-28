from __future__ import annotations

from html import escape
from pathlib import Path
from typing import Any


def render_surface_briefing_sheet_html(pack: dict[str, Any]) -> str:
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
      <div><span>脚本</span><strong>{summary['scenario_count']}</strong></div>
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
        <p class="scenario-line">{_html(main_scenario['id'] if main_scenario else '暂无脚本')} · {_html(main_scenario['target'] if main_scenario else '暂无目标工具')}</p>
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
      <thead><tr><th>脚本</th><th>预期策略</th><th>最近有防护结果</th></tr></thead>
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


def render_briefing_sheet_index_html(sheets: list[dict[str, Any]]) -> str:
    rows = "".join(
        f"""
        <a class="sheet-link" href="{_html(Path(sheet['html_path']).name)}">
          <span>{_html(sheet['surface_name'])}</span>
          <b>{sheet['summary']['readiness_score']}%</b>
          <small>{sheet['summary']['scenario_count']} 脚本 · {sheet['summary']['sample_count']} 样本 · 缺口 {sheet['summary']['gap_count']}</small>
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
