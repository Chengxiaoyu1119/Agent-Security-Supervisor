import { Flex, Space, Typography } from 'antd';
import type { AuditLog } from '../../types';
import { LabelTag } from '../ui';

interface AuditLogListProps {
  logs: AuditLog[];
  selectedLogId?: string;
  onSelectLog: (id: string) => void;
}

export function AuditLogList({ logs, selectedLogId, onSelectLog }: AuditLogListProps) {
  return (
    <div style={{ maxHeight: 600, overflowY: 'auto' }}>
      {logs.map((log) => {
        const selected = selectedLogId === log.id;

        return (
          <div
            key={log.id}
            onClick={() => onSelectLog(log.id)}
            style={{
              cursor: 'pointer',
              background: selected ? 'var(--ant-color-primary-bg)' : 'transparent',
              padding: '12px 16px',
              borderLeft: selected ? '3px solid var(--ant-color-primary)' : '3px solid transparent',
              borderBottom: '1px solid var(--ant-color-border-secondary)'
            }}
          >
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <Space wrap>
                  <Typography.Text strong style={{ color: selected ? 'var(--ant-color-primary)' : 'inherit' }}>
                    {log.tool}
                  </Typography.Text>
                  <LabelTag
                    variant="filled"
                    color={log.decision === '允许' ? 'success' : log.decision === '拒绝' ? 'error' : 'warning'}
                  >
                    {log.decision}
                  </LabelTag>
                </Space>
                <div className="zh-mt-4">
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="zh-title-flush">
                    {log.reason}
                  </Typography.Paragraph>
                </div>
              </div>
              <div>
                <Typography.Text style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)' }}>
                  {log.policy_id}
                </Typography.Text>
              </div>
            </Flex>
          </div>
        );
      })}
      {!logs.length && <div className="zh-empty-panel">没有匹配的审计记录。</div>}
    </div>
  );
}
