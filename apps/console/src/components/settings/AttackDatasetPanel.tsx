import { Col, Row, Space, Typography } from 'antd';
import type { AttackCaseDataset, Overview } from '@/types';
import { LabelTag, MetricCard as Metric, PanelCard, UiButton } from '../ui';

interface AttackDatasetPanelProps {
  overview: Overview;
  attackDataset: AttackCaseDataset | null;
}

export function AttackDatasetPanel({ overview, attackDataset }: AttackDatasetPanelProps) {
  return (
    <PanelCard title="攻击样本数据集" type="inner">
      <Row gutter={[16, 16]} className="zh-mb-24">
        <Col xs={12} sm={8} md={4}>
          <Metric label="攻击面" value={`${attackDataset?.summary.surface_count ?? overview.summary.surface_count}`} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Metric label="剧本" value={`${attackDataset?.summary.scenario_count ?? overview.summary.scenario_count}`} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Metric
            label="对抗样本"
            value={`${attackDataset?.summary.adversarial_sample_count ?? overview.summary.scenario_count}`}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Metric
            label="越狱用例"
            value={`${attackDataset?.summary.jailbreak_case_count ?? overview.summary.scenario_count}`}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Metric label="复现入口" value={`${attackDataset?.summary.replay_recipe_count ?? '-'}`} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Metric label="工具调用" value={`${attackDataset?.summary.tool_call_count ?? '-'}`} />
        </Col>
      </Row>
      <Space className="zh-mb-24" wrap>
        <UiButton href="/api/datasets/attack_cases" target="_blank" type="link" className="zh-settings-link-flush">
          查看 JSON
        </UiButton>
        <UiButton href="/api/datasets/attack_cases.md" target="_blank" type="link">
          查看 Markdown
        </UiButton>
        <LabelTag variant="filled" className="zh-settings-code-tag">
          npm run cli -- samples --format json
        </LabelTag>
      </Space>
      <div>
        <Typography.Text strong className="zh-settings-field-title">
          按攻击面筛选
        </Typography.Text>
        <Space wrap>
          {overview.attack_surfaces.map((surface) => (
            <UiButton
              key={surface.id}
              href={`/api/datasets/attack_cases?surface_id=${encodeURIComponent(surface.id)}`}
              target="_blank"
              size="small"
            >
              {surface.name}
            </UiButton>
          ))}
        </Space>
      </div>
    </PanelCard>
  );
}
