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
