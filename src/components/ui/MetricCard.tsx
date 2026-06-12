import React from 'react';
import { Card, Statistic } from 'antd';

export type MetricCardProps = { label: string; value: React.ReactNode; tone?: 'green' | 'red' | 'amber' | 'cyan' | 'default'; suffix?: string };

export function MetricCard({ label, value, tone = 'default', suffix }: MetricCardProps) {
  const colors = { green: '#52c41a', red: '#ff4d4f', amber: '#faad14', cyan: '#13c2c2', default: 'inherit' };
  return (
    <Card variant="borderless" hoverable styles={{ body: { padding: '16px 24px'  }}}>
      <Statistic title={label} value={value as any} suffix={suffix} styles={{ content: { color: colors[tone as keyof typeof colors] || 'inherit', whiteSpace: 'nowrap'  }}} />
    </Card>
  );
}
