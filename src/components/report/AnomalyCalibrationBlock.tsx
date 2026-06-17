import React from 'react';
import { Row, Col, Typography, Space, Alert } from 'antd';
import { MetricCard as Metric, PanelCard } from '../ui';
import type { AnomalyCalibration } from '../../types';

export function AnomalyCalibrationBlock({ calibration }: { calibration: AnomalyCalibration }) {
  const summary = calibration.summary;
  const selected = summary.recommended_threshold;
  const visibleCurve = calibration.threshold_curve.filter(
    (item) => item.threshold >= selected - 15 && item.threshold <= selected + 20
  );
  const reviewItems = calibration.missed_attack_review.slice(0, 4);
  return (
    <PanelCard variant="borderless" className="zh-mb-24">
      <div style={{ padding: 24, background: 'var(--ant-color-fill-tertiary)', borderRadius: 8, marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col xs={24} sm={16}>
            <Typography.Text type="secondary" className="zh-meta-block">
              异常检测校准
            </Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, marginBottom: 8 }}>
              推荐阈值 anomaly_score ≥ {selected}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
              {calibration.conclusion || calibration.objective}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Typography.Title level={1} style={{ margin: 0, color: 'var(--ant-color-primary)' }}>
              {selected}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              复核阈值
            </Typography.Text>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
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
          <Typography.Title level={5} style={{ marginBottom: 16 }}>
            阈值曲线 (召回 / 误报)
          </Typography.Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {visibleCurve.map((item) => (
              <PanelCard
                key={item.threshold}
                size="small"
                type="inner"
                style={{
                  borderLeft: item.threshold === selected ? '3px solid var(--ant-color-primary)' : 'none',
                  background: item.threshold === selected ? 'var(--ant-color-primary-bg)' : undefined
                }}
              >
                <Row align="middle">
                  <Col span={4}>
                    <Typography.Text strong>{item.threshold}</Typography.Text>
                  </Col>
                  <Col span={14}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 4,
                        height: 8,
                        background: 'var(--ant-color-fill-secondary)',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ width: `${item.attack_recall_rate}%`, background: 'var(--ant-color-info)' }} />
                      <div
                        style={{ width: `${item.benign_false_alarm_rate}%`, background: 'var(--ant-color-warning)' }}
                      />
                    </div>
                  </Col>
                  <Col span={6} style={{ textAlign: 'right' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {item.attack_recall_rate}% / {item.benign_false_alarm_rate}%
                    </Typography.Text>
                  </Col>
                </Row>
              </PanelCard>
            ))}
          </Space>
        </Col>
        <Col xs={24} lg={12}>
          <Typography.Title level={5} style={{ marginBottom: 16 }}>
            低于阈值但已控制 ({summary.policy_controlled_missed_count} 个)
          </Typography.Title>
          {reviewItems.length ? (
            <Space orientation="vertical" style={{ width: '100%' }}>
              {reviewItems.map((item) => (
                <PanelCard key={item.id} size="small" type="inner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Typography.Text strong>{item.id}</Typography.Text>
                    <Typography.Text code>{item.tool}</Typography.Text>
                  </div>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: '8px 0' }}>
                    {item.title}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {item.policy_id} / {item.supervisor_decision} / 异常分 {item.anomaly_score}
                  </Typography.Text>
                </PanelCard>
              ))}
            </Space>
          ) : (
            <Alert title="没有需要复核的低分攻击样本。" type="info" showIcon />
          )}
        </Col>
      </Row>
    </PanelCard>
  );
}
