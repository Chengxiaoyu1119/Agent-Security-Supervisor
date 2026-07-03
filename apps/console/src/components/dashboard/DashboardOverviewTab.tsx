import { Col, Divider, Flex, Row, Space, Statistic, Typography } from 'antd';
import {
  Activity,
  ArrowRight,
  FlaskConical,
  GitBranch,
  Play,
  Settings2,
  ShieldCheck,
  TerminalSquare
} from 'lucide-react';
import { ActionRow, MetricCard as Metric, PanelCard, UiButton } from '../ui';
import { SurfaceResearchMatrix } from '../surface/SurfaceResearchMatrix';
import type { AlertItem, Overview, Scenario } from '@/types';
import { DashboardAgentNode } from './DashboardAgentNode';
import type { PageKey } from '@/app/navigation';
import { DashboardCompetitionGuide } from './DashboardCompetitionGuide';

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
  onOpenPage: (page: PageKey) => void;
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
  onOpenPage,
  onBatchCompare
}: DashboardOverviewTabProps) {
  return (
    <div className="zh-page-stack zh-mt-8">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <PanelCard variant="borderless" bodyPadding={32}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={24}>
              <div className="zh-dashboard-hero-copy">
                <Typography.Text type="secondary">命题挑战赛 · 大模型应用安全监督原型</Typography.Text>
                <Typography.Title level={1} className="zh-title-compact">
                  智能体工具调用实时审计与阻断台
                </Typography.Title>
                <Typography.Paragraph type="secondary" className="zh-text-lead">
                  以红队攻击样本驱动监督策略，对邮件、文件、API、代码执行和外部 Agent
                  事件进行风险评分、策略判定、沙箱执行和告警留痕。
                </Typography.Paragraph>
                <ActionRow>
                  <UiButton
                    type="primary"
                    size="large"
                    icon={<Play size={16} />}
                    onClick={() =>
                      onBatchCompare(
                        overview.scenarios.map((scenario) => scenario.id),
                        '全部攻击脚本'
                      )
                    }
                    disabled={running || !overview.scenarios.length}
                  >
                    {running ? '验证中...' : '一键验证全部脚本'}
                  </UiButton>
                  <UiButton
                    size="large"
                    icon={<TerminalSquare size={16} />}
                    onClick={() => priorityScenario && onSelectScenario(priorityScenario.id)}
                    disabled={!priorityScenario}
                  >
                    打开高风险脚本
                  </UiButton>
                </ActionRow>
              </div>
              <div className="zh-dashboard-metric-row">
                <PanelCard variant="borderless" className="zh-dashboard-metric-panel zh-dashboard-metric-panel--risk">
                  <Typography.Text type="secondary">最高风险分</Typography.Text>
                  <Typography.Title level={2} className="zh-title-flush zh-color-error">
                    {maxRiskScore}
                  </Typography.Title>
                  <Typography.Text type="secondary" className="zh-text-meta">
                    {latestAlert ? latestAlert.title : '等待攻击验证'}
                  </Typography.Text>
                </PanelCard>
                <PanelCard
                  variant="borderless"
                  className="zh-dashboard-metric-panel zh-dashboard-metric-panel--control"
                >
                  <Typography.Text type="secondary">防护控制率</Typography.Text>
                  <Typography.Title level={2} className="zh-title-flush zh-color-success">
                    {overview.summary.block_rate}%
                  </Typography.Title>
                  <Typography.Text type="secondary" className="zh-text-meta">
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
                    <span className="zh-color-primary zh-mr-8">{String(index + 1).padStart(2, '0')}</span>
                    {node.label}
                  </span>
                }
                value={node.value}
              />
            </Col>
          ))}
        </Row>
      </PanelCard>

      <DashboardCompetitionGuide
        overview={overview}
        completeSurfaceCount={completeSurfaceCount}
        onOpenPage={onOpenPage}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Metric
            label="攻击面完善度"
            value={`${completeSurfaceCount}/${overview.summary.surface_count}`}
            tone="cyan"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="攻击脚本" value={`${overview.summary.scenario_count}`} tone="amber" />
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
              <UiButton type="link" onClick={() => onSelectScenario(priorityScenario?.id ?? '')}>
                查看脚本详情
              </UiButton>
            }
          >
            <div className="zh-soft-block">
              <Typography.Text type="secondary" className="zh-text-meta zh-mb-12 zh-text-block">
                红队攻击方 (Red Team Agents)
              </Typography.Text>
              <div className="zh-dashboard-agent-flow">
                <DashboardAgentNode icon={<GitBranch size={20} />} title="规划 Agent" desc="分解攻击脚本" />
                <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                <DashboardAgentNode icon={<FlaskConical size={20} />} title="样本生成" desc="构造对抗样本" />
                <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                <DashboardAgentNode
                  icon={<TerminalSquare size={20} />}
                  title="执行 Agent"
                  desc="投递与漏洞利用"
                  active
                />
              </div>
              <Divider dashed className="zh-attack-divider" titlePlacement="left" plain>
                <Typography.Text type="danger" className="zh-text-meta">
                  攻击边界 (Attack Surface)
                </Typography.Text>
              </Divider>
              <Typography.Text type="secondary" className="zh-text-meta zh-mb-12 zh-text-block">
                蓝队防御方 (Blue Team Environment)
              </Typography.Text>
              <div className="zh-dashboard-pipeline-row">
                <DashboardAgentNode icon={<Settings2 size={20} />} title="目标智能体" desc="受害应用/模型" />
                <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                <DashboardAgentNode
                  icon={<ShieldCheck size={20} />}
                  title="行为监督器"
                  desc="实时旁路拦截"
                  activeTone="success"
                />
                <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                <DashboardAgentNode icon={<Activity size={20} />} title="沙箱与工具" desc="安全隔离执行" />
              </div>
            </div>
          </PanelCard>
        </Col>
        <Col xs={24} md={10}>
          <PanelCard
            title={
              <Space orientation="vertical" size={0}>
                <Typography.Text strong>主运行攻击脚本</Typography.Text>
                <Typography.Text type="secondary" className="zh-text-meta">
                  {overview.scenarios.length} 个可运行
                </Typography.Text>
              </Space>
            }
            variant="borderless"
            className="zh-full-height"
            bodyPadding={0}
          >
            <div className="zh-column-stack">
              {overview.scenarios.slice(0, 5).map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario.id)}
                  className="zh-dashboard-scenario-item"
                >
                  <div>
                    <div>
                      <Typography.Text strong>{scenario.title}</Typography.Text>
                    </div>
                    <div className="zh-mt-4">
                      <Typography.Text type="secondary" className="zh-text-meta">
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
