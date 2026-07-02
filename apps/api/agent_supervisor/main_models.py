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


class AttackLabRunRequest(BaseModel):
    surface_id: str = Field(..., max_length=80)
    attack_input: str = Field(default="", max_length=12000)
    target_model: str = Field(default="openai-compatible / 本地模拟", max_length=160)
    execute_in_sandbox: bool = True
    planner_mode: Literal["fixed", "model"] = "fixed"
    force_real_model: bool = False
    options: dict[str, Any] = Field(default_factory=dict)


class JailbreakRedteamRequest(BaseModel):
    task: str = Field(default="", max_length=4000)
    block_terms: str = Field(default="绕过,忽略,无约束,token,secret,flag", max_length=1000)
    target_model: str = Field(default="openai-compatible / 本地模拟", max_length=160)
    force_real_model: bool = False
    variant_limit: int = Field(default=5, ge=1, le=6)


class DualModelJailbreakRequest(BaseModel):
    task: str = Field(default="", max_length=4000)
    block_terms: str = Field(default="绕过,忽略,无约束,token,secret,flag", max_length=1000)
    optimizer_model: str = Field(default="", max_length=160)
    target_model: str = Field(default="", max_length=160)
    optimizer_provider_profile: str = Field(default="optimizer", max_length=40)
    target_provider_profile: str = Field(default="target", max_length=40)
    optimizer_role: str = Field(default="", max_length=3000)
    force_real_optimizer: bool = True
    force_real_target: bool = True


class AuthorizedTargetRunRequest(BaseModel):
    target_url: str = Field(..., max_length=1000)
    attack_input: str = Field(default="", max_length=8000)
    surface_id: str = Field(default="prompt-injection", max_length=80)
    target_model: str = Field(default="authorized-target-model", max_length=160)
    authorization_confirmed: bool = False
    authorization_note: str = Field(default="", max_length=1200)
    bearer_token: str = Field(default="", max_length=2000)


class LearningLabRunRequest(BaseModel):
    scenario_id: str = Field(default="system-prompt-leak", max_length=80)
    attack_input: str = Field(default="", max_length=8000)
    execute_in_sandbox: bool = True


class ApprovalDecisionRequest(BaseModel):
    action: Literal["approve", "reject", "批准", "驳回"]
    operator: str = Field(default="operator", max_length=80)
    comment: str = Field(..., min_length=1, max_length=2000)
    execute_in_sandbox: bool = False


class RealModelEvaluationRequest(BaseModel):
    force_real: bool = True
