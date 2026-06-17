import { Row, Col, Typography, Button, Input, Select } from 'antd';
import { ClipboardList } from 'lucide-react';
import { ActionRow, PanelCard } from '../ui';
import { SurfaceCard, SurfaceWorkbench } from '../surface/SurfaceWorkbench';
import type { AttackSurface, Scenario, SurfaceEvidencePack } from '../../types';
import { riskLabel } from '../../utils';

type DashboardSurfacesTabProps = {
  surfaceQuery: string;
  setSurfaceQuery: (value: string) => void;
  riskFilter: string;
  setRiskFilter: (value: string) => void;
  filteredSurfaces: AttackSurface[];
  scenarioCountBySurface: Record<string, number>;
  selectedSurface?: AttackSurface;
  selectedSurfaceScenarios: Scenario[];
  surfacePack: SurfaceEvidencePack | null;
  surfacePackLoading: boolean;
  surfacePackError: string;
  running: boolean;
  setSelectedSurfaceId: (id: string) => void;
  onSelectScenario: (id: string) => void;
  onBatchCompare: (ids: string[], label: string) => void;
};

export function DashboardSurfacesTab({
  surfaceQuery,
  setSurfaceQuery,
  riskFilter,
  setRiskFilter,
  filteredSurfaces,
  scenarioCountBySurface,
  selectedSurface,
  selectedSurfaceScenarios,
  surfacePack,
  surfacePackLoading,
  surfacePackError,
  running,
  setSelectedSurfaceId,
  onSelectScenario,
  onBatchCompare
}: DashboardSurfacesTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
      <PanelCard variant="borderless" styles={{ body: { padding: '16px 24px' } }}>
        <ActionRow
          content={
            <div className="zh-toolbar-controls">
              <Input
                placeholder="名称、入口、资产、检测信号"
                value={surfaceQuery}
                onChange={(e) => setSurfaceQuery(e.target.value)}
                style={{ width: 240 }}
                prefix={<Typography.Text type="secondary">搜索</Typography.Text>}
              />
              <Select
                value={riskFilter}
                onChange={setRiskFilter}
                style={{ width: 160 }}
                options={['全部', 'critical', 'high', 'medium', 'low'].map((risk) => ({
                  label: risk === '全部' ? '全部风险' : riskLabel[risk],
                  value: risk
                }))}
              />
            </div>
          }
        >
          <Button
            icon={<ClipboardList size={16} />}
            onClick={() =>
              selectedSurfaceScenarios.length &&
              onBatchCompare(
                selectedSurfaceScenarios.map((scenario) => scenario.id),
                selectedSurface?.name ?? '当前攻击面'
              )
            }
            disabled={running || !selectedSurfaceScenarios.length}
          >
            {running ? '验证中...' : '验证当前面'}
          </Button>
        </ActionRow>
      </PanelCard>

      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredSurfaces.map((surface) => (
              <SurfaceCard
                key={surface.id}
                surface={surface}
                scenarioCount={scenarioCountBySurface[surface.id] ?? 0}
                selected={selectedSurface?.id === surface.id}
                onSelect={() => setSelectedSurfaceId(surface.id)}
              />
            ))}
            {!filteredSurfaces.length && (
              <Typography.Text type="secondary" style={{ textAlign: 'center', padding: 48 }}>
                没有匹配的攻击面。
              </Typography.Text>
            )}
          </div>
        </Col>
        <Col xs={24} lg={16}>
          {selectedSurface ? (
            <SurfaceWorkbench
              surface={selectedSurface}
              scenarios={selectedSurfaceScenarios}
              surfacePack={surfacePack}
              surfacePackLoading={surfacePackLoading}
              surfacePackError={surfacePackError}
              running={running}
              onOpenScenario={onSelectScenario}
              onBatchCompare={onBatchCompare}
            />
          ) : (
            <PanelCard variant="borderless">
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Typography.Text type="secondary">暂无攻击面数据。</Typography.Text>
              </div>
            </PanelCard>
          )}
        </Col>
      </Row>
    </div>
  );
}
