import { Col, Row, Space, Typography } from 'antd';
import { ShieldCheck } from 'lucide-react';
import type { CompetitionReadiness, CompetitionReadinessWriteResult } from '@/types';
import { LabelTag, PanelCard, UiAlert, UiButton } from '../ui';

interface CompetitionReadinessPanelProps {
  competitionReadiness: CompetitionReadiness | null;
  competitionReadinessOutput: CompetitionReadinessWriteResult | null;
  checkingReadiness: boolean;
  handleRunReadiness: () => void | Promise<void>;
}

export function CompetitionReadinessPanel({
  competitionReadiness,
  competitionReadinessOutput,
  checkingReadiness,
  handleRunReadiness
}: CompetitionReadinessPanelProps) {
  return (
    <PanelCard
      title="赛前一键体检"
      extra={
        <UiButton
          type="primary"
          icon={<ShieldCheck size={16} />}
          onClick={handleRunReadiness}
          loading={checkingReadiness}
        >
          运行体检并写报告
        </UiButton>
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
                    <LabelTag
                      variant="filled"
                      color={check.status === 'pass' ? 'success' : check.status === 'block' ? 'error' : 'warning'}
                    >
                      {check.status_label}
                    </LabelTag>
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
            <UiAlert
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
              <LabelTag variant="filled" key={command} className="zh-settings-code-tag">
                {command}
              </LabelTag>
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
        <UiAlert
          title="暂无体检结果。点击按钮后会生成本地 JSON 和 Markdown，并在这里显示就绪分与补证项。"
          type="info"
          showIcon
        />
      )}
    </PanelCard>
  );
}
