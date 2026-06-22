from typing import Any, Literal

from pydantic import BaseModel, Field


class RunRequest(BaseModel):
    scenario_id: str = Field(..., max_length=120)
    guard_enabled: bool = True


class PolicyUpdate(BaseModel):
    enabled: bool | None = None
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    decision: Literal["允许", "拒绝", "询问", "隔离"] | None = None
    layer: str | None = Field(default=None, max_length=80)
    risk_controls: list[str] | None = Field(default=None, max_length=20)
    operator: str = Field(default="security-admin", max_length=80)
    comment: str = Field(default="", max_length=500)


class PolicySettingsUpdate(BaseModel):
    anomaly_review_threshold: int | None = Field(default=None, ge=1, le=100)
    anomaly_reject_threshold: int | None = Field(default=None, ge=1, le=100)
    approval_sla_minutes: int | None = Field(default=None, ge=1, le=1440)
    high_risk_auto_escalation: bool | None = None
    operator: str = Field(default="security-admin", max_length=80)
    comment: str = Field(default="", max_length=500)


class BatchCompareRequest(BaseModel):
    scenario_ids: list[str] | None = Field(default=None, max_length=100)


class AttackChainRunRequest(BaseModel):
    guard_enabled: bool = True


class AgentToolEvent(BaseModel):
    conversation_id: str = Field(default="demo-conversation", max_length=160)
    agent_id: str = Field(default="target-agent", max_length=160)
    agent_role: str = Field(default="target-agent", max_length=80)
    source_app: str = Field(default="generic-agent", max_length=120)
    model_input: str = Field(default="", max_length=20000)
    model_output: str = Field(default="", max_length=20000)
    tool_call: dict[str, Any]
    context_sources: list[str] = Field(default_factory=list, max_length=20)
    guard_enabled: bool = True
    execute_in_sandbox: bool = False


class BatchAgentToolEvents(BaseModel):
    events: list[AgentToolEvent] = Field(..., min_length=1, max_length=50)
    guard_enabled: bool = True
    execute_in_sandbox: bool = False


class ApprovalDecisionRequest(BaseModel):
    action: Literal["approve", "reject", "批准", "驳回"]
    operator: str = Field(default="operator", max_length=80)
    comment: str = Field(..., min_length=1, max_length=2000)
    execute_in_sandbox: bool = False


class RealModelEvaluationRequest(BaseModel):
    force_real: bool = True
