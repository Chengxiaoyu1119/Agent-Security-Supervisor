import { Col, Flex, Row, Space, Steps, Typography } from 'antd';
import { LabelTag, PanelCard, UiButton } from '../ui';
import { OpenClawPluginPanel } from './OpenClawPluginPanel';
import type {
  OpenClawIntegrationBundle,
  OpenClawPluginPackageResult,
  OpenClawPluginValidationWriteResult
} from '../../types';

type ExternalIntegrationTabProps = {
  integrationBundle: OpenClawIntegrationBundle | null;
  openClawPluginPackage: OpenClawPluginPackageResult | null;
  openClawPluginValidation: OpenClawPluginValidationWriteResult | null;
  writingOpenClawPlugin: boolean;
  validatingOpenClawPlugin: boolean;
  handleWriteOpenClawPlugin: () => void | Promise<void>;
  handleValidateOpenClawPlugin: () => void | Promise<void>;
};

export function ExternalIntegrationTab({
  integrationBundle,
  openClawPluginPackage,
  openClawPluginValidation,
  writingOpenClawPlugin,
  validatingOpenClawPlugin,
  handleWriteOpenClawPlugin,
  handleValidateOpenClawPlugin
}: ExternalIntegrationTabProps) {
  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      <PanelCard title="外部智能体监督接入" type="inner">
        <Row gutter={[16, 16]} className="zh-mb-24">
          <Col xs={24} sm={12} lg={6}>
            <PanelCard size="small" type="inner" className="zh-full-height">
              <Typography.Text type="secondary" className="zh-settings-info-label">
                HTTP 接口
              </Typography.Text>
              <Typography.Text code className="zh-settings-code-wrap">
                POST /api/supervisor/evaluate
              </Typography.Text>
            </PanelCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <PanelCard size="small" type="inner" className="zh-full-height">
              <Typography.Text type="secondary" className="zh-settings-info-label">
                OpenClaw 兼容
              </Typography.Text>
              <Typography.Text code className="zh-settings-code-wrap">
                POST /api/integrations/openclaw/events
              </Typography.Text>
            </PanelCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <PanelCard size="small" type="inner" className="zh-full-height">
              <Typography.Text type="secondary" className="zh-settings-info-label">
                适配器代码
              </Typography.Text>
              <Typography.Text code className="zh-settings-code-wrap">
                GET /api/integrations/openclaw/adapter.py
              </Typography.Text>
            </PanelCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <PanelCard size="small" type="inner" className="zh-full-height">
              <Typography.Text type="secondary" className="zh-settings-info-label">
                CLI 验证
              </Typography.Text>
              <Typography.Text code className="zh-settings-code-wrap">
                npm run cli -- demo-external
              </Typography.Text>
            </PanelCard>
          </Col>
        </Row>

        {integrationBundle && (
          <PanelCard
            title={
              <Space>
                OpenClaw 兼容接入包{' '}
                <LabelTag variant="filled" color="blue">
                  {integrationBundle.version}
                </LabelTag>
              </Space>
            }
            className="zh-mb-24 zh-settings-muted-body"
            type="inner"
            variant="borderless"
          >
            <Typography.Paragraph>{integrationBundle.purpose}</Typography.Paragraph>
            <Row gutter={[16, 16]} className="zh-mb-24">
              <Col xs={12} md={6}>
                <PanelCard size="small" variant="borderless">
                  <Typography.Text type="secondary" className="zh-meta-block">
                    接口数量
                  </Typography.Text>
                  <Typography.Text strong className="zh-settings-stat-value">
                    {integrationBundle.endpoints.length}
                  </Typography.Text>
                </PanelCard>
              </Col>
              <Col xs={12} md={6}>
                <PanelCard size="small" variant="borderless">
                  <Typography.Text type="secondary" className="zh-meta-block">
                    样例事件
                  </Typography.Text>
                  <Typography.Text strong className="zh-settings-stat-value">
                    {integrationBundle.sample_events.length}
                  </Typography.Text>
                </PanelCard>
              </Col>
              <Col xs={12} md={6}>
                <PanelCard size="small" variant="borderless">
                  <Typography.Text type="secondary" className="zh-meta-block">
                    最低控制
                  </Typography.Text>
                  <Typography.Text strong className="zh-settings-stat-value">
                    {integrationBundle.validation.expected.controlled_min}
                  </Typography.Text>
                </PanelCard>
              </Col>
              <Col xs={12} md={6}>
                <PanelCard size="small" variant="borderless">
                  <Typography.Text type="secondary" className="zh-meta-block">
                    安全默认
                  </Typography.Text>
                  <Typography.Text strong className="zh-settings-stat-value">
                    {integrationBundle.event_contract.safe_default.includes('false') ? '只审计' : '需确认'}
                  </Typography.Text>
                </PanelCard>
              </Col>
            </Row>

            <Space orientation="vertical" className="zh-settings-stack zh-settings-stack--mb-24" size="middle">
              {integrationBundle.endpoints.map((endpoint) => (
                <PanelCard key={endpoint.path} size="small" bodyPadding={12}>
                  <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8}>
                    <div>
                      <Typography.Text strong className="zh-settings-endpoint-title">
                        {endpoint.name}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="zh-settings-endpoint-description">
                        {endpoint.description}
                      </Typography.Text>
                    </div>
                    <LabelTag variant="filled" color="purple" className="zh-settings-code-tag">
                      {endpoint.method} {endpoint.path}
                    </LabelTag>
                  </Flex>
                </PanelCard>
              ))}
            </Space>

            <PanelCard size="small" className="zh-settings-soft-panel" variant="borderless">
              <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                <Typography.Text code className="zh-settings-code-wrap zh-settings-code-md">
                  {integrationBundle.validation.cli}
                </Typography.Text>
                <Space wrap>
                  <UiButton size="small" href="/api/integrations/openclaw/bundle" target="_blank">
                    查看接入包 JSON
                  </UiButton>
                  <UiButton size="small" href="/api/integrations/openclaw/adapter.py" target="_blank">
                    查看适配器代码
                  </UiButton>
                </Space>
              </Flex>
            </PanelCard>

            <div className="zh-settings-section-top">
              <Typography.Title level={5} className="zh-settings-section-title">
                接入步骤
              </Typography.Title>
              <Steps
                orientation="vertical"
                size="small"
                current={integrationBundle.acceptance_steps.length}
                items={integrationBundle.acceptance_steps.map((step) => ({
                  title: <Typography.Text>{step}</Typography.Text>
                }))}
              />
            </div>
          </PanelCard>
        )}

        <OpenClawPluginPanel
          integrationBundle={integrationBundle}
          openClawPluginPackage={openClawPluginPackage}
          openClawPluginValidation={openClawPluginValidation}
          writingOpenClawPlugin={writingOpenClawPlugin}
          validatingOpenClawPlugin={validatingOpenClawPlugin}
          handleWriteOpenClawPlugin={handleWriteOpenClawPlugin}
          handleValidateOpenClawPlugin={handleValidateOpenClawPlugin}
        />
      </PanelCard>
    </Space>
  );
}
