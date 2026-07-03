import { useState, useEffect, useMemo } from 'react';
import { fetchSurfaceEvidencePack, fetchSurfaceEvidencePackIndex, writeAllSurfaceEvidencePacks } from '../api';
import type { SurfaceEvidencePack, SurfaceEvidencePackWriteResult, SurfaceEvidencePackIndex, Overview } from '../types';
import { DashboardEvidenceTab, DashboardOverviewTab, DashboardSurfacesTab } from '../components/dashboard';
import { UiTabs } from '../components/ui';
import type { PageKey } from '../app/navigation';

export function Dashboard({
  overview,
  apiAvailable,
  running,
  onSelectScenario,
  onOpenPage,
  onBatchCompare
}: {
  overview: Overview;
  apiAvailable: boolean | null;
  running: boolean;
  onSelectScenario: (id: string) => void;
  onOpenPage: (page: PageKey) => void;
  onBatchCompare: (ids: string[], label: string) => void;
}) {
  const [selectedSurfaceId, setSelectedSurfaceId] = useState(overview.attack_surfaces[0]?.id ?? '');
  const [surfaceQuery, setSurfaceQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('全部');
  const [surfacePack, setSurfacePack] = useState<SurfaceEvidencePack | null>(null);
  const [surfacePackLoading, setSurfacePackLoading] = useState(false);
  const [surfacePackError, setSurfacePackError] = useState('');
  const [allPackExporting, setAllPackExporting] = useState(false);
  const [allPackExportResult, setAllPackExportResult] = useState<SurfaceEvidencePackWriteResult | null>(null);
  const [allPackExportError, setAllPackExportError] = useState('');
  const [surfacePackIndex, setSurfacePackIndex] = useState<SurfaceEvidencePackIndex | null>(null);
  const [surfacePackIndexLoading, setSurfacePackIndexLoading] = useState(false);
  const [surfacePackIndexError, setSurfacePackIndexError] = useState('');
  const scenarioCountBySurface = useMemo(() => {
    return overview.scenarios.reduce<Record<string, number>>((acc, scenario) => {
      acc[scenario.surface_id] = (acc[scenario.surface_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [overview.scenarios]);
  const filteredSurfaces = useMemo(() => {
    const keyword = surfaceQuery.trim().toLowerCase();
    return overview.attack_surfaces.filter((surface) => {
      const text = [
        surface.id,
        surface.name,
        surface.summary,
        surface.defense,
        ...(surface.entry_points ?? []),
        ...(surface.protected_assets ?? []),
        ...(surface.attacker_goals ?? []),
        ...(surface.detection_signals ?? []),
        ...(surface.evaluation_focus ?? []),
        ...(surface.mitigations ?? [])
      ]
        .join(' ')
        .toLowerCase();
      return (!keyword || text.includes(keyword)) && (riskFilter === '全部' || surface.risk === riskFilter);
    });
  }, [overview.attack_surfaces, riskFilter, surfaceQuery]);
  const selectedSurface =
    filteredSurfaces.find((surface) => surface.id === selectedSurfaceId) ??
    filteredSurfaces[0] ??
    overview.attack_surfaces[0];
  const activeSurfaceId = selectedSurface?.id;
  const selectedSurfaceScenarios = useMemo(
    () => (activeSurfaceId ? overview.scenarios.filter((scenario) => scenario.surface_id === activeSurfaceId) : []),
    [activeSurfaceId, overview.scenarios]
  );
  const totalSamples = overview.attack_surfaces.reduce((sum, surface) => sum + surface.samples, 0);
  const totalScripts = overview.attack_surfaces.reduce((sum, surface) => sum + surface.scripts, 0);
  const highRiskSurfaceCount = overview.attack_surfaces.filter((surface) =>
    ['critical', 'high'].includes(surface.risk)
  ).length;
  const completeSurfaceCount = overview.attack_surfaces.filter(
    (surface) =>
      surface.entry_points?.length &&
      surface.protected_assets?.length &&
      surface.detection_signals?.length &&
      surface.evaluation_focus?.length
  ).length;
  const controlledLogs = overview.audit_logs.filter((log) => ['拒绝', '询问', '隔离'].includes(log.decision)).length;
  const maxRiskScore = Math.max(
    0,
    ...overview.audit_logs.map((log) => log.risk_score ?? 0),
    ...overview.alerts.map((alert) => alert.risk_score ?? 0)
  );
  const latestAlert = overview.alerts[0];
  const priorityScenario =
    overview.scenarios.find((scenario) => scenario.severity === 'critical') ?? overview.scenarios[0];
  const pipelineNodes = [
    { label: '输入样本', value: `${totalSamples}` },
    { label: 'Agent 规划', value: `${overview.summary.scenario_count}` },
    { label: '工具调用', value: `${overview.audit_logs.length}` },
    { label: '监督判定', value: `${controlledLogs}` },
    { label: '告警留痕', value: `${overview.alerts.length}` }
  ];

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (ignore) return;
      if (!activeSurfaceId) {
        setSurfacePack(null);
        return;
      }
      if (!apiAvailable) {
        setSurfacePack(null);
        setSurfacePackLoading(false);
        setSurfacePackError('后端未连接，证据包接口暂不可用。');
        return;
      }
      setSurfacePackLoading(true);
      setSurfacePackError('');
      fetchSurfaceEvidencePack(activeSurfaceId)
        .then((data) => {
          if (!ignore) setSurfacePack(data);
        })
        .catch(() => {
          if (ignore) return;
          setSurfacePack(null);
          setSurfacePackError('证据包接口暂时不可用，请确认后端服务已启动。');
        })
        .finally(() => {
          if (!ignore) setSurfacePackLoading(false);
        });
    });
    return () => {
      ignore = true;
    };
  }, [activeSurfaceId, apiAvailable]);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(() => {
      if (ignore) return;
      if (!apiAvailable) {
        setSurfacePackIndex(null);
        setSurfacePackIndexLoading(false);
        setSurfacePackIndexError('后端未连接，全量证据索引暂不可用。');
        return;
      }
      setSurfacePackIndexLoading(true);
      setSurfacePackIndexError('');
      fetchSurfaceEvidencePackIndex()
        .then((data) => {
          if (!ignore) setSurfacePackIndex(data);
        })
        .catch(() => {
          if (ignore) return;
          setSurfacePackIndex(null);
          setSurfacePackIndexError('全量证据索引暂时不可用，请确认后端服务已启动。');
        })
        .finally(() => {
          if (!ignore) setSurfacePackIndexLoading(false);
        });
    });
    return () => {
      ignore = true;
    };
  }, [apiAvailable]);

  const handleExportAllSurfacePacks = async () => {
    setAllPackExporting(true);
    setAllPackExportError('');
    try {
      const result = await writeAllSurfaceEvidencePacks();
      setAllPackExportResult(result);
      fetchSurfaceEvidencePackIndex()
        .then(setSurfacePackIndex)
        .catch(() => undefined);
    } catch {
      setAllPackExportError('全部证据包导出失败，请确认后端服务已启动。');
    } finally {
      setAllPackExporting(false);
    }
  };

  return (
    <div className="zh-page-stack">
      <UiTabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: '核心大盘',
            children: (
              <DashboardOverviewTab
                overview={overview}
                running={running}
                priorityScenario={priorityScenario}
                maxRiskScore={maxRiskScore}
                latestAlert={latestAlert}
                completeSurfaceCount={completeSurfaceCount}
                totalSamples={totalSamples}
                totalScripts={totalScripts}
                highRiskSurfaceCount={highRiskSurfaceCount}
                pipelineNodes={pipelineNodes}
                onSelectScenario={onSelectScenario}
                onOpenPage={onOpenPage}
                onBatchCompare={onBatchCompare}
              />
            )
          },
          {
            key: 'surfaces',
            label: '攻击面工作台',
            children: (
              <DashboardSurfacesTab
                surfaceQuery={surfaceQuery}
                setSurfaceQuery={setSurfaceQuery}
                riskFilter={riskFilter}
                setRiskFilter={setRiskFilter}
                filteredSurfaces={filteredSurfaces}
                scenarioCountBySurface={scenarioCountBySurface}
                selectedSurface={selectedSurface}
                selectedSurfaceScenarios={selectedSurfaceScenarios}
                surfacePack={surfacePack}
                surfacePackLoading={surfacePackLoading}
                surfacePackError={surfacePackError}
                running={running}
                setSelectedSurfaceId={setSelectedSurfaceId}
                onSelectScenario={onSelectScenario}
                onBatchCompare={onBatchCompare}
              />
            )
          },
          {
            key: 'evidence',
            label: '答辩证据包',
            children: (
              <DashboardEvidenceTab
                allPackExportResult={allPackExportResult}
                allPackExportError={allPackExportError}
                allPackExporting={allPackExporting}
                handleExportAllSurfacePacks={handleExportAllSurfacePacks}
                surfacePackIndex={surfacePackIndex}
                surfacePackIndexLoading={surfacePackIndexLoading}
                surfacePackIndexError={surfacePackIndexError}
                selectedSurface={selectedSurface}
                setRiskFilter={setRiskFilter}
                setSurfaceQuery={setSurfaceQuery}
                setSelectedSurfaceId={setSelectedSurfaceId}
              />
            )
          }
        ]}
      />
    </div>
  );
}
