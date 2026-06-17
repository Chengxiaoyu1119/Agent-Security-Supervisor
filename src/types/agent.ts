import type { GuardDecision, RiskLevel } from './common';
import type { RunResult } from './runtime';

export interface AttackChainStage {
  id: string;
  name: string;
  index: number;
  scenario_id: string;
  tactic: string;
  expected_control: string;
  scenario: {
    id: string;
    surface_id: string;
    title: string;
    severity: RiskLevel;
    target: string;
    tool_count: number;
    tools: string[];
    defense: string;
  };
}

export interface AttackChain {
  id: string;
  title: string;
  severity: RiskLevel;
  summary: string;
  attacker_goal: string;
  business_context: string;
  defense_focus: string[];
  stages: AttackChainStage[];
  summary_stats: {
    stage_count: number;
    surface_count: number;
    tool_count: number;
    surfaces: string[];
    tools: string[];
  };
}

export interface AttackChainStageRun {
  stage: AttackChainStage;
  run_id: string;
  created_at: string;
  guard_enabled: boolean;
  attack_success: boolean;
  controlled: boolean;
  decisions: GuardDecision[];
  policies: string[];
  audit_hashes: string[];
  risk_scores: number[];
  anomaly_scores: number[];
  metrics: RunResult['metrics'];
  run: RunResult;
}

export interface AttackChainRunResult {
  chain: AttackChain;
  generated_at: string;
  guard_enabled: boolean;
  summary: {
    stage_count: number;
    controlled_stage_count: number;
    attack_success_stage_count: number;
    control_rate: number;
    avg_latency_ms: number;
    blocked_count: number;
    asked_count: number;
    isolated_count: number;
    decision_distribution: Record<string, number>;
    policy_distribution: Record<string, number>;
  };
  stages: AttackChainStageRun[];
}

export interface AttackChainCompareResult {
  chain: AttackChain;
  generated_at: string;
  summary: {
    stage_count: number;
    without_guard_attack_success_count: number;
    with_guard_attack_success_count: number;
    attack_success_reduced_count: number;
    controlled_with_guard_count: number;
    control_rate: number;
  };
  comparisons: Array<{
    stage: AttackChainStage;
    without_guard: AttackChainStageRun;
    with_guard: AttackChainStageRun;
    attack_success_reduced: boolean;
    blocked_or_controlled: boolean;
  }>;
}
