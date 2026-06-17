import type { GuardDecision, RiskLevel } from './common';
import type { RunResult } from './runtime';

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
