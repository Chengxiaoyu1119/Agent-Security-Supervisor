import { useMemo, useState } from 'react';
import { Row, Col, Typography, Switch, Space, Descriptions, Flex } from 'antd';
import { updatePolicyEnabled } from '../../api';
import type { Policy } from '../../types';
import { DecisionPill, LabelTag, MetricCard as Metric, PanelCard, UiAlert } from '../ui';

export function PolicyCenter({
  policies,
  setPolicies
}: {
  policies: Policy[];
  setPolicies: (policies: Policy[]) => void;
}) {
  const enabledCount = policies.filter((policy) => policy.enabled).length;
  const protectedSurfaceCount = useMemo(
    () => new Set(policies.flatMap((policy) => policy.surface_ids ?? [])).size,
    [policies]
  );
  const protectedToolCount = useMemo(() => new Set(policies.flatMap((policy) => policy.tools ?? [])).size, [policies]);
  const policyLayerCount = useMemo(
    () => new Set(policies.map((policy) => policy.layer).filter(Boolean)).size,
    [policies]
  );
  const [savingPolicyId, setSavingPolicyId] = useState('');
  const [policyError, setPolicyError] = useState('');

  async function togglePolicy(id: string) {
    const current = policies.find((policy) => policy.id === id);
    if (!current) return;
    const enabled = !current.enabled;
    const previousPolicies = policies;
    setPolicyError('');
    setSavingPolicyId(id);
    setPolicies(policies.map((policy) => (policy.id === id ? { ...policy, enabled } : policy)));
    try {
      const savedPolicy = await updatePolicyEnabled(id, enabled);
      setPolicies(previousPolicies.map((policy) => (policy.id === id ? savedPolicy : policy)));
    } catch {
      setPolicies(previousPolicies);
      setPolicyError('策略状态保存失败，页面已恢复到保存前状态。');
    } finally {
      setSavingPolicyId('');
    }
  }

  return (
    <div className="zh-page-stack">
      <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
        <Space orientation="vertical" size={4}>
          <Typography.Title level={2} className="zh-title-flush">
            防御策略中心
          </Typography.Title>
          <Typography.Text type="secondary">
            {enabledCount}/{policies.length} 已启用
          </Typography.Text>
        </Space>
      </Flex>

      {policyError ? <UiAlert type="error" title={policyError} showIcon /> : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Metric label="策略层级" value={`${policyLayerCount}`} tone="cyan" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="覆盖攻击面" value={`${protectedSurfaceCount}`} tone="green" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="覆盖工具" value={`${protectedToolCount}`} tone="amber" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric
            label="停用策略"
            value={`${policies.length - enabledCount}`}
            tone={policies.length - enabledCount ? 'red' : 'green'}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {policies.map((policy) => (
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={8} key={policy.id}>
            <PanelCard
              variant="borderless"
              className={`zh-policy-card${policy.enabled ? '' : ' zh-policy-card--disabled'}`}
            >
              <div className="zh-policy-card__head">
                <Space align="start">
                  <DecisionPill decision={policy.decision} />
                  <div className="zh-column-stack">
                    <Typography.Text strong className="zh-policy-card__title">
                      {policy.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="zh-policy-card__id">
                      {policy.id}
                    </Typography.Text>
                  </div>
                </Space>
                <Switch
                  checked={policy.enabled}
                  disabled={Boolean(savingPolicyId)}
                  loading={savingPolicyId === policy.id}
                  onChange={() => void togglePolicy(policy.id)}
                  size="small"
                />
              </div>

              <Typography.Paragraph type="secondary" className="zh-policy-card__description">
                {policy.description}
              </Typography.Paragraph>

              <div
                className={`zh-policy-card__meta${
                  policy.risk_controls?.length || policy.disable_impact ? ' zh-policy-card__meta--spaced' : ''
                }`}
              >
                <Descriptions size="small" column={2} className="zh-description-flush">
                  <Descriptions.Item
                    label={
                      <Typography.Text type="secondary" className="zh-text-meta">
                        层级
                      </Typography.Text>
                    }
                  >
                    <Typography.Text strong>{policy.layer ?? '未标注'}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <Typography.Text type="secondary" className="zh-text-meta">
                        攻击面
                      </Typography.Text>
                    }
                  >
                    <Typography.Text strong>{policy.surface_ids?.join(' / ') || '未绑定'}</Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <Typography.Text type="secondary" className="zh-text-meta">
                        工具
                      </Typography.Text>
                    }
                    span={2}
                  >
                    <Typography.Text strong>{policy.tools?.join(' / ') || '未绑定'}</Typography.Text>
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {policy.risk_controls?.length ? (
                <Space size={[0, 8]} wrap className={policy.disable_impact ? 'zh-mb-16' : undefined}>
                  {policy.risk_controls.map((item) => (
                    <LabelTag key={item} variant="filled" color="processing">
                      {item}
                    </LabelTag>
                  ))}
                </Space>
              ) : null}

              {policy.disable_impact && (
                <UiAlert type="warning" title={`关闭影响: ${policy.disable_impact}`} showIcon className="zh-mt-auto" />
              )}
            </PanelCard>
          </Col>
        ))}
      </Row>
    </div>
  );
}
