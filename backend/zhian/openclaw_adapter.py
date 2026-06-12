from __future__ import annotations

import json
import shutil
import subprocess
import threading
import urllib.request
import zipfile
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

OPENCLAW_PLUGIN_PACKAGE_LOCK = threading.Lock()


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
from backend.zhian.openclaw_adapter import OpenClawToolGuard

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


def build_openclaw_plugin_package_files(
    supervisor_url: str = "http://127.0.0.1:8012/api/integrations/openclaw/events",
) -> dict[str, str]:
    return {
        "package.json": _openclaw_plugin_package_json(),
        "openclaw.plugin.json": _openclaw_plugin_manifest(supervisor_url),
        "src/index.ts": _openclaw_plugin_source(supervisor_url),
        "dist/index.js": _openclaw_plugin_runtime(supervisor_url),
        "README.md": _openclaw_plugin_readme(supervisor_url),
    }


def build_openclaw_plugin_package_summary(
    supervisor_url: str = "http://127.0.0.1:8012/api/integrations/openclaw/events",
) -> dict[str, Any]:
    files = build_openclaw_plugin_package_files(supervisor_url)
    runtime = files["dist/index.js"]
    return {
        "name": "zhian-openclaw-guard",
        "version": "2026.06.08",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "package_type": "OpenClaw native plugin",
        "supervisor_url": supervisor_url,
        "core_hooks": ["before_tool_call", "after_tool_call"],
        "decision_mapping": {
            "允许": "放行工具调用，继续执行。",
            "拒绝": "返回 block 决策，阻断工具调用。",
            "询问": "返回 requireApproval 决策，等待人工确认，超时拒绝。",
            "隔离": "返回高风险 requireApproval 决策，默认不自动执行，由操作员选择沙箱流程。",
        },
        "install_commands": [
            "openclaw plugins install -l backend/sandbox/reports/zhian-openclaw-guard",
            "openclaw plugins inspect zhian-openclaw-guard --runtime --json",
            "openclaw plugins enable zhian-openclaw-guard",
        ],
        "runtime_checks": {
            "has_package_openclaw_extensions": '"openclaw"' in files["package.json"] and '"extensions"' in files["package.json"],
            "has_manifest_id": '"id": "zhian-openclaw-guard"' in files["openclaw.plugin.json"],
            "has_before_tool_call": "api.on" in runtime and '"before_tool_call"' in runtime,
            "has_after_tool_call": "api.on" in runtime and '"after_tool_call"' in runtime,
            "has_fail_closed": "failClosedDecision" in runtime and "timeoutBehavior" in runtime,
            "file_count": len(files),
        },
        "files": [
            {
                "path": path,
                "size": len(content.encode("utf-8")),
            }
            for path, content in files.items()
        ],
    }


def build_openclaw_plugin_package_markdown(
    supervisor_url: str = "http://127.0.0.1:8012/api/integrations/openclaw/events",
) -> str:
    summary = build_openclaw_plugin_package_summary(supervisor_url)
    files = build_openclaw_plugin_package_files(supervisor_url)
    lines = [
        "# OpenClaw 源码级插件包",
        "",
        "该材料把智安哨从“兼容事件接口”推进到 OpenClaw native plugin 形态。插件通过 OpenClaw typed plugin hooks 在工具执行前调用智安哨监督器。",
        "",
        "## 依据的 OpenClaw 接入面",
        "",
        "- `before_tool_call`：工具执行前策略闸门，可阻断或要求人工审批。",
        "- `after_tool_call`：工具执行后观察结果，用于审计补充。",
        "- native plugin 包：包含 `package.json`、`openclaw.plugin.json` 和运行入口。",
        "",
        "## 安装命令",
        "",
        "```powershell",
        *summary["install_commands"],
        "```",
        "",
        "## 决策映射",
        "",
        "| 智安哨决策 | OpenClaw Hook 行为 |",
        "|---|---|",
    ]
    for decision, behavior in summary["decision_mapping"].items():
        lines.append(f"| {decision} | {behavior} |")
    lines.extend(
        [
            "",
            "## 静态验收",
            "",
            "| 检查项 | 结果 |",
            "|---|---|",
        ]
    )
    for key, value in summary["runtime_checks"].items():
        lines.append(f"| {key} | {value} |")
    lines.extend(
        [
            "",
            "## 文件清单",
            "",
            "| 文件 | 大小 |",
            "|---|---:|",
        ]
    )
    for item in summary["files"]:
        lines.append(f"| `{item['path']}` | {item['size']} bytes |")
    lines.extend(
        [
            "",
            "## 运行入口预览",
            "",
            "```js",
            files["dist/index.js"],
            "```",
        ]
    )
    return "\n".join(lines)


def write_openclaw_plugin_package(
    output_root: str | Path | None = None,
    supervisor_url: str = "http://127.0.0.1:8012/api/integrations/openclaw/events",
) -> dict[str, Any]:
    with OPENCLAW_PLUGIN_PACKAGE_LOCK:
        root = Path(output_root) if output_root else Path(__file__).resolve().parents[1] / "sandbox" / "reports"
        package_dir = root / "zhian-openclaw-guard"
        package_dir.mkdir(parents=True, exist_ok=True)
        files = build_openclaw_plugin_package_files(supervisor_url)
        written: list[Path] = []
        for relative, content in files.items():
            path = package_dir / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            written.append(path)

        markdown_path = root / "OpenClaw源码级插件包.md"
        markdown_path.write_text(build_openclaw_plugin_package_markdown(supervisor_url), encoding="utf-8")
        written.append(markdown_path)

        zip_path = root / "zhian-openclaw-guard.zip"
        if zip_path.exists():
            zip_path.unlink()
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for relative in files:
                path = package_dir / relative
                archive.write(path, arcname=f"zhian-openclaw-guard/{relative}")
            archive.write(markdown_path, arcname="OpenClaw源码级插件包.md")

    summary = build_openclaw_plugin_package_summary(supervisor_url)
    return {
        "generated_at": summary["generated_at"],
        "package_dir": str(package_dir.resolve()),
        "zip_path": str(zip_path.resolve()),
        "markdown_path": str(markdown_path.resolve()),
        "file_count": len(written),
        "summary": summary,
    }


def validate_openclaw_plugin_package(
    output_root: str | Path | None = None,
    supervisor_url: str = "http://127.0.0.1:8012/api/integrations/openclaw/events",
    *,
    inspect_runtime: bool = False,
) -> dict[str, Any]:
    package = write_openclaw_plugin_package(output_root=output_root, supervisor_url=supervisor_url)
    package_dir = Path(package["package_dir"])
    runtime_path = package_dir / "dist" / "index.js"
    required_files = ["package.json", "openclaw.plugin.json", "src/index.ts", "dist/index.js", "README.md"]
    file_checks = {relative: (package_dir / relative).exists() for relative in required_files}
    static_checks = dict(package["summary"]["runtime_checks"])
    node_check = _run_command_check(
        ["node", "--check", str(runtime_path)],
        command_label=f"node --check {runtime_path}",
        missing_message="未检测到 Node.js，无法执行 JavaScript 语法检查。",
    )
    openclaw_cli = shutil.which("openclaw")
    runtime_check = {
        "attempted": False,
        "available": bool(openclaw_cli),
        "passed": None,
        "command": f"openclaw plugins inspect zhian-openclaw-guard --runtime --json",
        "stdout": "",
        "stderr": "",
        "skipped_reason": "",
    }
    if inspect_runtime:
        if openclaw_cli:
            runtime_check = _run_command_check(
                [openclaw_cli, "plugins", "inspect", "zhian-openclaw-guard", "--runtime", "--json"],
                command_label="openclaw plugins inspect zhian-openclaw-guard --runtime --json",
                missing_message="未检测到 OpenClaw CLI，无法执行真实 runtime inspect。",
            )
            runtime_check["available"] = True
        else:
            runtime_check["attempted"] = False
            runtime_check["skipped_reason"] = "当前环境未安装 OpenClaw CLI；请在安装 OpenClaw 后执行 install 与 inspect 命令。"
    else:
        runtime_check["skipped_reason"] = "默认只做无副作用静态验收；如需真实 OpenClaw runtime inspect，请启用 inspect_runtime。"

    static_passed = all(value is True for key, value in static_checks.items() if key != "file_count")
    files_passed = all(file_checks.values())
    node_passed = node_check["passed"] is True
    runtime_passed = runtime_check["passed"] is True
    remaining_gap = []
    if not runtime_passed:
        remaining_gap.append("真实 OpenClaw runtime inspect 尚未通过；需要在已安装 OpenClaw 的环境中安装并检查插件。")
    if not files_passed:
        remaining_gap.append("插件包缺少必要文件。")
    if not node_passed:
        remaining_gap.append("插件运行入口 JavaScript 语法检查未通过或未执行。")

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "package_dir": package["package_dir"],
        "zip_path": package["zip_path"],
        "markdown_path": package["markdown_path"],
        "static_passed": static_passed,
        "files_passed": files_passed,
        "node_syntax_passed": node_passed,
        "runtime_inspect_passed": runtime_passed,
        "overall_status": "runtime-validated"
        if static_passed and files_passed and node_passed and runtime_passed
        else "static-validated" if static_passed and files_passed and node_passed else "needs-fix",
        "file_checks": file_checks,
        "static_checks": static_checks,
        "node_check": node_check,
        "openclaw_runtime_check": runtime_check,
        "install_commands": package["summary"]["install_commands"],
        "remaining_gap": remaining_gap,
        "package": package,
    }


def write_openclaw_plugin_validation_report(
    output_root: str | Path | None = None,
    supervisor_url: str = "http://127.0.0.1:8012/api/integrations/openclaw/events",
    *,
    inspect_runtime: bool = False,
) -> dict[str, Any]:
    root = Path(output_root) if output_root else Path(__file__).resolve().parents[1] / "sandbox" / "reports"
    root.mkdir(parents=True, exist_ok=True)
    validation = validate_openclaw_plugin_package(
        output_root=root,
        supervisor_url=supervisor_url,
        inspect_runtime=inspect_runtime,
    )
    json_path = root / "OpenClaw源码级插件包验收报告.json"
    markdown_path = root / "OpenClaw源码级插件包验收报告.md"
    json_path.write_text(json.dumps(validation, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown_path.write_text(build_openclaw_plugin_validation_markdown(validation), encoding="utf-8")
    return {
        "generated_at": validation["generated_at"],
        "json_path": str(json_path.resolve()),
        "markdown_path": str(markdown_path.resolve()),
        "validation": validation,
    }


def build_openclaw_plugin_validation_markdown(validation: dict[str, Any] | None = None) -> str:
    validation = validation or validate_openclaw_plugin_package()
    lines = [
        "# OpenClaw 源码级插件包验收报告",
        "",
        f"生成时间：{validation['generated_at']}",
        f"总体状态：`{validation['overall_status']}`",
        "",
        "## 验收结论",
        "",
        f"- 文件完整性：{'通过' if validation['files_passed'] else '未通过'}",
        f"- 静态 Hook 检查：{'通过' if validation['static_passed'] else '未通过'}",
        f"- JavaScript 语法检查：{'通过' if validation['node_syntax_passed'] else '未通过'}",
        f"- OpenClaw runtime inspect：{'通过' if validation['runtime_inspect_passed'] else '未完成'}",
        "",
        "## 文件检查",
        "",
        "| 文件 | 结果 |",
        "|---|---|",
    ]
    for relative, passed in validation["file_checks"].items():
        lines.append(f"| `{relative}` | {'通过' if passed else '缺失'} |")
    lines.extend(
        [
            "",
            "## 静态检查",
            "",
            "| 检查项 | 结果 |",
            "|---|---|",
        ]
    )
    for key, value in validation["static_checks"].items():
        lines.append(f"| `{key}` | `{value}` |")
    node_check = validation["node_check"]
    runtime_check = validation["openclaw_runtime_check"]
    lines.extend(
        [
            "",
            "## 命令检查",
            "",
            f"- JS 语法命令：`{node_check['command']}`",
            f"- JS 语法结果：{'通过' if node_check['passed'] else '未通过'}",
            f"- OpenClaw 命令：`{runtime_check['command']}`",
            f"- OpenClaw 检查状态：{'已执行' if runtime_check['attempted'] else '未执行'}",
            f"- OpenClaw 检查结果：{'通过' if runtime_check['passed'] else runtime_check.get('skipped_reason') or '未通过'}",
            "",
            "## 安装与真实验收命令",
            "",
            "```powershell",
            *validation["install_commands"],
            "```",
            "",
            "## 剩余缺口",
            "",
        ]
    )
    if validation["remaining_gap"]:
        lines.extend(f"- {gap}" for gap in validation["remaining_gap"])
    else:
        lines.append("- 无。")
    return "\n".join(lines)


def _run_command_check(command: list[str], *, command_label: str, missing_message: str) -> dict[str, Any]:
    executable = shutil.which(command[0]) if command else None
    if not executable:
        return {
            "attempted": False,
            "available": False,
            "passed": None,
            "command": command_label,
            "stdout": "",
            "stderr": missing_message,
            "skipped_reason": missing_message,
        }
    try:
        completed = subprocess.run(
            [executable, *command[1:]],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=20,
            check=False,
        )
    except Exception as exc:  # noqa: BLE001 - validation should report failures, not crash packaging
        return {
            "attempted": True,
            "available": True,
            "passed": False,
            "command": command_label,
            "stdout": "",
            "stderr": str(exc),
            "skipped_reason": "",
        }
    return {
        "attempted": True,
        "available": True,
        "passed": completed.returncode == 0,
        "command": command_label,
        "stdout": completed.stdout.strip(),
        "stderr": completed.stderr.strip(),
        "skipped_reason": "",
    }


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
            "cli": "npm run cli -- demo-external",
            "real_agent_cli": "npm run cli -- external-agent-demo",
            "plugin_cli": "npm run cli -- openclaw-plugin --output backend/sandbox/reports",
            "plugin_validation_cli": "npm run cli -- openclaw-plugin-validate --output backend/sandbox/reports",
            "powershell": "Invoke-RestMethod -Method Post http://127.0.0.1:8012/api/supervisor/batch_evaluate -Body (Get-Content backend/sandbox/examples/openclaw-like-events.json -Raw) -ContentType 'application/json'",
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
            "如使用 OpenClaw 原生接入，运行 `npm run cli -- openclaw-plugin --output backend/sandbox/reports` 生成插件包，再用 `openclaw plugins install -l backend/sandbox/reports/zhian-openclaw-guard` 安装。",
            "运行 `npm run cli -- openclaw-plugin-validate --output backend/sandbox/reports` 生成插件包验收报告；安装 OpenClaw 后可追加 `--inspect-runtime` 获取真实 runtime inspect 结果。",
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


def _openclaw_plugin_package_json() -> str:
    return json.dumps(
        {
            "name": "@zhian-shao/openclaw-guard",
            "version": "0.1.0",
            "private": True,
            "type": "module",
            "description": "Zhian Shao tool-call guard for OpenClaw native plugin hooks.",
            "openclaw": {
                "extensions": ["./src/index.ts"],
                "runtimeExtensions": ["./dist/index.js"],
                "compat": {
                    "pluginApi": ">=2026.3.24-beta.2",
                    "minGatewayVersion": "2026.3.24-beta.2",
                },
            },
            "peerDependencies": {
                "openclaw": "*",
            },
            "files": [
                "dist",
                "src",
                "openclaw.plugin.json",
                "README.md",
            ],
        },
        ensure_ascii=False,
        indent=2,
    )


def _openclaw_plugin_manifest(supervisor_url: str) -> str:
    return json.dumps(
        {
            "id": "zhian-openclaw-guard",
            "name": "智安哨 OpenClaw Guard",
            "description": "在 OpenClaw 工具调用前接入智安哨行为监督器，输出允许、拒绝、询问、隔离决策。",
            "version": "0.1.0",
            "hooks": ["before_tool_call", "after_tool_call"],
            "configSchema": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "supervisorUrl": {
                        "type": "string",
                        "default": supervisor_url,
                        "description": "智安哨 OpenClaw 兼容监督接口。",
                    },
                    "timeoutMs": {
                        "type": "integer",
                        "default": 5000,
                        "minimum": 1000,
                        "maximum": 60000,
                    },
                    "failClosedDecision": {
                        "type": "string",
                        "enum": ["询问", "拒绝"],
                        "default": "询问",
                    },
                    "inspectToolResults": {
                        "type": "boolean",
                        "default": True,
                    },
                },
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def _openclaw_plugin_source(supervisor_url: str) -> str:
    return _openclaw_plugin_runtime(supervisor_url)


def _openclaw_plugin_runtime(supervisor_url: str) -> str:
    return f"""
import {{ definePluginEntry }} from "openclaw/plugin-sdk/plugin-entry";

const DEFAULT_SUPERVISOR_URL = "{supervisor_url}";
const DEFAULT_TIMEOUT_MS = 5_000;

export default definePluginEntry({{
  id: "zhian-openclaw-guard",
  name: "智安哨 OpenClaw Guard",
  description: "Intercepts OpenClaw tool calls and asks Zhian Shao for allow/deny/approval decisions.",
  configSchema: {{
    type: "object",
    additionalProperties: false,
    properties: {{
      supervisorUrl: {{ type: "string", default: DEFAULT_SUPERVISOR_URL }},
      timeoutMs: {{ type: "integer", default: DEFAULT_TIMEOUT_MS, minimum: 1000, maximum: 60000 }},
      failClosedDecision: {{ type: "string", enum: ["询问", "拒绝"], default: "询问" }},
      inspectToolResults: {{ type: "boolean", default: true }}
    }}
  }},
  register(api) {{
    api.on(
      "before_tool_call",
      async (event) => {{
        const config = getConfig(event);
        const supervisorResult = await evaluateToolCall(event, config, "before_tool_call");
        return toOpenClawBeforeToolDecision(supervisorResult, event, config);
      }},
      {{ priority: 100, timeoutMs: DEFAULT_TIMEOUT_MS }},
    );

    api.on(
      "after_tool_call",
      async (event) => {{
        const config = getConfig(event);
        if (config.inspectToolResults === false) {{
          return;
        }}
        await observeToolResult(event, config);
      }},
      {{ priority: 10, timeoutMs: DEFAULT_TIMEOUT_MS }},
    );
  }},
}});

function getConfig(event) {{
  const pluginConfig = event?.context?.pluginConfig ?? {{}};
  return {{
    supervisorUrl: String(pluginConfig.supervisorUrl ?? process.env.ZHIAN_SUPERVISOR_URL ?? DEFAULT_SUPERVISOR_URL),
    timeoutMs: Number(pluginConfig.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    failClosedDecision: String(pluginConfig.failClosedDecision ?? "询问"),
    inspectToolResults: pluginConfig.inspectToolResults !== false,
  }};
}}

async function evaluateToolCall(event, config, phase) {{
  const payload = buildSupervisorPayload(event, phase);
  try {{
    return await postJson(config.supervisorUrl, payload, config.timeoutMs);
  }} catch (error) {{
    return {{
      decision: config.failClosedDecision === "拒绝" ? "拒绝" : "询问",
      risk_level: "high",
      policy_id: "openclaw-plugin-supervisor-unavailable",
      reason: `智安哨监督器不可用，按 fail-closed 策略处理：${{error instanceof Error ? error.message : String(error)}}`,
      recommendation: "暂停自动工具调用，确认智安哨 API 服务是否运行。",
    }};
  }}
}}

async function observeToolResult(event, config) {{
  const payload = buildSupervisorPayload(event, "after_tool_call");
  payload.model_output = stringifyBounded(event?.result ?? event?.error ?? "", 2000);
  payload.tool_call.observed_result = {{
    ok: !event?.error,
    duration_ms: event?.durationMs ?? event?.duration_ms ?? null,
  }};
  try {{
    await postJson(config.supervisorUrl, payload, Math.min(config.timeoutMs, 3000));
  }} catch {{
    // after_tool_call is observation-only. Do not change the OpenClaw run if audit export fails.
  }}
}}

function buildSupervisorPayload(event, phase) {{
  const toolName = String(event?.toolName ?? event?.tool_name ?? event?.name ?? "unknown");
  const params = event?.params ?? event?.arguments ?? event?.input ?? {{}};
  const context = event?.context ?? {{}};
  return {{
    conversation_id: String(context.sessionKey ?? event?.sessionId ?? event?.conversationId ?? "openclaw-session"),
    agent_id: String(context.agentId ?? event?.agentId ?? "openclaw-agent"),
    agent_role: String(context.agentRole ?? event?.agentRole ?? "executor"),
    source_app: "OpenClaw",
    model_input: stringifyBounded(event?.prompt ?? event?.modelInput ?? event?.inputText ?? "", 2000),
    model_output: stringifyBounded(event?.modelOutput ?? event?.assistantMessage ?? "", 2000),
    tool_call: {{
      tool: normalizeTool(toolName),
      arguments: params && typeof params === "object" ? params : {{ value: params }},
      risk_hint: inferRiskHint(toolName, params),
      openclaw_tool_name: toolName,
      openclaw_phase: phase,
      openclaw_run_id: context.runId ?? event?.runId ?? null,
    }},
    context_sources: ["openclaw", "plugin", phase],
    guard_enabled: true,
    execute_in_sandbox: false,
  }};
}}

function toOpenClawBeforeToolDecision(result, event, config) {{
  const decision = String(result?.decision ?? "询问");
  if (decision === "允许") {{
    return undefined;
  }}
  const reason = formatReason(result);
  if (decision === "拒绝") {{
    return {{
      block: true,
      blockReason: reason,
      metadata: buildDecisionMetadata(result),
    }};
  }}
  return {{
    requireApproval: {{
      title: decision === "隔离" ? "隔离执行高风险工具" : "确认 OpenClaw 工具调用",
      description: reason,
      severity: decision === "隔离" ? "warning" : "info",
      timeoutMs: 60_000,
      timeoutBehavior: "deny",
      metadata: buildDecisionMetadata(result),
    }},
  }};
}}

function buildDecisionMetadata(result) {{
  return {{
    source: "zhian-shao",
    run_id: result?.run_id,
    audit_id: result?.audit_id,
    policy_id: result?.policy_id,
    risk_level: result?.risk_level,
    risk_score: result?.risk_score,
    anomaly_score: result?.anomaly_score,
  }};
}}

function formatReason(result) {{
  const policy = result?.policy_id ? `策略 ${{result.policy_id}}` : "智安哨策略";
  const score = Number.isFinite(Number(result?.risk_score)) ? `，风险分 ${{result.risk_score}}` : "";
  const anomaly = Number.isFinite(Number(result?.anomaly_score)) ? `，异常分 ${{result.anomaly_score}}` : "";
  const reason = result?.reason ? String(result.reason) : "工具调用需要安全复核。";
  const recommendation = result?.recommendation ? ` 建议：${{result.recommendation}}` : "";
  return `${{policy}}${{score}}${{anomaly}}：${{reason}}${{recommendation}}`;
}}

async function postJson(url, payload, timeoutMs) {{
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {{
    const response = await fetch(url, {{
      method: "POST",
      headers: {{ "Content-Type": "application/json" }},
      body: JSON.stringify(payload),
      signal: controller.signal,
    }});
    if (!response.ok) {{
      throw new Error(`HTTP ${{response.status}} ${{await response.text()}}`);
    }}
    return await response.json();
  }} finally {{
    clearTimeout(timer);
  }}
}}

function normalizeTool(toolName) {{
  const lowered = String(toolName).toLowerCase();
  if ((lowered.includes("file") || lowered.includes("fs")) && lowered.includes("read")) return "file.read";
  if ((lowered.includes("file") || lowered.includes("fs")) && lowered.includes("write")) return "file.write";
  if (lowered.includes("mail") || lowered.includes("email") || lowered.includes("send_message")) return "mail.send";
  if (lowered.includes("exec") || lowered.includes("shell") || lowered.includes("terminal") || lowered.includes("bash") || lowered.includes("powershell")) return "code.run";
  if (lowered.includes("memory") && lowered.includes("write")) return "memory.write";
  if (lowered.includes("memory") && lowered.includes("read")) return "memory.read";
  if (lowered.includes("env")) return "env.read";
  if (lowered.includes("api") || lowered.includes("http") || lowered.includes("fetch") || lowered.includes("web") || lowered.includes("browser")) return "api.call";
  return toolName;
}}

function inferRiskHint(toolName, params) {{
  const lowered = `${{toolName}} ${{stringifyBounded(params, 1000)}}`.toLowerCase();
  if (lowered.includes("confidential") || lowered.includes("secret") || lowered.includes("token")) return "sensitive_file";
  if (lowered.includes("external") || lowered.includes("@") || lowered.includes("http://") || lowered.includes("https://")) return "external_target";
  if (lowered.includes("bulk") || lowered.includes("export") || lowered.includes("all")) return "bulk_export";
  if (lowered.includes("rm ") || lowered.includes("del ") || lowered.includes("curl ") || lowered.includes("wget ")) return "dangerous_command";
  return "openclaw_tool_call";
}}

function stringifyBounded(value, maxLength) {{
  let text;
  try {{
    text = typeof value === "string" ? value : JSON.stringify(value);
  }} catch {{
    text = String(value);
  }}
  if (!text) return "";
  return text.length > maxLength ? `${{text.slice(0, maxLength)}}...` : text;
}}
""".strip()


def _openclaw_plugin_readme(supervisor_url: str) -> str:
    return f"""
# 智安哨 OpenClaw Guard

这是一个 OpenClaw native plugin。它在 OpenClaw 工具执行前注册 `before_tool_call`，把工具名、参数、上下文和运行标识发送到智安哨监督器，再把智安哨的 `允许 / 拒绝 / 询问 / 隔离` 映射为 OpenClaw 的放行、阻断或人工审批。

## 安装

```powershell
openclaw plugins install -l ./zhian-openclaw-guard
openclaw plugins inspect zhian-openclaw-guard --runtime --json
openclaw plugins enable zhian-openclaw-guard
```

## 配置

默认监督接口：

```text
{supervisor_url}
```

也可以通过 OpenClaw 插件配置或环境变量覆盖：

```powershell
$env:ZHIAN_SUPERVISOR_URL="http://127.0.0.1:8012/api/integrations/openclaw/events"
```

## 验收

1. 启动智安哨后端：`npm run api`
2. 安装并启用本插件。
3. 让 OpenClaw 执行文件读取、邮件发送、API 调用或代码执行工具。
4. 在智安哨页面查看审计日志、告警、策略命中、risk_score、anomaly_score 和 audit_hash。

## 安全默认值

- 智安哨不可用时 fail-closed，默认进入人工确认。
- `拒绝` 映射为 OpenClaw block。
- `询问` 和 `隔离` 映射为 OpenClaw requireApproval，超时拒绝。
- `after_tool_call` 只做审计观察，不改变 OpenClaw 运行结果。
""".strip()


def _load_sample_events() -> list[dict[str, Any]]:
    sample_path = Path(__file__).resolve().parents[1] / "sandbox" / "examples" / "openclaw-like-events.json"
    try:
        data = json.loads(sample_path.read_text(encoding="utf-8"))
    except OSError:
        return []
    return data if isinstance(data, list) else []
