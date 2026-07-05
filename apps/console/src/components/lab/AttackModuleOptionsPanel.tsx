import type { ReactNode } from 'react';
import { Space, Typography } from 'antd';
import { UiInput, UiSelect } from '../ui';
import type { AttackModuleOptions } from './attackModuleOptions';

type AttackModuleOptionsPanelProps = {
  surfaceId: string;
  value: AttackModuleOptions;
  onChange: (value: AttackModuleOptions) => void;
};

const CODE_COMMAND_OPTIONS = [
  { label: '安全探针：打印 Python 版本', value: 'python --version' },
  { label: '安全探针：打印 Python 简写版本', value: 'python -V' },
  { label: '劫持载荷：PowerShell 编码命令', value: 'powershell -enc <redacted>' },
  { label: '劫持载荷：删除命令', value: 'rm -rf /tmp/agent-lab' }
];

function mergeOption(current: AttackModuleOptions, key: string, nextValue: string): AttackModuleOptions {
  return { ...current, [key]: nextValue };
}

export function AttackModuleOptionsPanel({ surfaceId, value, onChange }: AttackModuleOptionsPanelProps) {
  if (surfaceId === 'prompt-injection') {
    return (
      <Space orientation="vertical" size={12} className="zh-full-width">
        <OptionField label="外发收件人">
          <UiInput value={value.to} onChange={(event) => onChange(mergeOption(value, 'to', event.target.value))} />
        </OptionField>
        <OptionField label="邮件主题">
          <UiInput
            value={value.subject}
            onChange={(event) => onChange(mergeOption(value, 'subject', event.target.value))}
          />
        </OptionField>
      </Space>
    );
  }

  if (surfaceId === 'jailbreak') {
    return (
      <OptionField label="模型响应主题">
        <UiInput value={value.topic} onChange={(event) => onChange(mergeOption(value, 'topic', event.target.value))} />
      </OptionField>
    );
  }

  if (surfaceId === 'data-leakage') {
    return (
      <OptionField label="读取路径">
        <UiInput value={value.path} onChange={(event) => onChange(mergeOption(value, 'path', event.target.value))} />
      </OptionField>
    );
  }

  if (surfaceId === 'tool-hijack') {
    return (
      <OptionField label="代码执行参数">
        <UiSelect
          value={value.command}
          options={CODE_COMMAND_OPTIONS}
          onChange={(nextValue) => onChange(mergeOption(value, 'command', String(nextValue)))}
        />
      </OptionField>
    );
  }

  if (surfaceId === 'memory-poison') {
    return (
      <OptionField label="记忆来源标记">
        <UiInput
          value={value.source}
          onChange={(event) => onChange(mergeOption(value, 'source', event.target.value))}
        />
      </OptionField>
    );
  }

  if (surfaceId === 'environment-pollution') {
    return (
      <OptionField label="读取的环境键">
        <UiInput value={value.key} onChange={(event) => onChange(mergeOption(value, 'key', event.target.value))} />
      </OptionField>
    );
  }

  if (surfaceId === 'abuse-risk') {
    return (
      <OptionField label="模拟 API 端点">
        <UiInput
          value={value.endpoint}
          onChange={(event) => onChange(mergeOption(value, 'endpoint', event.target.value))}
        />
      </OptionField>
    );
  }

  return null;
}

function OptionField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="zh-attack-lab__field">
      <Typography.Text strong>{label}</Typography.Text>
      {children}
    </div>
  );
}
