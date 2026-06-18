import type { GuardDecision, RiskLevel } from '../common';

export interface BenignEvaluationCase {
  id: string;
  category: string;
  title: string;
  business_purpose: string;
  model_input: string;
  model_output: string;
  tool_call: {
    tool: string;
    arguments: Record<string, unknown>;
    risk_hint: string;
  };
  context_sources: string[];
  expected_decision: GuardDecision;
  decision: GuardDecision;
  risk_level: RiskLevel;
  risk_score?: number;
  risk_factors?: string[];
  anomaly_score?: number;
  anomaly_signals?: string[];
  policy_id: string;
  reason: string;
  recommendation: string;
  matches_expected: boolean;
  is_false_positive: boolean;
  latency_ms: number;
}

export interface BenignEvaluation {
  generated_at: string;
  filter: {
    category: string | null;
    guard_enabled: boolean;
  };
  summary: {
    case_count: number;
    category_count: number;
    tool_count: number;
    expected_allow_count: number;
    expected_control_count: number;
    allowed_count: number;
    controlled_count: number;
    false_positive_count: number;
    false_positive_rate: number;
    expected_match_count: number;
    expected_match_rate: number;
    avg_latency_ms: number;
    max_risk_score: number;
    max_anomaly_score: number;
    category_distribution: Record<string, number>;
    tool_distribution: Record<string, number>;
  };
  cases: BenignEvaluationCase[];
}

export interface BenignWorkflowStep {
  id: string;
  workflow_id: string;
  title: string;
  model_input: string;
  model_output: string;
  tool: string;
  tool_call: {
    tool: string;
    arguments: Record<string, unknown>;
    risk_hint: string;
  };
  context_sources: string[];
  expected_decision: GuardDecision;
  decision: GuardDecision;
  risk_level: RiskLevel;
  policy_id: string;
  reason: string;
  recommendation: string;
  risk_score: number;
  risk_factors: string[];
  anomaly_score: number;
  anomaly_signals: string[];
  matches_expected: boolean;
  is_false_positive: boolean;
  executed: boolean;
  sandboxed: boolean;
  tool_result: Record<string, unknown>;
  previous_hash: string;
  audit_hash: string;
}

export interface BenignWorkflow {
  id: string;
  title: string;
  business_purpose: string;
  step_count: number;
  passed: boolean;
  false_positive_count: number;
  expected_control_count: number;
  controlled_count: number;
  executed_count: number;
  audit_chain_valid: boolean;
  audit_chain_checked: number;
  audit_chain_failures: Array<{ step: number; reason: string }>;
  steps: BenignWorkflowStep[];
}

export interface BenignWorkflowEvaluation {
  generated_at: string;
  filter: {
    guard_enabled: boolean;
  };
  summary: {
    workflow_count: number;
    passed_workflow_count: number;
    workflow_pass_rate: number;
    step_count: number;
    expected_allow_step_count: number;
    expected_control_step_count: number;
    allowed_step_count: number;
    controlled_step_count: number;
    executed_step_count: number;
    false_positive_count: number;
    false_positive_rate: number;
    expected_match_count: number;
    expected_match_rate: number;
    tool_count: number;
    tool_distribution: Record<string, number>;
    decision_distribution: Record<string, number>;
    audit_chain_valid_count: number;
  };
  workflows: BenignWorkflow[];
}
