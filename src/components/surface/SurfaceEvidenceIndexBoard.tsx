import { Row, Col, Typography, Space, Empty, Flex } from 'antd';
import { Folder, Shield, AlertCircle } from 'lucide-react';
import type { SurfaceEvidencePackIndex } from '../../types';
import { LabelTag, PanelCard, UiProgress } from '../ui';

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
            let color = 'default';
            if (item.risk === 'critical') color = 'error';
            if (item.risk === 'high') color = 'warning';
            if (item.risk === 'medium') color = 'processing';
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
                    <div>
                      <Typography.Text strong className="zh-text-block">
                        {item.surface_name}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="zh-text-meta zh-break-anywhere">
                        {item.surface_id}
                      </Typography.Text>
                    </div>
                    <LabelTag color={color} variant="filled" className="zh-fit-tag">
                      {item.risk}
                    </LabelTag>
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
                      <Typography.Text>{item.control_rate}%</Typography.Text>
                    </div>
                    <UiProgress
                      percent={item.control_rate}
                      size="small"
                      showInfo={false}
                      strokeColor="var(--ant-color-success)"
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
                        {item.gap_count} 项缺口
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
