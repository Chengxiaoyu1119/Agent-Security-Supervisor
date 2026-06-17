import React from 'react';
import { Row, Col, Typography, Tag, Progress, Space } from 'antd';
import { MetricCard as Metric, PanelCard } from '../ui';
import type { ProjectRoadmap } from '../../types';

export function ProjectRoadmapBlock({ roadmap }: { roadmap: ProjectRoadmap }) {
  const topDimensions = roadmap.dimensions.slice(0, 6);
  const topBacklog = roadmap.feature_backlog.slice(0, 5);
  return (
    <PanelCard variant="borderless" className="zh-mb-24">
      <div style={{ padding: 24, background: 'var(--ant-color-fill-tertiary)', borderRadius: 8, marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col xs={24} sm={16}>
            <Typography.Text type="secondary" className="zh-meta-block">
              项目方向判断
            </Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, marginBottom: 8 }}>
              {roadmap.direction.verdict}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
              {roadmap.direction.reason}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Typography.Title level={1} style={{ margin: 0, color: 'var(--ant-color-primary)' }}>
              {roadmap.summary.overall_score}%
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              综合成熟度
            </Typography.Text>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
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
          <Typography.Title level={5} style={{ marginBottom: 16 }}>
            成熟度维度 ({roadmap.dimensions.length} 项)
          </Typography.Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {topDimensions.map((item) => (
              <PanelCard key={item.name} size="small" type="inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <Tag
                    color={item.status === '已完成' ? 'success' : item.status === '高优先级缺口' ? 'error' : 'warning'}
                  >
                    {item.status}
                  </Tag>
                </div>
                <Progress
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
                <Typography.Text type="secondary" style={{ fontSize: 13, marginTop: 8, display: 'block' }}>
                  {item.evidence}
                </Typography.Text>
              </PanelCard>
            ))}
          </Space>
        </Col>
        <Col xs={24} lg={12}>
          <Typography.Title level={5} style={{ marginBottom: 16 }}>
            缺少功能优先级 ({roadmap.feature_backlog.length} 项)
          </Typography.Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {topBacklog.map((item) => (
              <PanelCard
                key={item.id}
                size="small"
                type="inner"
                style={{
                  borderLeft: `3px solid var(--ant-color-${item.priority === 'P0' ? 'error' : item.priority === 'P1' ? 'warning' : 'info'})`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Tag color={item.priority === 'P0' ? 'error' : item.priority === 'P1' ? 'warning' : 'default'}>
                    {item.priority}
                  </Tag>
                </div>
                <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: '8px 0' }}>
                  {item.why}
                </Typography.Paragraph>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
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
