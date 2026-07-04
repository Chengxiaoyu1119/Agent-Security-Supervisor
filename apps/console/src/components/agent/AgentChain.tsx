import { Col, Flex, Row, Space, Typography } from 'antd';
import { GitCompare, Play } from 'lucide-react';
import type { AttackChain, AttackChainCompareResult, AttackChainRunResult, RunResult } from '@/types';
import { riskLabel } from '@/utils';
import { MetricCard as Metric, PanelCard, UiButton, UiSelect } from '../ui';
import { ChainRuntimeEvidence } from './ChainRuntimeEvidence';
import { ChainStageGrid } from './ChainStageGrid';
import { RecentRunEvidence } from './RecentRunEvidence';
import { chainNodes, formatRunLabel, useAgentChainViewModel } from './useAgentChainViewModel';

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
  const {
    activeChain,
    currentChainResult,
    currentChainCompare,
    stageEvidence,
    candidates,
    selectedRunId,
    setSelectedRunId,
    activeRun,
    trace,
    activeAgents
  } = useAgentChainViewModel({
    result,
    runs,
    chains,
    selectedChainId,
    chainResult,
    chainCompareResult
  });

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
            <UiSelect value={activeChain.id} onChange={onSelectChain} className="zh-agent-chain-select">
              {chains.map((chain) => (
                <UiSelect.Option key={chain.id} value={chain.id}>
                  {chain.title}
                </UiSelect.Option>
              ))}
            </UiSelect>
            <UiButton icon={<Play size={16} />} onClick={onRunChain} disabled={chainRunning} loading={chainRunning}>
              {chainRunning ? '运行中...' : '运行有防护链'}
            </UiButton>
            <UiButton
              type="primary"
              icon={<GitCompare size={16} />}
              onClick={onCompareChain}
              disabled={chainRunning}
              loading={chainRunning}
            >
              {chainRunning ? '对比中...' : '无防护/有防护对比'}
            </UiButton>
          </Space>
        </Flex>
      </PanelCard>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <PanelCard variant="borderless" className="zh-agent-chain-hero">
            <Typography.Text className={`zh-agent-chain-hero__risk zh-agent-chain-hero__risk--${activeChain.severity}`}>
              {riskLabel[activeChain.severity]}风险组合链
            </Typography.Text>
            <Typography.Title level={4}>{activeChain.title}</Typography.Title>
            <Typography.Paragraph>{activeChain.summary}</Typography.Paragraph>
            <Row gutter={[16, 16]} className="zh-agent-chain-hero__stats">
              <Col xs={24} md={12}>
                <Typography.Text type="secondary" className="zh-text-block">
                  攻击目标
                </Typography.Text>
                <Typography.Text strong>{activeChain.attacker_goal}</Typography.Text>
              </Col>
              <Col xs={24} md={12}>
                <Typography.Text type="secondary" className="zh-text-block">
                  比赛场景
                </Typography.Text>
                <Typography.Text strong>{activeChain.business_context}</Typography.Text>
              </Col>
            </Row>
            <div className="zh-agent-chain-defense-tags">
              {activeChain.defense_focus.map((item) => (
                <Typography.Text key={item} type="secondary" className="zh-agent-chain-defense-item">
                  {item}
                </Typography.Text>
              ))}
            </div>
          </PanelCard>
        </Col>
        <Col xs={24} lg={8}>
          <PanelCard variant="borderless" className="zh-full-height">
            <Row gutter={[16, 16]} align="stretch">
              <Col xs={12}>
                <Metric label="阶段" value={`${activeChain.summary_stats.stage_count}`} tone="cyan" />
              </Col>
              <Col xs={12}>
                <Metric label="攻击面" value={`${activeChain.summary_stats.surface_count}`} tone="amber" />
              </Col>
              <Col xs={12}>
                <Metric label="工具" value={`${activeChain.summary_stats.tool_count}`} tone="green" />
              </Col>
              <Col xs={12}>
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

      <ChainStageGrid
        activeChain={activeChain}
        stageEvidence={stageEvidence}
        currentChainCompare={currentChainCompare}
      />

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
