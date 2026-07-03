import { Alert, Badge, Input, InputNumber, Progress, Select, Switch, Table, Tabs } from 'antd';
import type { AlertProps } from 'antd';

export const UiBadge = Badge;
export const UiInput = Input;
export const UiInputNumber = InputNumber;
export const UiProgress = Progress;
export const UiSelect = Select;
export const UiSwitch = Switch;
export const UiTable = Table;
export const UiTabs = Tabs;

export type UiAlertProps = Omit<AlertProps, 'message'> & {
  message?: AlertProps['message'];
};

export function UiAlert({ title, message, ...props }: UiAlertProps) {
  return <Alert {...props} title={title ?? message} />;
}

export type { BadgeProps as UiBadgeProps } from 'antd';
export type { InputProps as UiInputProps } from 'antd';
export type { InputNumberProps as UiInputNumberProps } from 'antd';
export type { ProgressProps as UiProgressProps } from 'antd';
export type { SelectProps as UiSelectProps } from 'antd';
export type { SwitchProps as UiSwitchProps } from 'antd';
export type { TableProps as UiTableProps } from 'antd';
export type { TabsProps as UiTabsProps } from 'antd';
