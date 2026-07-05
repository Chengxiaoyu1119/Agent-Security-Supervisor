import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Play, ShieldCheck, Target, TerminalSquare } from 'lucide-react';
import { Col, Descriptions, Row, Space, Typography } from 'antd';
import { fetchLearningLabScenarios, fetchTargetLabState, resetTargetLabState, runLearningLabAttack } from '../../api';
import type { LearningLabRunResult, LearningLabScenario, TargetLabState } from '../../types';
import { AuditDeepLinkButton } from '../audit/AuditDeepLinkButton';
import { DecisionPill, EvidenceCodeBlock, MetricCard, PanelCard, UiAlert, UiButton, UiInput, UiSwitch } from '../ui';
import { TargetLabStatePanel } from './TargetLabStatePanel';
import { LabModulePicker } from './LabModulePicker';
import {
  FALLBACK_SCENARIOS,
  assetProfile,
  compromisedAssetsText,
  scenarioIcon,
  stepLabels,
  stepState
} from './penetrationLearningProfiles';
import { penetrationFlowSteps } from './labRuntimeFlowPresets';
import { LabRuntimeFlow } from './LabRuntimeFlow';
import { ResultRunButton, RunResultEmptyState } from './RunResultActions';

type PenetrationLearningLabProps = {
  refresh?: () => Promise<unknown>;
};

export function PenetrationLearningLab({ refresh }: PenetrationLearningLabProps) {
  const [scenarios, setScenarios] = useState<LearningLabScenario[]>(FALLBACK_SCENARIOS);
  const [selectedId, setSelectedId] = useState(FALLBACK_SCENARIOS[0].id);
  const [attackInput, setAttackInput] = useState(FALLBACK_SCENARIOS[0].default_input);
  const [executeInSandbox, setExecuteInSandbox] = useState(true);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<LearningLabRunResult | null>(null);
  const [targetLab, setTargetLab] = useState<TargetLabState | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchLearningLabScenarios()
      .then((response) => {
        if (!mounted) return;
        setScenarios(response.scenarios);
        const first = response.scenarios[0];
        if (first) {
          setSelectedId(first.id);
          setAttackInput(first.default_input);
        }
      })
      .catch(() => {
        if (mounted) setNotice('后端未连接时只能查看默认场景，运行本地受控环境需要启动智安哨后端。');
      });
    fetchTargetLabState()
      .then((state) => {
        if (mounted) setTargetLab(state);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedId) ?? scenarios[0] ?? FALLBACK_SCENARIOS[0],
    [scenarios, selectedId]
  );
  const activeAsset = useMemo(() => assetProfile(activeScenario), [activeScenario]);

  function selectScenario(nextId: string) {
    const scenario = scenarios.find((item) => item.id === nextId);
    if (!scenario) return;
    setSelectedId(nextId);
    setAttackInput(scenario.default_input);
    setResult(null);
    setNotice('');
  }

  async function runAttack() {
    if (!activeScenario) return;
    setRunning(true);
    setNotice('');
    try {
      const nextResult = await runLearningLabAttack({
        scenario_id: activeScenario.id,
        attack_input: attackInput,
        execute_in_sandbox: executeInSandbox
      });
      setResult(nextResult);
      setTargetLab(nextResult.target_lab);
      await refresh?.();
    } catch (error) {
      setNotice(`本地受控环境攻击失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRunning(false);
    }
  }

  async function resetTargetLab() {
    setNotice('');
    try {
      setTargetLab(await resetTargetLabState());
      setResult(null);
      await refresh?.();
    } catch (error) {
      setNotice(`本地受控环境重置失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  if (!activeScenario) {
    return <UiAlert type="warning" showIcon title="暂无本地受控环境场景。" />;
  }

  return (
    <div className="zh-attack-lab">
      {notice && <UiAlert type="warning" showIcon title={notice} className="zh-mb-24" />}

      <PanelCard title="本地受控实验分步训练" subtitle="从目标资产开始操作，不再只看一键结果" className="zh-mb-24">
        <div className="zh-lab-step-strip">
          {stepLabels.map((label, index) => (
            <div key={label} className={`zh-lab-step zh-lab-step--${stepState(index, Boolean(result))}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
        <LabRuntimeFlow
          compact
          title="本地受控环境执行路径"
          steps={penetrationFlowSteps(activeAsset.asset, activeScenario.category, executeInSandbox, Boolean(result))}
        />
      </PanelCard>

      <Row gutter={[20, 20]} align="stretch">
        <Col xs={24} xl={6}>
          <LabModulePicker
            title="选择攻击面"
            subtitle={`${scenarios.length} 类本机授权目标`}
            items={scenarios.map((scenario) => ({
              id: scenario.id,
              title: scenario.name,
              subtitle: scenario.tool,
              icon: scenarioIcon(scenario.id)
            }))}
            activeId={activeScenario.id}
            onSelect={selectScenario}
          />
        </Col>

        <Col xs={24} xl={9}>
          <PanelCard
            title="目标资产与攻击构造"
            subtitle={`${activeScenario.category} · ${activeScenario.risk_hint}`}
            className="zh-attack-lab__input-panel"
          >
            <Space orientation="vertical" size={16} className="zh-full-width">
              <div className="zh-target-asset-grid">
                <div className="zh-target-asset-card">
                  <Target size={18} />
                  <strong>{activeAsset.asset}</strong>
                  <Typography.Text type="secondary">{activeAsset.visibleState}</Typography.Text>
                </div>
                <div className="zh-target-asset-card">
                  <AlertCircle size={18} />
                  <strong>利用动作</strong>
                  <Typography.Text type="secondary">{activeAsset.operation}</Typography.Text>
                </div>
              </div>

              <Descriptions column={1} size="small">
                <Descriptions.Item label="目标工具">{activeScenario.tool}</Descriptions.Item>
                <Descriptions.Item label="攻破信号">{activeAsset.successSignal}</Descriptions.Item>
                <Descriptions.Item label="防御策略">{activeScenario.defense}</Descriptions.Item>
              </Descriptions>

              <div className="zh-attack-lab__field">
                <Typography.Text strong>攻击输入</Typography.Text>
                <UiInput.TextArea
                  value={attackInput}
                  onChange={(event) => setAttackInput(event.target.value)}
                  rows={7}
                  showCount
                  maxLength={8000}
                />
              </div>
              <div className="zh-attack-lab__switch-row">
                <div>
                  <Typography.Text strong>执行本地沙箱工具</Typography.Text>
                  <Typography.Paragraph type="secondary" className="zh-attack-lab__hint">
                    只触碰项目自带受控环境文件、模拟 API、受控记忆和安全探针，不访问真实外部系统。
                  </Typography.Paragraph>
                </div>
                <UiSwitch checked={executeInSandbox} onChange={setExecuteInSandbox} />
              </div>
              <UiButton type="primary" icon={<Play size={16} />} loading={running} onClick={runAttack} block>
                执行当前攻击步骤
              </UiButton>
            </Space>
          </PanelCard>
        </Col>

        <Col xs={24} xl={9}>
          <PanelCard
            title="攻破与防护结果"
            subtitle={result ? result.summary.decision_change : '等待执行'}
            className="zh-full-height"
            extra={
              <ResultRunButton
                hasResult={Boolean(result)}
                idleLabel="执行"
                rerunLabel="重新执行"
                loading={running}
                onClick={runAttack}
              />
            }
          >
            {result ? (
              <Space orientation="vertical" size={16} className="zh-full-width">
                <Row gutter={[12, 12]}>
                  <Col xs={12} lg={6}>
                    <MetricCard
                      label="无防护"
                      value={result.summary.exploited_without_guard ? '攻破' : '未攻破'}
                      tone={result.summary.exploited_without_guard ? 'red' : 'green'}
                    />
                  </Col>
                  <Col xs={12} lg={6}>
                    <MetricCard
                      label="监督器"
                      value={result.summary.blocked_with_guard ? '拦截' : '放行'}
                      tone={result.summary.blocked_with_guard ? 'green' : 'red'}
                    />
                  </Col>
                  <Col xs={12} lg={6}>
                    <MetricCard label="暴露资产" value={result.summary.compromised_assets.length} tone="amber" />
                  </Col>
                  <Col xs={12} lg={6}>
                    <MetricCard label="风险分" value={result.guarded.risk_score ?? 0} tone="cyan" />
                  </Col>
                </Row>

                <PanelCard title="Agent 规划的真实工具调用" subtitle={<TerminalSquare size={16} />} type="inner">
                  <EvidenceCodeBlock>{JSON.stringify(result.tool_call, null, 2)}</EvidenceCodeBlock>
                </PanelCard>

                <PanelCard title="无防护目标响应" subtitle={<Target size={16} />} type="inner">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="决策">
                      <DecisionPill decision={result.vulnerable.decision} />
                    </Descriptions.Item>
                    <Descriptions.Item label="执行方式">{result.vulnerable.execution_mode}</Descriptions.Item>
                    <Descriptions.Item label="暴露资产">
                      {compromisedAssetsText(result.summary.compromised_assets)}
                    </Descriptions.Item>
                  </Descriptions>
                  <EvidenceCodeBlock maxHeight="large">{result.vulnerable.target_response}</EvidenceCodeBlock>
                </PanelCard>

                <PanelCard title="开启监督器后" subtitle={<ShieldCheck size={16} />} type="inner">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="决策">
                      <DecisionPill decision={result.guarded.decision} />
                    </Descriptions.Item>
                    <Descriptions.Item label="命中策略">{result.summary.guard_policy_id}</Descriptions.Item>
                    <Descriptions.Item label="审计编号">
                      <Space wrap>
                        <Typography.Text code>{result.summary.guard_audit_id}</Typography.Text>
                        <AuditDeepLinkButton auditId={result.summary.guard_audit_id} size="small">
                          查看
                        </AuditDeepLinkButton>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="原因">{result.guarded.reason}</Descriptions.Item>
                  </Descriptions>
                  <EvidenceCodeBlock maxHeight="large">
                    {result.summary.guarded_output_excerpt || result.guarded.recommendation}
                  </EvidenceCodeBlock>
                </PanelCard>
              </Space>
            ) : (
              <RunResultEmptyState
                icon={<Target size={28} />}
                title="等待执行本地受控实验"
                description="会在项目内置受控环境里执行当前攻击步骤，对比无防护响应、监督器拦截和环境状态变化。"
                actionLabel="执行当前攻击步骤"
                loading={running}
                onAction={runAttack}
              />
            )}
          </PanelCard>
        </Col>
      </Row>

      <TargetLabStatePanel targetLab={targetLab} onReset={resetTargetLab} />
    </div>
  );
}
