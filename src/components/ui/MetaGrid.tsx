import type { ReactNode } from 'react';
import { Typography } from 'antd';

export type MetaGridItem = {
  key: string;
  label: ReactNode;
  value: ReactNode;
};

export type MetaGridProps = {
  items: MetaGridItem[];
  columns?: 2 | 3 | 4;
  className?: string;
};

export function MetaGrid({ items, columns = 3, className }: MetaGridProps) {
  const classes = ['zh-meta-grid', `zh-meta-grid--${columns}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {items.map((item) => (
        <div className="zh-meta-grid__item" key={item.key}>
          <Typography.Text type="secondary" className="zh-meta-grid__label">
            {item.label}
          </Typography.Text>
          <Typography.Text className="zh-meta-grid__value">{item.value}</Typography.Text>
        </div>
      ))}
    </div>
  );
}
