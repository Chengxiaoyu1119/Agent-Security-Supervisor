import { useState, type ReactNode } from 'react';
import { Col, Row, Space, Typography } from 'antd';
import { Activity, RefreshCw } from 'lucide-react';
import { writeAnomalyCalibrationEvidence, writeProjectRoadmapEvidence } from '@/api';
import { MetricCard as Metric, PanelCard, UiAlert, UiButton, UiProgress } from '../ui';
import type { AnomalyCalibration } from '@/types';

type AnomalyCalibrationBlockProps = {
  calibration: AnomalyCalibration;
  onRefreshReport?: () => Promise<void> | void;
  onRefreshRuntime?: () => Promise<unknown> | void;
};

type CalibrationNotice = {
  type: 'success' | 'error' | 'info';
  message: string;
  description?: ReactNode;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误';
}

async function refreshReportData(
  onRefreshReport?: () => Promise<void> | void,
  onRefreshRuntime?: () => Promise<unknown> | void
) {
  await Promise.all([Promise.resolve(onRefreshReport?.()), Promise.resolve(onRefreshRuntime?.())]);
}

function formatCalibrationSource(source: string) {
  if (source.includes('SCENARIOS')) {
    return '项目攻击样本库中的模型对抗样本、越狱样例和工具调用攻击脚本。';
  }
  if (source.includes('BENIGN_CASES')) {
    return '正常业务任务库中的邮件、文件、API、记忆等授权业务流程。';
  }
  return source;
}

function formatThresholdRule(summary: AnomalyCalibration['summary']) {
  return `优先选择正常任务误报率为 0% 的阈值；如果不存在 0% 误报阈值，再选择误报率不超过 ${summary.max_false_alarm_rate}%、且攻击召回更高的阈值。`;
}

function formatConfusionMatrix(summary: AnomalyCalibration['summary']) {
  return `当前阈值下命中 ${summary.attack_detected_count} 个攻击样本，漏过 ${summary.attack_missed_count} 个攻击样本，正常任务误报 ${summary.benign_false_alarm_count} 个。`;
}

export function AnomalyCalibrationBlock({
  calibration,
  onRefreshReport,
  onRefreshRuntime
}: AnomalyCalibrationBlockProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllCurve, setShowAllCurve] = useState(false);
  const [notice, setNotice] = useState<CalibrationNotice | null>(null);
  const summary = calibration.summary;
  const selected = summary.recommended_threshold;
  const nearbyCurve = calibration.threshold_curve.filter(
    (item) => item.threshold >= selected - 10 && item.threshold <= selected + 10
  );
  const visibleCurve = showAllCurve ? calibration.threshold_curve : nearbyCurve;
  const reviewItems = calibration.missed_attack_review.slice(0, 4);
  const confusion = calibration.selected_confusion_matrix;

  async function handleRefreshCalibration() {
    setIsRefreshing(true);
    setNotice(null);
    try {
      const result = await writeAnomalyCalibrationEvidence();
      await writeProjectRoadmapEvidence();
      await refreshReportData(onRefreshReport, onRefreshRuntime);
      setNotice({
        type: 'success',
        message: `异常校准已刷新，推荐复核阈值 ${result.summary?.recommended_threshold ?? selected}。`,
        description: '后端已重新生成异常检测证据，并同步刷新项目成熟度路线图。'
      });
    } catch (error) {
      setNotice({ type: 'error', message: `异常校准刷新失败：${getErrorMessage(error)}` });
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <PanelCard variant="borderless" className="zh-mb-24">
      <div className="zh-section-surface">
        <Row align="middle" gutter={16}>
          <Col xs={24} md={16}>
            <Typography.Text type="secondary" className="zh-meta-block">
              异常检测校准
            </Typography.Text>
            <Typography.Title level={3} className="zh-title-flush zh-mb-8">
              推荐复核阈值：异常分 ≥ {selected}
            </Typography.Title>
            <Typography.Paragraph type="secondary" className="zh-title-flush">
              {calibration.conclusion || calibration.objective}
              异常分用于把规则命中、工具风险、上下文异常合并成同一个复核分数，作为监督判定依据。
            </Typography.Paragraph>
          </Col>
          <Col xs={24} md={8} className="zh-calibration-hero-action">
            <div>
              <Typography.Title level={1} className="zh-title-flush zh-color-primary">
                {selected}
              </Typography.Title>
              <Typography.Text type="secondary" className="zh-text-meta">
                复核阈值
              </Typography.Text>
            </div>
            <UiButton
              variant="primary"
              icon={<RefreshCw size={16} />}
              loading={isRefreshing}
              onClick={() => {
                void handleRefreshCalibration();
              }}
            >
              重新校准
            </UiButton>
          </Col>
        </Row>
      </div>

      {notice && (
        <UiAlert
          className="zh-mb-16"
          type={notice.type}
          message={notice.message}
          description={notice.description}
          showIcon
        />
      )}

      <Row gutter={[16, 16]} className="zh-mb-32">
        <Col xs={12} md={6}>
          <Metric label="攻击召回率" value={`${summary.attack_recall_rate}%`} tone="cyan" />
        </Col>
        <Col xs={12} md={6}>
          <Metric
            label="正常误报率"
            value={`${summary.benign_false_alarm_rate}%`}
            tone={summary.benign_false_alarm_rate ? 'amber' : 'green'}
          />
        </Col>
        <Col xs={12} md={6}>
          <Metric label="攻击样本" value={`${summary.attack_sample_count}`} tone="red" />
        </Col>
        <Col xs={12} md={6}>
          <Metric label="正常样本" value={`${summary.benign_sample_count}`} tone="green" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="zh-mb-24">
        <Col xs={24} lg={8}>
          <PanelCard size="small" type="inner" className="zh-calibration-info-card">
            <Typography.Text strong>样本来源</Typography.Text>
            <Typography.Paragraph type="secondary" className="zh-text-body zh-mb-0">
              攻击样本：{formatCalibrationSource(calibration.method.attack_source)}
              正常样本：{formatCalibrationSource(calibration.method.benign_source)}
            </Typography.Paragraph>
          </PanelCard>
        </Col>
        <Col xs={24} lg={8}>
          <PanelCard size="small" type="inner" className="zh-calibration-info-card">
            <Typography.Text strong>阈值选择规则</Typography.Text>
            <Typography.Paragraph type="secondary" className="zh-text-body zh-mb-0">
              {formatThresholdRule(summary)} 目标是尽量保留攻击召回，同时把正常业务任务误报压低。
            </Typography.Paragraph>
          </PanelCard>
        </Col>
        <Col xs={24} lg={8}>
          <PanelCard size="small" type="inner" className="zh-calibration-info-card">
            <Typography.Text strong>混淆矩阵</Typography.Text>
            <Typography.Paragraph type="secondary" className="zh-text-body zh-mb-0">
              {formatConfusionMatrix(summary)}
            </Typography.Paragraph>
            <div className="zh-calibration-matrix">
              <span>命中攻击 {confusion.true_positive_attack}</span>
              <span>漏过攻击 {confusion.false_negative_attack}</span>
              <span>正常误报 {confusion.false_positive_benign}</span>
              <span>正常放行 {confusion.true_negative_benign}</span>
            </div>
          </PanelCard>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <div className="zh-calibration-curve-toolbar">
            <div className="zh-flex-min">
              <Typography.Title level={5} className="zh-title-flush">
                阈值曲线
              </Typography.Title>
              <Typography.Text type="secondary" className="zh-text-meta">
                默认展示推荐阈值附近，展开后可查看全部候选阈值。
              </Typography.Text>
            </div>
            <div className="zh-calibration-curve-tools">
              <div className="zh-calibration-legend">
                <span className="zh-calibration-legend__recall">攻击召回</span>
                <span className="zh-calibration-legend__false">正常误报</span>
              </div>
              <UiButton size="small" onClick={() => setShowAllCurve((value) => !value)}>
                {showAllCurve ? '只看推荐附近' : `显示全部 ${calibration.threshold_curve.length} 个阈值`}
              </UiButton>
              <Activity size={18} className="zh-section-heading-icon" />
            </div>
          </div>
          <div className="zh-calibration-curve-grid">
            {visibleCurve.map((item) => (
              <PanelCard
                key={item.threshold}
                size="small"
                type="inner"
                className={`zh-calibration-curve-card ${
                  item.threshold === selected ? 'zh-threshold-card--selected' : ''
                }`}
              >
                <div className="zh-split-row zh-split-row--center zh-mb-8">
                  <Typography.Text strong>阈值 {item.threshold}</Typography.Text>
                  <Typography.Text type="secondary" className="zh-text-meta">
                    {item.threshold === selected ? '当前推荐' : `综合分 ${item.selection_score}`}
                  </Typography.Text>
                </div>
                <div className="zh-threshold-progress-stack">
                  <div className="zh-threshold-progress-line">
                    <span>召回</span>
                    <UiProgress percent={item.attack_recall_rate} size="small" showInfo={false} />
                    <strong>{item.attack_recall_rate}%</strong>
                  </div>
                  <div className="zh-threshold-progress-line">
                    <span>误报</span>
                    <UiProgress
                      percent={item.benign_false_alarm_rate}
                      size="small"
                      status={item.benign_false_alarm_rate ? 'exception' : 'success'}
                      showInfo={false}
                    />
                    <strong>{item.benign_false_alarm_rate}%</strong>
                  </div>
                </div>
                <Typography.Text type="secondary" className="zh-threshold-card-meta">
                  命中攻击 {item.attack_detected_count}/{item.attack_sample_count}，正常误报{' '}
                  {item.benign_false_alarm_count}/{item.benign_allowed_sample_count}，精确率 {item.precision_rate}%。
                </Typography.Text>
              </PanelCard>
            ))}
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="zh-section-heading-row">
            <div>
              <Typography.Title level={5} className="zh-title-flush">
                低分复核样本
              </Typography.Title>
              <Typography.Text type="secondary" className="zh-text-meta">
                低于阈值但已被策略控制：{summary.policy_controlled_missed_count} 个。
              </Typography.Text>
            </div>
          </div>
          <Typography.Paragraph type="secondary" className="zh-text-body zh-mb-16">
            下列样本异常分较低，但已由固定策略完成拦截或隔离。
          </Typography.Paragraph>
          {reviewItems.length ? (
            <Space orientation="vertical" className="zh-full-width">
              {reviewItems.map((item) => (
                <PanelCard key={item.id} size="small" type="inner" className="zh-calibration-review-card">
                  <div className="zh-split-row zh-mb-4">
                    <Typography.Text strong>{item.id}</Typography.Text>
                    <Typography.Text type="secondary" className="zh-text-meta">
                      {item.tool}
                    </Typography.Text>
                  </div>
                  <Typography.Paragraph type="secondary" className="zh-text-body zh-my-8">
                    {item.title}
                  </Typography.Paragraph>
                  <Typography.Paragraph type="secondary" className="zh-text-meta zh-my-8">
                    触发信号：{item.anomaly_signals.join('、') || item.risk_hint}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary" className="zh-text-meta">
                    {item.policy_id} / {item.supervisor_decision} / 异常分 {item.anomaly_score}
                  </Typography.Text>
                </PanelCard>
              ))}
            </Space>
          ) : (
            <UiAlert title="没有需要复核的低分攻击样本。" type="info" showIcon />
          )}
        </Col>
      </Row>
    </PanelCard>
  );
}
