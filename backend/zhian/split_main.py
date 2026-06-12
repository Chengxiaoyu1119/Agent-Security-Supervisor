import os
import re

main_path = r'C:\Users\Chengxiaoyu\Documents\GitHub\Net data intelligence security\backend\zhian\main.py'
with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

parts = re.split(r'\n(?=@app\.)', content)

header = parts[0]
endpoints = parts[1:]

core_routes = []
scenarios_routes = []
eval_routes = []
integration_routes = []

for ep in endpoints:
    if '/api/integrations/openclaw' in ep or '/api/supervisor' in ep:
        integration_routes.append(ep)
    elif '/api/evaluations' in ep or '/api/report' in ep or '/api/submission_package' in ep or '/api/approvals' in ep or '/api/readiness' in ep or '/api/project_roadmap' in ep or '/api/demo_drill' in ep or '/api/attack_surfaces' in ep or '/api/datasets' in ep:
        eval_routes.append(ep)
    elif '/api/run' in ep or '/api/compare' in ep or '/api/batch_compare' in ep or '/api/attack_chains' in ep or '/api/scenarios' in ep:
        scenarios_routes.append(ep)
    else:
        core_routes.append(ep)

routers_dir = r'C:\Users\Chengxiaoyu\Documents\GitHub\Net data intelligence security\backend\zhian\routers'
os.makedirs(routers_dir, exist_ok=True)

def fix_router(eps):
    res = []
    for ep in eps:
        ep = re.sub(r'@app\.(get|post|patch|delete|put)', r'@router.\1', ep)
        res.append(ep)
    return '\n' + '\n'.join(res)

import_header = """from fastapi import APIRouter, HTTPException, Response, Body
from pydantic import BaseModel
from typing import Any
from .. import data
from ..database import latest_runs, load_run, latest_audit_logs
from ..model_adapter import provider_status
from ..agents import *
from ..attack_chains import *
from ..supervisor import *
from ..events import *
from ..readiness import *
from ..roadmap import *
from ..demo_drill import *
from ..calibration import *
from ..ablation import *
from ..assessment import *
from ..services.package_service import *
from ..openclaw_adapter import *
from ..surface_pack import *
from ..benign import *
from ..benign_workflows import *
from ..datasets import *
from ..approvals import *
from ..integrity import *
from ..main_models import *

router = APIRouter()
"""

models_code = """from pydantic import BaseModel
from typing import Any
class RunRequest(BaseModel):
    scenario_id: str
    guard_enabled: bool = True

class PolicyUpdate(BaseModel):
    enabled: bool

class BatchCompareRequest(BaseModel):
    scenario_ids: list[str] | None = None

class AttackChainRunRequest(BaseModel):
    guard_enabled: bool = True

class AgentToolEvent(BaseModel):
    conversation_id: str = "demo-conversation"
    agent_id: str = "target-agent"
    agent_role: str = "target-agent"
    source_app: str = "generic-agent"
    model_input: str = ""
    model_output: str = ""
    tool_call: dict[str, Any]
    context_sources: list[str] = []
    guard_enabled: bool = True
    execute_in_sandbox: bool = False

class BatchAgentToolEvents(BaseModel):
    events: list[AgentToolEvent]
    guard_enabled: bool = True
    execute_in_sandbox: bool = False

class ApprovalDecisionRequest(BaseModel):
    action: str
    operator: str = "operator"
    comment: str = ""
    execute_in_sandbox: bool = False
"""
with open(r'C:\Users\Chengxiaoyu\Documents\GitHub\Net data intelligence security\backend\zhian\main_models.py', 'w', encoding='utf-8') as f:
    f.write(models_code)

with open(os.path.join(routers_dir, 'core.py'), 'w', encoding='utf-8') as f:
    f.write(import_header + fix_router(core_routes))
with open(os.path.join(routers_dir, 'scenarios.py'), 'w', encoding='utf-8') as f:
    f.write(import_header + fix_router(scenarios_routes))
with open(os.path.join(routers_dir, 'evaluations.py'), 'w', encoding='utf-8') as f:
    f.write(import_header + fix_router(eval_routes))
with open(os.path.join(routers_dir, 'integrations.py'), 'w', encoding='utf-8') as f:
    f.write(import_header + fix_router(integration_routes))

new_main = """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .tools import init_sandbox
from .routers import core, scenarios, evaluations, integrations

app = FastAPI(title="智安哨 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5178", "http://localhost:5178"],
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
"""
with open(main_path, 'w', encoding='utf-8') as f:
    f.write(new_main)

with open(os.path.join(routers_dir, '__init__.py'), 'w') as f:
    f.write('')

print('main.py successfully split into routers.')
