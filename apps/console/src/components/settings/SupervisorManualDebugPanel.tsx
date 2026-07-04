import { Col, Descriptions, Divider, Row, Space, Typography } from 'antd';
import { ClipboardList, ShieldCheck } from 'lucide-react';
import { DecisionPill, MetricCard as Metric, PanelCard, UiAlert, UiButton, UiInput } from '../ui';
import type { SupervisorBatchEvaluation, SupervisorEvaluation } from '@/types';
import { AuditDeepLinkButton } from '../audit/AuditDeepLinkButton';

type SupervisorManualDebugPanelProps = {
  eventJson: string;
  setEventJson: (value: string) => void;
  batchJson: string;
  setBatchJson: (value: string) => void;
  evaluation: SupervisorEvaluation | null;
  batchEvaluation: SupervisorBatchEvaluation | null;
  evaluating: boolean;
  batchEvaluating: boolean;
  evaluateError: string;
  handleEvaluateEvent: () => void | Promise<void>;
  handleBatchEvaluate: () => void | Promise<void>;
  loadSingleExternalSample: () => void;
  loadBatchExternalSample: () => void;
  clearExternalResults: () => void;
};

export function SupervisorManualDebugPanel({
  eventJson,
  setEventJson,
  batchJson,
  setBatchJson,
  evaluation,
  batchEvaluation,
  evaluating,
  batchEvaluating,
  evaluateError,
  handleEvaluateEvent,
  handleBatchEvaluate,
  loadSingleExternalSample,
  loadBatchExternalSample,
  clearExternalResults
}: SupervisorManualDebugPanelProps) {
  return (
    <PanelCard
      title="手工调试"
      type="inner"
      extra={
        <Space wrap>
          <UiButton size="small" onClick={loadSingleExternalSample}>
            单事件样例
          </UiButton>
          <UiButton size="small" onClick={loadBatchExternalSample}>
            批量样例
          </UiButton>
          <UiButton size="small" danger onClick={clearExternalResults}>
            清空评估
          </UiButton>
        </Space>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12} className="zh-settings-debug-column">
          <Typography.Text strong className="zh-settings-field-title">
            工具调用事件 JSON
          </Typography.Text>
          <Typography.Text type="secondary" className="zh-meta-block zh-mb-8">
            输入一个外部智能体工具调用事件，后端会真实调用监督器判定并写入审计日志。
          </Typography.Text>
          <UiInput.TextArea
            value={eventJson}
            onChange={(event) => setEventJson(event.target.value)}
            rows={10}
            className="zh-settings-editor"
            spellCheck={false}
          />
          <Space wrap>
            <UiButton
              type="primary"
              onClick={handleEvaluateEvent}
              loading={evaluating}
              icon={<ShieldCheck size={16} />}
            >
              评估并写入审计
            </UiButton>
            <UiButton onClick={loadSingleExternalSample}>重置样例</UiButton>
          </Space>
          {evaluateError && <UiAlert title={evaluateError} type="error" showIcon className="zh-settings-alert-top" />}
        </Col>
        <Col xs={24} lg={12} className="zh-settings-debug-column">
          <Typography.Text strong className="zh-settings-field-title">
            评估结果
          </Typography.Text>
          {evaluation ? (
            <PanelCard size="small" className="zh-settings-soft-card">
              <div className="zh-settings-evaluation-head">
                <div>
                  <Typography.Text strong className="zh-settings-evaluation-title">
                    {evaluation.risk_evidence.tool}
                  </Typography.Text>
                  <Typography.Text type="secondary" className="zh-settings-meta-sm">
                    {evaluation.surface_id} · {evaluation.policy_id}
                  </Typography.Text>
                </div>
                <DecisionPill decision={evaluation.decision} />
              </div>
              <Descriptions size="small" column={2} bordered className="zh-settings-description">
                <Descriptions.Item label="风险分">
                  {evaluation.risk_score ?? evaluation.risk_evidence.risk_score ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="异常分">
                  {evaluation.anomaly_score ?? evaluation.risk_evidence.anomaly_score ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="审计编号" span={2}>
                  <Space wrap>
                    <Typography.Text code>{evaluation.audit_id.slice(0, 8)}</Typography.Text>
                    <AuditDeepLinkButton auditId={evaluation.audit_id} size="small">
                      查看
                    </AuditDeepLinkButton>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="已落库">{evaluation.persisted ? '是' : '否'}</Descriptions.Item>
                <Descriptions.Item label="告警">{evaluation.alert ? '已生成' : '未生成'}</Descriptions.Item>
                <Descriptions.Item label="执行模式" span={2}>
                  {evaluation.execution_mode}
                </Descriptions.Item>
              </Descriptions>
              <Space orientation="vertical" className="zh-settings-stack">
                <div>
                  <Typography.Text type="secondary" className="zh-settings-meta-sm">
                    判定原因
                  </Typography.Text>
                  <Typography.Paragraph className="zh-settings-paragraph-flush">
                    {evaluation.reason}
                  </Typography.Paragraph>
                </div>
                <div>
                  <Typography.Text type="secondary" className="zh-settings-meta-sm">
                    检测信号
                  </Typography.Text>
                  <Typography.Paragraph className="zh-settings-paragraph-flush">
                    {evaluation.risk_evidence.detection_points.join(' / ')}
                  </Typography.Paragraph>
                </div>
                <div>
                  <Typography.Text type="secondary" className="zh-settings-meta-sm">
                    风险因子
                  </Typography.Text>
                  <Typography.Paragraph className="zh-settings-paragraph-flush">
                    {(evaluation.risk_factors ?? evaluation.risk_evidence.risk_factors ?? []).join(' / ') ||
                      '暂无风险因子记录'}
                  </Typography.Paragraph>
                </div>
              </Space>
            </PanelCard>
          ) : (
            <UiAlert
              title="暂无评估结果"
              description="点击左侧“评估并写入审计”后，这里会显示策略命中、风险分、异常分、审计编号和检测信号。"
              type="info"
              showIcon
            />
          )}
        </Col>
      </Row>

      <Divider />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12} className="zh-settings-debug-column">
          <Typography.Text strong className="zh-settings-field-title">
            批量事件 JSON
          </Typography.Text>
          <Typography.Text type="secondary" className="zh-meta-block zh-mb-8">
            批量输入多个工具调用事件，用于验证策略控制率、误报情况和审计落库能力。
          </Typography.Text>
          <UiInput.TextArea
            value={batchJson}
            onChange={(event) => setBatchJson(event.target.value)}
            rows={10}
            className="zh-settings-editor"
            spellCheck={false}
          />
          <Space wrap>
            <UiButton
              type="primary"
              onClick={handleBatchEvaluate}
              loading={batchEvaluating}
              icon={<ClipboardList size={16} />}
            >
              批量评估并写入审计
            </UiButton>
            <UiButton onClick={loadBatchExternalSample}>重置批量样例</UiButton>
          </Space>
        </Col>
        <Col xs={24} lg={12} className="zh-settings-debug-column">
          <Typography.Text strong className="zh-settings-field-title">
            批量评估结果
          </Typography.Text>
          {batchEvaluation ? (
            <Space orientation="vertical" className="zh-settings-stack">
              <Row gutter={[16, 16]} align="stretch">
                <Col xs={24} sm={8}>
                  <Metric label="事件总数" value={`${batchEvaluation.total}`} />
                </Col>
                <Col xs={24} sm={8}>
                  <Metric label="已管控" value={`${batchEvaluation.controlled}`} tone="green" />
                </Col>
                <Col xs={24} sm={8}>
                  <Metric label="控制率" value={`${batchEvaluation.control_rate}%`} tone="amber" />
                </Col>
              </Row>
              <div className="zh-settings-batch-stack">
                {batchEvaluation.results.map((item, idx) => (
                  <div key={idx} className="zh-settings-batch-item">
                    <Row gutter={[12, 8]} className="zh-settings-row-full" align="middle">
                      <Col xs={24} sm={6}>
                        <Typography.Text code>{item.risk_evidence.tool}</Typography.Text>
                      </Col>
                      <Col xs={24} sm={4}>
                        <DecisionPill decision={item.decision} />
                      </Col>
                      <Col xs={24} sm={11}>
                        <Typography.Text
                          type="secondary"
                          className="zh-settings-record-title zh-settings-endpoint-description"
                        >
                          策略: {item.policy_id}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="zh-settings-meta-sm">
                          {item.reason} · 风险分 {item.risk_score ?? item.risk_evidence.risk_score ?? '-'} · 异常分{' '}
                          {item.anomaly_score ?? item.risk_evidence.anomaly_score ?? '-'}
                        </Typography.Text>
                      </Col>
                      <Col xs={24} sm={3} className="zh-settings-align-right zh-settings-align-right-responsive">
                        <AuditDeepLinkButton auditId={item.audit_id} size="small">
                          审计
                        </AuditDeepLinkButton>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </Space>
          ) : (
            <UiAlert
              title="暂无批量评估结果"
              description="点击左侧“批量评估并写入审计”后，这里会展示控制率和每条事件的审计入口。"
              type="info"
              showIcon
            />
          )}
        </Col>
      </Row>
    </PanelCard>
  );
}
