import { useMemo } from 'react';
import { Space, Typography } from 'antd';
import { Play, ShieldCheck, TerminalSquare } from 'lucide-react';
import type { RunResult, Scenario } from '@/types';
import { ActionRow, LabelTag, UiButton } from '../ui';

function buildRunStatus(run?: RunResult) {
  if (!run) {
    return {
      label: '待运行',
      tag: '未生成 run_id',
      tone: 'default'
    };
  }

  if (run.guard_enabled && !run.attack_success) {
    return {
      label: '有防护已控制',
      tag: run.run_id,
      tone: 'success'
    };
  }

  if (run.guard_enabled && run.attack_success) {
    return {
      label: '有防护仍需复核',
      tag: run.run_id,
      tone: 'warning'
    };
  }

  return {
    label: run.attack_success ? '无防护已复现' : '无防护未复现',
    tag: run.run_id,
    tone: run.attack_success ? 'warning' : 'default'
  };
}

export function ScenarioRunStatusPanel({
  scenario,
  recentRuns,
  running,
  onRunScenario,
  onCompareScenario,
  onOpenAudit
}: {
  scenario: Scenario;
  recentRuns: RunResult[];
  running: boolean;
  onRunScenario: (id: string) => void;
  onCompareScenario: (id: string) => void;
  onOpenAudit: () => void;
}) {
  const latestScenarioRun = useMemo(
    () => recentRuns.find((run) => run.scenario.id === scenario.id),
    [recentRuns, scenario.id]
  );
  const latestRunStatus = buildRunStatus(latestScenarioRun);

  return (
    <>
      <ActionRow
        className="zh-scenario-action-row"
        content={
          <Space orientation="vertical" size={2}>
            <Typography.Text strong>当前脚本运行闭环</Typography.Text>
            <Typography.Text type="secondary" className="zh-text-meta">
              按钮会调用后端真实运行接口，运行后自动进入实验室并刷新审计、告警和报告基础数据。
            </Typography.Text>
          </Space>
        }
      >
        <UiButton type="primary" icon={<Play size={16} />} loading={running} onClick={() => onRunScenario(scenario.id)}>
          运行防护复现
        </UiButton>
        <UiButton icon={<TerminalSquare size={16} />} disabled={running} onClick={() => onCompareScenario(scenario.id)}>
          攻防对照
        </UiButton>
        <UiButton icon={<ShieldCheck size={16} />} onClick={onOpenAudit}>
          查看审计
        </UiButton>
      </ActionRow>

      <div className="zh-scenario-run-steps">
        <span>
          <strong>01</strong> 后端运行脚本
        </span>
        <span>
          <strong>02</strong> 调用业务工具
        </span>
        <span>
          <strong>03</strong> 监督器判定
        </span>
        <span>
          <strong>04</strong> 同步审计证据
        </span>
      </div>

      <div className="zh-scenario-runtime-grid">
        <div>
          <span>最近运行</span>
          <strong>{latestRunStatus.label}</strong>
          <LabelTag color={latestRunStatus.tone}>{latestRunStatus.tag}</LabelTag>
        </div>
        <div>
          <span>工具调用</span>
          <strong>{scenario.tool_calls.length}</strong>
          <em>{scenario.tool_calls.map((call) => call.tool).join('、') || '无外部工具'}</em>
        </div>
        <div>
          <span>审计证据</span>
          <strong>{latestScenarioRun?.audit_logs.length ?? 0}</strong>
          <em>{latestScenarioRun ? '已写入运行记录' : '运行后生成审计 hash'}</em>
        </div>
      </div>
    </>
  );
}
