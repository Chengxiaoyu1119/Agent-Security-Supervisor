import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportPanel } from './ReportPanel';
import type { ReportData } from '../types';

const report = {
  markdown: '# 智安哨初赛报告素材',
  summary: {
    surface_count: 1,
    scenario_count: 2,
    run_count: 3,
    control_rate: 80,
    false_positive_rate: 0,
    anomaly_attack_recall_rate: 90,
    avg_latency_ms: 120,
    attack_success_rate: 20,
    expected_match_rate: 95,
    output_filter_block_rate: 100,
    enabled_policy_count: 4,
    policy_count: 5
  },
  surface_coverage: [
    {
      id: 'prompt-injection',
      name: '提示词注入',
      risk: 'high',
      status: '已覆盖',
      samples: 3,
      scripts: 2,
      defense: '输入检测与工具拦截',
      scenario_count: 2,
      demo_ready: true
    }
  ],
  deliverables: [],
  policy_hits: [],
  runs: []
} as unknown as ReportData;

describe('ReportPanel', () => {
  it('renders the report center and primary tabs', () => {
    render(<ReportPanel report={report} onOpenScenario={vi.fn()} />);

    expect(screen.getByText('研究材料中心')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '复制 Markdown' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '报告概览与成熟度' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '攻防实战评测' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '正常与消融评测' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '成果交付与接口' })).toBeInTheDocument();
  });

  it('keeps the report page usable while report data is loading', () => {
    render(<ReportPanel report={null} onOpenScenario={vi.fn()} />);

    expect(screen.getByText('研究材料中心')).toBeInTheDocument();
    expect(screen.getByText('正在加载报告...')).toBeInTheDocument();
  });
});
