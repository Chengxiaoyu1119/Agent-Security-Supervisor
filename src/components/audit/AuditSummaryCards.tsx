import { Col, Row } from 'antd';
import { MetricCard as Metric } from '../ui';

interface AuditSummaryCardsProps {
  total: number;
  controlledCount: number;
  highRiskCount: number;
  executedCount: number;
}

export function AuditSummaryCards({ total, controlledCount, highRiskCount, executedCount }: AuditSummaryCardsProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Metric label="审计记录" value={`${total}`} tone="cyan" />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Metric label="已管控" value={`${controlledCount}`} tone="green" />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Metric label="高危/极高" value={`${highRiskCount}`} tone="red" />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Metric label="实际执行" value={`${executedCount}`} tone="amber" />
      </Col>
    </Row>
  );
}
