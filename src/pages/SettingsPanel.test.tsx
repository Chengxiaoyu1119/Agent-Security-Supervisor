import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';
import type { Overview } from '../types';

vi.mock('../api', () => ({
  fetchAttackCaseDataset: vi.fn().mockResolvedValue(null),
  fetchOpenClawIntegrationBundle: vi.fn().mockResolvedValue(null),
  fetchCompetitionReadiness: vi.fn().mockResolvedValue(null),
  fetchDemoDrill: vi.fn().mockResolvedValue(null),
  runDemoDrill: vi.fn(),
  runExternalAgentDemo: vi.fn(),
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
      provider: '本地模拟模型',
      configured: false,
      model: 'zhian-sim-guard',
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
    expect(screen.getByText('本地模拟模型')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '🤖 基础配置与成果对齐' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '🎯 演示体验与赛前体检' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '🔗 外部接入与开放集成' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '🛠️ 测试与手工调试' })).toBeInTheDocument();
  });
});
