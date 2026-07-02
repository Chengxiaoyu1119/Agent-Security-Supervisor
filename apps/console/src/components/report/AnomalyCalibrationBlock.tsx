import React from 'react';
import { Col, Row, Space, Typography } from 'antd';
import { MetricCard as Metric, PanelCard, UiAlert, UiProgress } from '../ui';
import type { AnomalyCalibration } from '@/types';

export function AnomalyCalibrationBlock({ calibration }: { calibration: AnomalyCalibration }) {
  const summary = calibration.summary;
  const selected = summary.recommended_threshold;
  const visibleCurve = calibration.threshold_curve.filter(
    (item) => item.threshold >= selected - 15 && item.threshold <= selected + 20
  );
  const reviewItems = calibration.missed_attack_review.slice(0, 4);
  return (
    <PanelCard variant="borderless" className="zh-mb-24">
      <div className="zh-section-surface">
        <Row align="middle" gutter={16}>
          <Col xs={24} sm={16}>
            <Typography.Text type="secondary" className="zh-meta-block">
              异常检测校准
            </Typography.Text>
            <Typography.Title level={3} className="zh-title-flush zh-mb-8">
              推荐阈值 anomaly_score ≥ {selected}
            </Typography.Title>
            <Typography.Paragraph type="secondary" className="zh-title-flush">
              {calibration.conclusion || calibration.objective}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} sm={8} className="zh-text-right">
            <Typography.Title level={1} className="zh-title-flush zh-color-primary">
              {selected}
            </Typography.Title>
            <Typography.Text type="secondary" className="zh-text-meta">
              复核阈值
            </Typography.Text>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} className="zh-mb-32">
        <Col span={6}>
          <Metric label="攻击召回率" value={`${summary.attack_recall_rate}%`} tone="cyan" />
        </Col>
        <Col span={6}>
          <Metric
            label="正常误报率"
            value={`${summary.benign_false_alarm_rate}%`}
            tone={summary.benign_false_alarm_rate ? 'amber' : 'green'}
          />
        </Col>
        <Col span={6}>
          <Metric label="攻击样本" value={`${summary.attack_sample_count}`} tone="red" />
        </Col>
        <Col span={6}>
          <Metric label="正常样本" value={`${summary.benign_sample_count}`} tone="green" />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Typography.Title level={5} className="zh-mb-16">
            阈值曲线 (召回 / 误报)
          </Typography.Title>
          <Space orientation="vertical" className="zh-full-width">
            {visibleCurve.map((item) => (
              <PanelCard
                key={item.threshold}
                size="small"
                type="inner"
                className={item.threshold === selected ? 'zh-threshold-card--selected' : ''}
              >
                <Row align="middle">
                  <Col span={4}>
                    <Typography.Text strong>{item.threshold}</Typography.Text>
                  </Col>
                  <Col span={14}>
                    <div className="zh-threshold-progress-stack">
                      <UiProgress percent={item.attack_recall_rate} size="small" showInfo={false} />
                      <UiProgress
                        percent={item.benign_false_alarm_rate}
                        size="small"
                        status={item.benign_false_alarm_rate ? 'exception' : 'success'}
                        showInfo={false}
                      />
                    </div>
                  </Col>
                  <Col span={6} className="zh-text-right">
                    <Typography.Text type="secondary" className="zh-text-meta">
                      {item.attack_recall_rate}% / {item.benign_false_alarm_rate}%
                    </Typography.Text>
                  </Col>
                </Row>
              </PanelCard>
            ))}
          </Space>
        </Col>
        <Col xs={24} lg={12}>
          <Typography.Title level={5} className="zh-mb-16">
            低于阈值但已控制 ({summary.policy_controlled_missed_count} 个)
          </Typography.Title>
          {reviewItems.length ? (
            <Space orientation="vertical" className="zh-full-width">
              {reviewItems.map((item) => (
                <PanelCard key={item.id} size="small" type="inner">
                  <div className="zh-split-row zh-mb-4">
                    <Typography.Text strong>{item.id}</Typography.Text>
                    <Typography.Text code>{item.tool}</Typography.Text>
                  </div>
                  <Typography.Paragraph type="secondary" className="zh-text-body zh-my-8">
                    {item.title}
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
