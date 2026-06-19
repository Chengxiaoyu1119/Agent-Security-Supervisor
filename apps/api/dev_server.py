from __future__ import annotations

import os

import uvicorn


def main() -> None:
    os.environ.setdefault("AGENT_SUPERVISOR_AUTH_DISABLED", "true")
    uvicorn.run("apps.api.agent_supervisor.main:app", host="127.0.0.1", port=8012)


if __name__ == "__main__":
    main()
