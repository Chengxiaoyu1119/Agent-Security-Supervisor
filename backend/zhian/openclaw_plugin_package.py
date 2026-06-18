from __future__ import annotations

import json
import shutil
import subprocess
import threading
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .openclaw_plugin_templates import (
    _openclaw_plugin_manifest,
    _openclaw_plugin_package_json,
    _openclaw_plugin_readme,
    _openclaw_plugin_runtime,
    _openclaw_plugin_source,
)


OPENCLAW_PLUGIN_PACKAGE_LOCK = threading.Lock()


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
