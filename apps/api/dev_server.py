from __future__ import annotations

import os

import uvicorn


def main() -> None:
    os.environ.setdefault("AGENT_SUPERVISOR_AUTH_DISABLED", "true")
    host = os.getenv("AGENT_SUPERVISOR_API_HOST", "127.0.0.1")
    port = int(os.getenv("AGENT_SUPERVISOR_API_PORT", "8012"))
    uvicorn.run("apps.api.agent_supervisor.main:app", host=host, port=port)


if __name__ == "__main__":
    main()
