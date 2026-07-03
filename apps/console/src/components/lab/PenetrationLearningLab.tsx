import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Play, ShieldCheck, Target, TerminalSquare } from 'lucide-react';
import { Col, Descriptions, Row, Space, Typography } from 'antd';
import { fetchLearningLabScenarios, fetchTargetLabState, resetTargetLabState, runLearningLabAttack } from '../../api';
import type { LearningLabRunResult, LearningLabScenario, TargetLabState } from '../../types';
import { AuditDeepLinkButton } from '../audit/AuditDeepLinkButton';
import { DecisionPill, EvidenceCodeBlock, MetricCard, PanelCard, UiAlert, UiButton, UiInput, UiSwitch } from '../ui';
import { TargetLabStatePanel } from './TargetLabStatePanel';
import {
  FALLBACK_SCENARIOS,
  assetProfile,
  compromisedAssetsText,
  scenarioIcon,
  stepLabels,
  stepState
} from './penetrationLearningProfiles';

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
        if (mounted) setNotice('后端未连接时只能查看默认场景，运行本地靶场需要启动智安哨后端。');
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
      setNotice(`本地靶场攻击失败：${error instanceof Error ? error.message : '未知错误'}`);
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
      setNotice(`本地靶场重置失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  if (!activeScenario) {
    return <UiAlert type="warning" showIcon title="暂无本地靶场场景。" />;
  }

  return (
    <div className="zh-attack-lab">
      {notice && <UiAlert type="warning" showIcon title={notice} className="zh-mb-24" />}

      <PanelCard title="本地靶场分步训练" subtitle="从目标资产开始操作，不再只看一键结果" className="zh-mb-24">
        <div className="zh-lab-step-strip">
          {stepLabels.map((label, index) => (
            <div key={label} className={`zh-lab-step zh-lab-step--${stepState(index, Boolean(result))}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </PanelCard>

      <Row gutter={[20, 20]} align="stretch">
        <Col xs={24} xl={6}>
          <PanelCard
            title="选择攻击面"
            subtitle={`${scenarios.length} 类本机授权靶场`}
            className="zh-attack-lab__module-panel"
          >
            <div className="zh-attack-lab__module-grid">
              {scenarios.map((scenario) => (
                <button
                  type="button"
                  key={scenario.id}
                  className={`zh-attack-lab__module-button ${
                    scenario.id === activeScenario.id ? 'zh-attack-lab__module-button--active' : ''
                  }`}
                  onClick={() => selectScenario(scenario.id)}
                >
                  <span className="zh-attack-lab__module-icon">{scenarioIcon(scenario.id)}</span>
                  <span className="zh-attack-lab__module-copy">
                    <strong>{scenario.name}</strong>
                    <span>{scenario.tool}</span>
                  </span>
                </button>
              ))}
            </div>
          </PanelCard>
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
                    只触碰项目自带靶场文件、靶场 API、靶场记忆和安全探针，不访问真实比赛平台。
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
              <div className="zh-attack-lab__empty">
                <Typography.Text type="secondary">
                  按步骤构造输入并执行后，这里会显示无防护攻破结果、监督器拦截结果和靶场状态变化。
                </Typography.Text>
              </div>
            )}
          </PanelCard>
        </Col>
      </Row>

      <TargetLabStatePanel targetLab={targetLab} onReset={resetTargetLab} />
    </div>
  );
}
