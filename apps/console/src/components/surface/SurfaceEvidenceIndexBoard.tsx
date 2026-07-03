import { Row, Col, Typography, Space, Empty, Flex } from 'antd';
import { AlertCircle, CheckCircle2, Clock3, Folder, Shield } from 'lucide-react';
import type { SurfaceEvidencePackIndex } from '@/types';
import { LabelTag, PanelCard, UiProgress } from '../ui';
import { riskLabel } from '@/utils';

function riskColor(risk: string) {
  if (risk === 'critical') return 'error';
  if (risk === 'high') return 'warning';
  if (risk === 'medium') return 'processing';
  return 'default';
}

function evidenceState(item: SurfaceEvidencePackIndex['surfaces'][number]) {
  if (!item.run_count) {
    return {
      label: '待补运行证据',
      color: 'warning',
      icon: <Clock3 size={12} className="zh-tag-icon" />
    };
  }
  if (item.control_rate >= 80) {
    return {
      label: `已验证 ${item.run_count} 条`,
      color: 'success',
      icon: <CheckCircle2 size={12} className="zh-tag-icon" />
    };
  }
  return {
    label: `需复核 ${item.run_count} 条`,
    color: 'warning',
    icon: <AlertCircle size={12} className="zh-tag-icon" />
  };
}

export function SurfaceEvidenceIndexBoard({
  index,
  loading,
  error,
  selectedSurfaceId,
  onSelectSurface
}: {
  index: SurfaceEvidencePackIndex | null;
  loading: boolean;
  error: string;
  selectedSurfaceId: string;
  onSelectSurface: (id: string) => void;
}) {
  const summary = index?.summary;
  return (
    <PanelCard
      title={
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <Space orientation="vertical" size={0}>
            <Typography.Text strong>全量证据索引</Typography.Text>
            <Typography.Text type="secondary" className="zh-text-body">
              按攻击面汇总样本、脚本、策略、工具、运行证据和缺口状态。
            </Typography.Text>
          </Space>
          <Space size="large" wrap>
            <Typography.Text type="secondary">
              {loading ? '...' : `${summary?.surface_count ?? 0}`} 类攻击面
            </Typography.Text>
            <Typography.Text type="secondary">
              {loading ? '...' : `${summary?.avg_readiness_score ?? 0}%`} 完整度
            </Typography.Text>
            <Typography.Text type="secondary">{loading ? '...' : `${summary?.gap_count ?? 0}`} 项缺口</Typography.Text>
          </Space>
        </Flex>
      }
      variant="borderless"
      className="zh-mb-24"
    >
      {error ? <Empty description={error} /> : null}
      {!error && (
        <Row gutter={[16, 16]}>
          {(index?.surfaces ?? []).map((item) => {
            const runtimeState = evidenceState(item);
            const hasRuntimeEvidence = item.run_count > 0;
            return (
              <Col xs={24} md={12} xl={8} key={item.surface_id}>
                <PanelCard
                  type="inner"
                  hoverable
                  onClick={() => onSelectSurface(item.surface_id)}
                  className={`zh-surface-evidence-card${
                    selectedSurfaceId === item.surface_id ? ' zh-surface-evidence-card--selected' : ''
                  }`}
                >
                  <div className="zh-surface-evidence-card__head">
                    <div className="zh-flex-min">
                      <Typography.Text strong className="zh-text-block">
                        {item.surface_name}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="zh-text-meta zh-break-anywhere">
                        {item.surface_id}
                      </Typography.Text>
                    </div>
                    <div className="zh-surface-evidence-card__tag-rail">
                      <LabelTag color={riskColor(item.risk)} variant="filled" className="zh-fit-tag">
                        {riskLabel[item.risk] ?? item.risk}风险
                      </LabelTag>
                      <LabelTag
                        color={runtimeState.color}
                        variant="filled"
                        icon={runtimeState.icon}
                        className="zh-fit-tag"
                      >
                        {runtimeState.label}
                      </LabelTag>
                    </div>
                  </div>

                  <div className="zh-surface-evidence-card__meta-grid">
                    <div>
                      <Typography.Text type="secondary" className="zh-text-meta">
                        脚本
                      </Typography.Text>
                      <Typography.Text strong>{item.scenario_count}</Typography.Text>
                    </div>
                    <div>
                      <Typography.Text type="secondary" className="zh-text-meta">
                        样本
                      </Typography.Text>
                      <Typography.Text strong>{item.sample_count}</Typography.Text>
                    </div>
                    <div>
                      <Typography.Text type="secondary" className="zh-text-meta">
                        策略
                      </Typography.Text>
                      <Typography.Text strong>{item.expected_policy_count}</Typography.Text>
                    </div>
                  </div>

                  <div className="zh-mb-8">
                    <div className="zh-split-row zh-text-meta">
                      <Typography.Text type="secondary">完整度</Typography.Text>
                      <Typography.Text>{item.readiness_score}%</Typography.Text>
                    </div>
                    <UiProgress
                      percent={item.readiness_score}
                      size="small"
                      showInfo={false}
                      strokeColor="var(--ant-color-primary)"
                    />
                  </div>

                  <div className="zh-mb-12">
                    <div className="zh-split-row zh-text-meta">
                      <Typography.Text type="secondary">控制率</Typography.Text>
                      <Typography.Text>{hasRuntimeEvidence ? `${item.control_rate}%` : '待运行'}</Typography.Text>
                    </div>
                    <UiProgress
                      percent={hasRuntimeEvidence ? item.control_rate : 0}
                      size="small"
                      showInfo={false}
                      strokeColor={hasRuntimeEvidence ? 'var(--ant-color-success)' : 'var(--ant-color-warning)'}
                    />
                  </div>

                  <div className="zh-flex-spacer"></div>

                  <Space size={[8, 8]} wrap>
                    {item.top_policies.slice(0, 2).map((policy) => (
                      <LabelTag
                        key={policy}
                        variant="filled"
                        color="processing"
                        icon={<Shield size={12} className="zh-tag-icon" />}
                        className="zh-title-flush"
                      >
                        {policy}
                      </LabelTag>
                    ))}
                    {item.tools.slice(0, 2).map((tool) => (
                      <LabelTag
                        key={tool}
                        variant="filled"
                        icon={<Folder size={12} className="zh-tag-icon" />}
                        className="zh-title-flush"
                      >
                        {tool}
                      </LabelTag>
                    ))}
                    {item.gap_count > 0 && (
                      <LabelTag
                        color="error"
                        variant="filled"
                        icon={<AlertCircle size={12} className="zh-tag-icon" />}
                        className="zh-title-flush"
                      >
                        待补 {item.gap_count} 项
                      </LabelTag>
                    )}
                  </Space>
                </PanelCard>
              </Col>
            );
          })}
          {loading && !index ? (
            <Col span={24}>
              <Empty description="正在加载全量证据索引..." />
            </Col>
          ) : null}
        </Row>
      )}
    </PanelCard>
  );
}
