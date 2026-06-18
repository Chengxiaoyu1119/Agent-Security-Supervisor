import React from 'react';
import { Tag } from 'antd';
import type { RiskLevel } from '@/types';
import { riskLabel } from '@/utils';

export type RiskTagProps = {
  risk: RiskLevel | string;
  suffix?: string;
};

export function RiskTag({ risk, suffix = '风险' }: RiskTagProps) {
  let color = 'default';
  if (risk === 'critical') color = 'error';
  if (risk === 'high') color = 'warning';
  if (risk === 'medium') color = 'processing';
  if (risk === 'low') color = 'success';

  const label = riskLabel[risk] ?? risk;
  return (
    <Tag color={color}>
      {label}
      {suffix}
    </Tag>
  );
}
