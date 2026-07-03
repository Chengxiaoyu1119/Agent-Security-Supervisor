import type { SupervisorEvaluation, TargetLabState } from './supervisor';

export interface LearningLabScenario {
  id: string;
  name: string;
  category: string;
  tool: string;
  risk_hint: string;
  default_input: string;
  exploit_goal: string;
  defense: string;
}

export interface LearningLabScenariosResponse {
  version: string;
  scenario_count: number;
  scenarios: LearningLabScenario[];
}

export interface LearningLabRunRequest {
  scenario_id: string;
  attack_input: string;
  execute_in_sandbox?: boolean;
}

export interface LearningLabRunResult {
  scenario: LearningLabScenario;
  attack_input: string;
  tool_call: {
    tool: string;
    arguments: Record<string, unknown>;
    risk_hint: string;
  };
  vulnerable: {
    decision: string;
    audit_id: string;
    run_id: string;
    policy_id: string;
    risk_score: number;
    execution_mode: string;
    exploited: boolean;
    target_response: string;
    tool_output: Record<string, unknown>;
  };
  guarded: SupervisorEvaluation;
  target_lab: TargetLabState;
  summary: {
    exploited_without_guard: boolean;
    blocked_with_guard: boolean;
    decision_change: string;
    compromised_assets: string[];
    guard_policy_id: string;
    guard_audit_id: string;
    vulnerable_output_excerpt: string;
    guarded_output_excerpt: string;
  };
}
