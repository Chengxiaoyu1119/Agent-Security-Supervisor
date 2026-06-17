import type { ReactNode } from 'react';

export type EvidenceCodeBlockProps = {
  children: ReactNode;
  size?: 'default' | 'small';
  maxHeight?: 'small' | 'large';
  flush?: boolean;
  className?: string;
};

export function EvidenceCodeBlock({
  children,
  size = 'default',
  maxHeight,
  flush = false,
  className
}: EvidenceCodeBlockProps) {
  const classes = [
    'zh-evidence-code-block',
    size === 'small' ? 'zh-evidence-code-block--small' : '',
    maxHeight ? `zh-evidence-code-block--max-${maxHeight}` : '',
    flush ? 'zh-evidence-code-block--flush' : '',
    className ?? ''
  ]
    .filter(Boolean)
    .join(' ');

  return <pre className={classes}>{children}</pre>;
}
