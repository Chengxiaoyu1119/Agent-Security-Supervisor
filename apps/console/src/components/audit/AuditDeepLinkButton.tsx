import type React from 'react';
import { Search } from 'lucide-react';
import { UiButton, type UiButtonProps } from '../ui';
import { openAuditLogById } from './auditDeepLink';

type AuditDeepLinkButtonProps = {
  auditId?: string;
  children?: React.ReactNode;
} & Omit<UiButtonProps, 'onClick' | 'icon' | 'children'>;

export function AuditDeepLinkButton({
  auditId,
  children = '查看审计',
  className = '',
  ...props
}: AuditDeepLinkButtonProps) {
  if (!auditId) return null;

  return (
    <UiButton
      icon={<Search size={14} />}
      size="small"
      variant="ghost"
      className={`zh-audit-link-button ${className}`.trim()}
      onClick={() => openAuditLogById(auditId)}
      {...props}
    >
      {children}
    </UiButton>
  );
}
