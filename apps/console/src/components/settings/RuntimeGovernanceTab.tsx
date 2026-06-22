import { Col, Flex, Row, Space, Switch, Typography } from 'antd';
import type {
  AuthContext,
  MemoryGovernance,
  ObservabilityMetrics,
  PolicySettings
} from '@/types';
import { LabelTag, MetricCard, PanelCard, UiButton, UiInputNumber } from '../ui';

type RuntimeGovernanceTabProps = {
  authContext: AuthContext | null;
  policySettings: PolicySettings | null;
  metrics: ObservabilityMetrics | null;
  memoryGovernance: MemoryGovernance | null;
  savingSettings: boolean;
  refreshingGovernance: boolean;
  onSettingsChange: (settings: PolicySettings) => void;
  onSaveSettings: () => void | Promise<void>;
  onRefreshGovernance: () => void | Promise<void>;
  onMemoryStatus: (memoryId: string, status: string) => void | Promise<void>;
  onRollbackMemory: () => void | Promise<void>;
};

export function RuntimeGovernanceTab({
  authContext,
  policySettings,
  metrics,
  memoryGovernance,
  savingSettings,
  refreshingGovernance,
  onSettingsChange,
  onSaveSettings,
  onRefreshGovernance,
  onMemoryStatus,
  onRollbackMemory
}: RuntimeGovernanceTabProps) {
  function patchSettings(patch: Partial<PolicySettings>) {
    if (!policySettings) return;
    onSettingsChange({ ...policySettings, ...patch });
  }

  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      <PanelCard type="inner">
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <Space orientation="vertical" size={4}>
            <Typography.Title level={4} className="zh-title-flush">
              运行治理中心
            </Typography.Title>
            <Typography.Text type="secondary">
              角色、策略阈值、运行指标和记忆治理统一在这里维护。
            </Typography.Text>
          </Space>
          <UiButton loading={refreshingGovernance} onClick={() => void onRefreshGovernance()}>
            刷新治理状态
          </UiButton>
        </Flex>
      </PanelCard>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <MetricCard label="当前角色" value={authContext?.role ?? 'unknown'} tone="cyan" />
        </Col>
        <Col xs={24} md={8}>
          <MetricCard label="策略版本" value={`${metrics?.summary.policy_version_count ?? 0}`} tone="green" />
        </Col>
        <Col xs={24} md={8}>
          <MetricCard label="运行控制率" value={`${metrics?.summary.control_rate ?? 0}%`} tone="amber" />
        </Col>
      </Row>

      <PanelCard title="策略阈值" type="inner">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Typography.Text type="secondary" className="zh-meta-block">
              异常询问阈值
            </Typography.Text>
            <UiInputNumber
              min={1}
              max={100}
              value={policySettings?.anomaly_review_threshold}
              onChange={(value) => patchSettings({ anomaly_review_threshold: Number(value ?? 55) })}
              className="zh-full-width"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Typography.Text type="secondary" className="zh-meta-block">
              异常拒绝阈值
            </Typography.Text>
            <UiInputNumber
              min={1}
              max={100}
              value={policySettings?.anomaly_reject_threshold}
              onChange={(value) => patchSettings({ anomaly_reject_threshold: Number(value ?? 85) })}
              className="zh-full-width"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Typography.Text type="secondary" className="zh-meta-block">
              复核时限分钟
            </Typography.Text>
            <UiInputNumber
              min={1}
              max={1440}
              value={policySettings?.approval_sla_minutes}
              onChange={(value) => patchSettings({ approval_sla_minutes: Number(value ?? 30) })}
              className="zh-full-width"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Typography.Text type="secondary" className="zh-meta-block">
              高风险自动升级
            </Typography.Text>
            <div className="zh-settings-switch-row">
              <Switch
                checked={Boolean(policySettings?.high_risk_auto_escalation)}
                onChange={(checked) => patchSettings({ high_risk_auto_escalation: checked })}
              />
              <UiButton type="primary" loading={savingSettings} onClick={() => void onSaveSettings()}>
                保存阈值
              </UiButton>
            </div>
          </Col>
        </Row>
      </PanelCard>

      <PanelCard title="运行指标" type="inner">
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <MetricCard label="运行次数" value={`${metrics?.summary.run_count ?? 0}`} tone="cyan" />
          </Col>
          <Col xs={12} md={6}>
            <MetricCard label="审计日志" value={`${metrics?.summary.audit_log_count ?? 0}`} tone="green" />
          </Col>
          <Col xs={12} md={6}>
            <MetricCard label="待复核" value={`${metrics?.summary.pending_review_count ?? 0}`} tone="amber" />
          </Col>
          <Col xs={12} md={6}>
            <MetricCard label="平均延迟" value={`${metrics?.summary.avg_detection_latency_ms ?? 0}ms`} tone="red" />
          </Col>
        </Row>
      </PanelCard>

      <PanelCard title="记忆治理" type="inner">
        <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="zh-mb-16">
          <Space wrap>
            <LabelTag variant="filled" color="processing">
              活跃 {memoryGovernance?.summary.active_count ?? 0}
            </LabelTag>
            <LabelTag variant="filled" color="warning">
              隔离 {memoryGovernance?.summary.quarantined_count ?? 0}
            </LabelTag>
            <LabelTag variant="filled" color="default">
              移除 {memoryGovernance?.summary.removed_count ?? 0}
            </LabelTag>
            {memoryGovernance?.items_window ? (
              <LabelTag variant="filled" color="blue">
                已返回 {memoryGovernance.items_window.returned}/{memoryGovernance.items_window.total}
              </LabelTag>
            ) : null}
          </Space>
          <UiButton onClick={() => void onRollbackMemory()}>回滚最新非种子记忆</UiButton>
        </Flex>
        <Space orientation="vertical" className="zh-full-width" size="middle">
          {(memoryGovernance?.items ?? []).slice(0, 8).map((item) => (
            <PanelCard key={item.id} size="small" bodyPadding={12}>
              <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
                <Space orientation="vertical" size={4} className="zh-settings-memory-copy">
                  <Space wrap>
                    <Typography.Text strong>{item.id}</Typography.Text>
                    <LabelTag variant="filled" color={item.status === 'active' ? 'success' : 'warning'}>
                      {item.status}
                    </LabelTag>
                    <LabelTag variant="filled" color="blue">
                      可信度 {item.trust_score}
                    </LabelTag>
                  </Space>
                  <Typography.Text type="secondary">{item.content}</Typography.Text>
                </Space>
                <Space wrap>
                  <UiButton size="small" onClick={() => void onMemoryStatus(item.id, 'active')}>
                    恢复
                  </UiButton>
                  <UiButton size="small" onClick={() => void onMemoryStatus(item.id, 'quarantined')}>
                    隔离
                  </UiButton>
                  <UiButton size="small" danger onClick={() => void onMemoryStatus(item.id, 'removed')}>
                    移除
                  </UiButton>
                </Space>
              </Flex>
            </PanelCard>
          ))}
        </Space>
      </PanelCard>
    </Space>
  );
}
