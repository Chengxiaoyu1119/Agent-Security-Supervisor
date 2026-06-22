from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any

from .paths import RUNTIME_DIR

DB_PATH = RUNTIME_DIR / "agent_supervisor.sqlite3"


def get_connection() -> sqlite3.Connection:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS experiment_runs (
                id TEXT PRIMARY KEY,
                scenario_id TEXT NOT NULL,
                guard_enabled INTEGER NOT NULL,
                attack_success INTEGER NOT NULL,
                blocked_count INTEGER NOT NULL,
                asked_count INTEGER NOT NULL,
                isolated_count INTEGER NOT NULL,
                detection_latency_ms INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                tool TEXT NOT NULL,
                decision TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                reason TEXT NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                decision TEXT NOT NULL,
                evidence TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS approval_reviews (
                id TEXT PRIMARY KEY,
                audit_id TEXT NOT NULL UNIQUE,
                run_id TEXT NOT NULL,
                status TEXT NOT NULL,
                final_decision TEXT NOT NULL,
                tool TEXT NOT NULL,
                policy_id TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                reason TEXT NOT NULL,
                operator TEXT NOT NULL,
                created_at TEXT NOT NULL,
                reviewed_at TEXT NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )
        _ensure_governance_tables(conn)


def _ensure_governance_tables(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS policy_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_id TEXT NOT NULL,
            operator TEXT NOT NULL,
            comment TEXT NOT NULL,
            created_at TEXT NOT NULL,
            before_payload TEXT NOT NULL,
            after_payload TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS runtime_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            payload TEXT NOT NULL
        )
        """
    )


def write_run(result: dict[str, Any]) -> None:
    with get_connection() as conn:
        _ensure_governance_tables(conn)
        conn.execute(
            """
            INSERT OR REPLACE INTO experiment_runs (
                id, scenario_id, guard_enabled, attack_success, blocked_count,
                asked_count, isolated_count, detection_latency_ms, created_at, payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                result["run_id"],
                result["scenario"]["id"],
                int(result["guard_enabled"]),
                int(result["attack_success"]),
                result["metrics"]["blocked_count"],
                result["metrics"]["asked_count"],
                result["metrics"]["isolated_count"],
                result["metrics"]["detection_latency_ms"],
                result["created_at"],
                json.dumps(result, ensure_ascii=False),
            ),
        )
        for log in result["audit_logs"]:
            conn.execute(
                """
                INSERT OR REPLACE INTO audit_logs (
                    id, run_id, tool, decision, risk_level, reason, payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    log["id"],
                    result["run_id"],
                    log["tool"],
                    log["decision"],
                    log["risk_level"],
                    log["reason"],
                    json.dumps(log, ensure_ascii=False),
                ),
            )
        for alert in result["alerts"]:
            conn.execute(
                """
                INSERT OR REPLACE INTO alerts (
                    id, run_id, severity, title, decision, evidence, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    alert["id"],
                    result["run_id"],
                    alert["severity"],
                    alert["title"],
                    alert["decision"],
                    alert["evidence"],
                    alert["created_at"],
                ),
            )
        conn.execute(
            """
            INSERT INTO runtime_events (event_type, created_at, payload)
            VALUES (?, ?, ?)
            """,
            (
                "run",
                result["created_at"],
                json.dumps(
                    {
                        "run_id": result["run_id"],
                        "scenario_id": result.get("scenario", {}).get("id", ""),
                        "guard_enabled": result.get("guard_enabled", False),
                        "attack_success": result.get("attack_success", False),
                        "metrics": result.get("metrics", {}),
                    },
                    ensure_ascii=False,
                ),
            ),
        )


def latest_runs(limit: int = 20) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT payload FROM experiment_runs ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [json.loads(row["payload"]) for row in rows]


def load_run(run_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute("SELECT payload FROM experiment_runs WHERE id = ?", (run_id,)).fetchone()
    return json.loads(row["payload"]) if row else None


def latest_audit_logs(limit: int = 100) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT payload FROM audit_logs ORDER BY rowid DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [json.loads(row["payload"]) for row in rows]


def record_policy_version(
    *,
    policy_id: str,
    before: dict[str, Any],
    after: dict[str, Any],
    operator: str = "security-admin",
    comment: str = "",
) -> dict[str, Any]:
    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        _ensure_governance_tables(conn)
        cursor = conn.execute(
            """
            INSERT INTO policy_versions (
                policy_id, operator, comment, created_at, before_payload, after_payload
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                policy_id,
                operator or "security-admin",
                comment,
                created_at,
                json.dumps(before, ensure_ascii=False),
                json.dumps(after, ensure_ascii=False),
            ),
        )
    return {
        "id": cursor.lastrowid,
        "policy_id": policy_id,
        "operator": operator or "security-admin",
        "comment": comment,
        "created_at": created_at,
        "before": before,
        "after": after,
    }


def list_policy_versions(policy_id: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
    query = """
        SELECT id, policy_id, operator, comment, created_at, before_payload, after_payload
        FROM policy_versions
    """
    params: tuple[Any, ...]
    if policy_id:
        query += " WHERE policy_id = ?"
        params = (policy_id, limit)
    else:
        params = (limit,)
    query += " ORDER BY id DESC LIMIT ?"
    with get_connection() as conn:
        _ensure_governance_tables(conn)
        rows = conn.execute(query, params).fetchall()
    return [
        {
            "id": row["id"],
            "policy_id": row["policy_id"],
            "operator": row["operator"],
            "comment": row["comment"],
            "created_at": row["created_at"],
            "before": json.loads(row["before_payload"]),
            "after": json.loads(row["after_payload"]),
        }
        for row in rows
    ]


def runtime_metrics_snapshot(limit: int = 500) -> dict[str, Any]:
    runs = latest_runs(limit)
    audit_logs = latest_audit_logs(limit)
    with get_connection() as conn:
        _ensure_governance_tables(conn)
        review_rows = conn.execute(
            "SELECT status, risk_level, reviewed_at FROM approval_reviews ORDER BY rowid DESC LIMIT ?",
            (limit,),
        ).fetchall()
        policy_version_count = conn.execute("SELECT COUNT(*) AS count FROM policy_versions").fetchone()["count"]
    latencies = [
        float(run.get("metrics", {}).get("detection_latency_ms", 0))
        for run in runs
        if run.get("metrics", {}).get("detection_latency_ms") is not None
    ]
    controlled = [
        run
        for run in runs
        if run.get("metrics", {}).get("blocked_count", 0)
        or run.get("metrics", {}).get("asked_count", 0)
        or run.get("metrics", {}).get("isolated_count", 0)
    ]
    decisions: dict[str, int] = {}
    policies: dict[str, int] = {}
    tools: dict[str, int] = {}
    for log in audit_logs:
        decisions[str(log.get("decision", "unknown"))] = decisions.get(str(log.get("decision", "unknown")), 0) + 1
        policies[str(log.get("policy_id", "unknown"))] = policies.get(str(log.get("policy_id", "unknown")), 0) + 1
        tools[str(log.get("tool", "unknown"))] = tools.get(str(log.get("tool", "unknown")), 0) + 1
    pending_reviews = sum(1 for row in review_rows if row["status"] == "待复核")
    resolved_reviews = sum(1 for row in review_rows if row["status"] in {"已批准", "已驳回"})
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "window": {"run_limit": limit, "audit_limit": limit},
        "summary": {
            "run_count": len(runs),
            "controlled_count": len(controlled),
            "control_rate": round((len(controlled) / len(runs)) * 100) if runs else 0,
            "attack_success_count": sum(1 for run in runs if run.get("attack_success")),
            "avg_detection_latency_ms": round(sum(latencies) / len(latencies), 2) if latencies else 0,
            "max_detection_latency_ms": round(max(latencies), 2) if latencies else 0,
            "audit_log_count": len(audit_logs),
            "pending_review_count": pending_reviews,
            "resolved_review_count": resolved_reviews,
            "policy_version_count": int(policy_version_count),
        },
        "decision_distribution": decisions,
        "policy_hit_distribution": policies,
        "tool_distribution": tools,
    }
