import { useMemo } from 'react';
import { updatePolicyEnabled } from '../../api';
import type { Policy } from '../../types';
import { DecisionPill, MetricCard as Metric } from '../ui';
import { Row, Col, Card, Typography, Switch, Space, Tag, Descriptions, Flex, Alert } from 'antd';

export function PolicyCenter({ policies, setPolicies }: { policies: Policy[]; setPolicies: (policies: Policy[]) => void }) {
  const enabledCount = policies.filter((policy) => policy.enabled).length;
  const protectedSurfaceCount = useMemo(
    () => new Set(policies.flatMap((policy) => policy.surface_ids ?? [])).size,
    [policies]
  );
  const protectedToolCount = useMemo(
    () => new Set(policies.flatMap((policy) => policy.tools ?? [])).size,
    [policies]
  );
  const policyLayerCount = useMemo(
    () => new Set(policies.map((policy) => policy.layer).filter(Boolean)).size,
    [policies]
  );

  function togglePolicy(id: string) {
    const current = policies.find((policy) => policy.id === id);
    if (!current) return;
    const enabled = !current.enabled;
    setPolicies(
      policies.map((policy) =>
        policy.id === id ? { ...policy, enabled } : policy
      )
    );
    updatePolicyEnabled(id, enabled).catch(() => undefined);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
        <Space orientation="vertical" size={4}>
          <Typography.Title level={2} style={{ margin: 0 }}>防御策略中心</Typography.Title>
          <Typography.Text type="secondary">{enabledCount}/{policies.length} 已启用</Typography.Text>
        </Space>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}><Metric label="策略层级" value={`${policyLayerCount}`} tone="cyan" /></Col>
        <Col xs={24} sm={12} md={6}><Metric label="覆盖攻击面" value={`${protectedSurfaceCount}`} tone="green" /></Col>
        <Col xs={24} sm={12} md={6}><Metric label="覆盖工具" value={`${protectedToolCount}`} tone="amber" /></Col>
        <Col xs={24} sm={12} md={6}><Metric label="停用策略" value={`${policies.length - enabledCount}`} tone={policies.length - enabledCount ? 'red' : 'green'} /></Col>
      </Row>

      <Row gutter={[24, 24]}>
        {policies.map(policy => (
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={8} key={policy.id}>
            <Card
              variant="borderless"
              style={{
                height: '100%',
                opacity: policy.enabled ? 1 : 0.6,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
              }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column'  }}}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <Space align="start">
                  <DecisionPill decision={policy.decision} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography.Text strong style={{ fontSize: 16, lineHeight: 1.2 }}>{policy.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>{policy.id}</Typography.Text>
                  </div>
                </Space>
                <Switch checked={policy.enabled} onChange={() => togglePolicy(policy.id)} size="small" />
              </div>
              
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 13, flex: 1 }}>{policy.description}</Typography.Paragraph>

              <div style={{ background: 'var(--ant-color-fill-quaternary)', padding: 12, borderRadius: 8, marginBottom: policy.risk_controls?.length ? 16 : (policy.disable_impact ? 16 : 0) }}>
                <Descriptions size="small" column={2} style={{ marginBottom: 0 }}>
                  <Descriptions.Item label={<Typography.Text type="secondary" style={{ fontSize: 12 }}>层级</Typography.Text>}><Typography.Text strong>{policy.layer ?? '未标注'}</Typography.Text></Descriptions.Item>
                  <Descriptions.Item label={<Typography.Text type="secondary" style={{ fontSize: 12 }}>攻击面</Typography.Text>}><Typography.Text strong>{policy.surface_ids?.join(' / ') || '未绑定'}</Typography.Text></Descriptions.Item>
                  <Descriptions.Item label={<Typography.Text type="secondary" style={{ fontSize: 12 }}>工具</Typography.Text>} span={2}><Typography.Text strong>{policy.tools?.join(' / ') || '未绑定'}</Typography.Text></Descriptions.Item>
                </Descriptions>
              </div>

              {policy.risk_controls?.length ? (
                <Space size={[0, 8]} wrap style={{ marginBottom: policy.disable_impact ? 16 : 0 }}>
                  {policy.risk_controls.map(item => <Tag key={item} variant="filled" color="processing">{item}</Tag>)}
                </Space>
              ) : null}

              {policy.disable_impact && (
                <Alert type="warning" title={`关闭影响: ${policy.disable_impact}`} showIcon style={{ marginTop: 'auto' }} />
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
