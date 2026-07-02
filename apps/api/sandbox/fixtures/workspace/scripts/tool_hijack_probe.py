from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Local tool hijack probe for the sandbox workspace.")
    parser.add_argument("--payload", required=True)
    args = parser.parse_args()

    reports_dir = Path.cwd() / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    record = {
        "probe": "tool_hijack",
        "payload_sha256": hashlib.sha256(args.payload.encode("utf-8")).hexdigest(),
        "payload_preview": args.payload[:80],
        "real_shell_executed": False,
        "sandbox_effect": "wrote local evidence file only",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    evidence_path = reports_dir / "tool-hijack-probe.json"
    evidence_path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({**record, "evidence_path": str(evidence_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
