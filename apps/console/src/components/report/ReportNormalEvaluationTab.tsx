import { Col, Row, Space, Typography } from 'antd';
import { LabelTag, MetricCard as Metric, PanelCard, SectionTitle, UiTable } from '../ui';
import type { ReportData } from '@/types';

type ReportNormalEvaluationTabProps = {
  report: ReportData;
};

export function ReportNormalEvaluationTab({ report }: ReportNormalEvaluationTabProps) {
  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      {report.policy_ablation && (
        <PanelCard
          title={
            <SectionTitle
              title="策略消融实验"
              meta={`${report.policy_ablation.summary.experiment_count} 组策略 / ${report.policy_ablation.summary.scenario_count} 个剧本`}
            />
          }
          variant="borderless"
        >
          <Row gutter={[16, 16]} className="zh-mb-24">
            <Col span={5}>
              <Metric
                label="基线控制率"
                value={`${report.policy_ablation.summary.baseline_control_rate}%`}
                tone="green"
              />
            </Col>
            <Col span={5}>
              <Metric
                label="消融后控制率"
                value={`${report.policy_ablation.summary.ablated_control_rate}%`}
                tone="amber"
              />
            </Col>
            <Col span={4}>
              <Metric label="控制率下降" value={`${report.policy_ablation.summary.control_drop}%`} tone="red" />
            </Col>
            <Col span={5}>
              <Metric label="风险暴露" value={`${report.policy_ablation.summary.risk_exposed_count}`} tone="red" />
            </Col>
            <Col span={5}>
              <Metric label="兜底控制" value={`${report.policy_ablation.summary.fallback_control_count}`} tone="cyan" />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            {report.policy_ablation.experiments.map((item) => (
              <Col xs={24} md={12} xl={8} key={item.id}>
                <PanelCard
                  type="inner"
                  title={
                    <Space>
                      <Typography.Text strong>{item.name}</Typography.Text>
                      <LabelTag variant="filled" color={item.risk_exposed_count ? 'error' : 'success'}>
                        {item.risk_exposed_count ? '出现暴露' : '有兜底'}
                      </LabelTag>
                    </Space>
                  }
                  className="zh-full-height"
                >
                  <Typography.Paragraph type="secondary" className="zh-min-h-44">
                    {item.hypothesis}
                  </Typography.Paragraph>
                  <Space size="large" className="zh-mb-16">
                    <div>
                      <Typography.Text type="secondary" className="zh-meta-block">
                        关闭策略
                      </Typography.Text>
                      <Typography.Text strong>{item.disabled_policies.length}</Typography.Text>
                    </div>
                    <div>
                      <Typography.Text type="secondary" className="zh-meta-block">
                        剧本
                      </Typography.Text>
                      <Typography.Text strong>{item.baseline.scenario_count}</Typography.Text>
                    </div>
                    <div>
                      <Typography.Text type="secondary" className="zh-meta-block">
                        基线
                      </Typography.Text>
                      <Typography.Text strong>{item.baseline.control_rate}%</Typography.Text>
                    </div>
                    <div>
                      <Typography.Text type="secondary" className="zh-meta-block">
                        消融后
                      </Typography.Text>
                      <Typography.Text strong>{item.ablated.control_rate}%</Typography.Text>
                    </div>
                  </Space>
                  <div className="zh-mb-16">
                    {item.disabled_policies.map((p) => (
                      <LabelTag variant="filled" key={p}>
                        {p}
                      </LabelTag>
                    ))}
                  </div>
                  <Typography.Text type="secondary" className="zh-text-body">
                    {item.conclusion}
                  </Typography.Text>
                </PanelCard>
              </Col>
            ))}
          </Row>
        </PanelCard>
      )}
      <PanelCard
        title={
          <SectionTitle
            title="正常比赛任务误报评测"
            meta={`${report.benign_evaluation.summary.case_count} 个正常样本 / 误报 ${report.benign_evaluation.summary.false_positive_count} 个`}
          />
        }
        variant="borderless"
      >
        <Row gutter={[16, 16]} className="zh-mb-24">
          <Col span={4}>
            <Metric label="正常样本" value={`${report.benign_evaluation.summary.case_count}`} tone="cyan" />
          </Col>
          <Col span={4}>
            <Metric label="覆盖类别" value={`${report.benign_evaluation.summary.category_count}`} tone="cyan" />
          </Col>
          <Col span={4}>
            <Metric label="工具类型" value={`${report.benign_evaluation.summary.tool_count}`} tone="amber" />
          </Col>
          <Col span={4}>
            <Metric
              label="需确认/隔离"
              value={`${report.benign_evaluation.summary.expected_control_count}`}
              tone="amber"
            />
          </Col>
          <Col span={4}>
            <Metric
              label="误报率"
              value={`${report.benign_evaluation.summary.false_positive_rate}%`}
              tone={report.benign_evaluation.summary.false_positive_rate > 0 ? 'red' : 'green'}
            />
          </Col>
          <Col span={4}>
            <Metric label="匹配率" value={`${report.benign_evaluation.summary.expected_match_rate}%`} tone="green" />
          </Col>
        </Row>
        <UiTable
          dataSource={report.benign_evaluation.cases}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: '样本',
              dataIndex: 'id',
              render: (t) => <Typography.Text strong>{t}</Typography.Text>
            },
            { title: '类别', dataIndex: 'category' },
            {
              title: '工具',
              key: 'tool',
              render: (_, r) => <Typography.Text code>{r.tool_call.tool}</Typography.Text>
            },
            { title: '期望', dataIndex: 'expected_decision' },
            { title: '实际', dataIndex: 'decision' },
            {
              title: '误报',
              key: 'is_false_positive',
              render: (_, r) => (
                <LabelTag variant="filled" color={r.is_false_positive ? 'error' : 'success'}>
                  {r.is_false_positive ? '是' : '否'}
                </LabelTag>
              )
            },
            {
              title: '策略',
              dataIndex: 'policy_id',
              render: (t) => <Typography.Text code>{t}</Typography.Text>
            }
          ]}
        />
      </PanelCard>
      {report.benign_workflow_evaluation && (
        <PanelCard
          title={
            <SectionTitle
              title="连续正常赛事流程评测"
              meta={`${report.benign_workflow_evaluation.summary.workflow_count} 条流程 / ${report.benign_workflow_evaluation.summary.step_count} 个步骤`}
            />
          }
          variant="borderless"
        >
          <Row gutter={[16, 16]} className="zh-mb-24">
            <Col span={5}>
              <Metric
                label="流程通过率"
                value={`${report.benign_workflow_evaluation.summary.workflow_pass_rate}%`}
                tone="green"
              />
            </Col>
            <Col span={5}>
              <Metric
                label="步骤误报率"
                value={`${report.benign_workflow_evaluation.summary.false_positive_rate}%`}
                tone="amber"
              />
            </Col>
            <Col span={5}>
              <Metric
                label="匹配率"
                value={`${report.benign_workflow_evaluation.summary.expected_match_rate}%`}
                tone="cyan"
              />
            </Col>
            <Col span={5}>
              <Metric
                label="边界控制"
                value={`${report.benign_workflow_evaluation.summary.expected_control_step_count}`}
                tone="amber"
              />
            </Col>
            <Col span={4}>
              <Metric
                label="审计链有效"
                value={`${report.benign_workflow_evaluation.summary.audit_chain_valid_count}`}
                tone="green"
              />
            </Col>
          </Row>
          <div className="zh-column-stack">
            {report.benign_workflow_evaluation.workflows.map((workflow, idx) => (
              <div key={idx} className="zh-report-list-item zh-report-list-item--top">
                <div className="zh-report-list-content">
                  <div>
                    <Typography.Text strong>{workflow.title}</Typography.Text>
                  </div>
                  <div className="zh-mt-4">
                    <Typography.Text type="secondary">{workflow.business_purpose}</Typography.Text>
                  </div>
                </div>
                <Space wrap>
                  <LabelTag variant="filled" color={workflow.passed ? 'success' : 'error'}>
                    {workflow.passed ? '通过' : '需复核'}
                  </LabelTag>
                  <LabelTag variant="filled">
                    {workflow.step_count} 步 / 控制 {workflow.controlled_count}
                  </LabelTag>
                  <LabelTag variant="filled">{workflow.audit_chain_valid ? 'hash 有效' : 'hash 异常'}</LabelTag>
                </Space>
              </div>
            ))}
          </div>
        </PanelCard>
      )}
    </Space>
  );
}
