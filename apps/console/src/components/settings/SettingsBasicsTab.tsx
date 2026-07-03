import { Col, Flex, Row, Space, Typography } from 'antd';
import { LabelTag, PanelCard, UiButton, UiInput, UiSelect, UiSwitch } from '../ui';
import type { ModelRuntimeConfig, Overview } from '@/types';
import { competitionCapabilityRows } from '@/utils';

type SettingsBasicsTabProps = {
  overview: Overview;
  modelConfig: ModelRuntimeConfig | null;
  savingModelConfig: boolean;
  onModelConfigChange: (config: ModelRuntimeConfig) => void;
  onSaveModelConfig: () => Promise<void>;
};

const fallbackProviders = [
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'zhipu', label: '智谱' },
  { id: 'openai-compatible', label: 'OpenAI 兼容接口' }
];

const profileMeta = [
  { id: 'target', title: '主模型', description: '负责响应安全评测输入，默认优先 DeepSeek。' },
  { id: 'optimizer', title: '副模型', description: '负责优化本地靶场测试提示词，默认优先智谱。' },
  { id: 'global', title: '全局默认模型', description: '用于普通模型调用和工具调用盲测。' }
];

export function SettingsBasicsTab({
  overview,
  modelConfig,
  savingModelConfig,
  onModelConfigChange,
  onSaveModelConfig
}: SettingsBasicsTabProps) {
  const providers = modelConfig?.allowed_providers?.length ? modelConfig.allowed_providers : fallbackProviders;
  const providerOptions = providers.map((provider) => ({ label: provider.label, value: provider.id }));
  const providerIds = providers.map((provider) => provider.id);
  const modelStatusByProvider = new Map(
    overview.models
      .map((model) => [normalizeProviderId(model.provider), model] as const)
      .filter(([providerId]) => providerIds.includes(providerId))
  );

  function updateModelConfig(updater: (config: ModelRuntimeConfig) => ModelRuntimeConfig) {
    if (!modelConfig) {
      return;
    }
    onModelConfigChange(updater(modelConfig));
  }

  function updateRealApiEnabled(realApiEnabled: boolean) {
    updateModelConfig((config) => ({ ...config, real_api_enabled: realApiEnabled }));
  }

  function updatePrimaryProvider(profileId: string, providerId: string) {
    updateModelConfig((config) => {
      const profile = config.profiles[profileId] ?? { provider_priority: [], model_overrides: {} };
      const existing = profile.provider_priority ?? [];
      const providerPriority = [
        providerId,
        ...existing.filter((item) => item !== providerId),
        ...providerIds.filter((item) => item !== providerId && !existing.includes(item))
      ];
      return {
        ...config,
        profiles: {
          ...config.profiles,
          [profileId]: {
            ...profile,
            provider_priority: providerPriority
          }
        }
      };
    });
  }

  function updateModelOverride(profileId: string, providerId: string, modelName: string) {
    updateModelConfig((config) => {
      const profile = config.profiles[profileId] ?? { provider_priority: [], model_overrides: {} };
      return {
        ...config,
        profiles: {
          ...config.profiles,
          [profileId]: {
            ...profile,
            model_overrides: {
              ...profile.model_overrides,
              [providerId]: modelName
            }
          }
        }
      };
    });
  }

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
                {model.configured ? '已配置真实 API' : '未配置，使用本地兜底模型'}
              </Typography.Text>
            </PanelCard>
          </Col>
        ))}
      </Row>

      <PanelCard title="大语言模型运行配置" type="inner">
        {modelConfig ? (
          <Space orientation="vertical" size="large" className="zh-settings-stack">
            <div className="zh-settings-model-toolbar">
              <div className="zh-flex-min">
                <Typography.Text strong className="zh-text-block">
                  真实 API 调用
                </Typography.Text>
                <Typography.Text type="secondary" className="zh-text-sm zh-text-block zh-mt-4">
                  密钥仍读取服务器 .env，页面只保存模型用途、优先级和模型名。
                </Typography.Text>
              </div>
              <Flex align="center" gap={12} wrap="wrap">
                <UiSwitch checked={modelConfig.real_api_enabled} onChange={updateRealApiEnabled} />
                <UiButton type="primary" loading={savingModelConfig} onClick={onSaveModelConfig}>
                  保存配置
                </UiButton>
              </Flex>
            </div>

            <Row gutter={[16, 16]}>
              {profileMeta.map((profile) => {
                const profileConfig = modelConfig.profiles[profile.id] ?? {
                  provider_priority: providerIds,
                  model_overrides: {}
                };
                const primaryProvider = profileConfig.provider_priority?.[0] ?? providerIds[0];
                const selectedProvider = providers.find((provider) => provider.id === primaryProvider) ?? providers[0];
                const defaultModel = modelStatusByProvider.get(primaryProvider)?.model ?? '';
                const orderLabels = (profileConfig.provider_priority?.length ? profileConfig.provider_priority : providerIds)
                  .map((providerId) => providers.find((provider) => provider.id === providerId)?.label ?? providerId)
                  .join(' -> ');
                return (
                  <Col xs={24} md={8} key={profile.id}>
                    <PanelCard type="inner" size="small" className="zh-full-height zh-settings-model-card">
                      <Space orientation="vertical" size="middle" className="zh-settings-stack">
                        <div>
                          <Typography.Text strong className="zh-text-block">
                            {profile.title}
                          </Typography.Text>
                          <Typography.Text type="secondary" className="zh-text-sm zh-text-block zh-mt-4">
                            {profile.description}
                          </Typography.Text>
                        </div>
                        <div className="zh-settings-model-field">
                          <Typography.Text type="secondary" className="zh-settings-info-label">
                            优先调用
                          </Typography.Text>
                          <UiSelect
                            className="zh-settings-model-select"
                            value={primaryProvider}
                            options={providerOptions}
                            onChange={(value) => updatePrimaryProvider(profile.id, value)}
                          />
                        </div>
                        <div className="zh-settings-model-field">
                          <Typography.Text type="secondary" className="zh-settings-info-label">
                            模型名称
                          </Typography.Text>
                          <UiInput
                            className="zh-settings-model-input"
                            value={profileConfig.model_overrides?.[primaryProvider] ?? ''}
                            placeholder={defaultModel ? `默认：${defaultModel}` : `默认：${selectedProvider.label}`}
                            onChange={(event) => updateModelOverride(profile.id, primaryProvider, event.target.value)}
                          />
                        </div>
                        <Typography.Text type="secondary" className="zh-code-sm">
                          调用顺序：{orderLabels}
                        </Typography.Text>
                      </Space>
                    </PanelCard>
                  </Col>
                );
              })}
            </Row>
          </Space>
        ) : (
          <Typography.Text type="secondary">正在读取模型运行配置...</Typography.Text>
        )}
      </PanelCard>

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

function normalizeProviderId(provider: string): string {
  if (/deepseek/i.test(provider)) {
    return 'deepseek';
  }
  if (/智谱|zhipu/i.test(provider)) {
    return 'zhipu';
  }
  if (/openai|兼容接口/i.test(provider)) {
    return 'openai-compatible';
  }
  return '';
}
