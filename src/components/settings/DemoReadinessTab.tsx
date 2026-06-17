import { Play, ScrollText, ShieldCheck, TerminalSquare } from 'lucide-react';
import { Alert, Button, Col, Row, Space, Tag, Typography } from 'antd';
import { DecisionPill, MetricCard as Metric, PanelCard } from '../ui';
import type {
  AttackCaseDataset,
  CompetitionReadiness,
  CompetitionReadinessWriteResult,
  DemoDrillResult,
  Overview
} from '../../types';

type DemoReadinessTabProps = {
  overview: Overview;
  attackDataset: AttackCaseDataset | null;
  demoDrill: DemoDrillResult | null;
  runningDemoDrill: boolean;
  handleRunDemoDrill: () => void | Promise<void>;
  competitionReadiness: CompetitionReadiness | null;
  competitionReadinessOutput: CompetitionReadinessWriteResult | null;
  checkingReadiness: boolean;
  handleRunReadiness: () => void | Promise<void>;
};

export function DemoReadinessTab({
  overview,
  attackDataset,
  demoDrill,
  runningDemoDrill,
  handleRunDemoDrill,
  competitionReadiness,
  competitionReadinessOutput,
  checkingReadiness,
  handleRunReadiness
}: DemoReadinessTabProps) {
  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      <PanelCard
        title="Judge Demo Mode (答辩一键演示)"
        extra={
          <Button type="primary" icon={<Play size={16} />} onClick={handleRunDemoDrill} loading={runningDemoDrill}>
            运行答辩演示
          </Button>
        }
        type="inner"
      >
        <Typography.Paragraph type="secondary">
          一键跑完正常放行、外发复核、批量导出审批和记忆隔离，自动生成 audit_hash、review_hash 与报告文件。
        </Typography.Paragraph>
        {demoDrill && demoDrill.summary.stage_count > 0 ? (
          <>
            <Row gutter={[16, 16]} className="zh-mb-24">
              <Col xs={12} sm={8} md={4}>
                <Metric label="演示步骤" value={`${demoDrill.summary.stage_count}`} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Metric label="监督控制" value={`${demoDrill.summary.controlled_count}`} tone="green" />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Metric label="人工批准" value={`${demoDrill.summary.approved_count}`} tone="cyan" />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Metric label="人工驳回" value={`${demoDrill.summary.rejected_count}`} tone="red" />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Metric label="审计 hash" value={`${demoDrill.summary.audit_hash_count}`} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Metric label="复核 hash" value={`${demoDrill.summary.review_hash_count}`} />
              </Col>
            </Row>
            <div className="zh-column-stack">
              {demoDrill.stages.map((stage) => (
                <div key={stage.index} className="zh-settings-record">
                  <Row className="zh-settings-row-full" align="middle" gutter={[16, 16]}>
                    <Col xs={4} md={2}>
                      <Typography.Text strong className="zh-settings-record-index">
                        {String(stage.index).padStart(2, '0')}
                      </Typography.Text>
                    </Col>
                    <Col xs={20} md={8}>
                      <Typography.Text strong className="zh-settings-record-title">
                        {stage.title}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        className="zh-settings-record-title zh-settings-endpoint-description"
                      >
                        {stage.objective}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="zh-settings-meta-sm">
                        {stage.reason}
                      </Typography.Text>
                    </Col>
                    <Col xs={24} md={6}>
                      <Space orientation="vertical" size={2}>
                        <Tag variant="filled" className="zh-settings-tag-flush">
                          {stage.tool}
                        </Tag>
                        <Typography.Text type="secondary" className="zh-settings-meta-sm">
                          策略: {stage.policy_id}
                        </Typography.Text>
                      </Space>
                    </Col>
                    <Col xs={12} md={4}>
                      <Space orientation="vertical" size={2}>
                        <DecisionPill decision={stage.decision} />
                        <Typography.Text type="secondary" className="zh-meta-block">
                          复核: {stage.approval_action_label}
                        </Typography.Text>
                      </Space>
                    </Col>
                    <Col xs={12} md={4}>
                      <Space orientation="vertical" size={2}>
                        <Typography.Text type="secondary" className="zh-meta-block">
                          audit: {stage.audit_hash?.slice(0, 14) ?? '-'}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="zh-meta-block">
                          review: {stage.review_hash?.slice(0, 14) ?? '-'}
                        </Typography.Text>
                      </Space>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
            <Space className="zh-settings-path-list" wrap>
              <Tag variant="filled" icon={<ScrollText size={14} />} className="zh-settings-path-tag">
                {demoDrill.markdown_path}
              </Tag>
              <Tag variant="filled" icon={<TerminalSquare size={14} />} className="zh-settings-path-tag">
                {demoDrill.json_path}
              </Tag>
            </Space>
          </>
        ) : (
          <Alert title="还没有运行答辩一键演示。点击按钮后会生成 4 步演示、审计证据和本地报告。" type="info" showIcon />
        )}
      </PanelCard>

      <PanelCard
        title="赛前一键体检"
        extra={
          <Button
            type="primary"
            icon={<ShieldCheck size={16} />}
            onClick={handleRunReadiness}
            loading={checkingReadiness}
          >
            运行体检并写报告
          </Button>
        }
        type="inner"
      >
        <Typography.Paragraph type="secondary">
          自动检查攻击面、误报、连续流程、OpenClaw 插件、截图和提交包，直接给出可提交状态与 P0 补证项。
        </Typography.Paragraph>
        {competitionReadiness ? (
          <>
            <Row gutter={[16, 16]} className="zh-settings-readiness-summary">
              <Col xs={12} md={6}>
                <Typography.Text type="secondary" className="zh-meta-block">
                  就绪分
                </Typography.Text>
                <Typography.Title level={2} className="zh-settings-readiness-score">
                  {competitionReadiness.readiness_score}%
                </Typography.Title>
              </Col>
              <Col xs={12} md={6}>
                <Typography.Text type="secondary" className="zh-meta-block">
                  {competitionReadiness.status_label}
                </Typography.Text>
                <Typography.Text strong>{competitionReadiness.verdict}</Typography.Text>
              </Col>
              <Col xs={24} md={12}>
                <Space size="large" wrap>
                  <div>
                    <Typography.Text type="secondary" className="zh-meta-block">
                      通过
                    </Typography.Text>
                    <Typography.Text strong>{competitionReadiness.summary.passed_count}</Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary" className="zh-meta-block">
                      阻塞
                    </Typography.Text>
                    <Typography.Text strong>{competitionReadiness.summary.blocker_count}</Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary" className="zh-meta-block">
                      截图
                    </Typography.Text>
                    <Typography.Text strong>{competitionReadiness.summary.screenshot_count}</Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary" className="zh-meta-block">
                      提交包文件
                    </Typography.Text>
                    <Typography.Text strong>{competitionReadiness.summary.latest_package_file_count}</Typography.Text>
                  </div>
                </Space>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              {competitionReadiness.checks.map((check, idx) => (
                <Col xs={24} lg={12} key={idx}>
                  <PanelCard
                    size="small"
                    className={
                      check.status === 'pass'
                        ? 'zh-settings-check-card--pass'
                        : check.status === 'block'
                          ? 'zh-settings-check-card--block'
                          : 'zh-settings-check-card--warning'
                    }
                  >
                    <div className="zh-settings-check-head">
                      <Typography.Text type="secondary" className="zh-settings-meta-sm">
                        {check.category} · {check.severity}
                      </Typography.Text>
                      <Tag
                        variant="filled"
                        color={check.status === 'pass' ? 'success' : check.status === 'block' ? 'error' : 'warning'}
                      >
                        {check.status_label}
                      </Tag>
                    </div>
                    <Typography.Text strong className="zh-settings-check-title">
                      {check.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="zh-settings-check-evidence">
                      {check.evidence}
                    </Typography.Text>
                  </PanelCard>
                </Col>
              ))}
            </Row>

            {competitionReadiness.blockers.length > 0 && (
              <Alert
                title="阻断项 (Blockers)"
                type="error"
                showIcon
                className="zh-settings-blocker-alert"
                description={
                  <div className="zh-column-stack">
                    {competitionReadiness.blockers.map((item, idx) => (
                      <div key={idx} className="zh-settings-blocker-item">
                        <Typography.Text strong>
                          {item.severity}: {item.title}
                        </Typography.Text>
                        <div className="zh-settings-blocker-action">{item.next_action}</div>
                      </div>
                    ))}
                  </div>
                }
              />
            )}

            <Space orientation="vertical" className="zh-settings-command-list">
              {competitionReadiness.acceptance_commands.map((command) => (
                <Tag variant="filled" key={command} className="zh-settings-code-tag">
                  {command}
                </Tag>
              ))}
              {competitionReadiness.summary.latest_package_zip && (
                <Typography.Text code className="zh-settings-code-wrap">
                  {competitionReadiness.summary.latest_package_zip}
                </Typography.Text>
              )}
              {competitionReadinessOutput && (
                <Typography.Text code className="zh-settings-code-wrap">
                  {competitionReadinessOutput.markdown_path}
                </Typography.Text>
              )}
              {competitionReadinessOutput && (
                <Typography.Text code className="zh-settings-code-wrap">
                  {competitionReadinessOutput.json_path}
                </Typography.Text>
              )}
            </Space>
          </>
        ) : (
          <Alert
            title="暂无体检结果。点击按钮后会生成本地 JSON 和 Markdown，并在这里显示就绪分与补证项。"
            type="info"
            showIcon
          />
        )}
      </PanelCard>

      <PanelCard title="攻击样本数据集" type="inner">
        <Row gutter={[16, 16]} className="zh-mb-24">
          <Col xs={12} sm={8} md={4}>
            <Metric
              label="攻击面"
              value={`${attackDataset?.summary.surface_count ?? overview.summary.surface_count}`}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Metric
              label="剧本"
              value={`${attackDataset?.summary.scenario_count ?? overview.summary.scenario_count}`}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Metric
              label="对抗样本"
              value={`${attackDataset?.summary.adversarial_sample_count ?? overview.summary.scenario_count}`}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Metric
              label="越狱用例"
              value={`${attackDataset?.summary.jailbreak_case_count ?? overview.summary.scenario_count}`}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Metric label="复现入口" value={`${attackDataset?.summary.replay_recipe_count ?? '-'}`} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Metric label="工具调用" value={`${attackDataset?.summary.tool_call_count ?? '-'}`} />
          </Col>
        </Row>
        <Space className="zh-mb-24" wrap>
          <Button href="/api/datasets/attack_cases" target="_blank" type="link" className="zh-settings-link-flush">
            查看 JSON
          </Button>
          <Button href="/api/datasets/attack_cases.md" target="_blank" type="link">
            查看 Markdown
          </Button>
          <Tag variant="filled" className="zh-settings-code-tag">
            npm run cli -- samples --format json
          </Tag>
        </Space>
        <div>
          <Typography.Text strong className="zh-settings-field-title">
            按攻击面筛选
          </Typography.Text>
          <Space wrap>
            {overview.attack_surfaces.map((surface) => (
              <Button
                key={surface.id}
                href={`/api/datasets/attack_cases?surface_id=${encodeURIComponent(surface.id)}`}
                target="_blank"
                size="small"
              >
                {surface.name}
              </Button>
            ))}
          </Space>
        </div>
      </PanelCard>
    </Space>
  );
}
