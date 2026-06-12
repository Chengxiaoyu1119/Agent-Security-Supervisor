from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
RUNTIME_DIR = BASE_DIR / "runtime"
DB_PATH = RUNTIME_DIR / "zhian.sqlite3"


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


def write_run(result: dict[str, Any]) -> None:
    with get_connection() as conn:
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
