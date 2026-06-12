import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Typography, Space, Flex, Button, Statistic, Input, Select, Alert, Tabs, Divider } from 'antd';
import { Activity, AlertTriangle, Play, TerminalSquare, ClipboardList, Settings2, FileWarning, ShieldCheck, ShieldAlert, ScrollText, GitBranch, FlaskConical, CheckCircle2, Copy, XCircle, ArrowRight } from 'lucide-react';
import { UiButton, MetricCard as Metric, DecisionPill } from '../components/ui';
import { fetchOverview, fetchScenarios, fetchStudentCompetitionAttackMap, fetchPolicies, fetchAuditLogs, verifyRunAuditHash, fetchAlerts, fetchApprovalReviews, decideApprovalReview, updatePolicyEnabled, runScenario, compareScenario, batchCompareScenarios, fetchAttackChains, runAttackChain, compareAttackChain, fetchReport, fetchAttackCaseDataset, fetchSurfaceEvidencePack, fetchSurfaceEvidencePackIndex, writeAllSurfaceEvidencePacks, fetchOpenClawIntegrationBundle, writeOpenClawPluginPackage, writeOpenClawPluginValidation, fetchCompetitionReadiness, writeCompetitionReadiness, fetchDemoDrill, runDemoDrill, runExternalAgentDemo, createSubmissionPackage, createCleanSubmissionPackage, evaluateSupervisorEvent, evaluateSupervisorBatch } from '../api';
import type { RiskLevel, GuardDecision, AttackSurface, StudentCompetitionAttackProfile, Scenario, ModelStatus, Policy, AlertItem, AuditLog, AuditHashVerification, AgentTrace, RunResult, CompareResult, BatchCompareResult, AttackChainStage, AttackChain, AttackChainStageRun, AttackChainRunResult, AttackChainCompareResult, ReportSummary, ReportSurfaceCoverage, ReportScenarioMatrix, ReportDeliverable, ReportCounterItem, BenignEvaluationCase, BenignEvaluation, BenignWorkflowStep, BenignWorkflow, BenignWorkflowEvaluation, SurfaceConclusion, SurfaceConclusionReport, OutputFilterCase, OutputFilterEvidence, AttackEffectivenessCase, RequirementAlignmentItem, AttackEffectiveness, PolicyAblationCase, PolicyAblationExperiment, PolicyAblation, ProjectRoadmapBacklogItem, ProjectRoadmap, AnomalyCalibration, CompetitionPackageFile, CompetitionChecklistItem, CompetitionPackage, SubmissionPackageResult, ApprovalStatus, ApprovalReview, ApprovalReviewList, ApprovalDecisionResult, SupervisorEvaluation, SupervisorBatchEvaluation, ExternalAgentDemoRecord, ExternalAgentDemoResult, OpenClawIntegrationBundle, OpenClawCommandCheck, OpenClawPluginPackageResult, OpenClawPluginValidation, OpenClawPluginValidationWriteResult, CompetitionReadinessCheck, CompetitionReadiness, CompetitionReadinessWriteResult, DemoDrillStage, DemoDrillResult, AttackCaseDataset, SurfaceEvidencePack, SurfaceEvidencePackWriteResult, SurfaceEvidencePackIndex, ReportData, Overview } from '../types';
import { riskLabel, writeClipboardText, externalEventSample, externalBatchEventSample, competitionCapabilityRows } from '../utils';
import { SurfaceCard, SurfaceWorkbench } from '../components/surface/SurfaceWorkbench';
import { SurfaceResearchMatrix } from '../components/surface/SurfaceResearchMatrix';
import { SurfaceEvidenceIndexBoard } from '../components/surface/SurfaceEvidenceIndexBoard';

const AgentNode = ({ icon, title, desc, active, activeTone = 'primary' }: any) => (
  <div style={{ 
    background: active ? `var(--ant-color-${activeTone}-bg)` : 'var(--ant-color-bg-container)', 
    border: `1px solid ${active ? `var(--ant-color-${activeTone})` : 'var(--ant-color-border)'}`,
    padding: '16px 12px',
    borderRadius: 8,
    textAlign: 'center',
    width: 120,
    boxShadow: active ? `0 0 8px var(--ant-color-${activeTone}-bg)` : '0 2px 4px rgba(0,0,0,0.02)',
    transition: 'all 0.3s'
  }}>
    <div style={{ color: active ? `var(--ant-color-${activeTone})` : 'var(--ant-color-text-secondary)', marginBottom: 12 }}>{icon}</div>
    <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>{title}</Typography.Text>
    <Typography.Text type="secondary" style={{ fontSize: 11 }}>{desc}</Typography.Text>
  </div>
);


export function Dashboard({
  overview,
  running,
  onSelectScenario,
  onBatchCompare
}: {
  overview: Overview;
  running: boolean;
  onSelectScenario: (id: string) => void;
  onBatchCompare: (ids: string[], label: string) => void;
}) {
  const firstSurfaceId = overview.attack_surfaces[0]?.id ?? '';
  const [selectedSurfaceId, setSelectedSurfaceId] = useState(firstSurfaceId);
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
      ].join(' ').toLowerCase();
      return (!keyword || text.includes(keyword)) && (riskFilter === '全部' || surface.risk === riskFilter);
    });
  }, [overview.attack_surfaces, riskFilter, surfaceQuery]);
  const selectedSurface = filteredSurfaces.find((surface) => surface.id === selectedSurfaceId) ?? filteredSurfaces[0] ?? overview.attack_surfaces[0];
  const selectedSurfaceScenarios = useMemo(
    () => selectedSurface ? overview.scenarios.filter((scenario) => scenario.surface_id === selectedSurface.id) : [],
    [overview.scenarios, selectedSurface?.id]
  );
  const totalSamples = overview.attack_surfaces.reduce((sum, surface) => sum + surface.samples, 0);
  const totalScripts = overview.attack_surfaces.reduce((sum, surface) => sum + surface.scripts, 0);
  const highRiskSurfaceCount = overview.attack_surfaces.filter((surface) => ['critical', 'high'].includes(surface.risk)).length;
  const completeSurfaceCount = overview.attack_surfaces.filter((surface) =>
    surface.entry_points?.length &&
    surface.protected_assets?.length &&
    surface.detection_signals?.length &&
    surface.evaluation_focus?.length
  ).length;
  const demoReadyRate = Math.round((completeSurfaceCount / Math.max(1, overview.summary.surface_count)) * 100);
  const controlledLogs = overview.audit_logs.filter((log) => ['拒绝', '询问', '隔离'].includes(log.decision)).length;
  const maxRiskScore = Math.max(
    0,
    ...overview.audit_logs.map((log) => log.risk_score ?? 0),
    ...overview.alerts.map((alert) => alert.risk_score ?? 0)
  );
  const latestAlert = overview.alerts[0];
  const priorityScenario = overview.scenarios.find((scenario) => scenario.severity === 'critical') ?? overview.scenarios[0];
  const pipelineNodes = [
    { label: '输入样本', value: `${totalSamples}` },
    { label: 'Agent 规划', value: `${overview.summary.scenario_count}` },
    { label: '工具调用', value: `${overview.audit_logs.length}` },
    { label: '监督判定', value: `${controlledLogs}` },
    { label: '告警留痕', value: `${overview.alerts.length}` }
  ];

  useEffect(() => {
    const firstVisibleId = filteredSurfaces[0]?.id ?? firstSurfaceId;
    if (!selectedSurfaceId && firstVisibleId) {
      setSelectedSurfaceId(firstVisibleId);
    }
    if (selectedSurfaceId && !filteredSurfaces.some((surface) => surface.id === selectedSurfaceId)) {
      setSelectedSurfaceId(firstVisibleId);
    }
  }, [filteredSurfaces, firstSurfaceId, selectedSurfaceId]);

  useEffect(() => {
    if (!selectedSurface?.id) {
      setSurfacePack(null);
      return;
    }
    let ignore = false;
    setSurfacePackLoading(true);
    setSurfacePackError('');
    fetchSurfaceEvidencePack(selectedSurface.id)
      .then((data) => {
        if (!ignore) setSurfacePack(data);
      })
      .catch(() => {
        if (!ignore) {
          setSurfacePack(null);
          setSurfacePackError('证据包接口暂时不可用，请确认后端服务已启动。');
        }
      })
      .finally(() => {
        if (!ignore) setSurfacePackLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [selectedSurface?.id]);

  useEffect(() => {
    let ignore = false;
    setSurfacePackIndexLoading(true);
    setSurfacePackIndexError('');
    fetchSurfaceEvidencePackIndex()
      .then((data) => {
        if (!ignore) setSurfacePackIndex(data);
      })
      .catch(() => {
        if (!ignore) {
          setSurfacePackIndex(null);
          setSurfacePackIndexError('全量证据索引暂时不可用，请确认后端服务已启动。');
        }
      })
      .finally(() => {
        if (!ignore) setSurfacePackIndexLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleExportAllSurfacePacks = async () => {
    setAllPackExporting(true);
    setAllPackExportError('');
    try {
      const result = await writeAllSurfaceEvidencePacks();
      setAllPackExportResult(result);
      fetchSurfaceEvidencePackIndex().then(setSurfacePackIndex).catch(() => undefined);
    } catch {
      setAllPackExportError('全部证据包导出失败，请确认后端服务已启动。');
    } finally {
      setAllPackExporting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Tabs defaultActiveKey="overview" items={[
        {
          key: 'overview',
          label: '核心大盘',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Card variant="borderless" styles={{ body: { padding: 32  }}}>
                    <Flex justify="space-between" align="center" wrap="wrap" gap={24}>
                      <div style={{ flex: 1, minWidth: 300 }}>
                        <Typography.Text type="secondary">命题挑战赛 · 大模型应用安全监督原型</Typography.Text>
                        <Typography.Title level={2} style={{ marginTop: 8, marginBottom: 16 }}>智能体工具调用实时审计与阻断台</Typography.Title>
                        <Typography.Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 600 }}>
                          以红队攻击样本驱动监督策略，对邮件、文件、API、代码执行和外部 Agent 事件进行风险评分、策略判定、沙箱执行和告警留痕。
                        </Typography.Paragraph>
                        <Space>
                          <Button
                            type="primary"
                            size="large"
                            icon={<Play size={16} />}
                            onClick={() => onBatchCompare(overview.scenarios.map((scenario) => scenario.id), '全部攻击剧本')}
                            disabled={running || !overview.scenarios.length}
                          >
                            {running ? '验证中...' : '一键验证全部剧本'}
                          </Button>
                          <Button
                            size="large"
                            icon={<TerminalSquare size={16} />}
                            onClick={() => priorityScenario && onSelectScenario(priorityScenario.id)}
                            disabled={!priorityScenario}
                          >
                            打开高风险剧本
                          </Button>
                        </Space>
                      </div>
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', width: '100%' }}>
                        <Card variant="borderless" style={{ background: 'var(--ant-color-error-bg)', minWidth: 160, flex: 1 }}>
                          <Typography.Text type="secondary">最高风险分</Typography.Text>
                          <Typography.Title level={1} style={{ margin: 0, color: 'var(--ant-color-error)' }}>{maxRiskScore}</Typography.Title>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{latestAlert ? latestAlert.title : '等待攻击演示'}</Typography.Text>
                        </Card>
                        <Card variant="borderless" style={{ background: 'var(--ant-color-success-bg)', minWidth: 160, flex: 1 }}>
                          <Typography.Text type="secondary">防护控制率</Typography.Text>
                          <Typography.Title level={1} style={{ margin: 0, color: 'var(--ant-color-success)' }}>{overview.summary.block_rate}%</Typography.Title>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>拒绝、询问均计入控制</Typography.Text>
                        </Card>
                      </div>
                    </Flex>
                  </Card>
                </Col>
              </Row>

              <Card variant="borderless">
                <Row gutter={[16, 16]} align="middle" justify="start">
                  {pipelineNodes.map((node, index) => (
                    <Col xs={12} sm={8} md={4} key={node.label}>
                      <Statistic title={<span><span style={{color: 'var(--ant-color-primary)', marginRight: 8}}>{String(index + 1).padStart(2, '0')}</span>{node.label}</span>} value={node.value} />
                    </Col>
                  ))}
                </Row>
              </Card>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Metric label="攻击面完善度" value={`${completeSurfaceCount}/${overview.summary.surface_count}`} tone="cyan" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Metric label="攻击剧本" value={`${overview.summary.scenario_count}`} tone="amber" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Metric label="样本/脚本" value={`${totalSamples}/${totalScripts}`} tone="green" />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Metric label="高风险面" value={`${highRiskSurfaceCount}`} tone="red" />
                </Col>
              </Row>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={14}>
                  <Card 
                    title={<Space><GitBranch size={18} color="var(--ant-color-primary)" /><Typography.Text strong>多 Agent 红队链路架构</Typography.Text></Space>} 
                    variant="borderless" 
                    style={{ height: '100%' }}
                    extra={<Button type="link" onClick={() => onSelectScenario(priorityScenario?.id ?? '')}>查看剧本详情</Button>}
                  >
                    <div style={{ background: 'var(--ant-color-fill-quaternary)', padding: 24, borderRadius: 8 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>红队攻击方 (Red Team Agents)</Typography.Text>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                         <AgentNode icon={<GitBranch size={20} />} title="规划 Agent" desc="分解攻击剧本" />
                         <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                         <AgentNode icon={<FlaskConical size={20} />} title="样本生成" desc="构造对抗样本" />
                         <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                         <AgentNode icon={<TerminalSquare size={20} />} title="执行 Agent" desc="投递与漏洞利用" active />
                      </div>
                      <Divider dashed style={{ borderColor: 'var(--ant-color-error)', margin: '20px 0' }} titlePlacement="left" plain>
                        <Typography.Text type="danger" style={{ fontSize: 12 }}>攻击边界 (Attack Surface)</Typography.Text>
                      </Divider>
                      <Typography.Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>蓝队防御方 (Blue Team Environment)</Typography.Text>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                         <AgentNode icon={<Settings2 size={20} />} title="目标智能体" desc="受害应用/模型" />
                         <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                         <AgentNode icon={<ShieldCheck size={20} />} title="行为监督器" desc="实时旁路拦截" activeTone="success" />
                         <ArrowRight size={16} color="var(--ant-color-text-tertiary)" />
                         <AgentNode icon={<Activity size={20} />} title="沙箱与工具" desc="安全隔离执行" />
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={10}>
                  <Card 
                    title={<Space orientation="vertical" size={0}><Typography.Text strong>主演示攻击剧本</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{overview.scenarios.length} 个可运行</Typography.Text></Space>} 
                    variant="borderless" 
                    style={{ height: '100%' }}
                    styles={{ body: { padding: 0  }}}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {overview.scenarios.slice(0, 5).map(scenario => (
                        <div
                          key={scenario.id}
                          onClick={() => onSelectScenario(scenario.id)}
                          style={{ padding: '16px 24px', cursor: 'pointer', borderBottom: '1px solid var(--ant-color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div>
                            <div><Typography.Text strong>{scenario.title}</Typography.Text></div>
                            <div style={{ marginTop: 4 }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{scenario.id} · {scenario.target}</Typography.Text></div>
                          </div>
                          <div>
                            <Play size={16} color="var(--ant-color-primary)" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>

              <div>
                <SurfaceResearchMatrix surfaces={overview.attack_surfaces} profiles={overview.student_competition_attack_map} />
              </div>
            </div>
          )
        },
        {
          key: 'surfaces',
          label: '攻击面工作台',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
              <Card variant="borderless" styles={{ body: { padding: '16px 24px'  }}}>
                <Flex gap={16} wrap="wrap" align="center">
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
                    options={['全部', 'critical', 'high', 'medium', 'low'].map(risk => ({ label: risk === '全部' ? '全部风险' : riskLabel[risk], value: risk }))}
                  />
                  <div style={{ flex: 1 }} />
                  <Button
                    icon={<ClipboardList size={16} />}
                    onClick={() => selectedSurfaceScenarios.length && onBatchCompare(selectedSurfaceScenarios.map((scenario) => scenario.id), selectedSurface?.name ?? '当前攻击面')}
                    disabled={running || !selectedSurfaceScenarios.length}
                  >
                    {running ? '验证中...' : '验证当前面'}
                  </Button>
                </Flex>
              </Card>

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
                    {!filteredSurfaces.length && <Typography.Text type="secondary" style={{ textAlign: 'center', padding: 48 }}>没有匹配的攻击面。</Typography.Text>}
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
                    <Card variant="borderless"><div style={{ textAlign: 'center', padding: 48 }}><Typography.Text type="secondary">暂无攻击面数据。</Typography.Text></div></Card>
                  )}
                </Col>
              </Row>
            </div>
          )
        },
        {
          key: 'evidence',
          label: '答辩证据包',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
              <Card variant="borderless" styles={{ body: { padding: '16px 24px'  }}}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                  <Typography.Text strong>证据包管理与导出</Typography.Text>
                  <Button
                    icon={<ScrollText size={16} />}
                    onClick={handleExportAllSurfacePacks}
                    loading={allPackExporting}
                    type="primary"
                  >
                    生成并导出全部证据包
                  </Button>
                </Flex>
              </Card>

              {(allPackExportResult || allPackExportError) && (
                <Alert title={allPackExportError ? "导出失败" : "全部攻击面证据包已生成"}
                  description={allPackExportError || `${allPackExportResult?.surface_count} 类攻击面 / ${allPackExportResult?.file_count} 个文件 / 缺口 ${allPackExportResult?.summary.gap_count} 项。路径: ${allPackExportResult?.output_dir}`}
                  type={allPackExportError ? "error" : "success"}
                  showIcon
                />
              )}

              <SurfaceEvidenceIndexBoard
                index={surfacePackIndex}
                loading={surfacePackIndexLoading}
                error={surfacePackIndexError}
                selectedSurfaceId={selectedSurface?.id ?? ''}
                onSelectSurface={(id) => {
                  setRiskFilter('全部');
                  setSurfaceQuery('');
                  setSelectedSurfaceId(id);
                }}
              />
            </div>
          )
        }
      ]} />
    </div>
  );
}