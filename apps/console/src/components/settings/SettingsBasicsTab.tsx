import { Col, Row, Space, Typography } from 'antd';
import { LabelTag, PanelCard } from '../ui';
import type { Overview } from '@/types';
import { competitionCapabilityRows } from '@/utils';

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
              <Typography.Text strong className="zh-text-block">
                {model.provider}
              </Typography.Text>
              <Typography.Text type="secondary" className="zh-text-sm zh-text-block zh-mb-4">
                {model.model}
              </Typography.Text>
              <div className="zh-mb-8">
                <LabelTag variant="filled" color="processing" className="zh-code-tag">
                  {model.endpoint ?? model.mode}
                </LabelTag>
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
            <div key={idx} className="zh-divided-list__item">
              <div>
                <Typography.Text strong>{item.requirement}</Typography.Text>
              </div>
              <div className="zh-mt-8">
                <Space orientation="vertical" size={2} className="zh-full-width">
                  <Typography.Text type="secondary">{item.implementation}</Typography.Text>
                  <Typography.Text type="secondary" className="zh-code-sm">
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
