import { Descriptions, Space, Typography } from 'antd';
import type { Scenario } from '../../types';
import { PanelCard } from '../ui';

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
      <Descriptions column={1} layout="vertical" size="small" bordered>
        <Descriptions.Item label="模型对抗样本">{scenario.adversarial_prompt}</Descriptions.Item>
        <Descriptions.Item label="越狱测试用例">{scenario.jailbreak_case}</Descriptions.Item>
        <Descriptions.Item label="防御策略">{scenario.defense}</Descriptions.Item>
      </Descriptions>
    </PanelCard>
  );
}
