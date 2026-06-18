import type { AttackSurface } from '../../types';

export const coverageLabel: Record<string, string> = {
  has_surface_profile: '攻击面画像',
  has_adversarial_samples: '对抗样本',
  has_jailbreak_cases: '越狱用例',
  has_agent_scripts: '攻击脚本',
  has_policy_expectations: '策略预期',
  has_runtime_evidence: '运行证据'
};

export function getSurfaceRiskColor(risk: AttackSurface['risk']) {
  if (risk === 'critical') return 'error';
  if (risk === 'high') return 'warning';
  if (risk === 'medium') return 'processing';
  return 'default';
}
