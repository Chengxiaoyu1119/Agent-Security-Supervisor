import type { ReactNode } from 'react';

export type ActionRowProps = {
  children?: ReactNode;
  content?: ReactNode;
  className?: string;
};

export function ActionRow({ children, content, className }: ActionRowProps) {
  const classes = ['zh-action-row', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {content ? <div className="zh-action-row__content">{content}</div> : null}
      {children ? <div className="zh-action-row__actions">{children}</div> : null}
    </div>
  );
}
