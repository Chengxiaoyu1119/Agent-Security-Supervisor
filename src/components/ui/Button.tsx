import React from 'react';
import { Button as AntButton, ButtonProps } from 'antd';

export type UiButtonProps = { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'default', icon?: React.ReactNode } & Omit<ButtonProps, 'variant'>;

export function UiButton({ variant = 'default', className = '', icon, children, ...props }: UiButtonProps) {
  let type: ButtonProps['type'] = undefined;
  let danger = false;
  if (variant === 'primary') type = 'primary';
  if (variant === 'ghost') type = 'text';
  if (variant === 'danger') { type = 'primary'; danger = true; }
  
  return (
    <AntButton type={type} danger={danger} icon={icon} className={className} {...props}>
      {children}
    </AntButton>
  );
}
