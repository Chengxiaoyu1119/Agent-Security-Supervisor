import type { AuditLog, RunResult } from '../../types';
import { Card, Typography, Space, Timeline, Tag, Descriptions } from 'antd';

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
    <Card
      size={compact ? 'small' : 'default'}
      type="inner"
      title={
        <Space>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">{run.scenario.id}</Typography.Text>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="决策">
          <Tag color={log?.decision === '允许' ? 'success' : log?.decision === '拒绝' ? 'error' : 'warning'}>
            {log?.decision ?? '未记录'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="策略">{log?.policy_id ?? '未记录'}</Descriptions.Item>
        <Descriptions.Item label="风险分">{log?.risk_score ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="异常分">{log?.anomaly_score ?? '-'}</Descriptions.Item>
      </Descriptions>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {log?.reason ?? '暂无监督判定原因。'}
      </Typography.Paragraph>
      <Typography.Text code>{log?.audit_hash ?? '暂无审计 hash'}</Typography.Text>
    </Card>
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
    <Card
      size={compact ? 'small' : 'default'}
      type="inner"
      title={
        <Space>
          <Typography.Text strong>{title}</Typography.Text>
          <Typography.Text type="secondary">{logs.length} 步工具调用</Typography.Text>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Timeline
        items={logs.map((log) => ({
          color: log.decision === '允许' ? 'green' : log.decision === '拒绝' ? 'red' : 'orange',
          content: (
            <div style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 8 }}>
                <Typography.Text strong>{log.tool}</Typography.Text>
                <Tag color={log.decision === '允许' ? 'success' : log.decision === '拒绝' ? 'error' : 'warning'}>
                  {log.decision}
                </Tag>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {log.policy_id}
                </Typography.Text>
              </Space>
              <br />
              <Space style={{ marginBottom: 8 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  风险分: {log.risk_score ?? '-'}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  异常分: {log.anomaly_score ?? '-'}
                </Typography.Text>
              </Space>
              <br />
              <Typography.Text code style={{ fontSize: 12 }}>
                {log.audit_hash ? log.audit_hash.slice(0, 16) : '暂无 hash'}
              </Typography.Text>
            </div>
          )
        }))}
      />
    </Card>
  );
}
