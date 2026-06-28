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
          <Typography.Text strong>攻击脚本控制</Typography.Text>
          <Typography.Text type="secondary" className="zh-text-meta">
            {scenario.id}
          </Typography.Text>
        </Space>
      }
      variant="borderless"
    >
      <div className="zh-mb-16">
        <Typography.Text type="secondary" className="zh-text-block zh-mb-8">
          选择脚本
        </Typography.Text>
        <UiSelect
          value={selected}
          onChange={setSelected}
          className="zh-full-width"
          options={scenarios.map((item) => ({ label: `${item.id} - ${item.title}`, value: item.id }))}
        />
      </div>

      <div className="zh-control-switch-row">
        <Typography.Text strong>行为监督器</Typography.Text>
        <Switch checked={guardEnabled} onChange={setGuardEnabled} checkedChildren="开启" unCheckedChildren="关闭" />
      </div>

      <Space orientation="vertical" className="zh-full-width zh-mb-24">
        <UiButton type="primary" block icon={<Play size={16} />} onClick={run} loading={running}>
          {running ? '运行中...' : '运行当前脚本'}
        </UiButton>
        <UiButton block icon={<TerminalSquare size={16} />} onClick={compare} disabled={running}>
          无防护/有防护对比
        </UiButton>
        <UiButton block icon={<ClipboardList size={16} />} onClick={batchCompare} disabled={running}>
          批量对比全部脚本
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
