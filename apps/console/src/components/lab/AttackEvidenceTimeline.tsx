import { CheckCircle2, CircleDot, ShieldCheck, Target, TerminalSquare } from 'lucide-react';
import { Descriptions, Space, Typography } from 'antd';
import type { AttackLabRunResult } from '../../types';
import { AuditDeepLinkButton } from '../audit/AuditDeepLinkButton';
import { DecisionPill, EvidenceCodeBlock, PanelCard } from '../ui';

type AttackEvidenceTimelineProps = {
  result: AttackLabRunResult;
};

export function AttackEvidenceTimeline({ result }: AttackEvidenceTimelineProps) {
  const steps = [
    {
      title: '输入进入目标 Agent',
      icon: <CircleDot size={16} />,
      body: result.attack_input
    },
    {
      title: 'Agent 规划工具调用',
      icon: <TerminalSquare size={16} />,
      body: JSON.stringify(result.tool_call, null, 2)
    },
    {
      title: '无防护执行结果',
      icon: <Target size={16} />,
      body: JSON.stringify(result.without_guard.audit_log.tool_output ?? {}, null, 2)
    },
    {
      title: '监督器判定',
      icon: <ShieldCheck size={16} />,
      body: result.with_guard.reason
    },
    {
      title: '审计证据落库',
      icon: <CheckCircle2 size={16} />,
      body: result.with_guard.audit_id
    }
  ];

  return (
    <PanelCard
      title="运行证据时间线"
      subtitle={result.with_guard.audit_id}
      extra={<AuditDeepLinkButton auditId={result.with_guard.audit_id} size="small" />}
    >
      <div className="zh-attack-timeline">
        {steps.map((step, index) => (
          <div key={step.title} className="zh-attack-timeline__item">
            <span className="zh-attack-timeline__icon">{step.icon}</span>
            <div className="zh-attack-timeline__content">
              <Space orientation="vertical" size={8} className="zh-full-width">
                <Typography.Text strong>
                  {String(index + 1).padStart(2, '0')} {step.title}
                </Typography.Text>
                <EvidenceCodeBlock maxHeight="small">{step.body}</EvidenceCodeBlock>
              </Space>
            </div>
          </div>
        ))}
      </div>

      <Descriptions column={{ xs: 1, md: 2 }} size="small" className="zh-mt-16">
        <Descriptions.Item label="无防护">
          <DecisionPill decision={result.without_guard.decision} />
        </Descriptions.Item>
        <Descriptions.Item label="监督器">
          <DecisionPill decision={result.with_guard.decision} />
        </Descriptions.Item>
        <Descriptions.Item label="策略">{result.summary.policy_id}</Descriptions.Item>
        <Descriptions.Item label="处置">{result.summary.execution_mode}</Descriptions.Item>
      </Descriptions>
    </PanelCard>
  );
}
