import type { ReactNode } from 'react';
import { Play } from 'lucide-react';
import { Space, Typography } from 'antd';
import { UiButton } from '../ui';

type ResultRunButtonProps = {
  hasResult: boolean;
  idleLabel: string;
  rerunLabel: string;
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
};

type RunResultEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  loading: boolean;
  onAction: () => void;
  disabled?: boolean;
  extraActions?: ReactNode;
};

export function ResultRunButton({
  hasResult,
  idleLabel,
  rerunLabel,
  loading,
  onClick,
  disabled
}: ResultRunButtonProps) {
  return (
    <UiButton
      type={hasResult ? 'default' : 'primary'}
      size="small"
      icon={<Play size={14} />}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
    >
      {hasResult ? rerunLabel : idleLabel}
    </UiButton>
  );
}

export function RunResultEmptyState({
  icon,
  title,
  description,
  actionLabel,
  loading,
  onAction,
  disabled,
  extraActions
}: RunResultEmptyStateProps) {
  return (
    <div className="zh-attack-lab__empty">
      <Space orientation="vertical" align="center" size={12}>
        {icon}
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary">{description}</Typography.Text>
        {extraActions ?? (
          <UiButton type="primary" icon={<Play size={16} />} loading={loading} disabled={disabled} onClick={onAction}>
            {actionLabel}
          </UiButton>
        )}
      </Space>
    </div>
  );
}
