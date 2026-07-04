import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';
import type { Overview } from '../types';

vi.mock('../api', () => ({
  fetchAttackCaseDataset: vi.fn().mockResolvedValue(null),
  fetchOpenClawIntegrationBundle: vi.fn().mockResolvedValue(null),
  fetchAgentIntegrationBundle: vi.fn().mockResolvedValue(null),
  fetchAuthContext: vi.fn().mockResolvedValue(null),
  fetchMemoryGovernance: vi.fn().mockResolvedValue(null),
  fetchObservabilityMetrics: vi.fn().mockResolvedValue(null),
  fetchPolicyConfig: vi.fn().mockResolvedValue({ settings: null }),
  fetchCompetitionReadiness: vi.fn().mockResolvedValue(null),
  fetchDemoDrill: vi.fn().mockResolvedValue(null),
  fetchModelConfig: vi.fn().mockResolvedValue({
    real_api_enabled: true,
    real_api_enabled_source: 'runtime',
    allowed_providers: [
      { id: 'deepseek', label: 'DeepSeek' },
      { id: 'zhipu', label: '智谱' },
      { id: 'openai-compatible', label: 'OpenAI 兼容接口' }
    ],
    profiles: {
      target: { provider_priority: ['deepseek', 'zhipu'], model_overrides: {} },
      optimizer: { provider_priority: ['zhipu', 'deepseek'], model_overrides: {} },
      global: { provider_priority: ['deepseek', 'zhipu'], model_overrides: {} }
    }
  }),
  rollbackLatestMemory: vi.fn(),
  runDemoDrill: vi.fn(),
  runExternalAgentDemo: vi.fn(),
  updateMemoryStatus: vi.fn(),
  updateModelConfig: vi.fn(),
  updatePolicySettings: vi.fn(),
  writeCompetitionReadiness: vi.fn(),
  writeOpenClawPluginPackage: vi.fn(),
  writeOpenClawPluginValidation: vi.fn(),
  evaluateSupervisorEvent: vi.fn(),
  evaluateSupervisorBatch: vi.fn()
}));

const overview = {
  attack_surfaces: [
    {
      id: 'prompt-injection',
      name: '提示词注入',
      risk: 'high',
      status: '已覆盖',
      summary: '覆盖核心攻击面',
      samples: 3,
      scripts: 2,
      defense: '输入检测与工具拦截'
    }
  ],
  scenarios: [],
  models: [
    {
      provider: '本地安全评测模型',
      configured: false,
      model: 'agent-supervisor-sim-guard',
      mode: 'fallback'
    }
  ],
  recent_runs: [],
  alerts: [],
  audit_logs: [],
  summary: {
    surface_count: 1,
    scenario_count: 2,
    recent_run_count: 0,
    block_rate: 0,
    attack_success_rate: 0,
    avg_latency_ms: 0
  }
} as Overview;

describe('SettingsPanel', () => {
  it('renders the settings shell and primary tabs', async () => {
    render(<SettingsPanel overview={overview} refresh={vi.fn().mockResolvedValue(undefined)} />);

    expect(await screen.findByText('模型与系统设置')).toBeInTheDocument();
    expect(screen.getByText('本地安全评测模型')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '基础配置与成果对齐' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '运行体检与赛前核验' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '外部接入与开放集成' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '运行治理中心' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '测试与手工调试' })).toBeInTheDocument();
  });
});
