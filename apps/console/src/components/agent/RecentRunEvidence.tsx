import { Col, Flex, Row, Space, Steps, Timeline, Typography } from 'antd';
import { Activity, GitBranch, ShieldCheck } from 'lucide-react';
import type { RunResult } from '@/types';
import { riskLabel } from '@/utils';
import { DecisionPill, EvidenceList, MetricCard as Metric, PanelCard, UiSelect } from '../ui';

export function RecentRunEvidence({
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
          <UiSelect
            value={activeRun?.run_id ?? selectedRunId}
            onChange={(value) => setSelectedRunId(value)}
            className="zh-agent-run-select"
          >
            {candidates.map((run) => (
              <UiSelect.Option key={run.run_id} value={run.run_id}>
                {formatRunLabel(run)}
              </UiSelect.Option>
            ))}
          </UiSelect>
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
