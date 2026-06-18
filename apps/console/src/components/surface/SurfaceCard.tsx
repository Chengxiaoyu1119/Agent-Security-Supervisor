import { Col, Row, Space, Typography } from 'antd';
import type { AttackSurface } from '@/types';
import { riskLabel } from '@/utils';
import { LabelTag, PanelCard } from '../ui';
import { getSurfaceRiskColor } from './surfaceWorkbenchUtils';

export function SurfaceCard({
  surface,
  scenarioCount,
  selected,
  onSelect
}: {
  surface: AttackSurface;
  scenarioCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const entries = surface.entry_points?.slice(0, 2) ?? [];
  const signals = surface.detection_signals?.slice(0, 2) ?? [];
  const color = getSurfaceRiskColor(surface.risk);

  return (
    <PanelCard
      type="inner"
      hoverable
      onClick={onSelect}
      className={`zh-surface-card${selected ? ' zh-surface-card--selected' : ''}`}
    >
      <div className="zh-surface-card__head">
        <Typography.Text strong className="zh-text-lg">
          {surface.name}
        </Typography.Text>
        <LabelTag color={color}>{riskLabel[surface.risk]}</LabelTag>
      </div>
      <Typography.Paragraph type="secondary" className="zh-surface-card__summary">
        {surface.summary}
      </Typography.Paragraph>

      {(entries.length > 0 || signals.length > 0) && (
        <Space size={[0, 4]} wrap className="zh-surface-card__tags">
          {entries.map((item) => (
            <LabelTag key={`entry-${item}`} variant="filled">
              入口：{item}
            </LabelTag>
          ))}
          {signals.map((item) => (
            <LabelTag key={`signal-${item}`} variant="filled" color="processing">
              信号：{item}
            </LabelTag>
          ))}
        </Space>
      )}

      <Row gutter={[8, 8]} className="zh-surface-card__meta">
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            样本
          </Typography.Text>
          <Typography.Text strong>{surface.samples}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            脚本
          </Typography.Text>
          <Typography.Text strong>{surface.scripts}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            剧本
          </Typography.Text>
          <Typography.Text strong>{scenarioCount}</Typography.Text>
        </Col>
        <Col span={6}>
          <Typography.Text type="secondary" className="zh-meta-block">
            状态
          </Typography.Text>
          <Typography.Text strong>{surface.status}</Typography.Text>
        </Col>
      </Row>
    </PanelCard>
  );
}
