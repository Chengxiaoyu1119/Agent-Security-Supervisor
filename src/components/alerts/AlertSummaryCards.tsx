import { Col, Row } from 'antd';
import { MetricCard as Metric } from '../ui';

interface AlertSummaryCardsProps {
  total: number;
  criticalCount: number;
  blockedCount: number;
  controlledCount: number;
}

export function AlertSummaryCards({ total, criticalCount, blockedCount, controlledCount }: AlertSummaryCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Metric label="告警总数" value={`${total}`} tone="cyan" />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Metric label="极高风险" value={`${criticalCount}`} tone="red" />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Metric label="拒绝阻断" value={`${blockedCount}`} tone="green" />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Metric label="询问/隔离" value={`${controlledCount}`} tone="amber" />
      </Col>
    </Row>
  );
}
