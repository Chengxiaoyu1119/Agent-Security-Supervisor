from pydantic import BaseModel
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
