import { Descriptions, Flex, Space, Typography } from 'antd';
import { Copy } from 'lucide-react';
import type { AlertItem } from '@/types';
import { riskLabel } from '@/utils';
import { EvidenceCodeBlock, LabelTag, PanelCard, UiButton } from '../ui';

interface AlertDetailProps {
  alert?: AlertItem;
  copied: boolean;
  onCopy: () => void;
}

export function AlertDetail({ alert, copied, onCopy }: AlertDetailProps) {
  if (!alert) {
    return <div className="zh-empty-panel zh-empty-panel--large">选择一条告警查看详情。</div>;
  }

  return (
    <PanelCard
      type="inner"
      title={
        <Space>
          <Typography.Text>{alert.title}</Typography.Text>
          <LabelTag variant="filled">{alert.decision}</LabelTag>
        </Space>
      }
      extra={<Typography.Text type="secondary">{alert.created_at.slice(0, 19).replace('T', ' ')}</Typography.Text>}
    >
      <Descriptions column={2} size="small" bordered className="zh-mb-16">
        <Descriptions.Item label="严重级别">
          <LabelTag variant="filled" color={['critical', 'high'].includes(alert.severity) ? 'error' : 'default'}>
            {riskLabel[alert.severity]}
          </LabelTag>
        </Descriptions.Item>
        <Descriptions.Item label="风险分">
          <Typography.Text type="danger">{alert.risk_score ?? '-'}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="异常分">{alert.anomaly_score ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="策略编号">{alert.policy_id ?? '未知'}</Descriptions.Item>
        <Descriptions.Item label="攻击剧本">{alert.scenario_id ?? '未知'}</Descriptions.Item>
        <Descriptions.Item label="目标工具">{alert.tool ?? alert.target ?? '未知'}</Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5}>阻断证据</Typography.Title>
      <Typography.Paragraph>{alert.evidence}</Typography.Paragraph>

      <Typography.Title level={5}>推荐处置</Typography.Title>
      <Typography.Paragraph>{alert.recommendation || '暂无推荐处置。'}</Typography.Paragraph>

      {(alert.risk_factors?.length || 0) > 0 ? (
        <>
          <Typography.Title level={5}>风险因子</Typography.Title>
          <Space wrap className="zh-mb-16">
            {alert.risk_factors?.map((factor: string) => (
              <LabelTag variant="filled" key={factor}>
                {factor}
              </LabelTag>
            ))}
          </Space>
        </>
      ) : null}

      {(alert.anomaly_signals?.length || 0) > 0 ? (
        <>
          <Typography.Title level={5}>异常信号</Typography.Title>
          <Space wrap className="zh-mb-16">
            {alert.anomaly_signals?.map((signal: string) => (
              <LabelTag variant="filled" key={signal} color="warning">
                {signal}
              </LabelTag>
            ))}
          </Space>
        </>
      ) : null}

      <Typography.Title level={5}>工具参数</Typography.Title>
      <EvidenceCodeBlock size="small">{JSON.stringify(alert.arguments ?? {}, null, 2)}</EvidenceCodeBlock>

      <Typography.Title level={5}>工具输出</Typography.Title>
      <EvidenceCodeBlock size="small" maxHeight="small">
        {alert.tool_output?.output ?? '未执行或暂无输出。'}
      </EvidenceCodeBlock>

      <Flex justify="flex-end" className="zh-detail-actions">
        <UiButton icon={<Copy size={16} />} onClick={onCopy}>
          {copied ? '已复制' : '复制证据'}
        </UiButton>
      </Flex>
    </PanelCard>
  );
}
