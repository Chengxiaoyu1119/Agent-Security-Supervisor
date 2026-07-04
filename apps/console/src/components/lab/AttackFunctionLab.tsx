import { useEffect, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { Col, Descriptions, Divider, Row, Space, Typography } from 'antd';
import { fetchAttackLabModules, fetchTargetLabState, resetTargetLabState, runAttackLabModule } from '../../api';
import type { AttackLabModule, AttackLabRunResult, TargetLabState } from '../../types';
import { DecisionPill, LabelTag, MetricCard, PanelCard, UiAlert, UiButton, UiInput, UiSelect, UiSwitch } from '../ui';
import { DEFAULT_ATTACK_LAB_MODULES } from './attackFunctionModules';
import { AttackEvidenceTimeline } from './AttackEvidenceTimeline';
import { AttackModuleOptionsPanel } from './AttackModuleOptionsPanel';
import { defaultAttackModuleOptions, type AttackModuleOptions } from './attackModuleOptions';
import { TargetLabStatePanel } from './TargetLabStatePanel';
import { TargetLabDeltaPanel } from './TargetLabDeltaPanel';
import { attackFunctionIcons, fallbackAttackFunctionIcon } from './attackFunctionIcons';
import { attackFunctionFlowSteps } from './labRuntimeFlowPresets';
import { LabModulePicker } from './LabModulePicker';
import { LabRuntimeFlow } from './LabRuntimeFlow';
import { ResultRunButton, RunResultEmptyState } from './RunResultActions';

type AttackFunctionLabProps = {
  refresh?: () => Promise<unknown>;
};

export function AttackFunctionLab({ refresh }: AttackFunctionLabProps) {
  const [modules, setModules] = useState<AttackLabModule[]>(DEFAULT_ATTACK_LAB_MODULES);
  const [selectedSurface, setSelectedSurface] = useState(DEFAULT_ATTACK_LAB_MODULES[0].surface_id);
  const [attackInput, setAttackInput] = useState(DEFAULT_ATTACK_LAB_MODULES[0].default_input);
  const [moduleOptions, setModuleOptions] = useState<AttackModuleOptions>(
    defaultAttackModuleOptions(DEFAULT_ATTACK_LAB_MODULES[0].surface_id)
  );
  const [executeInSandbox, setExecuteInSandbox] = useState(true);
  const [plannerMode, setPlannerMode] = useState<'fixed' | 'model'>('model');
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<AttackLabRunResult | null>(null);
  const [targetLab, setTargetLab] = useState<TargetLabState | null>(null);
  const [targetLabBeforeRun, setTargetLabBeforeRun] = useState<TargetLabState | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchAttackLabModules()
      .then((response) => {
        if (!mounted) return;
        setModules(response.modules);
        const first = response.modules[0];
        if (first) {
          setSelectedSurface(first.surface_id);
          setAttackInput(first.default_input);
          setModuleOptions(defaultAttackModuleOptions(first.surface_id));
        }
      })
      .catch(() => {
        if (mounted) setNotice('后端未连接时只能查看模块说明，运行实验需要启动智安哨后端。');
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetchTargetLabState()
      .then(setTargetLab)
      .catch(() => undefined);
  }, []);

  const activeModule = useMemo(
    () => modules.find((module) => module.surface_id === selectedSurface) ?? modules[0],
    [modules, selectedSurface]
  );

  function selectModule(module: AttackLabModule) {
    setSelectedSurface(module.surface_id);
    setAttackInput(module.default_input);
    setModuleOptions(defaultAttackModuleOptions(module.surface_id));
    setResult(null);
    setNotice('');
  }

  function selectModuleById(surfaceId: string) {
    const module = modules.find((item) => item.surface_id === surfaceId);
    if (module) selectModule(module);
  }

  async function runModule() {
    if (!activeModule) return;
    setRunning(true);
    setNotice('');
    try {
      const beforeRun = await fetchTargetLabState().catch(() => targetLab);
      setTargetLabBeforeRun(beforeRun);
      const nextResult = await runAttackLabModule({
        surface_id: activeModule.surface_id,
        attack_input: attackInput,
        execute_in_sandbox: executeInSandbox,
        planner_mode: plannerMode,
        force_real_model: plannerMode === 'model',
        options: moduleOptions
      });
      setResult(nextResult);
      setTargetLab(nextResult.target_lab);
      await refresh?.();
    } catch (error) {
      setNotice(`攻击实验运行失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRunning(false);
    }
  }

  async function resetTargetLab() {
    setNotice('');
    try {
      setTargetLab(await resetTargetLabState());
    } catch (error) {
      setNotice(`靶场状态重置失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  if (!activeModule) {
    return <UiAlert type="warning" showIcon title="暂无攻击功能模块。" />;
  }

  return (
    <div className="zh-attack-lab">
      {notice && <UiAlert type="warning" showIcon title={notice} className="zh-mb-24" />}
      <Row gutter={[20, 20]} align="stretch">
        <Col xs={24} xl={7}>
          <LabModulePicker
            title="攻击功能"
            subtitle={`${modules.length} 类可运行攻击面`}
            items={modules.map((module) => ({
              id: module.surface_id,
              title: module.name,
              subtitle: module.tool,
              icon: attackFunctionIcons[module.surface_id] ?? fallbackAttackFunctionIcon
            }))}
            activeId={activeModule.surface_id}
            onSelect={selectModuleById}
          />
        </Col>

        <Col xs={24} xl={9}>
          <PanelCard
            title={`${activeModule.name}实验`}
            subtitle={`${activeModule.target} · ${activeModule.risk_hint}`}
            className="zh-attack-lab__input-panel"
          >
            <Space orientation="vertical" size={16} className="zh-full-width">
              <div className="zh-attack-lab__field">
                <Typography.Text strong>工具调用生成方式</Typography.Text>
                <UiSelect
                  value={plannerMode}
                  onChange={(value) => setPlannerMode(value)}
                  options={[
                    { label: '真实模型规划（后端配置模型）', value: 'model' },
                    { label: '离线规则规划（无模型时复核）', value: 'fixed' }
                  ]}
                />
              </div>
              {plannerMode === 'model' && (
                <UiAlert
                  type="info"
                  showIcon
                  message="运行时会优先调用后端已配置的大模型生成工具调用；接口不可用时才启用本地安全评测模型兜底。"
                />
              )}
              <LabRuntimeFlow compact steps={attackFunctionFlowSteps(plannerMode, executeInSandbox)} />
              <div className="zh-attack-lab__field">
                <Typography.Text strong>攻击输入</Typography.Text>
                <UiInput.TextArea
                  value={attackInput}
                  onChange={(event) => setAttackInput(event.target.value)}
                  rows={8}
                  showCount
                  maxLength={12000}
                />
              </div>
              <PanelCard title="可编辑工具参数" subtitle={activeModule.tool} type="inner">
                <AttackModuleOptionsPanel
                  surfaceId={activeModule.surface_id}
                  value={moduleOptions}
                  onChange={setModuleOptions}
                />
              </PanelCard>
              <div className="zh-attack-lab__switch-row">
                <div>
                  <Typography.Text strong>沙箱执行</Typography.Text>
                  <Typography.Paragraph type="secondary" className="zh-attack-lab__hint">
                    只执行项目内置靶场工具，邮件、文件、API、命令和记忆都限制在本地隔离环境。
                  </Typography.Paragraph>
                </div>
                <UiSwitch checked={executeInSandbox} onChange={setExecuteInSandbox} />
              </div>
              <UiButton type="primary" icon={<Play size={16} />} loading={running} onClick={runModule}>
                运行攻击实验
              </UiButton>
            </Space>
          </PanelCard>
        </Col>

        <Col xs={24} xl={8}>
          <PanelCard
            title="攻防结果"
            subtitle={result ? result.summary.decision_change : '等待运行'}
            className="zh-full-height"
            extra={
              <ResultRunButton
                hasResult={Boolean(result)}
                idleLabel="运行"
                rerunLabel="重新运行"
                loading={running}
                onClick={runModule}
              />
            }
          >
            {result ? (
              <Space orientation="vertical" size={14} className="zh-full-width">
                <Row gutter={[12, 12]} align="stretch">
                  <Col xs={12} sm={12}>
                    <MetricCard
                      label="无防护暴露"
                      value={result.summary.exposed_without_guard ? '是' : '否'}
                      tone={result.summary.exposed_without_guard ? 'red' : 'green'}
                    />
                  </Col>
                  <Col xs={12} sm={12}>
                    <MetricCard
                      label="有防护控制"
                      value={result.summary.controlled_with_guard ? '是' : '否'}
                      tone={result.summary.controlled_with_guard ? 'green' : 'red'}
                    />
                  </Col>
                </Row>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="生成方式">{result.module.planner_mode}</Descriptions.Item>
                  <Descriptions.Item label="规划器">
                    {result.model_plan.provider} {result.model_plan.model}
                  </Descriptions.Item>
                  <Descriptions.Item label="无防护决策">
                    <DecisionPill decision={result.without_guard.decision} />
                  </Descriptions.Item>
                  <Descriptions.Item label="监督器决策">
                    <DecisionPill decision={result.with_guard.decision} />
                  </Descriptions.Item>
                  <Descriptions.Item label="命中策略">{result.summary.policy_id}</Descriptions.Item>
                  <Descriptions.Item label="风险分">{result.summary.risk_score}</Descriptions.Item>
                </Descriptions>
                <Divider className="zh-attack-lab__divider" />
                <TargetLabDeltaPanel before={targetLabBeforeRun} after={result.target_lab} />
                <Divider className="zh-attack-lab__divider" />
                <div className="zh-attack-lab__explain-list">
                  {result.explanation.map((item) => (
                    <div key={item.title} className="zh-attack-lab__explain-item">
                      <LabelTag color="blue">{item.title}</LabelTag>
                      <Typography.Text>{item.text}</Typography.Text>
                    </div>
                  ))}
                </div>
              </Space>
            ) : (
              <RunResultEmptyState
                icon={<Play size={28} />}
                title="等待运行攻击实验"
                description="会调用后端攻击模块、本地沙箱工具和监督器，生成无防护/有防护两组真实审计结果。"
                actionLabel="运行攻击实验"
                loading={running}
                onAction={runModule}
              />
            )}
          </PanelCard>
        </Col>
      </Row>

      {result && (
        <Row gutter={[20, 20]} className="zh-attack-lab__evidence-row">
          <Col xs={24} lg={14}>
            <AttackEvidenceTimeline result={result} />
          </Col>
          <Col xs={24} lg={10}>
            <PanelCard title="监督证据" subtitle={result.with_guard.audit_id}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="处置方式">{result.summary.execution_mode}</Descriptions.Item>
                <Descriptions.Item label="判定原因">{result.with_guard.reason}</Descriptions.Item>
                <Descriptions.Item label="防御建议">{result.with_guard.recommendation}</Descriptions.Item>
                <Descriptions.Item label="上下文来源">{result.context_sources.join(', ')}</Descriptions.Item>
              </Descriptions>
            </PanelCard>
          </Col>
        </Row>
      )}

      <TargetLabStatePanel targetLab={targetLab} onReset={resetTargetLab} />
    </div>
  );
}
