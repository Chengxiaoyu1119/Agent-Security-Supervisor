import { Space, Typography } from 'antd';
import type { Scenario } from '@/types';
import { PanelCard } from '../ui';

const SAMPLE_ITEMS = [
  { key: 'adversarial_prompt', label: '模型对抗样本' },
  { key: 'jailbreak_case', label: '越狱测试用例' },
  { key: 'defense', label: '防御策略' }
] as const;

export function ScenarioSamplePanel({ scenario }: { scenario: Scenario }) {
  return (
    <PanelCard
      title={
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>攻击样本与越狱用例</Typography.Text>
          <Typography.Text type="secondary" className="zh-text-meta">
            {scenario.target}
          </Typography.Text>
        </Space>
      }
      variant="borderless"
    >
      <div className="zh-scenario-sample-list">
        {SAMPLE_ITEMS.map((item) => (
          <div key={item.key} className="zh-scenario-sample-item">
            <Typography.Text type="secondary" className="zh-text-meta">
              {item.label}
            </Typography.Text>
            <Typography.Text>{scenario[item.key]}</Typography.Text>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
