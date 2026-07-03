import React from 'react';
import { Tag } from 'antd';

export type StatusPillProps = { status: string; variant?: 'solid' | 'outline' };

export function StatusPill({ status, variant = 'solid' }: StatusPillProps) {
  let color = 'default';
  if (status === '已评估' || status === '评估中') color = 'success';
  if (status === '待生成' || status === '未覆盖') color = 'error';
  return (
    <Tag color={color} bordered={variant === 'outline'} className="zh-label-tag">
      {status}
    </Tag>
  );
}
