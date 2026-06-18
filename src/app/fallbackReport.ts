import type { ReportData } from '../types';

export function createFallbackReport(): ReportData {
  return {
    markdown: '# 智安哨初赛报告素材\n\n后端未启动，暂无可导出的实验日志。',
    summary: {
      generated_at: new Date().toISOString(),
      surface_count: 0,
      scenario_count: 0,
      run_count: 0,
      guarded_run_count: 0,
      attack_success_rate: 0,
      control_rate: 0,
      avg_latency_ms: 0,
      enabled_policy_count: 0,
      policy_count: 0,
      benign_sample_count: 0,
      false_positive_count: 0,
      false_positive_rate: 0,
      expected_match_rate: 0,
      surface_conclusion_count: 0,
      output_filter_case_count: 0,
      output_filter_block_rate: 0,
      attack_reproduced_rate: 0,
      defense_effective_rate: 0,
      evidence_complete_rate: 0,
      policy_ablation_control_drop: 0,
      policy_ablation_risk_exposed_count: 0,
      anomaly_recommended_threshold: 0,
      anomaly_attack_recall_rate: 0,
      anomaly_false_alarm_rate: 0
    },
    surface_coverage: [],
    scenario_matrix: [],
    deliverables: [],
    policy_hits: [],
    decision_counts: [],
    benign_evaluation: {
      generated_at: new Date().toISOString(),
      filter: { category: null, guard_enabled: true },
      summary: {
        case_count: 0,
        category_count: 0,
        tool_count: 0,
        expected_allow_count: 0,
        expected_control_count: 0,
        allowed_count: 0,
        controlled_count: 0,
        false_positive_count: 0,
        false_positive_rate: 0,
        expected_match_count: 0,
        expected_match_rate: 0,
        avg_latency_ms: 0,
        max_risk_score: 0,
        max_anomaly_score: 0,
        category_distribution: {},
        tool_distribution: {}
      },
      cases: []
    },
    benign_workflow_evaluation: {
      generated_at: new Date().toISOString(),
      filter: { guard_enabled: true },
      summary: {
        workflow_count: 0,
        passed_workflow_count: 0,
        workflow_pass_rate: 0,
        step_count: 0,
        expected_allow_step_count: 0,
        expected_control_step_count: 0,
        allowed_step_count: 0,
        controlled_step_count: 0,
        executed_step_count: 0,
        false_positive_count: 0,
        false_positive_rate: 0,
        expected_match_count: 0,
        expected_match_rate: 0,
        tool_count: 0,
        tool_distribution: {},
        decision_distribution: {},
        audit_chain_valid_count: 0
      },
      workflows: []
    },
    surface_conclusions: {
      generated_at: new Date().toISOString(),
      summary: {
        surface_count: 0,
        conclusion_count: 0,
        with_run_evidence_count: 0,
        scenario_count: 0,
        tool_count: 0
      },
      conclusions: []
    },
    output_filter_evidence: {
      generated_at: new Date().toISOString(),
      summary: {
        case_count: 0,
        blocked_count: 0,
        block_rate: 0,
        policy_distribution: {}
      },
      cases: []
    },
    attack_effectiveness: {
      generated_at: new Date().toISOString(),
      summary: {
        scenario_count: 0,
        surface_count: 0,
        attack_reproduced_count: 0,
        attack_reproduced_rate: 0,
        defense_effective_count: 0,
        defense_effective_rate: 0,
        expected_match_count: 0,
        expected_match_rate: 0,
        evidence_complete_count: 0,
        evidence_complete_rate: 0,
        controlled_surface_distribution: {}
      },
      cases: [],
      requirement_alignment: []
    },
    policy_ablation: {
      generated_at: new Date().toISOString(),
      summary: {
        experiment_count: 0,
        scenario_count: 0,
        baseline_control_rate: 0,
        ablated_control_rate: 0,
        control_drop: 0,
        risk_exposed_count: 0,
        fallback_control_count: 0,
        primary_hit_count: 0
      },
      experiments: []
    },
    anomaly_calibration: {
      generated_at: new Date().toISOString(),
      objective: '等待后端生成异常检测阈值校准数据。',
      method: {
        attack_source: '',
        benign_source: '',
        score_range: '',
        selection_rule: '',
        important_note: ''
      },
      summary: {
        recommended_threshold: 0,
        max_false_alarm_rate: 0,
        attack_sample_count: 0,
        benign_sample_count: 0,
        benign_allowed_sample_count: 0,
        attack_detected_count: 0,
        attack_missed_count: 0,
        attack_recall_rate: 0,
        benign_false_alarm_count: 0,
        benign_false_alarm_rate: 0,
        policy_controlled_missed_count: 0,
        policy_controlled_missed_rate: 0,
        attack_score_median: 0,
        benign_score_median: 0,
        attack_score_range: { min: 0, max: 0 },
        benign_score_range: { min: 0, max: 0 }
      },
      threshold_curve: [],
      selected_confusion_matrix: {
        threshold: 0,
        true_positive_attack: 0,
        false_negative_attack: 0,
        false_positive_benign: 0,
        true_negative_benign: 0
      },
      missed_attack_review: [],
      benign_false_alarm_review: [],
      conclusion: ''
    },
    project_roadmap: {
      generated_at: new Date().toISOString(),
      direction: {
        verdict: '等待后端生成项目成熟度判断',
        score: 0,
        reason: '后端未启动，暂无路线图数据。',
        competition_fit: 0
      },
      summary: {
        overall_score: 0,
        dimension_count: 0,
        completed_count: 0,
        partial_count: 0,
        high_priority_gap_count: 0,
        p0_backlog_count: 0,
        surface_count: 0,
        scenario_count: 0,
        run_count: 0,
        evidence_gap_count: 0
      },
      dimensions: [],
      feature_backlog: [],
      next_sprint: [],
      risk_register: []
    },
    runs: []
  };
}
