import { Col, Flex, Row, Space, Typography } from 'antd';
import { MetricCard as Metric, PanelCard, SectionTitle, UiBadge, UiProgress } from '../ui';
import type { ReportData } from '@/types';
import { AnomalyCalibrationBlock } from './AnomalyCalibrationBlock';
import { ProjectRoadmapBlock } from './ProjectRoadmapBlock';

type ReportOverviewTabProps = {
  report: ReportData;
};

export function ReportOverviewTab({ report }: ReportOverviewTabProps) {
  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Metric label="攻击面覆盖" value={`${report.summary.surface_count}/7`} tone="cyan" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Metric label="攻击脚本" value={`${report.summary.scenario_count}`} tone="amber" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Metric label="防护控制率" value={`${report.summary.control_rate}%`} tone="green" />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Metric
            label="正常误报率"
            value={`${report.summary.false_positive_rate}%`}
            tone={report.summary.false_positive_rate ? 'amber' : 'green'}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Metric
            label="异常召回率"
            value={`${report.summary.anomaly_attack_recall_rate ?? report.anomaly_calibration?.summary.attack_recall_rate ?? 0}%`}
            tone="cyan"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Metric label="平均延迟" value={`${report.summary.avg_latency_ms}ms`} tone="red" />
        </Col>
      </Row>
      {report.project_roadmap && <ProjectRoadmapBlock roadmap={report.project_roadmap} />}
      {report.anomaly_calibration && <AnomalyCalibrationBlock calibration={report.anomaly_calibration} />}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <PanelCard
            title={<SectionTitle title="核心评测曲线" meta={`${report.summary.run_count} 次实验运行`} />}
            variant="borderless"
            className="zh-full-height"
          >
            <Space orientation="vertical" className="zh-full-width">
              {[
                {
                  label: '防护控制率',
                  value: report.summary.control_rate,
                  color: 'var(--ant-color-success)'
                },
                {
                  label: '攻击成功率',
                  value: report.summary.attack_success_rate,
                  color: 'var(--ant-color-error)'
                },
                {
                  label: '正常比赛任务误报率',
                  value: report.summary.false_positive_rate,
                  color: 'var(--ant-color-warning)'
                },
                {
                  label: '期望决策匹配率',
                  value: report.summary.expected_match_rate,
                  color: 'var(--ant-color-info)'
                },
                {
                  label: '输出过滤阻断率',
                  value: report.summary.output_filter_block_rate,
                  color: 'var(--ant-color-success)'
                },
                {
                  label: '策略启用率',
                  value: Math.round(
                    (report.summary.enabled_policy_count / Math.max(1, report.summary.policy_count)) * 100
                  ),
                  color: 'var(--ant-color-info)'
                }
              ].map((item) => (
                <div key={item.label}>
                  <Flex justify="space-between">
                    <Typography.Text>{item.label}</Typography.Text>
                    <Typography.Text strong>{item.value}%</Typography.Text>
                  </Flex>
                  <UiProgress
                    percent={Math.min(100, Math.max(0, item.value))}
                    showInfo={false}
                    strokeColor={item.color}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </PanelCard>
        </Col>
        <Col xs={24} lg={12}>
          <PanelCard title="攻击面脚本分布" variant="borderless" className="zh-full-height">
            <Space orientation="vertical" className="zh-full-width">
              {report.surface_coverage.map((surface) => {
                const maxCount = Math.max(1, ...report.surface_coverage.map((i) => i.scenario_count));
                return (
                  <div key={surface.id}>
                    <Flex justify="space-between">
                      <Typography.Text>{surface.name}</Typography.Text>
                      <Typography.Text strong>{surface.scenario_count}</Typography.Text>
                    </Flex>
                    <UiProgress
                      percent={Math.max(2, Math.round((surface.scenario_count / maxCount) * 100))}
                      showInfo={false}
                      strokeColor="var(--ant-color-primary)"
                      size="small"
                    />
                  </div>
                );
              })}
            </Space>
          </PanelCard>
        </Col>
      </Row>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <PanelCard
            title={<SectionTitle title="比赛预期成果对齐" meta={`${report.deliverables.length} 项`} />}
            variant="borderless"
            className="zh-full-height"
          >
            <div className="zh-column-stack">
              {report.deliverables.map((item, idx) => (
                <div key={idx} className="zh-report-list-item">
                  <div className="zh-report-list-main">
                    <div className="zh-pt-4">
                      <UiBadge status="processing" />
                    </div>
                    <div>
                      <div>
                        <Typography.Text strong>{item.name}</Typography.Text>
                      </div>
                      <div className="zh-mt-4">
                        <Typography.Text type="secondary">{item.evidence}</Typography.Text>
                      </div>
                    </div>
                  </div>
                  <Typography.Text strong>{item.status}</Typography.Text>
                </div>
              ))}
              {!report.deliverables.length && <div className="zh-empty-panel">暂无数据</div>}
            </div>
          </PanelCard>
        </Col>
        <Col xs={24} lg={12}>
          <PanelCard
            title={<SectionTitle title="策略命中统计" meta={`${report.policy_hits.length || 0} 类策略`} />}
            variant="borderless"
            className="zh-full-height"
          >
            <div className="zh-column-stack">
              {report.policy_hits.map((item, idx) => (
                <div key={idx} className="zh-report-list-item">
                  <Typography.Text>{item.policy_id}</Typography.Text>
                  <Typography.Text strong>{item.count}</Typography.Text>
                </div>
              ))}
              {!report.policy_hits.length && (
                <div className="zh-empty-panel">暂无策略命中记录，先运行一次攻击脚本。</div>
              )}
            </div>
          </PanelCard>
        </Col>
      </Row>
    </Space>
  );
}
