export interface CapabilityReplayEvidence {
  decision: string;
  policy_id: string;
  audit_id?: string;
  unguarded_audit_id?: string;
  tool?: string;
  risk_score?: number;
  evidence_title: string;
  evidence_detail: string;
  recommendation?: string;
  tool_output_excerpt: string;
  context_sources?: string[];
  expected_block?: boolean;
}

export interface CapabilityReplayProbe {
  id: string;
  name: string;
  category: string;
  goal: string;
  status: 'passed' | 'warning' | 'failed';
  replay_level: '真实可复现' | '沙箱可复现' | string;
  request_payload: Record<string, unknown>;
  evidence: CapabilityReplayEvidence;
}

export interface CapabilityReplayResult {
  generated_at: string;
  summary: {
    probe_count: number;
    passed_count: number;
    runnable_count: number;
    pass_rate: number;
  };
  probes: CapabilityReplayProbe[];
}
