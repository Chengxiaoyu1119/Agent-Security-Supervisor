from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from .database import get_connection
from .tools import execute_tool


BASE_DIR = Path(__file__).resolve().parents[1]
REPORT_ROOT = BASE_DIR / "sandbox" / "reports"

PENDING_STATUS = "待复核"
APPROVED_STATUS = "已批准"
REJECTED_STATUS = "已驳回"

STATUS_VALUES = {PENDING_STATUS, APPROVED_STATUS, REJECTED_STATUS}
ACTION_MAP = {
    "approve": (APPROVED_STATUS, "允许", "人工批准后，上游比赛平台仍应按最小权限重新执行工具调用。"),
    "批准": (APPROVED_STATUS, "允许", "人工批准后，上游比赛平台仍应按最小权限重新执行工具调用。"),
    "reject": (REJECTED_STATUS, "拒绝", "人工驳回后，工具调用保持阻断，建议补充赛事授权或改用脱敏结果。"),
    "驳回": (REJECTED_STATUS, "拒绝", "人工驳回后，工具调用保持阻断，建议补充赛事授权或改用脱敏结果。"),
}


def create_approval_review(event: dict[str, Any], supervisor_result: dict[str, Any]) -> dict[str, Any] | None:
    """Create a review ticket for decisions that require human confirmation."""
    if supervisor_result.get("decision") != "询问":
        return None

    audit_log = supervisor_result.get("audit_log") or {}
    if not audit_log.get("id"):
        return None

    existing = _load_review_by_audit_id(str(audit_log["id"]))
    if existing:
        return existing

    tool_call = event.get("tool_call") or {}
    created_at = _now()
    review = {
        "id": str(uuid4()),
        "audit_id": str(audit_log["id"]),
        "run_id": str(supervisor_result.get("run_id", audit_log.get("run_id", ""))),
        "status": PENDING_STATUS,
        "final_decision": "等待人工确认",
        "approval_action": "",
        "tool": str(audit_log.get("tool", tool_call.get("tool", ""))),
        "arguments": tool_call.get("arguments", audit_log.get("arguments", {})),
        "policy_id": str(supervisor_result.get("policy_id", audit_log.get("policy_id", ""))),
        "risk_level": str(supervisor_result.get("risk_level", audit_log.get("risk_level", "medium"))),
        "risk_score": supervisor_result.get("risk_score", audit_log.get("risk_score", 0)),
        "risk_factors": supervisor_result.get("risk_factors", audit_log.get("risk_factors", [])),
        "anomaly_score": supervisor_result.get("anomaly_score", audit_log.get("anomaly_score", 0)),
        "anomaly_signals": supervisor_result.get("anomaly_signals", audit_log.get("anomaly_signals", [])),
        "reason": str(supervisor_result.get("reason", audit_log.get("reason", ""))),
        "recommendation": str(supervisor_result.get("recommendation", audit_log.get("recommendation", ""))),
        "source_app": str(event.get("source_app", audit_log.get("source_app", "generic-agent"))),
        "agent_id": str(event.get("agent_id", audit_log.get("agent_id", "external-agent"))),
        "conversation_id": str(event.get("conversation_id", audit_log.get("conversation_id", "external-conversation"))),
        "model_input_excerpt": str(event.get("model_input", ""))[:360],
        "model_output_excerpt": str(event.get("model_output", ""))[:360],
        "audit_hash": str(audit_log.get("audit_hash", "")),
        "previous_hash": str(audit_log.get("previous_hash", "")),
        "review_previous_hash": str(audit_log.get("audit_hash", "")),
        "operator": "",
        "comment": "",
        "created_at": created_at,
        "reviewed_at": "",
        "execution_note": "监督器已暂停该工具调用，等待人工确认后由上游比赛平台决定是否重新发起。",
        "sandbox_replay_requested": False,
        "sandbox_replayed_at": "",
        "sandbox_replay": None,
        "hash_valid": True,
    }
    review["review_hash"] = _review_hash(review)
    _write_review(review)
    return review


def list_approval_reviews(status: str | None = None, limit: int = 100) -> dict[str, Any]:
    selected_status = _normalize_status(status)
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT payload FROM approval_reviews ORDER BY rowid DESC LIMIT ?",
            (limit,),
        ).fetchall()

    reviews = [_restore_hash_state(json.loads(row["payload"])) for row in rows]
    if selected_status:
        reviews = [item for item in reviews if item.get("status") == selected_status]

    all_reviews = reviews if selected_status else [_restore_hash_state(json.loads(row["payload"])) for row in rows]
    summary = _summary(all_reviews)
    return {
        "generated_at": _now(),
        "status_filter": selected_status or "全部",
        "summary": summary,
        "reviews": reviews,
    }


def decide_approval_review(
    review_id: str,
    action: str,
    operator: str = "operator",
    comment: str = "",
    execute_in_sandbox: bool = False,
) -> dict[str, Any]:
    review = _load_review(review_id)
    if not review:
        raise KeyError(review_id)

    normalized_action = action.strip().lower() if action else ""
    if normalized_action not in ACTION_MAP:
        raise ValueError("action 必须是 approve/reject，或中文“批准/驳回”")

    status, final_decision, execution_note = ACTION_MAP[normalized_action]
    sandbox_replay = review.get("sandbox_replay")
    sandbox_replayed_at = review.get("sandbox_replayed_at", "")
    execution_note = execution_note
    if status == APPROVED_STATUS and execute_in_sandbox:
        sandbox_replayed_at = _now()
        try:
            sandbox_replay = execute_tool(
                {
                    "tool": review["tool"],
                    "arguments": review.get("arguments", {}),
                },
                "允许",
            )
            execution_note = "人工批准后已在本地沙箱重放工具调用；不会触达真实比赛平台。"
        except Exception as exc:  # noqa: BLE001 - persisted as review evidence
            sandbox_replay = {
                "executed": False,
                "sandboxed": True,
                "output": f"沙箱重放失败：{exc}",
            }
            execution_note = "人工批准后尝试沙箱重放，但执行失败；真实比赛平台仍需重新发起并按最小权限执行。"

    updated = {
        **review,
        "status": status,
        "final_decision": final_decision,
        "approval_action": normalized_action,
        "operator": operator or "operator",
        "comment": comment,
        "reviewed_at": _now(),
        "execution_note": execution_note,
        "sandbox_replay_requested": bool(execute_in_sandbox),
        "sandbox_replayed_at": sandbox_replayed_at,
        "sandbox_replay": sandbox_replay,
    }
    updated["review_hash"] = _review_hash(updated)
    updated["hash_valid"] = True
    _write_review(updated)
    return {
        "updated": True,
        "review": updated,
        "summary": list_approval_reviews()["summary"],
    }


def build_approval_review_markdown(data: dict[str, Any] | None = None) -> str:
    data = data or list_approval_reviews(limit=200)
    summary = data["summary"]
    lines = [
        "# 人工复核队列与审批闭环报告",
        "",
        "本报告记录监督器判定为“询问”的工具调用。每条复核单都关联原始审计 hash，并在批准或驳回后生成新的 review_hash，便于答辩时证明人工处置没有脱离证据链。",
        "",
        "## 队列概览",
        "",
        f"- 复核单总数：{summary['total']}",
        f"- 待复核：{summary['pending_count']}",
        f"- 已批准：{summary['approved_count']}",
        f"- 已驳回：{summary['rejected_count']}",
        f"- 高危/极高：{summary['high_risk_count']}",
        f"- hash 有效：{summary['hash_valid_count']} / {summary['total']}",
        "",
        "## 复核明细",
        "",
        "| 时间 | 状态 | 工具 | 策略 | 风险 | 操作人 | 结论 | 证据 |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for item in data["reviews"]:
        lines.append(
            "| {created_at} | {status} | `{tool}` | `{policy_id}` | {risk_level}/{risk_score} | {operator} | {final_decision} | {reason} |".format(
                created_at=str(item.get("created_at", ""))[:19].replace("T", " "),
                status=item.get("status", ""),
                tool=item.get("tool", ""),
                policy_id=item.get("policy_id", ""),
                risk_level=item.get("risk_level", ""),
                risk_score=item.get("risk_score", "-"),
                operator=item.get("operator") or "-",
                final_decision=item.get("final_decision") or "-",
                reason=str(item.get("reason", "")).replace("\n", " ")[:120],
            )
        )

    if not data["reviews"]:
        lines.append("| - | - | - | - | - | - | - | 当前没有复核单。 |")

    lines.extend(
        [
            "",
            "## 验收口径",
            "",
            "- 外部智能体调用 `/api/supervisor/evaluate` 后，如果策略返回“询问”，系统自动生成待复核单。",
            "- 监督端可以通过 `/api/approvals/{review_id}/decision` 执行批准或驳回。",
            "- 审批结论、操作人、备注、原始审计 hash 和复核 hash 都会写入本地数据库。",
        ]
    )
    return "\n".join(lines)


def write_approval_review_report(output_root: str | Path | None = None) -> dict[str, Any]:
    root = Path(output_root) if output_root else REPORT_ROOT
    root.mkdir(parents=True, exist_ok=True)
    data = list_approval_reviews(limit=200)
    json_path = root / "人工复核队列报告.json"
    markdown_path = root / "人工复核队列报告.md"
    json_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown_path.write_text(build_approval_review_markdown(data), encoding="utf-8")
    return {
        "generated_at": data["generated_at"],
        "json_path": str(json_path.resolve()),
        "markdown_path": str(markdown_path.resolve()),
        "summary": data["summary"],
        "reviews": data["reviews"],
    }


def _write_review(review: dict[str, Any]) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO approval_reviews (
                id, audit_id, run_id, status, final_decision, tool, policy_id,
                risk_level, risk_score, reason, operator, created_at,
                reviewed_at, payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                review["id"],
                review["audit_id"],
                review["run_id"],
                review["status"],
                review["final_decision"],
                review["tool"],
                review["policy_id"],
                review["risk_level"],
                int(review.get("risk_score") or 0),
                review["reason"],
                review.get("operator", ""),
                review["created_at"],
                review.get("reviewed_at", ""),
                json.dumps(review, ensure_ascii=False),
            ),
        )


def _load_review(review_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("SELECT payload FROM approval_reviews WHERE id = ?", (review_id,)).fetchone()
    return _restore_hash_state(json.loads(row["payload"])) if row else None


def _load_review_by_audit_id(audit_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("SELECT payload FROM approval_reviews WHERE audit_id = ?", (audit_id,)).fetchone()
    return _restore_hash_state(json.loads(row["payload"])) if row else None


def _restore_hash_state(review: dict[str, Any]) -> dict[str, Any]:
    review["hash_valid"] = review.get("review_hash") == _review_hash(review)
    return review


def _review_hash(review: dict[str, Any]) -> str:
    payload = {key: value for key, value in review.items() if key not in {"review_hash", "hash_valid"}}
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def _summary(reviews: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "total": len(reviews),
        "pending_count": sum(1 for item in reviews if item.get("status") == PENDING_STATUS),
        "approved_count": sum(1 for item in reviews if item.get("status") == APPROVED_STATUS),
        "rejected_count": sum(1 for item in reviews if item.get("status") == REJECTED_STATUS),
        "high_risk_count": sum(1 for item in reviews if item.get("risk_level") in {"high", "critical"}),
        "hash_valid_count": sum(1 for item in reviews if item.get("hash_valid")),
        "latest_created_at": max((str(item.get("created_at", "")) for item in reviews), default=""),
        "latest_reviewed_at": max((str(item.get("reviewed_at", "")) for item in reviews if item.get("reviewed_at")), default=""),
    }


def _normalize_status(status: str | None) -> str | None:
    if not status or status == "全部":
        return None
    if status not in STATUS_VALUES:
        raise ValueError(f"未知复核状态：{status}")
    return status


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
