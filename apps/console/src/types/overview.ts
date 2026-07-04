import type { ModelStatus } from './common';
import type { AlertItem, AuditLog, RunResult } from './runtime';
import type { AttackSurface, Scenario, StudentCompetitionAttackProfile } from './surface';

export interface Overview {
  attack_surfaces: AttackSurface[];
  student_competition_attack_map?: StudentCompetitionAttackProfile[];
  scenarios: Scenario[];
  models: ModelStatus[];
  recent_runs: RunResult[];
  alerts: AlertItem[];
  audit_logs: AuditLog[];
  summary: {
    surface_count: number;
    scenario_count: number;
    recent_run_count: number;
    block_rate: number;
    guarded_run_count?: number;
    guarded_controlled_count?: number;
    guarded_control_rate?: number;
    attack_success_rate: number;
    avg_latency_ms: number;
  };
}
