import { TerminalSquare } from 'lucide-react';
import { Alert, Col, Descriptions, Flex, Row, Space, Steps, Typography } from 'antd';
import { LabelTag, PanelCard, UiButton } from '../ui';
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

        <PanelCard
          title="OpenClaw 源码级插件包"
          className="zh-mb-24"
          type="inner"
          extra={
            <Space>
              <UiButton
                type="primary"
                onClick={handleWriteOpenClawPlugin}
                loading={writingOpenClawPlugin}
                icon={<TerminalSquare size={16} />}
              >
                生成插件包
              </UiButton>
              <UiButton onClick={handleValidateOpenClawPlugin} loading={validatingOpenClawPlugin}>
                运行验收
              </UiButton>
            </Space>
          }
        >
          <Typography.Paragraph type="secondary">
            生成可安装的 native plugin 目录，使用 before_tool_call 在 OpenClaw 工具执行前接入智安哨监督器。
          </Typography.Paragraph>

          {openClawPluginPackage ? (
            <>
              <Row gutter={[16, 16]} className="zh-settings-row-mb-16">
                <Col xs={12} sm={6}>
                  <Typography.Text type="secondary" className="zh-settings-text-block">
                    插件类型
                  </Typography.Text>
                  <Typography.Text strong>{openClawPluginPackage.summary.package_type}</Typography.Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Typography.Text type="secondary" className="zh-settings-text-block">
                    核心 Hook
                  </Typography.Text>
                  <Typography.Text strong>{openClawPluginPackage.summary.core_hooks.length}</Typography.Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Typography.Text type="secondary" className="zh-settings-text-block">
                    文件数
                  </Typography.Text>
                  <Typography.Text strong>{openClawPluginPackage.file_count}</Typography.Text>
                </Col>
                <Col xs={12} sm={6}>
                  <Typography.Text type="secondary" className="zh-settings-text-block">
                    检查通过
                  </Typography.Text>
                  <Typography.Text strong>
                    {Object.values(openClawPluginPackage.summary.runtime_checks).filter(Boolean).length}
                  </Typography.Text>
                </Col>
              </Row>
              <Space orientation="vertical" className="zh-settings-stack zh-settings-stack--mb-16">
                <Typography.Text code className="zh-settings-code-wrap">
                  {openClawPluginPackage.package_dir}
                </Typography.Text>
                <Typography.Text code className="zh-settings-code-wrap">
                  {openClawPluginPackage.zip_path}
                </Typography.Text>
                <Typography.Text code className="zh-settings-code-wrap">
                  {openClawPluginPackage.markdown_path}
                </Typography.Text>
              </Space>
              <Space wrap className="zh-settings-stack--mb-16">
                {Object.entries(openClawPluginPackage.summary.runtime_checks).map(([key, value]) => (
                  <LabelTag variant="filled" key={key} color={value ? 'success' : 'error'}>
                    {key}: {String(value)}
                  </LabelTag>
                ))}
              </Space>
              <Space orientation="vertical" className="zh-settings-stack">
                {openClawPluginPackage.summary.install_commands.map((command) => (
                  <Typography.Text key={command} code>
                    {command}
                  </Typography.Text>
                ))}
                {integrationBundle?.validation.plugin_validation_cli && (
                  <Typography.Text code>{integrationBundle.validation.plugin_validation_cli}</Typography.Text>
                )}
              </Space>
            </>
          ) : (
            <Alert
              title="还没有生成 OpenClaw 插件包。生成后会在本地输出 `zhian-openclaw-guard` 目录、zip 和说明文档。"
              type="info"
              showIcon
            />
          )}

          {openClawPluginValidation && (
            <PanelCard size="small" type="inner" className="zh-settings-result-panel">
              <Descriptions size="small" column={2} className="zh-settings-description">
                <Descriptions.Item label="验收状态">
                  <LabelTag
                    variant="filled"
                    color={
                      openClawPluginValidation.validation.overall_status === 'static-validated' ? 'success' : 'warning'
                    }
                  >
                    {openClawPluginValidation.validation.overall_status === 'static-validated'
                      ? '静态通过'
                      : openClawPluginValidation.validation.overall_status}
                  </LabelTag>
                </Descriptions.Item>
                <Descriptions.Item label="文件完整">
                  <LabelTag
                    variant="filled"
                    color={openClawPluginValidation.validation.files_passed ? 'success' : 'error'}
                  >
                    {openClawPluginValidation.validation.files_passed ? '通过' : '未通过'}
                  </LabelTag>
                </Descriptions.Item>
                <Descriptions.Item label="Hook 结构">
                  <LabelTag
                    variant="filled"
                    color={openClawPluginValidation.validation.static_passed ? 'success' : 'error'}
                  >
                    {openClawPluginValidation.validation.static_passed ? '通过' : '未通过'}
                  </LabelTag>
                </Descriptions.Item>
                <Descriptions.Item label="JS 语法">
                  <LabelTag
                    variant="filled"
                    color={openClawPluginValidation.validation.node_syntax_passed ? 'success' : 'error'}
                  >
                    {openClawPluginValidation.validation.node_syntax_passed ? '通过' : '未通过'}
                  </LabelTag>
                </Descriptions.Item>
                <Descriptions.Item label="OpenClaw runtime">
                  <LabelTag
                    variant="filled"
                    color={openClawPluginValidation.validation.runtime_inspect_passed ? 'success' : 'processing'}
                  >
                    {openClawPluginValidation.validation.runtime_inspect_passed ? '通过' : '待真实环境'}
                  </LabelTag>
                </Descriptions.Item>
              </Descriptions>
              <Space orientation="vertical" className="zh-settings-stack zh-settings-stack--mb-16">
                <Typography.Text code>{openClawPluginValidation.markdown_path}</Typography.Text>
                <Typography.Text code>{openClawPluginValidation.json_path}</Typography.Text>
              </Space>
              <Space wrap className="zh-settings-stack--mb-16">
                {Object.entries(openClawPluginValidation.validation.file_checks).map(([key, value]) => (
                  <LabelTag variant="filled" key={key} color={value ? 'success' : 'error'}>
                    {key}: {value ? '存在' : '缺失'}
                  </LabelTag>
                ))}
              </Space>
              {openClawPluginValidation.validation.remaining_gap.length > 0 && (
                <div className="zh-settings-error-text">
                  {openClawPluginValidation.validation.remaining_gap.map((gap) => (
                    <div key={gap}>{gap}</div>
                  ))}
                </div>
              )}
            </PanelCard>
          )}
        </PanelCard>
      </PanelCard>
    </Space>
  );
}
