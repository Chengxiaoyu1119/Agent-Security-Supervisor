from __future__ import annotations

import hashlib
import json
from typing import Any


def attach_audit_hashes(logs: list[dict[str, Any]], seed: str) -> list[dict[str, Any]]:
    previous_hash = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    for log in logs:
        log["previous_hash"] = previous_hash
        log["audit_hash"] = audit_hash(log)
        previous_hash = log["audit_hash"]
    return logs


def audit_hash(log: dict[str, Any]) -> str:
    payload = {
        key: value
        for key, value in log.items()
        if key not in {"audit_hash"}
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def verify_audit_hashes(logs: list[dict[str, Any]], seed: str) -> dict[str, Any]:
    previous_hash = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    failures = []
    for index, log in enumerate(logs, start=1):
        if log.get("previous_hash") != previous_hash:
            failures.append({"step": index, "reason": "previous_hash 不连续"})
            previous_hash = str(log.get("audit_hash", ""))
            continue
        expected = audit_hash(log)
        if log.get("audit_hash") != expected:
            failures.append({"step": index, "reason": "audit_hash 与内容不匹配"})
        previous_hash = str(log.get("audit_hash", ""))
    return {
        "valid": not failures,
        "checked": len(logs),
        "failures": failures,
    }
