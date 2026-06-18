import { Space, Switch, Typography } from 'antd';
import { ClipboardList, Play, TerminalSquare } from 'lucide-react';
import { PanelCard, UiButton, UiSelect } from '../ui';
import type { ExperimentLabProps } from './ExperimentLab.types';

type ExperimentControlPanelProps = Pick<
  ExperimentLabProps,
  | 'scenario'
  | 'scenarios'
  | 'selected'
  | 'setSelected'
  | 'guardEnabled'
  | 'setGuardEnabled'
  | 'running'
  | 'run'
  | 'compare'
  | 'batchCompare'
>;

export function ExperimentControlPanel({
  scenario,
  scenarios,
  selected,
  setSelected,
  guardEnabled,
  setGuardEnabled,
  running,
  run,
  compare,
  batchCompare
}: ExperimentControlPanelProps) {
  return (
    <PanelCard
      title={
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>攻击剧本控制</Typography.Text>
          <Typography.Text type="secondary" className="zh-text-meta">
            {scenario.id}
          </Typography.Text>
        </Space>
      }
      variant="borderless"
    >
      <div className="zh-mb-16">
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          选择剧本
        </Typography.Text>
        <UiSelect
          value={selected}
          onChange={setSelected}
          className="zh-full-width"
          options={scenarios.map((item) => ({ label: `${item.id} - ${item.title}`, value: item.id }))}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          padding: '12px 16px',
          background: 'var(--ant-color-fill-quaternary)',
          borderRadius: 8
        }}
      >
        <Typography.Text strong>行为监督器</Typography.Text>
        <Switch checked={guardEnabled} onChange={setGuardEnabled} checkedChildren="开启" unCheckedChildren="关闭" />
      </div>

      <Space orientation="vertical" style={{ width: '100%', marginBottom: 24 }}>
        <UiButton type="primary" block icon={<Play size={16} />} onClick={run} loading={running}>
          {running ? '运行中...' : '运行当前剧本'}
        </UiButton>
        <UiButton block icon={<TerminalSquare size={16} />} onClick={compare} disabled={running}>
          无防护/有防护对比
        </UiButton>
        <UiButton block icon={<ClipboardList size={16} />} onClick={batchCompare} disabled={running}>
          批量对比全部剧本
        </UiButton>
      </Space>

      <PanelCard type="inner" title="智能体攻击脚本步骤" size="small">
        <ol className="zh-ordered-list">
          {scenario.script_steps.map((step) => (
            <li key={step}>
              <Typography.Text>{step}</Typography.Text>
            </li>
          ))}
        </ol>
      </PanelCard>
    </PanelCard>
  );
}
