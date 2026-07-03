import { Col, Flex, Row, Space, Typography } from 'antd';
import type { AttackChain, AttackChainCompareResult, AttackChainStageRun } from '@/types';
import { DecisionPill, PanelCard, UiBadge } from '../ui';

export function ChainStageGrid({
  activeChain,
  stageEvidence,
  currentChainCompare
}: {
  activeChain: AttackChain;
  stageEvidence: AttackChainStageRun[];
  currentChainCompare: AttackChainCompareResult | null;
}) {
  return (
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
                    <UiBadge count={stage.index} className="zh-agent-badge-primary" />
                    <Typography.Text strong className="zh-agent-chain-stage-name">
                      {stage.name}
                    </Typography.Text>
                  </Space>
                  <Typography.Text type="secondary" className="zh-agent-chain-stage-tag">
                    {stage.scenario.surface_id}
                  </Typography.Text>
                </Flex>
                <Typography.Paragraph type="secondary" className="zh-agent-chain-stage-description">
                  {stage.tactic}
                </Typography.Paragraph>
                <Space className="zh-agent-chain-stage-meta">
                  <Typography.Text type="secondary" className="zh-agent-chain-stage-code">
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
  );
}
