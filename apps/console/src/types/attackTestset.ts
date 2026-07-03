export interface AttackTestsetSample {
  id: string;
  surface_id: string;
  title: string;
  attack_input: string;
  options: Record<string, unknown>;
  detector_id: string;
  customized?: boolean;
}

export interface AttackTestsetSurface {
  surface_id: string;
  name: string;
  sample_count: number;
  samples: AttackTestsetSample[];
}

export interface AttackTestsetsResponse {
  version: string;
  sample_count: number;
  detectors: Record<
    string,
    {
      name: string;
      description: string;
      markers: string[];
    }
  >;
  surfaces: AttackTestsetSurface[];
}

export interface AttackTestsetRunRequest {
  surface_id: string;
  sample_ids?: string[];
  sample_overrides?: Record<
    string,
    {
      attack_input?: string;
      options?: Record<string, unknown>;
    }
  >;
  execute_in_sandbox?: boolean;
  planner_mode?: 'fixed' | 'model';
  force_real_model?: boolean;
}

export interface AttackTestsetDetectorResult {
  detector_id: string;
  name: string;
  hit: boolean;
  labels: string[];
  matched_markers: string[];
  confidence: number;
  evidence_excerpt: string;
}

export interface AttackTestsetRunRecord {
  sample: AttackTestsetSample;
  detector: AttackTestsetDetectorResult;
  attack_reproduced: boolean;
  defense_effective: boolean;
  decision_change: string;
  risk_score: number;
  policy_id: string;
  audit_id: string;
  tool_call: {
    tool: string;
    arguments: Record<string, unknown>;
    risk_hint: string;
  };
  without_guard: {
    decision: string;
    tool_output: Record<string, unknown>;
  };
  with_guard: {
    decision: string;
    reason: string;
    recommendation: string;
  };
}

export interface AttackTestsetRunResult {
  version: string;
  surface_id: string;
  sample_count: number;
  summary: {
    attack_reproduced_count: number;
    detector_hit_count: number;
    defense_effective_count: number;
    control_rate: number;
    detector_hit_rate: number;
    label_counts: Record<string, number>;
  };
  records: AttackTestsetRunRecord[];
}
