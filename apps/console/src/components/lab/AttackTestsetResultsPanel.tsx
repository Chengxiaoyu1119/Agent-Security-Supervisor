import { ShieldCheck } from 'lucide-react';
import { Col, Descriptions, Row, Space, Typography } from 'antd';
import type { AttackTestsetRunResult } from '../../types';
import { AuditDeepLinkButton } from '../audit/AuditDeepLinkButton';
import { DecisionPill, EvidenceCodeBlock, LabelTag, MetricCard, PanelCard } from '../ui';

type AttackTestsetResultsPanelProps = {
  result: AttackTestsetRunResult;
};

function labelCountsText(labels: Record<string, number>) {
  const entries = Object.entries(labels);
  if (!entries.length) return '未命中';
  return entries.map(([label, count]) => `${label}:${count}`).join('；');
}

export function AttackTestsetResultsPanel({ result }: AttackTestsetResultsPanelProps) {
  return (
    <Space orientation="vertical" size={16} className="zh-full-width">
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}>
          <MetricCard label="攻击复现" value={result.summary.attack_reproduced_count} tone="red" />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard label="检测命中" value={`${result.summary.detector_hit_rate}%`} tone="amber" />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard label="防护控制率" value={`${result.summary.control_rate}%`} tone="green" />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard label="样本数" value={result.sample_count} tone="cyan" />
        </Col>
      </Row>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="命中标签">{labelCountsText(result.summary.label_counts)}</Descriptions.Item>
      </Descriptions>
      <div className="zh-testset-record-list">
        {result.records.map((record) => (
          <PanelCard
            key={record.sample.id}
            title={`${record.sample.id} ${record.sample.title}`}
            subtitle={record.detector.name}
            extra={<AuditDeepLinkButton auditId={record.audit_id} size="small" />}
            type="inner"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="攻击面">{record.sample.surface_id}</Descriptions.Item>
                  <Descriptions.Item label="检测器">
                    <LabelTag color={record.detector.hit ? 'error' : 'default'}>
                      {record.detector.hit ? '命中' : '未命中'}
                    </LabelTag>
                  </Descriptions.Item>
                  <Descriptions.Item label="样本来源">
                    <LabelTag color={record.sample.customized ? 'processing' : 'default'}>
                      {record.sample.customized ? '手动编辑' : '内置测试集'}
                    </LabelTag>
                  </Descriptions.Item>
                  <Descriptions.Item label="置信度">{record.detector.confidence}</Descriptions.Item>
                  <Descriptions.Item label="防护有效">
                    <LabelTag color={record.defense_effective ? 'success' : 'warning'}>
                      {record.defense_effective ? '是' : '否'}
                    </LabelTag>
                  </Descriptions.Item>
                  <Descriptions.Item label="监督决策">
                    <DecisionPill decision={record.with_guard.decision} />
                  </Descriptions.Item>
                  <Descriptions.Item label="审计编号">{record.audit_id}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} lg={14}>
                <EvidenceCodeBlock maxHeight="small">
                  {JSON.stringify(
                    {
                      attack_input: record.sample.attack_input,
                      tool_call: record.tool_call,
                      detector_markers: record.detector.matched_markers,
                      without_guard_output: record.without_guard.tool_output
                    },
                    null,
                    2
                  )}
                </EvidenceCodeBlock>
                <Typography.Text type="secondary">
                  <ShieldCheck size={14} className="zh-inline-icon" />
                  {record.with_guard.reason}
                </Typography.Text>
              </Col>
            </Row>
          </PanelCard>
        ))}
      </div>
    </Space>
  );
}
