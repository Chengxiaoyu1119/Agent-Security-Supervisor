import { Space, Typography } from 'antd';
import { AlertTriangle } from 'lucide-react';
import type { AlertItem } from '@/types';
import { LabelTag } from '../ui';

interface AlertListProps {
  alerts: AlertItem[];
  selectedAlertId?: string;
  onSelectAlert: (id: string) => void;
}

function getAlertIconColor(alert: AlertItem) {
  return alert.severity === 'critical' || alert.severity === 'high'
    ? 'var(--ant-color-error)'
    : 'var(--ant-color-warning)';
}

function getDecisionColor(decision: AlertItem['decision']) {
  if (decision === '允许') return 'success';
  if (decision === '拒绝') return 'error';
  return 'warning';
}

export function AlertList({ alerts, selectedAlertId, onSelectAlert }: AlertListProps) {
  return (
    <div className="zh-scroll-list zh-scroll-list--fixed zh-scroll-list--stack">
      {alerts.map((alert) => {
        const selected = selectedAlertId === alert.id;

        return (
          <div
            key={alert.id}
            onClick={() => onSelectAlert(alert.id)}
            className={`zh-selectable-list-item zh-selectable-list-item--flex${
              selected ? ' zh-selectable-list-item--active' : ''
            }`}
          >
            <div className="zh-list-icon-offset">
              <AlertTriangle size={20} color={getAlertIconColor(alert)} />
            </div>
            <div className="zh-flex-spacer">
              <Space>
                <Typography.Text strong className={selected ? 'zh-text-primary-active' : undefined}>
                  {alert.title}
                </Typography.Text>
                <LabelTag variant="filled" color={getDecisionColor(alert.decision)}>
                  {alert.decision}
                </LabelTag>
              </Space>
              <div className="zh-mt-4">
                <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="zh-mb-4">
                  {alert.evidence}
                </Typography.Paragraph>
                <Space wrap size={[0, 4]}>
                  <Typography.Text className="zh-text-meta">{alert.scenario_id ?? '未知剧本'}</Typography.Text>
                  <Typography.Text className="zh-text-meta">·</Typography.Text>
                  <Typography.Text className="zh-text-meta">{alert.policy_id ?? '未知策略'}</Typography.Text>
                  <Typography.Text className="zh-text-meta">·</Typography.Text>
                  <Typography.Text type="danger" className="zh-text-meta">
                    {alert.risk_score ?? '-'}分
                  </Typography.Text>
                </Space>
              </div>
            </div>
          </div>
        );
      })}
      {!alerts.length && <div className="zh-empty-panel">暂无告警记录</div>}
    </div>
  );
}
