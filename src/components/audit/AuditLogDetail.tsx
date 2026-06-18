import { Descriptions, Flex, Space, Typography } from 'antd';
import { Copy } from 'lucide-react';
import type { AuditLog } from '../../types';
import { riskLabel } from '../../utils';
import { EvidenceCodeBlock, LabelTag, PanelCard, UiBadge, UiButton } from '../ui';

interface AuditLogDetailProps {
  log?: AuditLog;
  copied: boolean;
  onCopy: () => void;
}

export function AuditLogDetail({ log, copied, onCopy }: AuditLogDetailProps) {
  if (!log) {
    return <div className="zh-empty-panel zh-empty-panel--large">选择一条记录查看详情。</div>;
  }

  return (
    <PanelCard
      type="inner"
      title={
        <Space>
          <Typography.Text>{log.tool}</Typography.Text>
          <LabelTag variant="filled">{log.decision}</LabelTag>
        </Space>
      }
      extra={<Typography.Text type="secondary">{log.timestamp.slice(0, 19).replace('T', ' ')}</Typography.Text>}
    >
      <Descriptions column={2} size="small" bordered className="zh-mb-16">
        <Descriptions.Item label="风险等级">
          <LabelTag variant="filled" color={['critical', 'high'].includes(log.risk_level) ? 'error' : 'default'}>
            {riskLabel[log.risk_level]}
          </LabelTag>
        </Descriptions.Item>
        <Descriptions.Item label="风险分">{log.risk_score ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="异常分">{log.anomaly_score ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="策略编号">{log.policy_id}</Descriptions.Item>
        <Descriptions.Item label="实际执行">
          <UiBadge
            status={log.tool_output.executed ? 'success' : 'default'}
            text={log.tool_output.executed ? '是' : '否'}
          />
        </Descriptions.Item>
        <Descriptions.Item label="沙箱执行">
          <UiBadge
            status={log.tool_output.sandboxed ? 'processing' : 'default'}
            text={log.tool_output.sandboxed ? '是' : '否'}
          />
        </Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5}>命中原因</Typography.Title>
      <Typography.Paragraph>{log.reason}</Typography.Paragraph>

      <Typography.Title level={5}>推荐处置</Typography.Title>
      <Typography.Paragraph>{log.recommendation}</Typography.Paragraph>

      {log.risk_factors && log.risk_factors.length > 0 ? (
        <>
          <Typography.Title level={5}>风险因子</Typography.Title>
          <Space wrap className="zh-mb-16">
            {log.risk_factors.map((factor) => (
              <LabelTag variant="filled" key={factor}>
                {factor}
              </LabelTag>
            ))}
          </Space>
        </>
      ) : null}

      <Typography.Title level={5}>工具参数</Typography.Title>
      <EvidenceCodeBlock size="small">{JSON.stringify(log.arguments, null, 2)}</EvidenceCodeBlock>

      <Typography.Title level={5}>工具输出</Typography.Title>
      <EvidenceCodeBlock size="small" maxHeight="small">
        {log.tool_output.output}
      </EvidenceCodeBlock>

      <Flex justify="flex-end" className="zh-detail-actions">
        <UiButton icon={<Copy size={16} />} onClick={onCopy}>
          {copied ? '已复制' : '复制证据'}
        </UiButton>
      </Flex>
    </PanelCard>
  );
}
