import { Col, Row, Space, Tag, Typography } from 'antd';
import { PanelCard } from '../ui';
import type { Overview } from '../../types';
import { competitionCapabilityRows } from '../../utils';

type SettingsBasicsTabProps = {
  overview: Overview;
};

export function SettingsBasicsTab({ overview }: SettingsBasicsTabProps) {
  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      <Row gutter={[16, 16]}>
        {overview.models.map((model) => (
          <Col xs={24} sm={12} md={8} lg={6} key={model.provider}>
            <PanelCard type="inner" size="small" hoverable className="zh-full-height">
              <Typography.Text strong style={{ display: 'block' }}>
                {model.provider}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                {model.model}
              </Typography.Text>
              <div style={{ marginBottom: 8 }}>
                <Tag
                  variant="filled"
                  color="processing"
                  style={{
                    fontFamily: 'monospace',
                    whiteSpace: 'normal',
                    wordBreak: 'break-all',
                    display: 'inline-block',
                    padding: '2px 6px',
                    lineHeight: 1.4
                  }}
                >
                  {model.endpoint ?? model.mode}
                </Tag>
              </div>
              <Typography.Text type="secondary" className="zh-meta-block">
                {model.configured ? '已配置真实 API' : '未配置，使用模拟兜底'}
              </Typography.Text>
            </PanelCard>
          </Col>
        ))}
      </Row>

      <PanelCard title="赛题成果对齐" type="inner">
        <div className="zh-column-stack">
          {competitionCapabilityRows.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px 0',
                borderBottom:
                  idx === competitionCapabilityRows.length - 1 ? 'none' : '1px solid var(--ant-color-border-secondary)'
              }}
            >
              <div>
                <Typography.Text strong>{item.requirement}</Typography.Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                  <Typography.Text type="secondary">{item.implementation}</Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}
                  >
                    {item.evidence}
                  </Typography.Text>
                </Space>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>
    </Space>
  );
}
