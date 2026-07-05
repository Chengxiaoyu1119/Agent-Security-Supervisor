from __future__ import annotations

from html import escape
from pathlib import Path
from typing import Any

RISK_NAME = {
    "critical": "极高",
    "high": "高",
    "medium": "中",
    "low": "低",
}

COVERAGE_LABELS = {
    "has_surface_profile": "攻击面画像",
    "has_adversarial_samples": "对抗样本",
    "has_jailbreak_cases": "越狱用例",
    "has_agent_scripts": "智能体脚本",
    "has_policy_expectations": "策略预期",
    "has_runtime_evidence": "运行证据",
}

TOOL_LABELS = {
    "mail.send": "邮件发送",
    "file.read": "文件读取",
    "file.write": "文件写入",
    "api.call": "接口调用",
    "memory.write": "记忆写入",
    "memory.read": "记忆读取",
    "code.execute": "代码执行",
    "model.respond": "模型响应",
    "env.read": "环境读取",
    "multi-tool-chain": "多工具链",
}

POLICY_LABELS = {
    "external-mail": "外部收件复核",
    "sensitive-api": "敏感接口拒绝",
    "jailbreak-filter": "越狱过滤",
    "model-output-filter": "输出过滤",
    "bulk-action-review": "批量操作复核",
    "tool-return-trust": "工具返回隔离",
    "environment-trust": "环境信任降级",
    "memory-write": "记忆写入隔离",
    "memory-read-sensitive": "敏感记忆读取控制",
    "path-boundary": "路径边界控制",
    "guard-disabled": "未启用防护",
}

TEXT_REPLACEMENTS = {
    "api.call": "接口调用",
    "mail.send": "邮件发送",
    "memory.write": "记忆写入",
    "memory.read": "记忆读取",
    "model.respond": "模型响应",
    "env.read": "环境读取",
    "multi-tool-chain": "多工具链",
    "external-mail": "外部收件复核",
    "sensitive-api": "敏感接口拒绝",
    "jailbreak-filter": "越狱过滤",
    "model-output-filter": "输出过滤",
    "bulk-action-review": "批量操作复核",
    "tool-return-trust": "工具返回隔离",
    "environment-trust": "环境信任降级",
    "memory-write": "记忆写入隔离",
    "多 agent": "多智能体",
    "Agent": "智能体",
    "agent": "智能体",
    "API": "接口",
    "token": "令牌",
    "endpoint": "接口",
}


def render_surface_briefing_sheet_html(pack: dict[str, Any]) -> str:
    surface = pack["surface"]
    summary = pack["summary"]
    scenarios = pack.get("scenarios", [])
    main_scenario = scenarios[0] if scenarios else None
    guarded = main_scenario.get("latest_guarded_result", {}) if main_scenario else {}
    risk_name = RISK_NAME.get(surface.get("risk"), surface.get("risk", "未知"))

    metric_cells = _render_metric_cells(summary)
    object_rows = _render_key_value_rows(
        [
            ("攻击入口", _human_text(_join(surface.get("entry_points"), limit=4))),
            ("保护资产", _human_text(_join(surface.get("protected_assets"), limit=4))),
            ("检测信号", _human_text(_join(surface.get("detection_signals"), limit=4))),
            ("涉及工具", _join([_human_tool(item.get("tool", "")) for item in pack.get("tool_coverage", [])], limit=6)),
            ("防御动作", _human_text(_join(surface.get("mitigations") or [surface.get("defense", "")], limit=3))),
        ]
    )
    decision_rows = _render_key_value_rows(
        [
            ("最近结果", guarded.get("status", "待验证")),
            ("运行编号", _short_hash(guarded.get("run_id"))),
            ("命中策略", _join([f"{_human_policy(item.get('policy_id', ''))} / {item.get('decision', '')}" for item in pack.get("policy_distribution", [])], limit=5)),
            ("风险分", "未记录" if guarded.get("risk_score") is None else guarded.get("risk_score")),
            ("审计哈希", _short_hash(guarded.get("audit_hash"))),
            ("运行时间", _short_time(guarded.get("created_at"))),
        ]
    )
    path_rows = _render_path_rows(pack.get("threat_chain", [])[:5])
    gap_rows = _render_gap_rows(pack.get("gaps", []))
    scenario_rows = _render_scenario_rows(scenarios[:5])
    coverage_text = _coverage_text(pack.get("coverage_checks", {}))

    html = f"""<!doctype html>
<html lang=\"zh-CN\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>智能体安全评测记录 - {_html(surface.get('name', ''))}</title>
  <style>
    :root {{
      color-scheme: light;
      --ink: #111827;
      --text: #243044;
      --muted: #667085;
      --subtle: #8a94a6;
      --line: #d7dde7;
      --line-soft: #e8edf4;
      --paper: #ffffff;
      --blue: #1d4ed8;
      --green: #047857;
      --green-bg: #e8f6f0;
      --amber: #9a5b00;
      --amber-bg: #fff6df;
      --red: #b42318;
      --red-bg: #fff1f0;
      font-family: \"Microsoft YaHei\", \"PingFang SC\", \"Segoe UI\", system-ui, sans-serif;
    }}
    @page {{ size: A4 landscape; margin: 8mm; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; min-width: 1120px; background: #f3f5f8; color: var(--ink); }}
    .sheet {{ width: 1120px; min-height: 760px; margin: 0 auto; padding: 34px 40px 28px; background: var(--paper); }}
    .report-head {{ display: grid; grid-template-columns: minmax(0, 1fr) 275px; gap: 30px; border-bottom: 2px solid var(--ink); padding-bottom: 18px; }}
    .doc-title {{ margin: 0 0 10px; color: var(--muted); font-size: 15px; font-weight: 900; }}
    h1 {{ margin: 0; font-size: 40px; line-height: 1.08; letter-spacing: -.03em; color: var(--ink); }}
    .report-subtitle {{ margin-top: 12px; color: var(--text); font-size: 14px; line-height: 1.6; }}
    .doc-meta {{ border-collapse: collapse; width: 100%; font-size: 12px; }}
    .doc-meta th {{ width: 76px; color: var(--muted); font-weight: 800; text-align: left; padding: 5px 0; border-bottom: 1px solid var(--line-soft); }}
    .doc-meta td {{ color: var(--text); padding: 5px 0; border-bottom: 1px solid var(--line-soft); overflow-wrap: anywhere; }}
    .status {{ display: inline-flex; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 900; }}
    .status-ok {{ color: var(--green); background: var(--green-bg); }}
    .status-warn {{ color: var(--amber); background: var(--amber-bg); }}
    .status-bad {{ color: var(--red); background: var(--red-bg); }}
    .metrics {{ width: 100%; margin-top: 16px; border-collapse: collapse; table-layout: fixed; }}
    .metrics th {{ color: var(--muted); font-size: 12px; font-weight: 800; text-align: left; border-bottom: 1px solid var(--line); padding: 8px 10px 7px 0; }}
    .metrics td {{ color: var(--ink); font-size: 24px; font-weight: 900; border-bottom: 1px solid var(--line); padding: 8px 10px 12px 0; }}
    .metrics small {{ color: var(--subtle); font-size: 12px; margin-left: 3px; }}
    .cols {{ display: grid; grid-template-columns: 1fr 1fr; column-gap: 34px; row-gap: 22px; margin-top: 20px; }}
    .section {{ break-inside: avoid; }}
    .section h2 {{ margin: 0 0 8px; padding-bottom: 7px; border-bottom: 1px solid var(--line); color: var(--ink); font-size: 17px; line-height: 1.25; }}
    .section h2 small {{ margin-left: 8px; color: var(--subtle); font-size: 12px; font-weight: 700; }}
    .kv-table, .result-table, .path-table {{ width: 100%; border-collapse: collapse; }}
    .kv-table th {{ width: 92px; color: var(--muted); font-size: 13px; font-weight: 800; text-align: left; vertical-align: top; padding: 7px 12px 7px 0; border-bottom: 1px solid var(--line-soft); }}
    .kv-table td {{ color: var(--text); font-size: 13px; line-height: 1.55; padding: 7px 0; border-bottom: 1px solid var(--line-soft); }}
    .path-table th, .path-table td, .result-table th, .result-table td {{ border-bottom: 1px solid var(--line-soft); padding: 8px 10px 8px 0; text-align: left; vertical-align: top; }}
    .path-table th, .result-table th {{ color: var(--muted); font-size: 12px; font-weight: 800; }}
    .path-table td, .result-table td {{ color: var(--text); font-size: 12.5px; line-height: 1.45; }}
    .path-table td:first-child {{ color: var(--blue); font-weight: 900; width: 90px; }}
    .result-table strong {{ display: block; color: var(--ink); font-size: 12.5px; }}
    .result-table small {{ display: block; margin-top: 3px; color: var(--subtle); overflow-wrap: anywhere; }}
    .span-2 {{ grid-column: 1 / -1; }}
    .coverage {{ margin: 10px 0 0; color: var(--muted); font-size: 12px; line-height: 1.55; }}
    .footer {{ display: flex; justify-content: space-between; gap: 24px; margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--line); color: var(--subtle); font-size: 12px; font-weight: 800; }}
    @media print {{ body {{ background: #fff; }} .sheet {{ width: 1120px; min-height: auto; margin: 0; }} }}
  </style>
</head>
<body>
  <main class=\"sheet\">
    <header class=\"report-head\">
      <div>
        <p class=\"doc-title\">智能体安全评测记录</p>
        <h1>{_html(surface.get('name', ''))}</h1>
        <div class=\"report-subtitle\">运行对象：大模型智能体工具调用链路；记录范围：攻击脚本、监督判定、审计哈希和处理结果。</div>
      </div>
      <table class=\"doc-meta\">
        <tbody>
          <tr><th>攻击面</th><td>{_html(surface.get('name', ''))}</td></tr>
          <tr><th>风险级别</th><td>{_html(risk_name)}</td></tr>
          <tr><th>最近结果</th><td>{_status_badge(guarded.get('status', '待验证'))}</td></tr>
          <tr><th>运行编号</th><td>{_html(_short_hash(guarded.get('run_id')))}</td></tr>
        </tbody>
      </table>
    </header>

    <table class=\"metrics\">
      <thead><tr>{metric_cells['head']}</tr></thead>
      <tbody><tr>{metric_cells['body']}</tr></tbody>
    </table>

    <section class=\"cols\">
      <article class=\"section\">
        <h2>一、评测对象与边界<small>输入、资产、工具</small></h2>
        <table class=\"kv-table\"><tbody>{object_rows}</tbody></table>
      </article>

      <article class=\"section\">
        <h2>二、监督判定记录<small>策略、分数、审计</small></h2>
        <table class=\"kv-table\"><tbody>{decision_rows}</tbody></table>
        <p class=\"coverage\">覆盖检查：{_html(coverage_text)}</p>
      </article>

      <article class=\"section\">
        <h2>三、攻击路径复现<small>从输入到工具调用</small></h2>
        <table class=\"path-table\"><tbody>{path_rows}</tbody></table>
      </article>

      <article class=\"section\">
        <h2>四、缺口与处理<small>用于后续补证</small></h2>
        <table class=\"result-table\">
          <thead><tr><th>级别</th><th>问题</th><th>处理动作</th></tr></thead>
          <tbody>{gap_rows}</tbody>
        </table>
      </article>

      <article class=\"section span-2\">
        <h2>五、脚本级评测结果<small>最近有防护结果，最多展示 5 条</small></h2>
        <table class=\"result-table\">
          <thead><tr><th style=\"width:30%\">脚本</th><th style=\"width:22%\">目标工具</th><th style=\"width:30%\">预期策略</th><th>结果</th></tr></thead>
          <tbody>{scenario_rows}</tbody>
        </table>
      </article>
    </section>

    <footer class=\"footer\">
      <span>智安哨 · 智能体安全监督评测</span>
      <span>生成时间：{_html(_short_time(pack.get('generated_at', '-')))}</span>
    </footer>
  </main>
</body>
</html>"""
    return html


def render_briefing_sheet_index_html(sheets: list[dict[str, Any]]) -> str:
    rows = "".join(
        f"""
        <a class=\"sheet-link\" href=\"{_html(Path(sheet['html_path']).name)}\">
          <span>{_html(sheet['surface_name'])}</span>
          <b>{sheet['summary']['readiness_score']}%</b>
          <small>{sheet['summary']['scenario_count']} 脚本 · {sheet['summary']['sample_count']} 样本 · 缺口 {sheet['summary']['gap_count']}</small>
        </a>
        """
        for sheet in sheets
    )
    return f"""<!doctype html>
<html lang=\"zh-CN\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>攻击面评测单页索引</title>
  <style>
    :root {{ --bg: #f3f5f8; --ink: #111827; --muted: #667085; --blue: #1d4ed8; --line: #d7dde7; font-family: \"Microsoft YaHei\", \"PingFang SC\", \"Segoe UI\", system-ui, sans-serif; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; background: var(--bg); color: var(--ink); }}
    main {{ width: min(1080px, calc(100vw - 40px)); margin: 0 auto; padding: 48px 0; }}
    h1 {{ margin: 0; font-size: clamp(32px, 5vw, 46px); line-height: 1.08; }}
    p {{ max-width: 760px; color: var(--muted); font-size: 16px; line-height: 1.7; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-top: 28px; }}
    .sheet-link {{ display: grid; min-height: 132px; align-content: space-between; border-top: 3px solid var(--blue); background: #fff; color: inherit; padding: 18px; text-decoration: none; }}
    .sheet-link span {{ color: var(--ink); font-size: 20px; font-weight: 900; }}
    .sheet-link b {{ color: var(--blue); font-size: 34px; line-height: 1; }}
    .sheet-link small {{ color: var(--muted); font-weight: 800; }}
  </style>
</head>
<body>
  <main>
    <h1>攻击面评测单页索引</h1>
    <p>每个 HTML 文件对应一类攻击面，内容来自后端证据包、策略判定和最近审计记录，可直接转换成 PNG 或 PDF 用于汇报。</p>
    <section class=\"grid\">{rows}</section>
  </main>
</body>
</html>"""


def _render_metric_cells(summary: dict[str, Any]) -> dict[str, str]:
    rows = [
        ("攻击脚本", summary.get("scenario_count", 0), "条"),
        ("对抗样本", summary.get("sample_count", 0), "条"),
        ("工具类型", summary.get("unique_tool_count", 0), "类"),
        ("有防护运行", summary.get("guarded_run_count", 0), "次"),
        ("控制率", f"{summary.get('control_rate', 0)}%", ""),
        ("证据完整度", f"{summary.get('readiness_score', 0)}%", ""),
    ]
    return {
        "head": "".join(f"<th>{_html(label)}</th>" for label, _, _ in rows),
        "body": "".join(f"<td>{_html(value)}<small>{_html(unit)}</small></td>" for _, value, unit in rows),
    }


def _render_key_value_rows(rows: list[tuple[str, Any]]) -> str:
    return "".join(f"<tr><th>{_html(key)}</th><td>{_html(_human_text(value))}</td></tr>" for key, value in rows)


def _render_path_rows(nodes: list[dict[str, Any]]) -> str:
    if not nodes:
        return '<tr><td colspan="2">暂无攻击路径记录。</td></tr>'
    return "".join(
        f"<tr><td>{_html(node.get('stage', ''))}</td><td>{_html(_human_text(node.get('text', '')))}</td></tr>"
        for node in nodes
    )


def _render_scenario_rows(scenarios: list[dict[str, Any]]) -> str:
    if not scenarios:
        return '<tr><td colspan="4">暂无脚本记录</td></tr>'
    rows = []
    for index, card in enumerate(scenarios, start=1):
        expected = _join(
            [f"{_human_policy(item.get('policy_id', ''))} / {item.get('decision', '')}" for item in card.get("expected_decisions", [])],
            limit=3,
        )
        result = card.get("latest_guarded_result", {})
        status = result.get("status", "暂无运行证据")
        rows.append(
            f"""
            <tr>
              <td><strong>{_html(_human_text(card.get('title', card.get('id', ''))))}</strong><small>脚本 {index}</small></td>
              <td>{_html(_human_tool(card.get('target', '')))}</td>
              <td>{_html(_human_text(expected))}</td>
              <td>{_status_badge(status)}<small>{_html(_short_hash(result.get('run_id')))}</small></td>
            </tr>
            """
        )
    return "".join(rows)


def _render_gap_rows(gaps: list[dict[str, Any]]) -> str:
    if not gaps:
        return '<tr><td><span class="status status-ok">正常</span></td><td>暂无高优先级缺口</td><td>保持当前样本、脚本、策略和审计证据链。</td></tr>'
    rows = []
    for gap in gaps[:4]:
        severity = str(gap.get("severity", "medium"))
        rows.append(
            f"<tr><td>{_status_badge(_human_severity(severity))}</td><td>{_html(_human_text(gap.get('title', '')))}</td><td>{_html(_human_text(gap.get('action', '')))}</td></tr>"
        )
    return "".join(rows)


def _status_badge(status: Any) -> str:
    text = str(status or "未记录")
    status_class = "status-ok"
    if text in {"攻击成功", "高", "极高", "high", "critical", "失败"}:
        status_class = "status-bad"
    elif text in {"暂无运行证据", "待验证", "中", "medium", "未完成"}:
        status_class = "status-warn"
    return f'<span class="status {status_class}">{_html(text)}</span>'


def _coverage_text(checks: dict[str, bool]) -> str:
    if not checks:
        return "未记录"
    done = [COVERAGE_LABELS.get(key, key) for key, value in checks.items() if value]
    todo = [COVERAGE_LABELS.get(key, key) for key, value in checks.items() if not value]
    parts = []
    if done:
        parts.append("已覆盖：" + "、".join(done))
    if todo:
        parts.append("待补充：" + "、".join(todo))
    return "；".join(parts)


def _join(values: Any, limit: int = 3, sep: str = " / ") -> str:
    if not values:
        return "未记录"
    items = [str(item).strip() for item in values if str(item).strip()]
    if not items:
        return "未记录"
    selected = items[:limit]
    if len(items) > limit:
        selected.append(f"等 {len(items)} 项")
    return sep.join(selected)


def _short_hash(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return "暂无"
    return text[:16]


def _short_time(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return "暂无"
    return text.replace("T", " ").replace("+00:00", " UTC")[:24]


def _human_tool(value: Any) -> str:
    text = str(value or "").strip()
    return TOOL_LABELS.get(text, _human_text(text))


def _human_policy(value: Any) -> str:
    text = str(value or "").strip()
    return POLICY_LABELS.get(text, _human_text(text))


def _human_severity(value: Any) -> str:
    text = str(value or "").strip()
    return {
        "critical": "极高",
        "high": "高",
        "medium": "中",
        "low": "低",
        "ok": "正常",
    }.get(text, text)


def _human_text(value: Any) -> str:
    text = str(value or "")
    for source, target in TEXT_REPLACEMENTS.items():
        text = text.replace(source, target)
    return text


def _html(value: Any) -> str:
    return escape(str(value), quote=True)
