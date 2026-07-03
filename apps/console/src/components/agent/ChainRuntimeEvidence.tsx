import { Col, Flex, Row, Space, Typography } from 'antd';
import type { AttackChainCompareResult, AttackChainRunResult } from '@/types';
import { MetricCard as Metric, PanelCard, UiBadge } from '../ui';

export function ChainRuntimeEvidence({
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
                  <Typography.Text type="secondary" className="zh-agent-chain-stage-code">
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
          <div className="zh-agent-policy-list">
            {Object.entries(result.summary.policy_distribution).map(([policy, count]) => (
              <span key={policy} className="zh-agent-policy-item">
                {policy} <UiBadge count={count} className="zh-agent-badge-brand" />
              </span>
            ))}
          </div>
        )}
      </Space>
    </PanelCard>
  );
}
