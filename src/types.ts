export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type GuardDecision = '允许' | '拒绝' | '询问' | '隔离';

export interface AttackSurface {
  id: string;
  name: string;
  risk: RiskLevel;
  status: string;
  summary: string;
  samples: number;
  scripts: number;
  defense: string;
  entry_points?: string[];
  protected_assets?: string[];
  attacker_goals?: string[];
  detection_signals?: string[];
  evaluation_focus?: string[];
  mitigations?: string[];
}

export interface StudentCompetitionAttackProfile {
  id: string;
  name: string;
  risk: RiskLevel;
  status: string;
  why: string;
  entry_points: string[];
  protected_assets: string[];
  attacker_paths: string[];
  supervision: string[];
  demo_scenarios: string[];
}

export interface Scenario {
  id: string;
  surface_id: string;
  title: string;
  severity: RiskLevel;
  target: string;
  adversarial_prompt: string;
  jailbreak_case: string;
  expected_risk: string;
  defense: string;
  script_steps: string[];
  attack_path?: string[];
  detection_points?: string[];
  success_criteria?: string[];
  safety_boundary?: string;
  tags?: string[];
  tool_calls: Array<{
    tool: string;
    arguments: Record<string, unknown>;
    risk_hint: string;
  }>;
}

export interface ModelStatus {
  provider: string;
  configured: boolean;
  model: string;
  mode: string;
  endpoint?: string;
}

export interface Policy {
  id: string;
  name: string;
  decision: GuardDecision;
  enabled: boolean;
  description: string;
  layer?: string;
  surface_ids?: string[];
  tools?: string[];
  risk_controls?: string[];
  demo_scenarios?: string[];
  disable_impact?: string;
}

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

export interface ReportSummary {
  generated_at: string;
  surface_count: number;
  scenario_count: number;
  run_count: number;
  guarded_run_count: number;
  attack_success_rate: number;
  control_rate: number;
  avg_latency_ms: number;
  enabled_policy_count: number;
  policy_count: number;
  benign_sample_count: number;
  false_positive_count: number;
  false_positive_rate: number;
  expected_match_rate: number;
  surface_conclusion_count: number;
  output_filter_case_count: number;
  output_filter_block_rate: number;
  attack_reproduced_rate?: number;
  defense_effective_rate?: number;
  evidence_complete_rate?: number;
  policy_ablation_control_drop?: number;
  policy_ablation_risk_exposed_count?: number;
  anomaly_recommended_threshold?: number;
  anomaly_attack_recall_rate?: number;
  anomaly_false_alarm_rate?: number;
}

export interface ReportSurfaceCoverage {
  id: string;
  name: string;
  risk: RiskLevel;
  status: string;
  samples: number;
  scripts: number;
  scenario_count: number;
  demo_ready: boolean;
  defense: string;
}

export interface ReportScenarioMatrix {
  id: string;
  surface: string;
  title: string;
  severity: RiskLevel;
  target: string;
  has_adversarial_prompt: boolean;
  has_jailbreak_case: boolean;
  script_steps: number;
  tool_calls: number;
  last_attack_success: boolean | null;
  last_decision: string;
}

export interface ReportDeliverable {
  name: string;
  status: string;
  evidence: string;
}

export interface ReportCounterItem {
  policy_id?: string;
  decision?: string;
  count: number;
}

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

export interface SurfaceConclusion {
  surface_id: string;
  surface_name: string;
  risk: RiskLevel;
  status: string;
  attack_principle: string;
  entry_points: string[];
  protected_assets: string[];
  scenario_count: number;
  sample_count: number;
  script_count: number;
  tool_coverage: string[];
  run_count: number;
  guarded_run_count: number;
  controlled_run_count: number;
  attack_success_count: number;
  control_rate: number;
  attack_success_rate: number;
  avg_latency_ms: number;
  expected_decisions: Record<string, number>;
  expected_policies: Record<string, number>;
  representative_scenarios: Array<{
    id: string;
    title: string;
    target: string;
    severity: RiskLevel;
    tool_calls: number;
  }>;
  key_findings: string[];
  defense_conclusion: string;
  experiment_status: string;
}

export interface SurfaceConclusionReport {
  generated_at: string;
  summary: {
    surface_count: number;
    conclusion_count: number;
    with_run_evidence_count: number;
    scenario_count: number;
    tool_count: number;
  };
  conclusions: SurfaceConclusion[];
}

export interface OutputFilterCase {
  scenario_id: string;
  surface_id: string;
  title: string;
  severity: RiskLevel;
  risk_hint: string;
  filter_type: string;
  adversarial_prompt: string;
  jailbreak_case: string;
  without_guard: {
    decision: GuardDecision;
    policy_id: string;
    risk_level: RiskLevel;
    evidence: string;
  };
  with_guard: {
    decision: GuardDecision;
    policy_id: string;
    risk_level: RiskLevel;
    reason: string;
    recommendation: string;
  };
  blocked: boolean;
  comparison: string;
}

export interface OutputFilterEvidence {
  generated_at: string;
  summary: {
    case_count: number;
    blocked_count: number;
    block_rate: number;
    policy_distribution: Record<string, number>;
  };
  cases: OutputFilterCase[];
}

export interface AttackEffectivenessCase {
  scenario_id: string;
  surface_id: string;
  surface_name: string;
  title: string;
  severity: RiskLevel;
  target: string;
  attack_reproduced_without_guard: boolean;
  defense_effective_with_guard: boolean;
  expected_decision_match: boolean;
  evidence_complete: boolean;
  evidence_gaps: string[];
  without_guard: {
    run_id: string;
    created_at: string;
    attack_success: boolean;
    guard_enabled: boolean;
    decisions: string[];
    policies: string[];
    risk_scores: number[];
    anomaly_scores?: number[];
    audit_hashes?: string[];
    alert_count: number;
  } | null;
  with_guard: {
    run_id: string;
    created_at: string;
    attack_success: boolean;
    guard_enabled: boolean;
    decisions: string[];
    policies: string[];
    risk_scores: number[];
    anomaly_scores?: number[];
    audit_hashes?: string[];
    alert_count: number;
  } | null;
  unguarded_hash_status?: {
    valid: boolean;
    checked: number;
    failures: Array<{ step: number; reason: string }>;
  };
  guarded_hash_status?: {
    valid: boolean;
    checked: number;
    failures: Array<{ step: number; reason: string }>;
  };
  expected_decisions: Array<{
    tool: string;
    decision: GuardDecision;
    policy_id: string;
    risk_level: RiskLevel;
    risk_score?: number;
    anomaly_score?: number;
  }>;
  observed_decisions: Array<{
    tool?: string;
    decision?: GuardDecision;
    policy_id?: string;
    risk_level?: RiskLevel;
    risk_score?: number;
    anomaly_score?: number;
  }>;
}

export interface RequirementAlignmentItem {
  id: string;
  requirement: string;
  expected: string;
  status: string;
  evidence: string;
}

export interface AttackEffectiveness {
  generated_at: string;
  summary: {
    scenario_count: number;
    surface_count: number;
    attack_reproduced_count: number;
    attack_reproduced_rate: number;
    defense_effective_count: number;
    defense_effective_rate: number;
    expected_match_count: number;
    expected_match_rate: number;
    evidence_complete_count: number;
    evidence_complete_rate: number;
    controlled_surface_distribution: Record<string, number>;
  };
  cases: AttackEffectivenessCase[];
  requirement_alignment: RequirementAlignmentItem[];
}

export interface PolicyAblationCase {
  scenario_id: string;
  title: string;
  surface_id: string;
  status: string;
  baseline: {
    attack_success: boolean;
    controlled: boolean;
    decisions: string[];
    policies: string[];
    risk_scores: number[];
    primary_hit_count: number;
    allowed_tool_count: number;
    controlled_tool_count: number;
  };
  ablated: {
    attack_success: boolean;
    controlled: boolean;
    decisions: string[];
    policies: string[];
    risk_scores: number[];
    primary_hit_count: number;
    allowed_tool_count: number;
    controlled_tool_count: number;
  };
}

export interface PolicyAblationExperiment {
  id: string;
  name: string;
  disabled_policies: string[];
  scenario_ids: string[];
  hypothesis: string;
  baseline: {
    scenario_count: number;
    controlled_count: number;
    attack_success_count: number;
    control_rate: number;
    blocked_count: number;
    asked_count: number;
    isolated_count: number;
    primary_hit_count: number;
    policy_distribution: Record<string, number>;
  };
  ablated: {
    scenario_count: number;
    controlled_count: number;
    attack_success_count: number;
    control_rate: number;
    blocked_count: number;
    asked_count: number;
    isolated_count: number;
    primary_hit_count: number;
    policy_distribution: Record<string, number>;
  };
  risk_exposed_count: number;
  fallback_control_count: number;
  primary_hit_count: number;
  conclusion: string;
  cases: PolicyAblationCase[];
}

export interface PolicyAblation {
  generated_at: string;
  summary: {
    experiment_count: number;
    scenario_count: number;
    baseline_control_rate: number;
    ablated_control_rate: number;
    control_drop: number;
    risk_exposed_count: number;
    fallback_control_count: number;
    primary_hit_count: number;
  };
  experiments: PolicyAblationExperiment[];
}

export interface ProjectRoadmapBacklogItem {
  id: string;
  priority: string;
  title: string;
  why: string;
  scope: string;
  acceptance: string;
  status: string;
}

export interface ProjectRoadmap {
  generated_at: string;
  direction: {
    verdict: string;
    score: number;
    reason: string;
    competition_fit: number;
  };
  summary: {
    overall_score: number;
    dimension_count: number;
    completed_count: number;
    partial_count: number;
    high_priority_gap_count: number;
    p0_backlog_count: number;
    surface_count: number;
    scenario_count: number;
    run_count: number;
    evidence_gap_count: number;
  };
  dimensions: Array<{
    name: string;
    score: number;
    status: string;
    evidence: string;
    next_actions: string[];
  }>;
  feature_backlog: ProjectRoadmapBacklogItem[];
  next_sprint: ProjectRoadmapBacklogItem[];
  risk_register: Array<{
    risk: string;
    impact: string;
    mitigation: string;
  }>;
}

export interface AnomalyCalibration {
  generated_at: string;
  objective: string;
  method: {
    attack_source: string;
    benign_source: string;
    score_range: string;
    selection_rule: string;
    important_note: string;
  };
  summary: {
    recommended_threshold: number;
    max_false_alarm_rate: number;
    attack_sample_count: number;
    benign_sample_count: number;
    benign_allowed_sample_count: number;
    attack_detected_count: number;
    attack_missed_count: number;
    attack_recall_rate: number;
    benign_false_alarm_count: number;
    benign_false_alarm_rate: number;
    policy_controlled_missed_count: number;
    policy_controlled_missed_rate: number;
    attack_score_median: number;
    benign_score_median: number;
    attack_score_range: { min: number; max: number };
    benign_score_range: { min: number; max: number };
  };
  threshold_curve: Array<{
    threshold: number;
    attack_sample_count: number;
    benign_allowed_sample_count: number;
    attack_detected_count: number;
    attack_missed_count: number;
    benign_false_alarm_count: number;
    attack_recall_rate: number;
    benign_false_alarm_rate: number;
    precision_rate: number;
    selection_score: number;
  }>;
  selected_confusion_matrix: {
    threshold: number;
    true_positive_attack: number;
    false_negative_attack: number;
    false_positive_benign: number;
    true_negative_benign: number;
  };
  missed_attack_review: Array<{
    id: string;
    title: string;
    tool: string;
    risk_hint: string;
    anomaly_score: number;
    anomaly_signals: string[];
    supervisor_decision: string;
    policy_id: string;
    expected_decision?: string;
  }>;
  benign_false_alarm_review: Array<{
    id: string;
    title: string;
    tool: string;
    risk_hint: string;
    anomaly_score: number;
    anomaly_signals: string[];
    supervisor_decision: string;
    policy_id: string;
    expected_decision?: string;
  }>;
  conclusion: string;
}

export interface CompetitionPackageFile {
  filename: string;
  title: string;
  description: string;
  content_type: string;
  content: string;
  size: number;
}

export interface CompetitionChecklistItem {
  requirement: string;
  status: string;
  evidence: string;
}

export interface CompetitionPackage {
  generated_at: string;
  summary: {
    surface_count: number;
    scenario_count: number;
    demo_ready_surface_count: number;
    file_count: number;
    run_count: number;
    alert_count: number;
    control_rate: number;
  };
  checklist: CompetitionChecklistItem[];
  files: CompetitionPackageFile[];
  adapter_schema: Record<string, unknown>;
}

export interface SubmissionPackageResult {
  generated_at: string;
  package_dir: string;
  zip_path: string;
  file_count: number;
  summary: CompetitionPackage['summary'];
  clean_mode?: boolean;
  clean_summary?: {
    clean_run_count: number;
    clean_scenario_count: number;
    clean_guarded_run_count: number;
    clean_unguarded_run_count: number;
    clean_unguarded_attack_success_count: number;
    clean_guarded_controlled_count: number;
    clean_control_rate: number;
  };
  files: Array<{
    filename: string;
    relative_path: string;
    size: number;
  }>;
}

export type ApprovalStatus = '待复核' | '已批准' | '已驳回';

export interface ApprovalReview {
  id: string;
  audit_id: string;
  run_id: string;
  status: ApprovalStatus;
  final_decision: string;
  approval_action: string;
  tool: string;
  arguments: Record<string, unknown>;
  policy_id: string;
  risk_level: RiskLevel;
  risk_score?: number;
  risk_factors?: string[];
  anomaly_score?: number;
  anomaly_signals?: string[];
  reason: string;
  recommendation: string;
  source_app: string;
  agent_id: string;
  conversation_id: string;
  model_input_excerpt: string;
  model_output_excerpt: string;
  audit_hash: string;
  previous_hash: string;
  review_previous_hash: string;
  review_hash: string;
  hash_valid: boolean;
  operator: string;
  comment: string;
  created_at: string;
  reviewed_at: string;
  execution_note: string;
  sandbox_replay_requested?: boolean;
  sandbox_replayed_at?: string;
  sandbox_replay?: {
    executed: boolean;
    sandboxed: boolean;
    simulated?: boolean;
    output: string;
  } | null;
}

export interface ApprovalReviewList {
  generated_at: string;
  status_filter: string;
  summary: {
    total: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    high_risk_count: number;
    hash_valid_count: number;
    latest_created_at: string;
    latest_reviewed_at: string;
  };
  reviews: ApprovalReview[];
}

export interface ApprovalDecisionResult {
  updated: boolean;
  review: ApprovalReview;
  summary: ApprovalReviewList['summary'];
}

export interface SupervisorEvaluation {
  run_id: string;
  audit_id: string;
  persisted: boolean;
  decision: GuardDecision;
  risk_level: RiskLevel;
  risk_score?: number;
  risk_factors?: string[];
  anomaly_score?: number;
  anomaly_signals?: string[];
  policy_id: string;
  reason: string;
  recommendation: string;
  execution_mode: string;
  surface_id: string;
  risk_evidence: {
    tool: string;
    risk_hint: string;
    arguments: Record<string, unknown>;
    context_sources: string[];
    model_input_excerpt: string;
    model_output_excerpt: string;
    detection_points: string[];
    risk_score?: number;
    risk_factors?: string[];
    anomaly_score?: number;
    anomaly_signals?: string[];
  };
  audit_log: AuditLog;
  alert: AlertItem | null;
  approval_review?: ApprovalReview | null;
}

export interface SupervisorBatchEvaluation {
  total: number;
  controlled: number;
  control_rate: number;
  results: SupervisorEvaluation[];
}

export interface ExternalAgentDemoRecord {
  task_id: string;
  title: string;
  tool: string;
  arguments: Record<string, unknown>;
  decision: string;
  policy_id: string;
  reason: string;
  executed: boolean;
  tool_result: Record<string, unknown> | string | null;
  run_id?: string;
  audit_id?: string;
  audit_hash?: string;
  risk_level?: RiskLevel;
  risk_score?: number;
  anomaly_score?: number;
}

export interface ExternalAgentDemoResult {
  generated_at: string;
  supervisor_url: string;
  summary: {
    task_count: number;
    controlled_count: number;
    executed_count: number;
    control_rate: number;
    executed_tools: string[];
    audit_hash_count: number;
  };
  records: ExternalAgentDemoRecord[];
  runtime_dir: string;
  json_path: string;
  markdown_path: string;
}

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
    latest_package_zip: string;
    latest_package_dir: string;
    latest_package_file_count: number;
    screenshot_count: number;
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
  latest_package: Record<string, unknown>;
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

export interface AttackCaseDataset {
  name: string;
  version: string;
  generated_at: string;
  filter?: {
    surface_id: string | null;
  };
  summary: {
    surface_count: number;
    scenario_count: number;
    adversarial_sample_count: number;
    jailbreak_case_count: number;
    agent_script_count: number;
    replay_recipe_count?: number;
    tool_call_count: number;
    surface_distribution: Record<string, number>;
  };
  cases: Array<{
    id: string;
    surface_id: string;
    surface_name: string;
    title: string;
    severity: RiskLevel;
    target: string;
  }>;
}

export interface SurfaceEvidencePack {
  name: string;
  version: string;
  generated_at: string;
  surface: AttackSurface;
  summary: {
    scenario_count: number;
    sample_count: number;
    jailbreak_case_count: number;
    agent_script_count: number;
    tool_call_count: number;
    unique_tool_count: number;
    expected_policy_count: number;
    run_count: number;
    attack_run_count: number;
    external_run_count: number;
    guarded_run_count: number;
    controlled_run_count: number;
    latest_guarded_scenario_count: number;
    latest_controlled_scenario_count: number;
    control_rate: number;
    guarded_attack_success_rate: number;
    readiness_score: number;
    gap_count: number;
  };
  coverage_checks: Record<string, boolean>;
  gaps: Array<{
    severity: 'high' | 'medium' | 'low' | string;
    title: string;
    evidence: string;
    action: string;
    command?: string;
  }>;
  threat_chain: Array<{
    stage: string;
    text: string;
  }>;
  policy_distribution: Array<{
    policy_id: string;
    policy_name: string;
    count: number;
    decision: string;
  }>;
  tool_coverage: Array<{
    tool: string;
    count: number;
  }>;
  replay_commands: Array<{
    label: string;
    value: string;
  }>;
  scenarios: Array<{
    id: string;
    surface_id: string;
    title: string;
    severity: RiskLevel;
    target: string;
    attack_path: string[];
    detection_points: string[];
    success_criteria: string[];
    safety_boundary: string;
    tool_calls: Array<{
      tool: string;
      arguments: Record<string, unknown>;
      risk_hint: string;
    }>;
    script_steps: string[];
    expected_decisions: Array<{
      step: number;
      tool: string;
      risk_hint: string;
      decision: string;
      policy_id: string;
      risk_level: RiskLevel;
      risk_score: number;
      anomaly_score: number;
      reason: string;
    }>;
    latest_guarded_result: {
      status: string;
      run_id: string;
      created_at?: string;
      decision: string;
      policy_id: string;
      risk_score?: number;
      audit_hash?: string;
      attack_success: boolean | null;
    };
    latest_unguarded_result: {
      status: string;
      run_id: string;
      created_at?: string;
      decision: string;
      policy_id: string;
      risk_score?: number;
      audit_hash?: string;
      attack_success: boolean | null;
    };
  }>;
  dataset_summary: AttackCaseDataset['summary'];
}

export interface SurfaceEvidencePackWriteResult {
  generated_at: string;
  output_dir: string;
  index_json_path: string;
  index_markdown_path: string;
  surface_count: number;
  file_count: number;
  summary: {
    surface_count: number;
    scenario_count: number;
    sample_count: number;
    agent_script_count: number;
    avg_readiness_score: number;
    avg_control_rate: number;
    gap_count: number;
    runtime_evidence_surface_count: number;
    complete_surface_count: number;
  };
  packs: Array<{
    surface_id: string;
    json_path: string;
    markdown_path: string;
    summary: SurfaceEvidencePack['summary'];
  }>;
}

export interface SurfaceEvidencePackIndex {
  name: string;
  version: string;
  generated_at: string;
  summary: SurfaceEvidencePackWriteResult['summary'];
  surfaces: Array<{
    surface_id: string;
    surface_name: string;
    risk: RiskLevel;
    scenario_count: number;
    sample_count: number;
    agent_script_count: number;
    expected_policy_count: number;
    unique_tool_count: number;
    run_count: number;
    control_rate: number;
    readiness_score: number;
    gap_count: number;
    top_policies: string[];
    tools: string[];
    gaps: SurfaceEvidencePack['gaps'];
  }>;
}

export interface ReportData {
  markdown: string;
  summary: ReportSummary;
  surface_coverage: ReportSurfaceCoverage[];
  scenario_matrix: ReportScenarioMatrix[];
  deliverables: ReportDeliverable[];
  policy_hits: ReportCounterItem[];
  decision_counts: ReportCounterItem[];
  benign_evaluation: BenignEvaluation;
  benign_workflow_evaluation?: BenignWorkflowEvaluation;
  surface_conclusions: SurfaceConclusionReport;
  output_filter_evidence: OutputFilterEvidence;
  attack_effectiveness?: AttackEffectiveness;
  policy_ablation?: PolicyAblation;
  anomaly_calibration?: AnomalyCalibration;
  project_roadmap?: ProjectRoadmap;
  runs: RunResult[];
  competition_package?: CompetitionPackage;
}

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
    attack_success_rate: number;
    avg_latency_ms: number;
  };
}
