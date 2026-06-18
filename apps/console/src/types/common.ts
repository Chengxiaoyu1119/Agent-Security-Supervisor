export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type GuardDecision = '允许' | '拒绝' | '询问' | '隔离';

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
