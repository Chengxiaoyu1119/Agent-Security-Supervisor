import { Col, Row, Typography } from 'antd';
import type { CompareResult } from '@/types';
import { RunAuditTimeline, RunEvidenceStrip } from '../evidence/RunEvidence';
import { PanelCard } from '../ui';

export function ComparisonPanel({ comparison }: { comparison: CompareResult }) {
  const before = comparison.without_guard;
  const after = comparison.with_guard;

  return (
    <PanelCard type="inner" title="对比结果分析" className="zh-mt-24">
      <Row gutter={24} align="middle">
        <Col span={11}>
          <PanelCard variant="borderless" className="zh-compare-card--danger">
            <Typography.Text type="secondary" className="zh-text-block">
              无防护复现
            </Typography.Text>
            <Typography.Title level={4} className="zh-compare-title zh-compare-title--danger">
              {before.attack_success ? '攻击成功' : '未达成风险'}
            </Typography.Title>
            <Typography.Paragraph className="zh-text-body">
              监督器只记录不阻断，模拟真实攻击风险暴露。
            </Typography.Paragraph>
            <Typography.Text type="secondary" className="zh-text-meta">
              延迟 {before.metrics.detection_latency_ms}ms · 阻断 {before.metrics.blocked_count}
            </Typography.Text>
          </PanelCard>
        </Col>
        <Col span={2} className="zh-text-center">
          <Typography.Title level={3} type="secondary" className="zh-title-flush">
            →
          </Typography.Title>
        </Col>
        <Col span={11}>
          <PanelCard variant="borderless" className="zh-compare-card--success">
            <Typography.Text type="secondary" className="zh-text-block">
              有防护验证
            </Typography.Text>
            <Typography.Title level={4} className="zh-compare-title zh-compare-title--success">
              {after.attack_success ? '仍需加固' : '风险已控制'}
            </Typography.Title>
            <Typography.Paragraph className="zh-text-body">
              行为监督器输出拒绝、询问或隔离，形成可解释防御证据。
            </Typography.Paragraph>
            <Typography.Text type="secondary" className="zh-text-meta">
              延迟 {after.metrics.detection_latency_ms}ms · 阻断 {after.metrics.blocked_count} · 询问{' '}
              {after.metrics.asked_count} · 隔离 {after.metrics.isolated_count}
            </Typography.Text>
          </PanelCard>
        </Col>
      </Row>
      <div className="zh-mt-24">
        <Row gutter={24}>
          <Col span={12}>
            <RunEvidenceStrip title="无防护证据" run={before} compact />
          </Col>
          <Col span={12}>
            <RunEvidenceStrip title="有防护证据" run={after} compact />
          </Col>
        </Row>
      </div>
      <div className="zh-mt-24">
        <Row gutter={24}>
          <Col span={12}>
            <RunAuditTimeline title="无防护全链路审计" logs={before.audit_logs} compact />
          </Col>
          <Col span={12}>
            <RunAuditTimeline title="有防护全链路审计" logs={after.audit_logs} compact />
          </Col>
        </Row>
      </div>
    </PanelCard>
  );
}
