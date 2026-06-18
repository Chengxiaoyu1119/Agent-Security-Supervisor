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
    <div className="zh-scroll-list zh-scroll-list--fixed">
      {logs.map((log) => {
        const selected = selectedLogId === log.id;

        return (
          <div
            key={log.id}
            onClick={() => onSelectLog(log.id)}
            className={`zh-selectable-list-item${selected ? ' zh-selectable-list-item--active' : ''}`}
          >
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
              <div className="zh-flex-min">
                <Space wrap>
                  <Typography.Text strong className={selected ? 'zh-text-primary-active' : undefined}>
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
                <Typography.Text className="zh-text-meta zh-text-tertiary">{log.policy_id}</Typography.Text>
              </div>
            </Flex>
          </div>
        );
      })}
      {!logs.length && <div className="zh-empty-panel">没有匹配的审计记录。</div>}
    </div>
  );
}
