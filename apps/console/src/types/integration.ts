import type { GuardDecision, RiskLevel } from './common';

export interface OpenClawIntegrationBundle {
  name: string;
  version: string;
  generated_at: string;
  purpose: string;
  endpoints: Array<{
    name: string;
    method: string;
    path: string;
    description: string;
  }>;
  event_contract: {
    required_fields: string[];
    optional_fields: string[];
    safe_default: string;
    tool_call: Record<string, string>;
  };
  adapter_code: string;
  sample_events: Record<string, unknown>[];
  validation: {
    cli: string;
    real_agent_cli?: string;
    plugin_validation_cli?: string;
    powershell: string;
    expected: {
      event_count: number;
      controlled_min: number;
      allowed_normal_read: boolean;
    };
  };
  acceptance_steps: string[];
  safety_boundary: string[];
}

export interface AgentIntegrationExample {
  id: string;
  name: string;
  framework: string;
  runtime_stage: string;
  endpoint: string;
  status: string;
  code: string;
}

export interface AgentIntegrationBundle {
  name: string;
  version: string;
  generated_at: string;
  purpose: string;
  decision_contract: Record<string, string>;
  event_contract: {
    required_fields: string[];
    recommended_fields: string[];
    safe_default: string;
  };
  examples: AgentIntegrationExample[];
  acceptance: string[];
}

export interface OpenClawCommandCheck {
  attempted: boolean;
  available: boolean;
  passed: boolean | null;
  command: string;
  stdout: string;
  stderr: string;
  skipped_reason: string;
}

export interface OpenClawPluginPackageResult {
  generated_at: string;
  package_dir: string;
  zip_path: string;
  markdown_path: string;
  file_count: number;
  summary: {
    name: string;
    version: string;
    generated_at: string;
    package_type: string;
    supervisor_url: string;
    core_hooks: string[];
    decision_mapping: Record<string, string>;
    install_commands: string[];
    runtime_checks: Record<string, boolean | number>;
    files: Array<{
      path: string;
      size: number;
    }>;
  };
}

export interface OpenClawPluginValidation {
  generated_at: string;
  package_dir: string;
  zip_path: string;
  markdown_path: string;
  static_passed: boolean;
  files_passed: boolean;
  node_syntax_passed: boolean;
  runtime_inspect_passed: boolean;
  overall_status: 'runtime-validated' | 'static-validated' | 'needs-fix' | string;
  file_checks: Record<string, boolean>;
  static_checks: Record<string, boolean | number>;
  node_check: OpenClawCommandCheck;
  openclaw_runtime_check: OpenClawCommandCheck;
  install_commands: string[];
  remaining_gap: string[];
  package: OpenClawPluginPackageResult;
}

export interface OpenClawPluginValidationWriteResult {
  generated_at: string;
  json_path: string;
  markdown_path: string;
  validation: OpenClawPluginValidation;
}

export interface CompetitionReadinessCheck {
  id: string;
  title: string;
  category: string;
  status: 'passed' | 'warning' | 'blocked' | string;
  status_label: string;
  severity: string;
  weight: number;
  earned_score: number;
  evidence: string;
  details: Record<string, unknown>;
  next_action: string;
  artifact_paths: string[];
}

export interface CompetitionReadiness {
  project: string;
  generated_at: string;
  overall_status: string;
  status_label: string;
  verdict: string;
  readiness_score: number;
  summary: {
    check_count: number;
    passed_count: number;
    warning_count: number;
    blocker_count: number;
    surface_count: number;
    scenario_count: number;
    policy_count: number;
    benign_case_count: number;
    benign_false_positive_rate: number;
    benign_workflow_count: number;
    benign_workflow_false_positive_rate: number;
    recommended_threshold: number;
    approval_review_count: number;
    pending_approval_count: number;
    resolved_approval_count: number;
    demo_drill_stage_count: number;
    demo_drill_review_hash_count: number;
    roadmap_score: number;
    roadmap_p0_backlog_count: number;
  };
  checks: CompetitionReadinessCheck[];
  blockers: Array<{
    id: string;
    title: string;
    severity: string;
    evidence: string;
    next_action: string;
  }>;
  next_actions: Array<{
    id: string;
    severity: string;
    title: string;
    action: string;
  }>;
  acceptance_commands: string[];
  latest_package?: Record<string, unknown>;
}

export interface CompetitionReadinessWriteResult {
  generated_at: string;
  json_path: string;
  markdown_path: string;
  summary: CompetitionReadiness['summary'];
  readiness_score: number;
  overall_status: string;
  blockers: CompetitionReadiness['blockers'];
  readiness: CompetitionReadiness;
}

export interface DemoDrillStage {
  index: number;
  title: string;
  objective: string;
  tool: string;
  arguments: Record<string, unknown>;
  decision: GuardDecision;
  policy_id: string;
  risk_level: RiskLevel;
  risk_score?: number;
  anomaly_score?: number;
  reason: string;
  recommendation: string;
  run_id: string;
  audit_id: string;
  audit_hash: string;
  approval_review_id: string;
  approval_status: string;
  approval_action_label: string;
  review_hash: string;
  model_input_excerpt: string;
  execution_mode: string;
}

export interface DemoDrillResult {
  name: string;
  generated_at: string;
  started_at: string;
  summary: {
    stage_count: number;
    controlled_count: number;
    approved_count: number;
    rejected_count: number;
    audit_hash_count: number;
    review_hash_count: number;
    decisions: string[];
    policies: string[];
    max_risk_score: number;
    max_anomaly_score: number;
  };
  stages: DemoDrillStage[];
  demo_script: string[];
  acceptance_points: string[];
  json_path: string;
  markdown_path: string;
}
