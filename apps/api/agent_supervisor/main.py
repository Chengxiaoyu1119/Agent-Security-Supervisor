import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import core, evaluations, integrations, scenarios
from .tools import init_sandbox

app = FastAPI(title="智安哨 API", version="0.1.0")


def _cors_origins() -> list[str]:
    configured = os.getenv("AGENT_SUPERVISOR_CORS_ORIGINS", "")
    if configured.strip():
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return ["http://127.0.0.1:5178", "http://localhost:5178"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup() -> None:
    init_db()
    init_sandbox()

app.include_router(core.router)
app.include_router(scenarios.router)
app.include_router(evaluations.router)
app.include_router(integrations.router)
