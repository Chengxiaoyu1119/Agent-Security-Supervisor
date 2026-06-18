import type { RiskLevel } from './common';

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
