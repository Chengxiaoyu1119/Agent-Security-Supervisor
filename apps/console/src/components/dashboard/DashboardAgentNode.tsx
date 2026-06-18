import type { ReactNode } from 'react';
import { Typography } from 'antd';

type DashboardAgentNodeProps = {
  icon: ReactNode;
  title: string;
  desc: string;
  active?: boolean;
  activeTone?: 'primary' | 'success';
};

export function DashboardAgentNode({ icon, title, desc, active, activeTone = 'primary' }: DashboardAgentNodeProps) {
  const nodeClass = ['zh-dashboard-agent-node', active ? `zh-dashboard-agent-node--${activeTone}` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={nodeClass}>
      <div className="zh-dashboard-agent-node__icon">{icon}</div>
      <Typography.Text strong className="zh-text-body zh-text-block">
        {title}
      </Typography.Text>
      <Typography.Text type="secondary" className="zh-text-micro">
        {desc}
      </Typography.Text>
    </div>
  );
}
