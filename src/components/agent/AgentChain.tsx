import { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Space, Flex, Button, Select, Badge, Tag, Timeline, Steps, Divider } from 'antd';
import { Activity, GitBranch, GitCompare, Play, ShieldCheck } from 'lucide-react';
import type { AttackChain, AttackChainCompareResult, AttackChainRunResult, RunResult } from '../../types';
import { DecisionPill, MetricCard as Metric } from '../ui';

const riskLabel: Record<string, string> = {
  critical: '极高',
  high: '高',
  medium: '中',
  low: '低'
};

interface AgentChainProps {
  result: RunResult | null;
  runs: RunResult[];
  chains: AttackChain[];
  selectedChainId: string;
  onSelectChain: (id: string) => void;
  chainResult: AttackChainRunResult | null;
  chainCompareResult: AttackChainCompareResult | null;
  chainRunning: boolean;
  onRunChain: () => void;
  onCompareChain: () => void;
}

export function AgentChain({
  result,
  runs,
  chains,
  selectedChainId,
  onSelectChain,
  chainResult,
  chainCompareResult,
  chainRunning,
  onRunChain,
  onCompareChain
}: AgentChainProps) {
  const activeChain = chains.find((chain) => chain.id === selectedChainId) ?? chains[0] ?? null;
  const currentChainResult = chainResult?.chain.id === activeChain?.id ? chainResult : null;
  const currentChainCompare = chainCompareResult?.chain.id === activeChain?.id ? chainCompareResult : null;
  const stageEvidence = useMemo(() => {
    if (currentChainCompare) {
      return currentChainCompare.comparisons.map((item) => item.with_guard);
    }
    return currentChainResult?.stages ?? [];
  }, [currentChainCompare, currentChainResult]);

  const candidates = useMemo(() => {
    const map = new Map<string, RunResult>();
    stageEvidence.forEach((stage) => map.set(stage.run_id, stage.run));
    if (result) {
      map.set(result.run_id, result);
    }
    runs.forEach((run) => map.set(run.run_id, run));
    return Array.from(map.values());
  }, [result, runs, stageEvidence]);

  const [selectedRunId, setSelectedRunId] = useState('');

  useEffect(() => {
    if (stageEvidence[0]?.run_id) {
      setSelectedRunId(stageEvidence[0].run_id);
    } else if (result?.run_id) {
      setSelectedRunId(result.run_id);
    } else if (!selectedRunId && candidates[0]?.run_id) {
      setSelectedRunId(candidates[0].run_id);
    }
  }, [result?.run_id, candidates, selectedRunId, stageEvidence]);

  const activeRun = candidates.find((run) => run.run_id === selectedRunId) ?? candidates[0] ?? null;
  const trace = activeRun?.agent_trace ?? [];
  const chainNodes = ['规划 Agent', '样本生成 Agent', '执行 Agent', '目标智能体', '行为监督器', '评测 Agent'];
  const activeAgents = new Set(trace.map((item) => item.agent));
  const formatRunLabel = (run: RunResult) => {
    const time = run.created_at.slice(5, 19).replace('T', ' ');
    return `${time} · ${run.scenario.id} · 防护${run.guard_enabled ? '开' : '关'} · ${run.attack_success ? '攻击成功' : '已控制'}`;
  };

  if (!activeChain) {
    return (
      <Card variant="borderless" style={{ textAlign: 'center', padding: 48 }}>
        <Typography.Text type="secondary">后端未返回组合攻击链配置，暂无组合攻击链。</Typography.Text>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card variant="borderless">
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>多 Agent 协同攻击链</Typography.Title>
            <Typography.Text type="secondary">{activeChain.summary_stats.stage_count} 步 / {activeChain.summary_stats.surface_count} 类攻击面 / {activeChain.summary_stats.tool_count} 类工具</Typography.Text>
          </div>
          <Space wrap>
            <Select value={activeChain.id} onChange={onSelectChain} style={{ width: '100%', maxWidth: 300, minWidth: 200 }}>
              {chains.map((chain) => <Select.Option key={chain.id} value={chain.id}>{chain.title}</Select.Option>)}
            </Select>
            <Button icon={<Play size={16} />} onClick={onRunChain} disabled={chainRunning} loading={chainRunning}>{chainRunning ? '运行中...' : '运行有防护链'}</Button>
            <Button type="primary" icon={<GitCompare size={16} />} onClick={onCompareChain} disabled={chainRunning} loading={chainRunning}>{chainRunning ? '对比中...' : '无防护/有防护对比'}</Button>
          </Space>
        </Flex>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card variant="borderless" style={{ height: '100%', background: 'linear-gradient(145deg, var(--ant-color-primary-bg) 0%, transparent 100%)' }}>
            <Tag color={activeChain.severity === 'critical' ? 'error' : activeChain.severity === 'high' ? 'warning' : 'processing'} style={{ marginBottom: 16 }}>{riskLabel[activeChain.severity]}风险组合链</Tag>
            <Typography.Title level={4}>{activeChain.title}</Typography.Title>
            <Typography.Paragraph>{activeChain.summary}</Typography.Paragraph>
            <Row gutter={24} style={{ marginTop: 24 }}>
              <Col span={12}>
                <Typography.Text type="secondary" style={{ display: 'block' }}>攻击目标</Typography.Text>
                <Typography.Text strong>{activeChain.attacker_goal}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary" style={{ display: 'block' }}>比赛场景</Typography.Text>
                <Typography.Text strong>{activeChain.business_context}</Typography.Text>
              </Col>
            </Row>
            <Space wrap style={{ marginTop: 24 }}>
              {activeChain.defense_focus.map((item) => <Tag key={item} color="cyan" style={{ margin: 0 }}>{item}</Tag>)}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card variant="borderless" style={{ height: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}><Metric label="阶段" value={`${activeChain.summary_stats.stage_count}`} tone="cyan" /></Col>
              <Col span={12}><Metric label="攻击面" value={`${activeChain.summary_stats.surface_count}`} tone="amber" /></Col>
              <Col span={12}><Metric label="工具" value={`${activeChain.summary_stats.tool_count}`} tone="green" /></Col>
              <Col span={12}><Metric label="链路状态" value={currentChainCompare || currentChainResult ? '已有证据' : '待运行'} tone={currentChainCompare || currentChainResult ? 'green' : 'amber'} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="攻击链阶段映射" variant="borderless">
        <Row gutter={[16, 16]}>
          {activeChain.stages.map((stage) => {
            const evidence = stageEvidence.find((item) => item.stage.id === stage.id);
            const compare = currentChainCompare?.comparisons.find((item) => item.stage.id === stage.id);
            const isExposed = evidence?.attack_success;
            const isControlled = evidence?.controlled;
            return (
              <Col xs={24} md={12} xl={8} key={stage.id}>
                <Card type="inner" style={{ height: '100%', borderColor: isControlled ? 'var(--ant-color-success-border)' : isExposed ? 'var(--ant-color-error-border)' : 'var(--ant-color-border-secondary)' }}>
                  <Flex justify="space-between" align="flex-start" style={{ marginBottom: 12 }} gap={8}>
                    <Space style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <Badge count={stage.index} style={{ backgroundColor: 'var(--ant-color-primary)' }} />
                      <Typography.Text strong style={{ wordBreak: 'break-word' }}>{stage.name}</Typography.Text>
                    </Space>
                    <Tag style={{ margin: 0 }}>{stage.scenario.surface_id}</Tag>
                  </Flex>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 13, minHeight: 40 }}>{stage.tactic}</Typography.Paragraph>
                  <Space style={{ marginBottom: 12 }}>
                    <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{stage.scenario.id}</Typography.Text>
                  </Space>
                  <div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{stage.expected_control}</Typography.Text></div>
                  
                  {evidence && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--ant-color-border-secondary)' }}>
                      <Space wrap>{evidence.decisions.map((decision, index) => <DecisionPill key={`${decision}-${index}`} decision={decision} />)}</Space>
                    </div>
                  )}
                  {compare && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--ant-color-border-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <Typography.Text type={compare.without_guard.attack_success ? 'danger' : 'secondary'}>无防护: {compare.without_guard.attack_success ? '暴露' : '未暴露'}</Typography.Text>
                      <Typography.Text type={compare.with_guard.controlled ? 'success' : 'warning'}>有防护: {compare.with_guard.controlled ? '已控制' : '需复核'}</Typography.Text>
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {(currentChainResult || currentChainCompare) && (
        <ChainRuntimeEvidence result={currentChainResult} compareResult={currentChainCompare} />
      )}

      <RecentRunEvidence
        activeRun={activeRun}
        candidates={candidates}
        selectedRunId={selectedRunId}
        setSelectedRunId={setSelectedRunId}
        trace={trace}
        chainNodes={chainNodes}
        activeAgents={activeAgents}
        formatRunLabel={formatRunLabel}
      />
    </div>
  );
}

function ChainRuntimeEvidence({ result, compareResult }: { result: AttackChainRunResult | null; compareResult: AttackChainCompareResult | null }) {
  if (compareResult) {
    return (
      <Card title={<Space><span>无防护 / 有防护对比</span><Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>{compareResult.generated_at.slice(0, 19).replace('T', ' ')}</Typography.Text></Space>} extra={
        <div style={{ textAlign: 'right' }}>
          <Typography.Title level={3} style={{ margin: 0, color: 'var(--ant-color-primary)' }}>{compareResult.summary.control_rate}%</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>有防护控制率</Typography.Text>
        </div>
      }>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}><Metric label="无防护暴露" value={`${compareResult.summary.without_guard_attack_success_count}`} tone="red" /></Col>
            <Col xs={12} sm={6}><Metric label="有防护暴露" value={`${compareResult.summary.with_guard_attack_success_count}`} tone="amber" /></Col>
            <Col xs={12} sm={6}><Metric label="风险下降" value={`${compareResult.summary.attack_success_reduced_count}`} tone="green" /></Col>
            <Col xs={12} sm={6}><Metric label="已控制阶段" value={`${compareResult.summary.controlled_with_guard_count}`} tone="cyan" /></Col>
          </Row>
          
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            {compareResult.comparisons.map((item) => (
              <Card key={item.stage.id} size="small" style={{ background: 'var(--ant-color-bg-layout)' }}>
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                  <div>
                    <Typography.Text strong style={{ display: 'block' }}>{item.stage.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>{item.stage.scenario.id}</Typography.Text>
                  </div>
                  <Space orientation="vertical" align="end" size={0}>
                    <Typography.Text type={item.without_guard.attack_success ? 'danger' : 'secondary'}>无防护: {item.without_guard.attack_success ? '暴露' : '未暴露'}</Typography.Text>
                    <Typography.Text type={item.with_guard.controlled ? 'success' : 'warning'}>有防护: {item.with_guard.controlled ? '已控制' : '需复核'}</Typography.Text>
                  </Space>
                </Flex>
                <div style={{ marginTop: 8 }}>
                  <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{item.with_guard.policies.join(' / ') || '未命中策略'}</Typography.Text>
                </div>
              </Card>
            ))}
          </Space>
        </Space>
      </Card>
    );
  }

  if (!result) return null;
  return (
    <Card title={<Space><span>有防护组合链运行结果</span><Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>{result.generated_at.slice(0, 19).replace('T', ' ')}</Typography.Text></Space>} extra={
      <div style={{ textAlign: 'right' }}>
        <Typography.Title level={3} style={{ margin: 0, color: 'var(--ant-color-primary)' }}>{result.summary.control_rate}%</Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>阶段控制率</Typography.Text>
      </div>
    }>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}><Metric label="控制阶段" value={`${result.summary.controlled_stage_count}/${result.summary.stage_count}`} tone="green" /></Col>
          <Col xs={12} sm={6}><Metric label="阻断" value={`${result.summary.blocked_count}`} tone="red" /></Col>
          <Col xs={12} sm={6}><Metric label="询问" value={`${result.summary.asked_count}`} tone="amber" /></Col>
          <Col xs={12} sm={6}><Metric label="隔离" value={`${result.summary.isolated_count}`} tone="cyan" /></Col>
        </Row>
        
        {Object.keys(result.summary.policy_distribution).length > 0 && (
          <Space wrap size={[8, 8]}>
            {Object.entries(result.summary.policy_distribution).map(([policy, count]) => (
              <Tag key={policy} color="blue">{policy} <Badge count={count} style={{ backgroundColor: '#fff', color: '#1677ff', boxShadow: 'none' }} /></Tag>
            ))}
          </Space>
        )}
      </Space>
    </Card>
  );
}

function RecentRunEvidence({
  activeRun,
  candidates,
  selectedRunId,
  setSelectedRunId,
  trace,
  chainNodes,
  activeAgents,
  formatRunLabel
}: {
  activeRun: RunResult | null;
  candidates: RunResult[];
  selectedRunId: string;
  setSelectedRunId: (id: string) => void;
  trace: RunResult['agent_trace'];
  chainNodes: string[];
  activeAgents: Set<string>;
  formatRunLabel: (run: RunResult) => string;
}) {
  return (
    <Card title={<Space><span>单次运行证据</span><Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>{activeRun ? `${activeRun.scenario.id} · ${activeRun.audit_logs.length} 条工具调用` : '暂无运行记录'}</Typography.Text></Space>} extra={
      candidates.length > 0 && (
        <Select value={activeRun?.run_id ?? selectedRunId} onChange={(value) => setSelectedRunId(value)} style={{ width: 200, maxWidth: '100%' }}>
          {candidates.map((run) => (
            <Select.Option key={run.run_id} value={run.run_id}>{formatRunLabel(run)}</Select.Option>
          ))}
        </Select>
      )
    } style={{ marginTop: 24 }}>
      {activeRun ? (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}><Metric label="实验剧本" value={activeRun.scenario.id.replace('-001', '')} tone="cyan" /></Col>
            <Col xs={12} sm={6}><Metric label="工具调用" value={`${activeRun.audit_logs.length}`} tone="amber" /></Col>
            <Col xs={12} sm={6}><Metric label="监督决策" value={activeRun.attack_success ? '暴露' : '控制'} tone={activeRun.attack_success ? 'red' : 'green'} /></Col>
            <Col xs={12} sm={6}><Metric label="检测延迟" value={`${activeRun.metrics.detection_latency_ms}ms`} tone="green" /></Col>
          </Row>

          <Card type="inner" title="Agent 协作链路" size="small">
            <Steps
              size="small"
              current={chainNodes.length}
              items={chainNodes.map((node) => ({
                title: node,
                status: activeAgents.has(node) ? 'finish' : 'wait',
                content: activeAgents.has(node) ? '已记录' : '未触发'
              }))}
              style={{ overflowX: 'auto', padding: '16px 0' }}
            />
          </Card>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card type="inner" title={`Agent 协作时间线 (${trace.length} 步)`}>
                <Timeline
                  items={trace.map((item) => ({
                    color: item.status === 'error' ? 'red' : 'blue',
                    content: (
                      <div style={{ marginBottom: 16 }}>
                        <Flex justify="space-between" wrap="wrap">
                          <Typography.Text strong>{item.agent}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.timestamp.slice(11, 19)}</Typography.Text>
                        </Flex>
                        <div style={{ fontSize: 13, color: 'var(--ant-color-text-secondary)', marginBottom: 8 }}>{item.role} · {item.status}</div>
                        <Typography.Paragraph style={{ margin: 0, fontSize: 13, background: 'var(--ant-color-bg-layout)', padding: 8, borderRadius: 4 }}>{item.message}</Typography.Paragraph>
                      </div>
                    )
                  }))}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                <Card type="inner" title={`工具调用与监督证据 (${activeRun.audit_logs.length} 条)`}>
                  <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                    {activeRun.audit_logs.map((log) => (
                      <Card key={log.id} size="small" style={{ background: 'var(--ant-color-bg-layout)' }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                          <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{log.tool}</Typography.Text>
                          <DecisionPill decision={log.decision} />
                        </Flex>
                        <Typography.Paragraph style={{ fontSize: 13 }}>{log.reason}</Typography.Paragraph>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          策略：{log.policy_id} · 风险：{riskLabel[log.risk_level]} · 执行：{log.tool_output.executed ? '是' : '否'}
                        </Typography.Text>
                      </Card>
                    ))}
                  </Space>
                </Card>

                <Card type="inner" title={`告警与结果 (${activeRun.alerts.length} 条告警)`}>
                  <Typography.Text strong type={activeRun.attack_success ? 'danger' : 'success'} style={{ display: 'block', fontSize: 16, marginBottom: 8 }}>
                    {activeRun.attack_success ? '攻击风险暴露' : '攻击已被监督器控制'}
                  </Typography.Text>
                  <Typography.Paragraph type="secondary">
                    阻断 {activeRun.metrics.blocked_count}，询问 {activeRun.metrics.asked_count}，
                    隔离 {activeRun.metrics.isolated_count}，误报率 {activeRun.metrics.false_positive_rate}%。
                  </Typography.Paragraph>
                  <Flex gap={16} wrap="wrap" style={{ marginTop: 16, color: 'var(--ant-color-text-secondary)' }}>
                    <Space size={4}><ShieldCheck size={14} /><span>hash {activeRun.audit_logs.filter((log) => log.audit_hash).length} 条</span></Space>
                    <Space size={4}><Activity size={14} /><span>{activeRun.metrics.detection_latency_ms}ms</span></Space>
                    <Space size={4}><GitBranch size={14} /><span>{activeRun.agent_trace.length} 步</span></Space>
                  </Flex>
                </Card>
              </Space>
            </Col>
          </Row>
        </Space>
      ) : (
        <Typography.Text type="secondary">暂无攻击链记录。</Typography.Text>
      )}
    </Card>
  );
}
