import React from 'react';
import { Empty } from 'antd';

export type EmptyStateProps = {
  description?: React.ReactNode;
};

export function EmptyState({ description = '暂无数据' }: EmptyStateProps) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />;
}
