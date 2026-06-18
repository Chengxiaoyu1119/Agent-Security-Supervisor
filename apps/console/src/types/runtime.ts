import type { GuardDecision, RiskLevel } from './common';
import type { Scenario } from './surface';

export interface AlertItem {
  id: string;
  run_id: string;
  severity: RiskLevel;
  title: string;
  decision: GuardDecision;
  evidence: string;
  created_at: string;
  scenario_id?: string;
  scenario_title?: string;
  surface_id?: string;
  target?: string;
  policy_id?: string;
  tool?: string;
  arguments?: Record<string, unknown>;
  recommendation?: string;
  tool_output?: {
    executed?: boolean;
    sandboxed?: boolean;
    simulated?: boolean;
    output?: string;
  };
  risk_score?: number;
  risk_factors?: string[];
  anomaly_score?: number;
  anomaly_signals?: string[];
}

export interface AuditLog {
  id: string;
  run_id: string;
  step: number;
  tool: string;
  arguments: Record<string, unknown>;
  decision: GuardDecision;
  risk_level: RiskLevel;
  policy_id: string;
  reason: string;
  recommendation: string;
  risk_score?: number;
  risk_factors?: string[];
  anomaly_score?: number;
  anomaly_signals?: string[];
  previous_hash?: string;
  audit_hash?: string;
  tool_output: {
    executed: boolean;
    sandboxed: boolean;
    simulated?: boolean;
    output: string;
  };
  timestamp: string;
}

export interface AuditHashVerification {
  run_id: string;
  scenario_id: string;
  created_at: string;
  valid: boolean;
  checked: number;
  failures: Array<{
    step: number;
    reason: string;
  }>;
  first_hash?: string;
  last_hash?: string;
}

export interface AgentTrace {
  id: string;
  agent: string;
  role: string;
  message: string;
  status: string;
  timestamp: string;
}

export interface RunResult {
  run_id: string;
  created_at: string;
  scenario: Scenario;
  guard_enabled: boolean;
  agent_trace: AgentTrace[];
  audit_logs: AuditLog[];
  alerts: AlertItem[];
  attack_success: boolean;
  metrics: {
    attack_success_rate: number;
    blocked_count: number;
    asked_count: number;
    isolated_count: number;
    detection_latency_ms: number;
    false_positive_rate: number;
  };
}

export interface CompareResult {
  scenario_id: string;
  without_guard: RunResult;
  with_guard: RunResult;
  summary: {
    attack_success_reduced: boolean;
    blocked_or_controlled: boolean;
  };
}

export interface BatchCompareResult {
  scenario_ids: string[];
  comparisons: CompareResult[];
  summary: {
    total: number;
    exposed_without_guard: number;
    controlled_with_guard: number;
    attack_success_reduced: number;
    control_rate: number;
    avg_latency_ms: number;
    blocked_count: number;
    asked_count: number;
    isolated_count: number;
  };
}
