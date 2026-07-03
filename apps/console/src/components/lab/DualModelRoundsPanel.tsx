import { Bot, ShieldCheck } from 'lucide-react';
import { Col, Descriptions, Row, Space, Typography } from 'antd';
import type { DualModelJailbreakRound } from '../../types';
import { AuditDeepLinkButton } from '../audit/AuditDeepLinkButton';
import { DecisionPill, EvidenceCodeBlock, LabelTag, MetricCard, PanelCard } from '../ui';

type DualModelRoundsPanelProps = {
  rounds: DualModelJailbreakRound[];
};

function findingText(findings: Array<Record<string, string>>) {
  if (!findings.length) return '未命中过滤器';
  return findings.map((item) => `${item.type ?? 'finding'}:${item.count ?? '1'}`).join('；');
}

function modelLabel(provider: string, model: string, mode: string) {
  return `${provider || 'unknown'} / ${model || 'unknown'} / ${mode}`;
}

export function DualModelRoundsPanel({ rounds }: DualModelRoundsPanelProps) {
  if (!rounds.length) return null;

  return (
    <PanelCard title="多轮越狱优化过程" subtitle={`${rounds.length} 轮副模型优化 -> 主模型对测 -> 监督器判定`}>
      <Space orientation="vertical" size={16} className="zh-full-width">
        {rounds.map((round) => (
          <PanelCard
            key={round.round_index}
            title={`第 ${round.round_index} 轮`}
            subtitle={round.summary.decision_change}
            extra={<AuditDeepLinkButton auditId={round.supervisor.with_guard.audit_id} size="small" />}
            type="inner"
          >
            <Row gutter={[12, 12]} className="zh-dual-model-round-metrics">
              <Col xs={12} md={6}>
                <MetricCard label="副模型" value={round.summary.optimizer_real ? '真实' : '兜底'} tone="cyan" />
              </Col>
              <Col xs={12} md={6}>
                <MetricCard label="主模型" value={round.summary.target_real ? '真实' : '兜底'} tone="amber" />
              </Col>
              <Col xs={12} md={6}>
                <MetricCard
                  label="疑似突破"
                  value={round.summary.attack_success ? '是' : '否'}
                  tone={round.summary.attack_success ? 'red' : 'green'}
                />
              </Col>
              <Col xs={12} md={6}>
                <MetricCard
                  label="监督控制"
                  value={round.summary.controlled_with_guard ? '成功' : '未控制'}
                  tone={round.summary.controlled_with_guard ? 'green' : 'red'}
                />
              </Col>
            </Row>

            <Descriptions column={{ xs: 1, md: 2 }} size="small" className="zh-mt-16">
              <Descriptions.Item label="副模型链路">
                {modelLabel(round.optimizer.provider, round.optimizer.model, round.optimizer.mode)}
              </Descriptions.Item>
              <Descriptions.Item label="主模型链路">
                {modelLabel(round.target.provider, round.target.model, round.target.mode)}
              </Descriptions.Item>
              <Descriptions.Item label="输出过滤">{findingText(round.output_filter.findings)}</Descriptions.Item>
              <Descriptions.Item label="命中策略">{round.summary.policy_id}</Descriptions.Item>
              <Descriptions.Item label="无监督">
                <DecisionPill decision={round.supervisor.without_guard.decision} />
              </Descriptions.Item>
              <Descriptions.Item label="开启监督器">
                <DecisionPill decision={round.supervisor.with_guard.decision} />
              </Descriptions.Item>
              <Descriptions.Item label="副模型模式">
                <LabelTag color={round.optimizer.mode === 'real-api' ? 'processing' : 'default'}>
                  {round.optimizer.mode}
                </LabelTag>
              </Descriptions.Item>
              <Descriptions.Item label="主模型模式">
                <LabelTag color={round.target.mode === 'real-api' ? 'processing' : 'default'}>
                  {round.target.mode}
                </LabelTag>
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={[16, 16]} className="zh-mt-16">
              <Col xs={24} lg={12}>
                <Typography.Text strong>
                  <Bot size={14} className="zh-inline-icon" /> 副模型优化提示词
                </Typography.Text>
                <EvidenceCodeBlock maxHeight="small">{round.optimizer.optimized_prompt}</EvidenceCodeBlock>
              </Col>
              <Col xs={24} lg={12}>
                <Typography.Text strong>
                  <Bot size={14} className="zh-inline-icon" /> 主模型过滤后输出
                </Typography.Text>
                <EvidenceCodeBlock maxHeight="small">{round.target.filtered_output}</EvidenceCodeBlock>
              </Col>
            </Row>

            <Typography.Paragraph type="secondary" className="zh-mt-8 zh-mb-0">
              <ShieldCheck size={14} className="zh-inline-icon" />
              {round.supervisor.with_guard.reason}
            </Typography.Paragraph>
          </PanelCard>
        ))}
      </Space>
    </PanelCard>
  );
}
