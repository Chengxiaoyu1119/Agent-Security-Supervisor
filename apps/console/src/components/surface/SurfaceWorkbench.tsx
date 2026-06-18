import { Col, Divider, Row, Space, Typography } from 'antd';
import { ClipboardList, Play } from 'lucide-react';
import type { AttackSurface, Scenario, SurfaceEvidencePack } from '@/types';
import { riskLabel } from '@/utils';
import { LabelTag, MetricCard as Metric, PanelCard, UiButton } from '../ui';
import { SurfaceAttributeGroup } from './SurfaceAttributeGroup';
import { SurfaceDefenseBriefCard } from './SurfaceDefenseBriefCard';
import { SurfaceEvidencePackPanel } from './SurfaceEvidencePackPanel';
import { SurfaceScenarioList } from './SurfaceScenarioList';
import { getSurfaceRiskColor } from './surfaceWorkbenchUtils';

export { SurfaceCard } from './SurfaceCard';

export function SurfaceWorkbench({
  surface,
  scenarios,
  surfacePack,
  surfacePackLoading,
  surfacePackError,
  running,
  onOpenScenario,
  onBatchCompare
}: {
  surface: AttackSurface;
  scenarios: Scenario[];
  surfacePack: SurfaceEvidencePack | null;
  surfacePackLoading: boolean;
  surfacePackError: string;
  running: boolean;
  onOpenScenario: (id: string) => void;
  onBatchCompare: (ids: string[], label: string) => void;
}) {
  const firstScenarioId = scenarios[0]?.id;
  const color = getSurfaceRiskColor(surface.risk);

  return (
    <PanelCard className={`zh-surface-workbench zh-surface-workbench--${color}`} bodyPadding={24}>
      <Row gutter={32}>
        <Col xs={24} lg={16}>
          <div className="zh-surface-workbench__head">
            <div>
              <Typography.Title level={3} className="zh-surface-workbench__title">
                {surface.name}
              </Typography.Title>
              <Space size="small" align="center" wrap>
                <LabelTag color={color}>{riskLabel[surface.risk]}风险</LabelTag>
                <Typography.Text type="secondary" className="zh-code-sm">
                  {surface.id}
                </Typography.Text>
                <Typography.Text type="secondary" className="zh-text-sm">
                  {surface.status}
                </Typography.Text>
              </Space>
            </div>
            <Space>
              <UiButton
                type="primary"
                icon={<ClipboardList size={16} />}
                onClick={() => firstScenarioId && onOpenScenario(firstScenarioId)}
                disabled={!firstScenarioId}
              >
                运行首个剧本
              </UiButton>
              <UiButton
                icon={<Play size={16} />}
                onClick={() =>
                  onBatchCompare(
                    scenarios.map((scenario) => scenario.id),
                    surface.name
                  )
                }
                disabled={running || !scenarios.length}
              >
                {running ? '验证中...' : '批量验证'}
              </UiButton>
            </Space>
          </div>

          <Typography.Paragraph type="secondary" className="zh-surface-workbench__summary">
            {surface.summary}
          </Typography.Paragraph>

          <Row gutter={[16, 16]} className="zh-mb-24">
            <Col xs={12} sm={6}>
              <Metric label="样本" value={`${surface.samples}`} tone="cyan" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric label="脚本" value={`${surface.scripts}`} tone="amber" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric label="剧本" value={`${scenarios.length}`} tone="green" />
            </Col>
            <Col xs={12} sm={6}>
              <Metric
                label="风险"
                value={riskLabel[surface.risk]}
                tone={surface.risk === 'critical' ? 'red' : surface.risk === 'high' ? 'amber' : 'cyan'}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="zh-surface-workbench__attributes">
            <Col span={12}>
              <SurfaceAttributeGroup title="攻击入口" items={surface.entry_points} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup title="保护资产" items={surface.protected_assets} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup title="攻击目标" items={surface.attacker_goals} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup title="检测信号" items={surface.detection_signals} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup title="评测重点" items={surface.evaluation_focus} />
            </Col>
            <Col span={12}>
              <SurfaceAttributeGroup
                title="防御加固"
                items={surface.mitigations?.length ? surface.mitigations : [surface.defense]}
              />
            </Col>
          </Row>

          <SurfaceDefenseBriefCard
            surface={surface}
            scenarios={scenarios}
            pack={surfacePack}
            loading={surfacePackLoading}
          />
          <Divider />
          <SurfaceEvidencePackPanel
            surface={surface}
            pack={surfacePack}
            loading={surfacePackLoading}
            error={surfacePackError}
          />
        </Col>

        <Col xs={24} lg={8}>
          <SurfaceScenarioList scenarios={scenarios} onOpenScenario={onOpenScenario} />
        </Col>
      </Row>
    </PanelCard>
  );
}
