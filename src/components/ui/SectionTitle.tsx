import type { ReactNode } from 'react';
import { Space, Typography } from 'antd';

export type SectionTitleProps = {
  title: ReactNode;
  meta?: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

export function SectionTitle({ title, meta, orientation = 'horizontal', className }: SectionTitleProps) {
  if (!meta) {
    return <Typography.Text strong>{title}</Typography.Text>;
  }

  return (
    <Space
      className={className}
      orientation={orientation}
      size={orientation === 'vertical' ? 0 : 8}
      wrap={orientation === 'horizontal'}
    >
      <Typography.Text strong>{title}</Typography.Text>
      <Typography.Text type="secondary" className="zh-section-title__meta">
        {meta}
      </Typography.Text>
    </Space>
  );
}
