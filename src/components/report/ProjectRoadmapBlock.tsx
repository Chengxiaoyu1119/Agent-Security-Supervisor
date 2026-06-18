import React from 'react';
import { Col, Row, Space, Typography } from 'antd';
import { LabelTag, MetricCard as Metric, PanelCard, UiProgress } from '../ui';
import type { ProjectRoadmap } from '../../types';

export function ProjectRoadmapBlock({ roadmap }: { roadmap: ProjectRoadmap }) {
  const topDimensions = roadmap.dimensions.slice(0, 6);
  const topBacklog = roadmap.feature_backlog.slice(0, 5);
  return (
    <PanelCard variant="borderless" className="zh-mb-24">
      <div className="zh-section-surface">
        <Row align="middle" gutter={16}>
          <Col xs={24} sm={16}>
            <Typography.Text type="secondary" className="zh-meta-block">
              项目方向判断
            </Typography.Text>
            <Typography.Title level={3} className="zh-title-flush zh-mb-8">
              {roadmap.direction.verdict}
            </Typography.Title>
            <Typography.Paragraph type="secondary" className="zh-title-flush">
              {roadmap.direction.reason}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} sm={8} className="zh-text-right">
            <Typography.Title level={1} className="zh-title-flush zh-color-primary">
              {roadmap.summary.overall_score}%
            </Typography.Title>
            <Typography.Text type="secondary" className="zh-text-meta">
              综合成熟度
            </Typography.Text>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} className="zh-mb-32">
        <Col span={6}>
          <Metric
            label="已完成维度"
            value={`${roadmap.summary.completed_count}/${roadmap.summary.dimension_count}`}
            tone="green"
          />
        </Col>
        <Col span={6}>
          <Metric label="高优先级缺口" value={`${roadmap.summary.high_priority_gap_count}`} tone="red" />
        </Col>
        <Col span={6}>
          <Metric label="P0 待办" value={`${roadmap.summary.p0_backlog_count}`} tone="amber" />
        </Col>
        <Col span={6}>
          <Metric label="赛题匹配" value={`${roadmap.direction.competition_fit}%`} tone="cyan" />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Typography.Title level={5} className="zh-mb-16">
            成熟度维度 ({roadmap.dimensions.length} 项)
          </Typography.Title>
          <Space orientation="vertical" className="zh-full-width">
            {topDimensions.map((item) => (
              <PanelCard key={item.name} size="small" type="inner">
                <div className="zh-split-row zh-mb-8">
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <LabelTag
                    color={item.status === '已完成' ? 'success' : item.status === '高优先级缺口' ? 'error' : 'warning'}
                  >
                    {item.status}
                  </LabelTag>
                </div>
                <UiProgress
                  percent={Math.min(100, Math.max(0, item.score))}
                  size="small"
                  strokeColor={
                    item.status === '已完成'
                      ? 'var(--ant-color-success)'
                      : item.status === '高优先级缺口'
                        ? 'var(--ant-color-error)'
                        : 'var(--ant-color-warning)'
                  }
                />
                <Typography.Text type="secondary" className="zh-text-body zh-mt-8 zh-text-block">
                  {item.evidence}
                </Typography.Text>
              </PanelCard>
            ))}
          </Space>
        </Col>
        <Col xs={24} lg={12}>
          <Typography.Title level={5} className="zh-mb-16">
            缺少功能优先级 ({roadmap.feature_backlog.length} 项)
          </Typography.Title>
          <Space orientation="vertical" className="zh-full-width">
            {topBacklog.map((item) => (
              <PanelCard
                key={item.id}
                size="small"
                type="inner"
                style={{
                  borderLeft: `3px solid var(--ant-color-${item.priority === 'P0' ? 'error' : item.priority === 'P1' ? 'warning' : 'info'})`
                }}
              >
                <div className="zh-split-row zh-mb-4">
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <LabelTag color={item.priority === 'P0' ? 'error' : item.priority === 'P1' ? 'warning' : 'default'}>
                    {item.priority}
                  </LabelTag>
                </div>
                <Typography.Paragraph type="secondary" className="zh-text-body zh-my-8">
                  {item.why}
                </Typography.Paragraph>
                <Typography.Text type="secondary" className="zh-text-meta">
                  验收标准: {item.acceptance}
                </Typography.Text>
              </PanelCard>
            ))}
          </Space>
        </Col>
      </Row>
    </PanelCard>
  );
}
