import type { ReactNode } from 'react';
import { Typography } from 'antd';

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
  const classes = ['zh-section-title', `zh-section-title--${orientation}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Typography.Text strong>{title}</Typography.Text>
      <Typography.Text type="secondary" className="zh-section-title__meta">
        {meta}
      </Typography.Text>
    </div>
  );
}
