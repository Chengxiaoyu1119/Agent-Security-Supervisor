import React from 'react';
import { Card, Statistic } from 'antd';

export type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: 'green' | 'red' | 'amber' | 'cyan' | 'default';
  suffix?: string;
};

export function MetricCard({ label, value, tone = 'default', suffix }: MetricCardProps) {
  const colors: Record<NonNullable<MetricCardProps['tone']>, string> = {
    green: 'var(--zh-risk-low)',
    red: 'var(--zh-risk-critical)',
    amber: 'var(--zh-risk-high)',
    cyan: 'var(--zh-risk-cyan)',
    default: 'inherit'
  };
  return (
    <Card variant="borderless" hoverable styles={{ body: { padding: '16px 24px' } }}>
      <Statistic
        title={label}
        value={value}
        suffix={suffix}
        styles={{ content: { color: colors[tone as keyof typeof colors] || 'inherit', whiteSpace: 'nowrap' } }}
      />
    </Card>
  );
}
