import { Col, Row, Typography } from 'antd';
import type { TargetLabState } from '../../types';
import { MetricCard, PanelCard } from '../ui';

type TargetLabDeltaPanelProps = {
  before: TargetLabState | null;
  after: TargetLabState;
};

const TARGET_LAB_METRICS: Array<{ key: keyof TargetLabState; label: string }> = [
  { key: 'api_call_count', label: 'API 调用' },
  { key: 'bulk_export_count', label: '批量导出' },
  { key: 'sensitive_read_count', label: '敏感读取' },
  { key: 'review_note_count', label: '复盘备注' }
];

function metricValue(state: TargetLabState | null, key: keyof TargetLabState) {
  const value = state?.[key];
  return typeof value === 'number' ? value : 0;
}

function metricDelta(before: TargetLabState | null, after: TargetLabState, key: keyof TargetLabState) {
  return metricValue(after, key) - metricValue(before, key);
}

export function TargetLabDeltaPanel({ before, after }: TargetLabDeltaPanelProps) {
  return (
    <PanelCard title="靶场状态变化" type="inner">
      <Row gutter={[12, 12]}>
        {TARGET_LAB_METRICS.map((item) => {
          const delta = metricDelta(before, after, item.key);
          return (
            <Col xs={12} sm={12} key={String(item.key)}>
              <MetricCard
                label={item.label}
                value={`${metricValue(after, item.key)} (${delta >= 0 ? '+' : ''}${delta})`}
                tone={delta > 0 ? 'amber' : 'cyan'}
              />
            </Col>
          );
        })}
      </Row>
      <Typography.Text type="secondary" className="zh-attack-lab__hint">
        括号内是本次运行相对运行前的变化，用来判断工具是否真实触碰了本地靶场资产。
      </Typography.Text>
    </PanelCard>
  );
}
