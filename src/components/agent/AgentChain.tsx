import { useMemo, useState } from 'react';
import { Row, Col, Typography, Space, Flex, Button, Select, Badge, Tag, Timeline, Steps } from 'antd';
import { Activity, GitBranch, GitCompare, Play, ShieldCheck } from 'lucide-react';
import type { AttackChain, AttackChainCompareResult, AttackChainRunResult, RunResult } from '../../types';
import { riskLabel } from '../../utils';
import { DecisionPill, EvidenceList, MetricCard as Metric, PanelCard } from '../ui';

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

  const defaultRunId = stageEvidence[0]?.run_id ?? result?.run_id ?? candidates[0]?.run_id ?? '';
  const resolvedRunId = candidates.some((run) => run.run_id === selectedRunId) ? selectedRunId : defaultRunId;
  const activeRun = candidates.find((run) => run.run_id === resolvedRunId) ?? candidates[0] ?? null;
  const trace = activeRun?.agent_trace ?? [];
  const chainNodes = ['规划 Agent', '样本生成 Agent', '执行 Agent', '目标智能体', '行为监督器', '评测 Agent'];
  const activeAgents = new Set(trace.map((item) => item.agent));
  const formatRunLabel = (run: RunResult) => {
    const time = run.created_at.slice(5, 19).replace('T', ' ');
    return `${time} · ${run.scenario.id} · 防护${run.guard_enabled ? '开' : '关'} · ${run.attack_success ? '攻击成功' : '已控制'}`;
  };

  if (!activeChain) {
    return (
      <PanelCard variant="borderless" className="zh-agent-chain-empty">
        <Typography.Text type="secondary">后端未返回组合攻击链配置，暂无组合攻击链。</Typography.Text>
      </PanelCard>
    );
  }

  return (
    <div className="zh-agent-chain-stack">
      <PanelCard variant="borderless">
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Typography.Title level={3} className="zh-agent-chain-title">
              多 Agent 协同攻击链
            </Typography.Title>
            <Typography.Text type="secondary">
              {activeChain.summary_stats.stage_count} 步 / {activeChain.summary_stats.surface_count} 类攻击面 /{' '}
              {activeChain.summary_stats.tool_count} 类工具
            </Typography.Text>
          </div>
          <Space wrap>
            <Select value={activeChain.id} onChange={onSelectChain} className="zh-agent-chain-select">
              {chains.map((chain) => (
                <Select.Option key={chain.id} value={chain.id}>
                  {chain.title}
                </Select.Option>
              ))}
            </Select>
            <Button icon={<Play size={16} />} onClick={onRunChain} disabled={chainRunning} loading={chainRunning}>
              {chainRunning ? '运行中...' : '运行有防护链'}
            </Button>
            <Button
              type="primary"
              icon={<GitCompare size={16} />}
              onClick={onCompareChain}
              disabled={chainRunning}
              loading={chainRunning}
            >
              {chainRunning ? '对比中...' : '无防护/有防护对比'}
            </Button>
          </Space>
        </Flex>
      </PanelCard>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <PanelCard variant="borderless" className="zh-agent-chain-hero">
            <Tag
              color={
                activeChain.severity === 'critical'
                  ? 'error'
                  : activeChain.severity === 'high'
                    ? 'warning'
                    : 'processing'
              }
              className="zh-agent-chain-hero__tag"
            >
              {riskLabel[activeChain.severity]}风险组合链
            </Tag>
            <Typography.Title level={4}>{activeChain.title}</Typography.Title>
            <Typography.Paragraph>{activeChain.summary}</Typography.Paragraph>
            <Row gutter={24} className="zh-agent-chain-hero__stats">
              <Col span={12}>
                <Typography.Text type="secondary" className="zh-text-block">
                  攻击目标
                </Typography.Text>
                <Typography.Text strong>{activeChain.attacker_goal}</Typography.Text>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary" className="zh-text-block">
                  比赛场景
                </Typography.Text>
                <Typography.Text strong>{activeChain.business_context}</Typography.Text>
              </Col>
            </Row>
            <Space wrap className="zh-agent-chain-defense-tags">
              {activeChain.defense_focus.map((item) => (
                <Tag key={item} color="cyan" className="zh-agent-chain-stage-tag">
                  {item}
                </Tag>
              ))}
            </Space>
          </PanelCard>
        </Col>
        <Col xs={24} lg={8}>
          <PanelCard variant="borderless" className="zh-full-height">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Metric label="阶段" value={`${activeChain.summary_stats.stage_count}`} tone="cyan" />
              </Col>
              <Col span={12}>
                <Metric label="攻击面" value={`${activeChain.summary_stats.surface_count}`} tone="amber" />
              </Col>
              <Col span={12}>
                <Metric label="工具" value={`${activeChain.summary_stats.tool_count}`} tone="green" />
              </Col>
              <Col span={12}>
                <Metric
                  label="链路状态"
                  value={currentChainCompare || currentChainResult ? '已有证据' : '待运行'}
                  tone={currentChainCompare || currentChainResult ? 'green' : 'amber'}
                />
              </Col>
            </Row>
          </PanelCard>
        </Col>
      </Row>

      <PanelCard title="攻击链阶段映射" variant="borderless">
        <Row gutter={[16, 16]}>
          {activeChain.stages.map((stage) => {
            const evidence = stageEvidence.find((item) => item.stage.id === stage.id);
            const compare = currentChainCompare?.comparisons.find((item) => item.stage.id === stage.id);
            const isExposed = evidence?.attack_success;
            const isControlled = evidence?.controlled;
            const stageToneClass = isControlled
              ? 'zh-agent-chain-stage-card--controlled'
              : isExposed
                ? 'zh-agent-chain-stage-card--exposed'
                : 'zh-agent-chain-stage-card--idle';
            return (
              <Col xs={24} md={12} xl={8} key={stage.id}>
                <PanelCard type="inner" className={`zh-agent-chain-stage-card ${stageToneClass}`}>
                  <Flex justify="space-between" align="flex-start" className="zh-agent-chain-stage-head" gap={8}>
                    <Space className="zh-agent-chain-stage-title">
                      <Badge count={stage.index} className="zh-agent-badge-primary" />
                      <Typography.Text strong className="zh-agent-chain-stage-name">
                        {stage.name}
                      </Typography.Text>
                    </Space>
                    <Tag className="zh-agent-chain-stage-tag">{stage.scenario.surface_id}</Tag>
                  </Flex>
                  <Typography.Paragraph type="secondary" className="zh-agent-chain-stage-description">
                    {stage.tactic}
                  </Typography.Paragraph>
                  <Space className="zh-agent-chain-stage-meta">
                    <Typography.Text code className="zh-agent-chain-stage-code">
                      {stage.scenario.id}
                    </Typography.Text>
                  </Space>
                  <div>
                    <Typography.Text type="secondary" className="zh-text-sm">
                      {stage.expected_control}
                    </Typography.Text>
                  </div>

                  {evidence && (
                    <div className="zh-agent-chain-stage-footer">
                      <Space wrap>
                        {evidence.decisions.map((decision, index) => (
                          <DecisionPill key={`${decision}-${index}`} decision={decision} />
                        ))}
                      </Space>
                    </div>
                  )}
                  {compare && (
                    <div className="zh-agent-chain-stage-footer zh-agent-chain-stage-footer--compare">
                      <Typography.Text type={compare.without_guard.attack_success ? 'danger' : 'secondary'}>
                        无防护: {compare.without_guard.attack_success ? '暴露' : '未暴露'}
                      </Typography.Text>
                      <Typography.Text type={compare.with_guard.controlled ? 'success' : 'warning'}>
                        有防护: {compare.with_guard.controlled ? '已控制' : '需复核'}
                      </Typography.Text>
                    </div>
                  )}
                </PanelCard>
              </Col>
            );
          })}
        </Row>
      </PanelCard>

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

function ChainRuntimeEvidence({
  result,
  compareResult
}: {
  result: AttackChainRunResult | null;
  compareResult: AttackChainCompareResult | null;
}) {
  if (compareResult) {
    return (
      <PanelCard
        title={
          <Space>
            <span>无防护 / 有防护对比</span>
            <Typography.Text type="secondary" className="zh-agent-runtime-time">
              {compareResult.generated_at.slice(0, 19).replace('T', ' ')}
            </Typography.Text>
          </Space>
        }
        extra={
          <div className="zh-agent-runtime-summary">
            <Typography.Title level={3} className="zh-agent-runtime-score">
              {compareResult.summary.control_rate}%
            </Typography.Title>
            <Typography.Text type="secondary" className="zh-agent-runtime-label">
              有防护控制率
            </Typography.Text>
          </div>
        }
      >
        <Space orientation="vertical" size="large" className="zh-agent-runtime-stack">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Metric
                label="无防护暴露"
                value={`${compareResult.summary.without_guard_attack_success_count}`}
                tone="red"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Metric
                label="有防护暴露"
                value={`${compareResult.summary.with_guard_attack_success_count}`}
                tone="amber"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Metric label="风险下降" value={`${compareResult.summary.attack_success_reduced_count}`} tone="green" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric label="已控制阶段" value={`${compareResult.summary.controlled_with_guard_count}`} tone="cyan" />
            </Col>
          </Row>

          <Space orientation="vertical" className="zh-agent-runtime-stack" size="middle">
            {compareResult.comparisons.map((item) => (
              <PanelCard key={item.stage.id} size="small" className="zh-agent-runtime-item">
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                  <div>
                    <Typography.Text strong className="zh-text-block">
                      {item.stage.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="zh-text-md">
                      {item.stage.scenario.id}
                    </Typography.Text>
                  </div>
                  <Space orientation="vertical" align="end" size={0}>
                    <Typography.Text type={item.without_guard.attack_success ? 'danger' : 'secondary'}>
                      无防护: {item.without_guard.attack_success ? '暴露' : '未暴露'}
                    </Typography.Text>
                    <Typography.Text type={item.with_guard.controlled ? 'success' : 'warning'}>
                      有防护: {item.with_guard.controlled ? '已控制' : '需复核'}
                    </Typography.Text>
                  </Space>
                </Flex>
                <div className="zh-agent-runtime-policy">
                  <Typography.Text code className="zh-agent-chain-stage-code">
                    {item.with_guard.policies.join(' / ') || '未命中策略'}
                  </Typography.Text>
                </div>
              </PanelCard>
            ))}
          </Space>
        </Space>
      </PanelCard>
    );
  }

  if (!result) return null;
  return (
    <PanelCard
      title={
        <Space>
          <span>有防护组合链运行结果</span>
          <Typography.Text type="secondary" className="zh-agent-runtime-time">
            {result.generated_at.slice(0, 19).replace('T', ' ')}
          </Typography.Text>
        </Space>
      }
      extra={
        <div className="zh-agent-runtime-summary">
          <Typography.Title level={3} className="zh-agent-runtime-score">
            {result.summary.control_rate}%
          </Typography.Title>
          <Typography.Text type="secondary" className="zh-agent-runtime-label">
            阶段控制率
          </Typography.Text>
        </div>
      }
    >
      <Space orientation="vertical" size="large" className="zh-agent-runtime-stack">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Metric
              label="控制阶段"
              value={`${result.summary.controlled_stage_count}/${result.summary.stage_count}`}
              tone="green"
            />
          </Col>
          <Col xs={12} sm={6}>
            <Metric label="阻断" value={`${result.summary.blocked_count}`} tone="red" />
          </Col>
          <Col xs={12} sm={6}>
            <Metric label="询问" value={`${result.summary.asked_count}`} tone="amber" />
          </Col>
          <Col xs={12} sm={6}>
            <Metric label="隔离" value={`${result.summary.isolated_count}`} tone="cyan" />
          </Col>
        </Row>

        {Object.keys(result.summary.policy_distribution).length > 0 && (
          <Space wrap size={[8, 8]}>
            {Object.entries(result.summary.policy_distribution).map(([policy, count]) => (
              <Tag key={policy} color="blue">
                {policy} <Badge count={count} className="zh-agent-badge-brand" />
              </Tag>
            ))}
          </Space>
        )}
      </Space>
    </PanelCard>
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
    <PanelCard
      title={
        <Space>
          <span>单次运行证据</span>
          <Typography.Text type="secondary" className="zh-agent-runtime-time">
            {activeRun ? `${activeRun.scenario.id} · ${activeRun.audit_logs.length} 条工具调用` : '暂无运行记录'}
          </Typography.Text>
        </Space>
      }
      extra={
        candidates.length > 0 && (
          <Select
            value={activeRun?.run_id ?? selectedRunId}
            onChange={(value) => setSelectedRunId(value)}
            className="zh-agent-run-select"
          >
            {candidates.map((run) => (
              <Select.Option key={run.run_id} value={run.run_id}>
                {formatRunLabel(run)}
              </Select.Option>
            ))}
          </Select>
        )
      }
      className="zh-agent-run-card"
    >
      {activeRun ? (
        <Space orientation="vertical" size="large" className="zh-agent-run-stack">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Metric label="实验剧本" value={activeRun.scenario.id.replace('-001', '')} tone="cyan" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric label="工具调用" value={`${activeRun.audit_logs.length}`} tone="amber" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric
                label="监督决策"
                value={activeRun.attack_success ? '暴露' : '控制'}
                tone={activeRun.attack_success ? 'red' : 'green'}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Metric label="检测延迟" value={`${activeRun.metrics.detection_latency_ms}ms`} tone="green" />
            </Col>
          </Row>

          <PanelCard type="inner" title="Agent 协作链路" size="small">
            <Steps
              size="small"
              current={chainNodes.length}
              items={chainNodes.map((node) => ({
                title: node,
                status: activeAgents.has(node) ? 'finish' : 'wait',
                content: activeAgents.has(node) ? '已记录' : '未触发'
              }))}
              className="zh-agent-steps"
            />
          </PanelCard>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <PanelCard type="inner" title={`Agent 协作时间线 (${trace.length} 步)`}>
                <Timeline
                  items={trace.map((item) => ({
                    color: item.status === 'error' ? 'red' : 'blue',
                    content: (
                      <div className="zh-agent-timeline-item">
                        <Flex justify="space-between" wrap="wrap">
                          <Typography.Text strong>{item.agent}</Typography.Text>
                          <Typography.Text type="secondary" className="zh-agent-timeline-time">
                            {item.timestamp.slice(11, 19)}
                          </Typography.Text>
                        </Flex>
                        <div className="zh-agent-timeline-meta">
                          {item.role} · {item.status}
                        </div>
                        <Typography.Paragraph className="zh-agent-timeline-message">
                          {item.message}
                        </Typography.Paragraph>
                      </div>
                    )
                  }))}
                />
              </PanelCard>
            </Col>

            <Col xs={24} lg={12}>
              <Space orientation="vertical" size="large" className="zh-agent-run-stack">
                <PanelCard type="inner" title={`工具调用与监督证据 (${activeRun.audit_logs.length} 条)`}>
                  <EvidenceList
                    items={activeRun.audit_logs.map((log) => ({
                      key: log.id,
                      title: (
                        <Typography.Text code className="zh-break-anywhere">
                          {log.tool}
                        </Typography.Text>
                      ),
                      extra: <DecisionPill decision={log.decision} />,
                      description: log.reason,
                      meta: (
                        <>
                          策略：{log.policy_id} · 风险：{riskLabel[log.risk_level]} · 执行：
                          {log.tool_output.executed ? '是' : '否'}
                        </>
                      )
                    }))}
                  />
                </PanelCard>

                <PanelCard type="inner" title={`告警与结果 (${activeRun.alerts.length} 条告警)`}>
                  <Typography.Text
                    strong
                    type={activeRun.attack_success ? 'danger' : 'success'}
                    className="zh-agent-result-title"
                  >
                    {activeRun.attack_success ? '攻击风险暴露' : '攻击已被监督器控制'}
                  </Typography.Text>
                  <Typography.Paragraph type="secondary">
                    阻断 {activeRun.metrics.blocked_count}，询问 {activeRun.metrics.asked_count}， 隔离{' '}
                    {activeRun.metrics.isolated_count}，误报率 {activeRun.metrics.false_positive_rate}%。
                  </Typography.Paragraph>
                  <Flex gap={16} wrap="wrap" className="zh-agent-result-meta">
                    <Space size={4}>
                      <ShieldCheck size={14} />
                      <span>hash {activeRun.audit_logs.filter((log) => log.audit_hash).length} 条</span>
                    </Space>
                    <Space size={4}>
                      <Activity size={14} />
                      <span>{activeRun.metrics.detection_latency_ms}ms</span>
                    </Space>
                    <Space size={4}>
                      <GitBranch size={14} />
                      <span>{activeRun.agent_trace.length} 步</span>
                    </Space>
                  </Flex>
                </PanelCard>
              </Space>
            </Col>
          </Row>
        </Space>
      ) : (
        <Typography.Text type="secondary">暂无攻击链记录。</Typography.Text>
      )}
    </PanelCard>
  );
}
