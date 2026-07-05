from __future__ import annotations

from datetime import datetime, timezone
from textwrap import dedent
from typing import Any


def build_agent_integration_bundle() -> dict[str, Any]:
    examples = [
        {
            "id": "generic-http-webhook",
            "name": "通用 HTTP Webhook",
            "framework": "任意 Agent 框架",
            "runtime_stage": "工具执行前",
            "endpoint": "POST /api/supervisor/evaluate",
            "status": "ready",
            "code": _generic_http_example(),
        },
        {
            "id": "openai-agents-sdk",
            "name": "OpenAI Agents SDK 接入示例",
            "framework": "OpenAI Agents SDK",
            "runtime_stage": "tool wrapper / handoff 前",
            "endpoint": "POST /api/supervisor/evaluate",
            "status": "reference",
            "code": _openai_agents_example(),
        },
        {
            "id": "langchain-tool-wrapper",
            "name": "LangChain Tool Wrapper",
            "framework": "LangChain",
            "runtime_stage": "BaseTool 调用前",
            "endpoint": "POST /api/supervisor/evaluate",
            "status": "reference",
            "code": _langchain_example(),
        },
        {
            "id": "langgraph-policy-node",
            "name": "LangGraph Policy Node",
            "framework": "LangGraph",
            "runtime_stage": "tool node 前置策略节点",
            "endpoint": "POST /api/supervisor/evaluate",
            "status": "reference",
            "code": _langgraph_example(),
        },
    ]
    return {
        "name": "智安哨通用 Agent Runtime 接入包",
        "version": "0.2.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "purpose": "把任意 Agent 框架的工具调用统一转成智安哨事件，由监督器返回允许、询问、拒绝或隔离。",
        "decision_contract": {
            "允许": "上游可以继续执行工具，但必须保留审计编号。",
            "询问": "暂停执行，创建人工复核单，等待安全分析员处理。",
            "拒绝": "禁止执行工具调用。",
            "隔离": "只允许在沙箱或低权限环境执行。",
        },
        "event_contract": {
            "required_fields": ["tool_call.tool", "tool_call.arguments"],
            "recommended_fields": ["conversation_id", "agent_id", "source_app", "model_input", "model_output"],
            "safe_default": "外部事件默认只判定和审计，不替上游真实执行工具。",
        },
        "examples": examples,
        "acceptance": [
            "工具调用前必须调用 /api/supervisor/evaluate。",
            "上游必须按 decision 执行允许、询问、拒绝或隔离。",
            "询问类结果必须把 approval_review.id 展示给人工复核人员。",
            "每次真实接入都要保留 run_id、audit_id 和 audit_hash。",
        ],
    }


def build_agent_integration_markdown(data: dict[str, Any] | None = None) -> str:
    data = data or build_agent_integration_bundle()
    lines = [
        f"# {data['name']}",
        "",
        data["purpose"],
        "",
        "## 决策合约",
        "",
    ]
    for decision, meaning in data["decision_contract"].items():
        lines.append(f"- {decision}：{meaning}")
    lines.extend(["", "## 接入示例", ""])
    for example in data["examples"]:
        lines.extend(
            [
                f"### {example['name']}",
                "",
                f"- 框架：{example['framework']}",
                f"- 位置：{example['runtime_stage']}",
                f"- 接口：`{example['endpoint']}`",
                "",
                "```python",
                example["code"].strip(),
                "```",
                "",
            ]
        )
    lines.extend(["## 验收标准", ""])
    lines.extend([f"- {item}" for item in data["acceptance"]])
    return "\n".join(lines)


def _generic_http_example() -> str:
    return dedent(
        """
        import requests

        def guard_tool_call(tool_name, arguments, model_input=""):
            response = requests.post(
                "http://127.0.0.1:8012/api/supervisor/evaluate",
                json={
                    "conversation_id": "prod-conversation-id",
                    "agent_id": "agent-1",
                    "source_app": "generic-agent",
                    "model_input": model_input,
                    "tool_call": {"tool": tool_name, "arguments": arguments},
                    "execute_in_sandbox": False,
                },
                timeout=5,
            )
            response.raise_for_status()
            return response.json()
        """
    )


def _openai_agents_example() -> str:
    return dedent(
        """
        # 示例代码表达接入位置：在真实工具函数执行前调用智安哨。
        def supervised_tool(tool_name, raw_tool_func):
            def wrapper(**kwargs):
                decision = guard_tool_call(tool_name, kwargs, model_input="agent trace excerpt")
                if decision["decision"] == "拒绝":
                    raise RuntimeError(decision["reason"])
                if decision["decision"] == "询问":
                    return {"pending_review": decision["approval_review"]["id"]}
                if decision["decision"] == "隔离":
                    return {"sandbox_only": True, "audit_id": decision["audit_id"]}
                return raw_tool_func(**kwargs)
            return wrapper
        """
    )


def _langchain_example() -> str:
    return dedent(
        """
        class SupervisedTool:
            def __init__(self, name, raw_tool):
                self.name = name
                self.raw_tool = raw_tool

            def invoke(self, arguments):
                decision = guard_tool_call(self.name, arguments)
                if decision["decision"] in {"拒绝", "询问"}:
                    return {"blocked": True, "decision": decision}
                return self.raw_tool.invoke(arguments)
        """
    )


def _langgraph_example() -> str:
    return dedent(
        """
        def policy_node(state):
            tool_call = state["next_tool_call"]
            decision = guard_tool_call(tool_call["tool"], tool_call.get("arguments", {}))
            state["supervisor_decision"] = decision
            if decision["decision"] == "允许":
                state["next"] = "tool_node"
            elif decision["decision"] == "隔离":
                state["next"] = "sandbox_tool_node"
            else:
                state["next"] = "human_review_node"
            return state
        """
    )
