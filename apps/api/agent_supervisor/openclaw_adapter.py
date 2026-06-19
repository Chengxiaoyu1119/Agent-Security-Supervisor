from __future__ import annotations

import json
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from .openclaw_plugin_package import (
    build_openclaw_plugin_package_summary,
)
from .paths import SANDBOX_EXAMPLES_DIR


@dataclass
class GuardedToolResult:
    decision: str
    policy_id: str
    reason: str
    executed: bool
    tool_result: Any = None
    supervisor_result: dict[str, Any] | None = None


class OpenClawToolGuard:
    """Small adapter that can be placed before an Agent tool executor.

    It is intentionally dependency-free. OpenClaw or another agent framework can
    call `guarded_execute()` inside its tool-dispatch hook before running the
    real business tool.
    """

    def __init__(
        self,
        supervisor_url: str = "http://127.0.0.1:8012/api/integrations/openclaw/events",
        *,
        timeout: float = 5.0,
        default_on_error: str = "询问",
    ) -> None:
        self.supervisor_url = supervisor_url
        self.timeout = timeout
        self.default_on_error = default_on_error

    def evaluate(
        self,
        *,
        conversation_id: str,
        agent_id: str,
        agent_role: str,
        source_app: str,
        model_input: str,
        model_output: str,
        tool_call: dict[str, Any],
        context_sources: list[str] | None = None,
        execute_in_sandbox: bool = False,
    ) -> dict[str, Any]:
        event = {
            "conversation_id": conversation_id,
            "agent_id": agent_id,
            "agent_role": agent_role,
            "source_app": source_app,
            "model_input": model_input,
            "model_output": model_output,
            "tool_call": tool_call,
            "context_sources": context_sources or [],
            "guard_enabled": True,
            "execute_in_sandbox": execute_in_sandbox,
        }
        body = json.dumps(event, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            self.supervisor_url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            return json.loads(response.read().decode("utf-8"))

    def guarded_execute(
        self,
        *,
        conversation_id: str,
        agent_id: str,
        agent_role: str,
        source_app: str,
        model_input: str,
        model_output: str,
        tool_call: dict[str, Any],
        executor: Callable[[dict[str, Any]], Any],
        context_sources: list[str] | None = None,
    ) -> GuardedToolResult:
        try:
            supervisor_result = self.evaluate(
                conversation_id=conversation_id,
                agent_id=agent_id,
                agent_role=agent_role,
                source_app=source_app,
                model_input=model_input,
                model_output=model_output,
                tool_call=tool_call,
                context_sources=context_sources,
            )
        except Exception as exc:  # noqa: BLE001 - fail closed to manual review
            return GuardedToolResult(
                decision=self.default_on_error,
                policy_id="supervisor-unavailable",
                reason=f"监督器不可用，按默认策略进入人工确认：{exc}",
                executed=False,
            )

        decision = str(supervisor_result.get("decision", "询问"))
        if decision in {"拒绝", "询问"}:
            return GuardedToolResult(
                decision=decision,
                policy_id=str(supervisor_result.get("policy_id", "unknown")),
                reason=str(supervisor_result.get("reason", "")),
                executed=False,
                supervisor_result=supervisor_result,
            )

        tool_result = executor(tool_call)
        return GuardedToolResult(
            decision=decision,
            policy_id=str(supervisor_result.get("policy_id", "unknown")),
            reason=str(supervisor_result.get("reason", "")),
            executed=True,
            tool_result=tool_result,
            supervisor_result=supervisor_result,
        )


def build_openclaw_hook_example() -> str:
    return """
from apps.api.agent_supervisor.openclaw_adapter import OpenClawToolGuard

guard = OpenClawToolGuard("http://127.0.0.1:8012/api/integrations/openclaw/events")

def tool_dispatch_hook(tool_call, real_executor, model_input, model_output, conversation_id):
    result = guard.guarded_execute(
        conversation_id=conversation_id,
        agent_id="openclaw-agent-01",
        agent_role="executor",
        source_app="OpenClaw",
        model_input=model_input,
        model_output=model_output,
        tool_call=tool_call,
        context_sources=["user", "agent-plan"],
        executor=real_executor,
    )
    if not result.executed:
        return {"blocked": True, "decision": result.decision, "reason": result.reason}
    return result.tool_result
""".strip()

def build_openclaw_integration_bundle() -> dict[str, Any]:
    sample_events = _load_sample_events()
    plugin_summary = build_openclaw_plugin_package_summary()
    return {
        "name": "OpenClaw-compatible tool-call guard bundle",
        "version": "2026.06.08",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "purpose": "把外部智能体的工具调用前置到智安哨监督器，获得允许、拒绝、询问、隔离决策，并写入审计证据。",
        "endpoints": [
            {
                "name": "通用监督接口",
                "method": "POST",
                "path": "/api/supervisor/evaluate",
                "description": "适合 LangChain、AutoGen、自研 Agent 等任意框架。",
            },
            {
                "name": "OpenClaw 兼容入口",
                "method": "POST",
                "path": "/api/integrations/openclaw/events",
                "description": "适合按 OpenClaw 风格工具调度钩子接入。",
            },
            {
                "name": "适配器代码",
                "method": "GET",
                "path": "/api/integrations/openclaw/adapter.py",
                "description": "可复制到外部智能体项目中的最小工具调用守卫。",
            },
            {
                "name": "最小真实接入演示",
                "method": "POST",
                "path": "/api/integrations/openclaw/minimal_agent_demo",
                "description": "从页面或接口运行最小外部 Agent 真实工具调度 demo，并生成审计证据文件。",
            },
            {
                "name": "OpenClaw 源码级插件包",
                "method": "POST",
                "path": "/api/integrations/openclaw/plugin_package/write",
                "description": "生成可安装到 OpenClaw 的 native plugin 包，使用 before_tool_call 作为工具调用前置闸门。",
            },
        ],
        "event_contract": {
            "required_fields": ["conversation_id", "agent_id", "source_app", "model_input", "model_output", "tool_call"],
            "tool_call": {
                "tool": "file.read | file.write | mail.send | api.call | code.run | memory.write | env.read | model.respond",
                "arguments": "工具参数对象",
                "risk_hint": "可选风险提示，例如 sensitive_file、external_mail、bulk_export",
            },
            "optional_fields": ["agent_role", "context_sources", "guard_enabled", "execute_in_sandbox"],
            "safe_default": "execute_in_sandbox 默认为 false，只做判定和审计，不替代真实比赛平台执行工具。",
        },
        "adapter_code": build_openclaw_hook_example(),
        "openclaw_plugin_package": plugin_summary,
        "sample_events": sample_events,
        "validation": {
            "cli": "node scripts/agent-supervisor-cli.mjs demo-external",
            "real_agent_cli": "node scripts/agent-supervisor-cli.mjs external-agent-demo",
            "plugin_cli": "node scripts/agent-supervisor-cli.mjs openclaw-plugin --output apps/api/sandbox/reports",
            "plugin_validation_cli": "node scripts/agent-supervisor-cli.mjs openclaw-plugin-validate --output apps/api/sandbox/reports",
            "powershell": "Invoke-RestMethod -Method Post http://127.0.0.1:8012/api/supervisor/batch_evaluate -Body (Get-Content apps/api/sandbox/examples/openclaw-like-events.json -Raw) -ContentType 'application/json'",
            "expected": {
                "event_count": len(sample_events),
                "controlled_min": 3,
                "allowed_normal_read": True,
            },
        },
        "acceptance_steps": [
            "在外部智能体项目的工具执行入口前调用 OpenClawToolGuard.guarded_execute。",
            "把模型输入、模型输出、工具名、工具参数和上下文来源封装成事件。",
            "先发送到 /api/integrations/openclaw/events。",
            "根据返回 decision 执行：允许继续、拒绝阻断、询问暂停、隔离到沙箱。",
            "在智安哨审计页和告警页查看 run_id、audit_id、policy_id、risk_score、audit_hash。",
            "如使用 OpenClaw 原生接入，运行 `node scripts/agent-supervisor-cli.mjs openclaw-plugin --output apps/api/sandbox/reports` 生成插件包，再用 `openclaw plugins install -l apps/api/sandbox/reports/agent-supervisor-openclaw-guard` 安装。",
            "运行 `node scripts/agent-supervisor-cli.mjs openclaw-plugin-validate --output apps/api/sandbox/reports` 生成插件包验收报告；安装 OpenClaw 后可追加 `--inspect-runtime` 获取真实 runtime inspect 结果。",
        ],
        "safety_boundary": [
            "默认不发送真实邮件。",
            "默认不读取真实用户文件。",
            "默认不替代真实比赛平台执行工具。",
            "如需执行，只允许在本项目沙箱和模拟比赛工具中验证。",
        ],
    }


def build_openclaw_integration_markdown() -> str:
    bundle = build_openclaw_integration_bundle()
    lines = [
        "# OpenClaw 兼容接入包",
        "",
        f"生成时间：{bundle['generated_at']}",
        "",
        "## 接入目标",
        "",
        bundle["purpose"],
        "",
        "## 接口清单",
        "",
        "| 接口 | 方法 | 说明 |",
        "|---|---|---|",
    ]
    for endpoint in bundle["endpoints"]:
        lines.append(f"| `{endpoint['path']}` | {endpoint['method']} | {endpoint['description']} |")
    lines.extend(
        [
            "",
            "## 事件结构",
            "",
            f"- 必填字段：{', '.join(bundle['event_contract']['required_fields'])}",
            f"- 可选字段：{', '.join(bundle['event_contract']['optional_fields'])}",
            f"- 安全默认值：{bundle['event_contract']['safe_default']}",
            "",
            "## 验证命令",
            "",
            "```powershell",
            bundle["validation"]["cli"],
            "```",
            "",
            "运行最小外部 Agent 真实工具调度接入演示：",
            "",
            "```powershell",
            bundle["validation"]["real_agent_cli"],
            "```",
            "",
            "生成 OpenClaw native plugin 并做静态验收：",
            "",
            "```powershell",
            bundle["validation"]["plugin_validation_cli"],
            "```",
            "",
            "## 适配器代码",
            "",
            "```python",
            bundle["adapter_code"],
            "```",
            "",
            "## 验收步骤",
            "",
        ]
    )
    for index, step in enumerate(bundle["acceptance_steps"], start=1):
        lines.append(f"{index}. {step}")
    lines.extend(["", "## 安全边界", ""])
    for item in bundle["safety_boundary"]:
        lines.append(f"- {item}")
    return "\n".join(lines)

def _load_sample_events() -> list[dict[str, Any]]:
    sample_path = SANDBOX_EXAMPLES_DIR / "openclaw-like-events.json"
    try:
        data = json.loads(sample_path.read_text(encoding="utf-8"))
    except OSError:
        return []
    return data if isinstance(data, list) else []
