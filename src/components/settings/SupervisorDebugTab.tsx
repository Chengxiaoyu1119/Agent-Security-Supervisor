import { ClipboardList, ShieldCheck, TerminalSquare } from 'lucide-react';
import { Alert, Col, Descriptions, Divider, Input, Row, Space, Typography } from 'antd';
import { DecisionPill, LabelTag, MetricCard as Metric, PanelCard, UiButton } from '../ui';
import type { ExternalAgentDemoResult, SupervisorBatchEvaluation, SupervisorEvaluation } from '../../types';

type SupervisorDebugTabProps = {
  externalAgentDemo: ExternalAgentDemoResult | null;
  runningExternalAgentDemo: boolean;
  handleRunExternalAgentDemo: () => void | Promise<void>;
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

export function SupervisorDebugTab({
  externalAgentDemo,
  runningExternalAgentDemo,
  handleRunExternalAgentDemo,
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
}: SupervisorDebugTabProps) {
  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      <PanelCard
        title="真实 Agent 工具调度演示"
        type="inner"
        extra={
          <UiButton
            type="primary"
            onClick={handleRunExternalAgentDemo}
            loading={runningExternalAgentDemo}
            icon={<TerminalSquare size={16} />}
          >
            运行真实 Agent demo
          </UiButton>
        }
        className="zh-mb-24"
      >
        <Typography.Paragraph type="secondary">
          从页面直接运行最小外部 Agent，让监督器在工具执行前做允许、拒绝或询问决策，并生成可提交的证据文件。
        </Typography.Paragraph>

        {externalAgentDemo ? (
          <>
            <Row gutter={16} className="zh-settings-row-mb-16">
              <Col span={4}>
                <Metric label="任务总数" value={`${externalAgentDemo.summary.task_count}`} />
              </Col>
              <Col span={4}>
                <Metric label="被控制" value={`${externalAgentDemo.summary.controlled_count}`} tone="green" />
              </Col>
              <Col span={4}>
                <Metric label="真实执行" value={`${externalAgentDemo.summary.executed_count}`} />
              </Col>
              <Col span={4}>
                <Metric label="控制率" value={`${externalAgentDemo.summary.control_rate}%`} tone="amber" />
              </Col>
              <Col span={4}>
                <Metric label="审计 hash" value={`${externalAgentDemo.summary.audit_hash_count}`} />
              </Col>
            </Row>
            <Space orientation="vertical" className="zh-settings-stack zh-settings-stack--mb-24">
              <Typography.Text code>{externalAgentDemo.markdown_path}</Typography.Text>
              <Typography.Text code>{externalAgentDemo.json_path}</Typography.Text>
            </Space>
            <div className="zh-column-stack">
              {externalAgentDemo.records.map((record, index) => (
                <div key={index} className="zh-settings-record">
                  <Row className="zh-settings-row-full" align="top" gutter={16}>
                    <Col span={2}>
                      <Typography.Text strong className="zh-settings-record-index">
                        {String(index + 1).padStart(2, '0')}
                      </Typography.Text>
                    </Col>
                    <Col span={10}>
                      <Typography.Text strong className="zh-settings-record-title">
                        {record.title}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="zh-settings-record-meta">
                        {record.reason}
                      </Typography.Text>
                      <Typography.Text code className="zh-settings-code-wrap zh-settings-code-sm">
                        {record.tool} {JSON.stringify(record.arguments)}
                      </Typography.Text>
                    </Col>
                    <Col span={12} className="zh-settings-align-right">
                      <Space orientation="vertical" align="end" size={4}>
                        <DecisionPill decision={record.decision} />
                        <LabelTag variant="filled" color={record.executed ? 'success' : 'default'}>
                          {record.executed ? '已执行' : '未执行'}
                        </LabelTag>
                        <Typography.Text type="secondary" className="zh-settings-meta-sm">
                          {record.policy_id}
                        </Typography.Text>
                        <Typography.Text type="secondary" className="zh-settings-mono-sm">
                          {record.audit_hash ? record.audit_hash.slice(0, 12) : 'no-hash'}
                        </Typography.Text>
                      </Space>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Alert
            title="还没有运行真实 Agent demo。点击按钮后，系统会自动跑 4 个工具调用并写入审计证据。"
            type="info"
            showIcon
          />
        )}
      </PanelCard>

      <PanelCard
        title="手工调试"
        type="inner"
        extra={
          <Space>
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
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Typography.Text strong className="zh-settings-field-title">
              工具调用事件 JSON
            </Typography.Text>
            <Input.TextArea
              value={eventJson}
              onChange={(event) => setEventJson(event.target.value)}
              rows={10}
              className="zh-settings-editor"
              spellCheck={false}
            />
            <Space>
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
            {evaluateError && <Alert title={evaluateError} type="error" showIcon className="zh-settings-alert-top" />}
          </Col>
          <Col xs={24} lg={12}>
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
                    <Typography.Text code>{evaluation.audit_id.slice(0, 8)}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="已落库">{evaluation.persisted ? '是' : '否'}</Descriptions.Item>
                  <Descriptions.Item label="告警">{evaluation.alert ? '已生成' : '未生成'}</Descriptions.Item>
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
              <Alert title="暂无评估结果" type="info" showIcon />
            )}
          </Col>
        </Row>

        <Divider />

        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Typography.Text strong className="zh-settings-field-title">
              批量事件 JSON
            </Typography.Text>
            <Input.TextArea
              value={batchJson}
              onChange={(event) => setBatchJson(event.target.value)}
              rows={10}
              className="zh-settings-editor"
              spellCheck={false}
            />
            <Space>
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
          <Col xs={24} lg={12}>
            <Typography.Text strong className="zh-settings-field-title">
              批量评估结果
            </Typography.Text>
            {batchEvaluation ? (
              <Space orientation="vertical" className="zh-settings-stack">
                <Row gutter={16}>
                  <Col span={8}>
                    <Metric label="事件总数" value={`${batchEvaluation.total}`} />
                  </Col>
                  <Col span={8}>
                    <Metric label="已管控" value={`${batchEvaluation.controlled}`} tone="green" />
                  </Col>
                  <Col span={8}>
                    <Metric label="控制率" value={`${batchEvaluation.control_rate}%`} tone="amber" />
                  </Col>
                </Row>
                <div className="zh-settings-batch-stack">
                  {batchEvaluation.results.map((item, idx) => (
                    <div key={idx} className="zh-settings-batch-item">
                      <Row className="zh-settings-row-full" align="middle">
                        <Col span={6}>
                          <Typography.Text code>{item.risk_evidence.tool}</Typography.Text>
                        </Col>
                        <Col span={4}>
                          <DecisionPill decision={item.decision} />
                        </Col>
                        <Col span={14}>
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
                      </Row>
                    </div>
                  ))}
                </div>
              </Space>
            ) : (
              <Alert title="暂无批量评估结果" type="info" showIcon />
            )}
          </Col>
        </Row>
      </PanelCard>
    </Space>
  );
}
