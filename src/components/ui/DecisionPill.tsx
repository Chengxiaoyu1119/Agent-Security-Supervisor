import React from 'react';
import { Tag } from 'antd';

export type DecisionPillProps = { decision: string };

export function DecisionPill({ decision }: DecisionPillProps) {
  let color = 'default';
  if (decision === '通过') color = 'success';
  if (decision === '隔离') color = 'warning';
  if (decision === '拒绝') color = 'error';
  if (decision === '询问') color = 'processing';
  return <Tag color={color}>{decision}</Tag>;
}
