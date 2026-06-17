import React from 'react';
import { Row, Col, Typography, Space, Flex, Button, Statistic, Divider } from 'antd';
import {
  Activity,
  Play,
  TerminalSquare,
  Settings2,
  ShieldCheck,
  GitBranch,
  FlaskConical,
  ArrowRight
} from 'lucide-react';
import { ActionRow, MetricCard as Metric, PanelCard } from '../ui';
import { SurfaceResearchMatrix } from '../surface/SurfaceResearchMatrix';
import type { AlertItem, Overview, Scenario } from '../../types';

type AgentNodeProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active?: boolean;
  activeTone?: 'primary' | 'success';
};

const AgentNode = ({ icon, title, desc, active, activeTone = 'primary' }: AgentNodeProps) => (
  <div
    style={{
      background: active ? `var(--ant-color-${activeTone}-bg)` : 'var(--ant-color-bg-container)',
      border: `1px solid ${active ? `var(--ant-color-${activeTone})` : 'var(--ant-color-border)'}`,
      padding: '16px 12px',
      borderRadius: 8,
      textAlign: 'center',
      width: 120,
      boxShadow: active ? `0 0 8px var(--ant-color-${activeTone}-bg)` : 'var(--zh-shadow-hairline)',
      transition: 'all 0.3s'
    }}
  >
    <div
      style={{ color: active ? `var(--ant-color-${activeTone})` : 'var(--ant-color-text-secondary)', marginBottom: 12 }}
    >
      {icon}
    </div>
    <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>
      {title}
    </Typography.Text>
    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
      {desc}
    </Typography.Text>
  </div>
);

type DashboardPipelineNode = {
  label: string;
  value: string;
};

type DashboardOverviewTabProps = {
  overview: Overview;
  running: boolean;
  priorityScenario?: Scenario;
  maxRiskScore: number;
  latestAlert?: AlertItem;
  completeSurfaceCount: number;
  totalSamples: number;
  totalScripts: number;
  highRiskSurfaceCount: number;
  pipelineNodes: DashboardPipelineNode[];
  onSelectScenario: (id: string) => void;
  onBatchCompare: (ids: string[], label: string) => void;
};

export function DashboardOverviewTab({
  overview,
  running,
  priorityScenario,
  maxRiskScore,
  latestAlert,
  completeSurfaceCount,
  totalSamples,
  totalScripts,
  highRiskSurfaceCount,
  pipelineNodes,
  onSelectScenario,
  onBatchCompare
}: DashboardOverviewTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <PanelCard variant="borderless" styles={{ body: { padding: 32 } }}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={24}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <Typography.Text type="secondary">命题挑战赛 · 大模型应用安全监督原型</Typography.Text>
                <Typography.Title level={2} style={{ marginTop: 8, marginBottom: 16 }}>
                  智能体工具调用实时审计与阻断台
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 600 }}>
                  以红队攻击样本驱动监督策略，对邮件、文件、API、代码执行和外部 Agent
                  事件进行风险评分、策略判定、沙箱执行和告警留痕。
                </Typography.Paragraph>
                <ActionRow>
                  <Button
                    type="primary"
                    size="large"
                    icon={<Play size={16} />}
                    onClick={() =>
                      onBatchCompare(
                        overview.scenarios.map((scenario) => scenario.id),
                        '全部攻击剧本'
                      )
                    }
                    disabled={running || !overview.scenarios.length}
                  >
                    {running ? '验证中...' : '一键验证全部剧本'}
                  </Button>
                  <Button
                    size="large"
                    icon={<TerminalSquare size={16} />}
                    onClick={() => priorityScenario && onSelectScenario(priorityScenario.id)}
                    disabled={!priorityScenario}
                  >
                    打开高风险剧本
                  </Button>
                </ActionRow>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', width: '100%' }}>
                <PanelCard
                  variant="borderless"
                  style={{ background: 'var(--ant-color-error-bg)', minWidth: 160, flex: 1 }}
                >
                  <Typography.Text type="secondary">最高风险分</Typography.Text>
                  <Typography.Title level={1} style={{ margin: 0, color: 'var(--ant-color-error)' }}>
                    {maxRiskScore}
                  </Typography.Title>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {latestAlert ? latestAlert.title : '等待攻击演示'}
                  </Typography.Text>
                </PanelCard>
                <PanelCard
                  variant="borderless"
                  style={{ background: 'var(--ant-color-success-bg)', minWidth: 160, flex: 1 }}
                >
                  <Typography.Text type="secondary">防护控制率</Typography.Text>
                  <Typography.Title level={1} style={{ margin: 0, color: 'var(--ant-color-success)' }}>
                    {overview.summary.block_rate}%
                  </Typography.Title>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    拒绝、询问均计入控制
                  </Typography.Text>
                </PanelCard>
              </div>
            </Flex>
          </PanelCard>
        </Col>
      </Row>

      <PanelCard variant="borderless">
        <Row gutter={[16, 16]} align="middle" justify="start">
          {pipelineNodes.map((node, index) => (
            <Col xs={12} sm={8} md={4} key={node.label}>
              <Statistic
                title={
                  <span>
                    <span style={{ color: 'var(--ant-color-primary)', marginRight: 8 }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {node.label}
                  </span>
                }
                value={node.value}
              />
            </Col>
          ))}
        </Row>
      </PanelCard>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Metric
            label="攻击面完善度"
            value={`${completeSurfaceCount}/${overview.summary.surface_count}`}
            tone="cyan"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="攻击剧本" value={`${overview.summary.scenario_count}`} tone="amber" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="样本/脚本" value={`${totalSamples}/${totalScripts}`} tone="green" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="高风险面" value={`${highRiskSurfaceCount}`} tone="red" />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={14}>
          <PanelCard
            title={
              <Space>
                <GitBranch size={18} color="var(--ant-color-primary)" />
                <Typography.Text strong>多 Agent 红队链路架构</Typography.Text>
              </Space>
            }
            variant="borderless"
            className="zh-full-height"
            extra={
              <Button type="link" onClick={() => onSelectScenario(priorityScenario?.id ?? '')}>
                查看剧本详情
              </Button>
            }
          >
            <div style={{ background: 'var(--ant-color-fill-quaternary)', padding: 24, borderRadius: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
                红队攻击方 (Red Team Agents)
              </Typography.Text>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16
                }}
              >
                <AgentNode icon={<GitBranch size={20} />} title="规划 Agent" desc="分解攻击剧本" />
                <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                <AgentNode icon={<FlaskConical size={20} />} title="样本生成" desc="构造对抗样本" />
                <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                <AgentNode icon={<TerminalSquare size={20} />} title="执行 Agent" desc="投递与漏洞利用" active />
              </div>
              <Divider
                dashed
                style={{ borderColor: 'var(--ant-color-error)', margin: '20px 0' }}
                titlePlacement="left"
                plain
              >
                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                  攻击边界 (Attack Surface)
                </Typography.Text>
              </Divider>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
                蓝队防御方 (Blue Team Environment)
              </Typography.Text>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <AgentNode icon={<Settings2 size={20} />} title="目标智能体" desc="受害应用/模型" />
                <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                <AgentNode
                  icon={<ShieldCheck size={20} />}
                  title="行为监督器"
                  desc="实时旁路拦截"
                  activeTone="success"
                />
                <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                <AgentNode icon={<Activity size={20} />} title="沙箱与工具" desc="安全隔离执行" />
              </div>
            </div>
          </PanelCard>
        </Col>
        <Col xs={24} md={10}>
          <PanelCard
            title={
              <Space orientation="vertical" size={0}>
                <Typography.Text strong>主演示攻击剧本</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {overview.scenarios.length} 个可运行
                </Typography.Text>
              </Space>
            }
            variant="borderless"
            className="zh-full-height"
            styles={{ body: { padding: 0 } }}
          >
            <div className="zh-column-stack">
              {overview.scenarios.slice(0, 5).map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario.id)}
                  style={{
                    padding: '16px 24px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--ant-color-border-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div>
                      <Typography.Text strong>{scenario.title}</Typography.Text>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {scenario.id} · {scenario.target}
                      </Typography.Text>
                    </div>
                  </div>
                  <div>
                    <Play size={16} color="var(--ant-color-primary)" />
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>
        </Col>
      </Row>

      <div>
        <SurfaceResearchMatrix surfaces={overview.attack_surfaces} profiles={overview.student_competition_attack_map} />
      </div>
    </div>
  );
}
