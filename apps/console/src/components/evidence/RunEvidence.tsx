import type { AuditLog, RunResult } from '@/types';
import { Typography, Space, Timeline, Descriptions } from 'antd';
import { LabelTag, PanelCard } from '../ui';

export function RunEvidenceStrip({
  title,
  run,
  compact = false
}: {
  title: string;
  run: RunResult;
  compact?: boolean;
}) {
  const log = run.audit_logs[0];
  return (
    <PanelCard
      size={compact ? 'small' : 'default'}
      type="inner"
      title={
        <Space>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">{run.scenario.id}</Typography.Text>
        </Space>
      }
      className="zh-mb-16"
    >
      <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }} bordered className="zh-mb-16">
        <Descriptions.Item label="决策">
          <LabelTag color={log?.decision === '允许' ? 'success' : log?.decision === '拒绝' ? 'error' : 'warning'}>
            {log?.decision ?? '未记录'}
          </LabelTag>
        </Descriptions.Item>
        <Descriptions.Item label="策略">{log?.policy_id ?? '未记录'}</Descriptions.Item>
        <Descriptions.Item label="风险分">{log?.risk_score ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="异常分">{log?.anomaly_score ?? '-'}</Descriptions.Item>
      </Descriptions>
      <Typography.Paragraph type="secondary" className="zh-mb-16">
        {log?.reason ?? '暂无监督判定原因。'}
      </Typography.Paragraph>
      <Typography.Text code>{log?.audit_hash ?? '暂无审计 hash'}</Typography.Text>
    </PanelCard>
  );
}

export function RunAuditTimeline({
  title,
  logs,
  compact = false
}: {
  title: string;
  logs: AuditLog[];
  compact?: boolean;
}) {
  if (logs.length <= 1) {
    return null;
  }
  return (
    <PanelCard
      size={compact ? 'small' : 'default'}
      type="inner"
      title={
        <Space>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">{logs.length} 步工具调用</Typography.Text>
        </Space>
      }
      className="zh-mb-16"
    >
      <Timeline
        items={logs.map((log) => ({
          color: log.decision === '允许' ? 'green' : log.decision === '拒绝' ? 'red' : 'orange',
          content: (
            <div className="zh-mb-16">
              <Space className="zh-mb-8">
                <Typography.Text strong>{log.tool}</Typography.Text>
                <LabelTag color={log.decision === '允许' ? 'success' : log.decision === '拒绝' ? 'error' : 'warning'}>
                  {log.decision}
                </LabelTag>
                <Typography.Text type="secondary" className="zh-text-meta">
                  {log.policy_id}
                </Typography.Text>
              </Space>
              <br />
              <Space className="zh-mb-8">
                <Typography.Text type="secondary" className="zh-text-meta">
                  风险分: {log.risk_score ?? '-'}
                </Typography.Text>
                <Typography.Text type="secondary" className="zh-text-meta">
                  异常分: {log.anomaly_score ?? '-'}
                </Typography.Text>
              </Space>
              <br />
              <Typography.Text code className="zh-text-meta">
                {log.audit_hash ? log.audit_hash.slice(0, 16) : '暂无 hash'}
              </Typography.Text>
            </div>
          )
        }))}
      />
    </PanelCard>
  );
}
