import type { Key, ReactNode } from 'react';
import { Space, Tag, Typography } from 'antd';
import { EmptyState } from './EmptyState';
import { PanelCard } from './PanelCard';

export type EvidenceListTone = 'default' | 'danger' | 'warning' | 'info' | 'success';

export type EvidenceListTag = {
  key?: Key;
  label: ReactNode;
  color?: string;
};

export type EvidenceListItem = {
  key: Key;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  extra?: ReactNode;
  tags?: EvidenceListTag[];
  content?: ReactNode;
  tone?: EvidenceListTone;
};

export type EvidenceListProps = {
  items: EvidenceListItem[];
  emptyText?: ReactNode;
  className?: string;
};

export function EvidenceList({ items, emptyText = '暂无数据', className }: EvidenceListProps) {
  if (!items.length) {
    return <EmptyState description={emptyText} />;
  }

  const classes = ['zh-evidence-list', className].filter(Boolean).join(' ');

  return (
    <Space orientation="vertical" size="middle" className={classes}>
      {items.map((item) => (
        <PanelCard
          key={item.key}
          size="small"
          className={`zh-evidence-list__item zh-evidence-list__item--${item.tone ?? 'default'}`}
        >
          <div className="zh-evidence-list__header">
            <Typography.Text strong>{item.title}</Typography.Text>
            {item.extra}
          </div>
          {item.description ? (
            <Typography.Paragraph type="secondary" className="zh-evidence-list__description">
              {item.description}
            </Typography.Paragraph>
          ) : null}
          {item.tags?.length ? (
            <Space size={[0, 8]} wrap className="zh-evidence-list__tags">
              {item.tags.map((tag, index) => (
                <Tag key={tag.key ?? index} color={tag.color}>
                  {tag.label}
                </Tag>
              ))}
            </Space>
          ) : null}
          {item.meta ? (
            <Typography.Text type="secondary" className="zh-evidence-list__meta">
              {item.meta}
            </Typography.Text>
          ) : null}
          {item.content}
        </PanelCard>
      ))}
    </Space>
  );
}
