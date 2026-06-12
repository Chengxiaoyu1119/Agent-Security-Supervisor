import { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme as antdTheme, Layout, Menu, Button as AntButton, Typography, Space, Alert, Spin, Drawer } from 'antd';
const { Sider, Header, Content } = Layout;
const { darkAlgorithm, defaultAlgorithm } = antdTheme;

import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  ClipboardList,
  CheckCircle2,
  FileWarning,
  FlaskConical,
  GitBranch,
  Play,
  ScrollText,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
  Copy,
  XCircle,
  Sun,
  Moon,
  Menu as MenuIcon
} from 'lucide-react';
import { batchCompareScenarios, compareAttackChain, compareScenario, createCleanSubmissionPackage, createSubmissionPackage, decideApprovalReview, evaluateSupervisorBatch, evaluateSupervisorEvent, fetchAlerts, fetchApprovalReviews, fetchAttackCaseDataset, fetchAttackChains, fetchAuditLogs, fetchCompetitionReadiness, fetchDemoDrill, fetchOpenClawIntegrationBundle, fetchOverview, fetchPolicies, fetchReport, fetchScenarios, fetchSurfaceEvidencePack, fetchSurfaceEvidencePackIndex, runAttackChain, runDemoDrill, runExternalAgentDemo, runScenario, verifyRunAuditHash, writeAllSurfaceEvidencePacks, writeCompetitionReadiness, writeOpenClawPluginPackage, writeOpenClawPluginValidation } from './api';
import { AgentChain } from './components/agent/AgentChain';
import { ExperimentLab } from './components/lab/ExperimentLab';
import { PolicyCenter } from './components/policy/PolicyCenter';
import { ScenarioLibrary } from './components/scenarios/ScenarioLibrary';
import { SurfaceEvidenceIndexBoard } from './components/surface/SurfaceEvidenceIndexBoard';
import { SurfaceResearchMatrix } from './components/surface/SurfaceResearchMatrix';
import { SurfaceCard, SurfaceWorkbench } from './components/surface/SurfaceWorkbench';
import { DecisionPill, MetricCard as Metric, UiButton } from './components/ui';
import type { AlertItem, AnomalyCalibration, ApprovalReview, ApprovalReviewList, AttackCaseDataset, AttackChain, AttackChainCompareResult, AttackChainRunResult, AttackEffectivenessCase, AttackSurface, AuditHashVerification, AuditLog, BatchCompareResult, CompareResult, CompetitionReadiness, CompetitionReadinessWriteResult, DemoDrillResult, ExternalAgentDemoResult, OpenClawIntegrationBundle, OpenClawPluginPackageResult, OpenClawPluginValidationWriteResult, Overview, Policy, ProjectRoadmap, ReportData, RunResult, Scenario, SubmissionPackageResult, SupervisorBatchEvaluation, SupervisorEvaluation, SurfaceEvidencePack, SurfaceEvidencePackIndex, SurfaceEvidencePackWriteResult } from './types';

type PageKey = 'dashboard' | 'scenarios' | 'lab' | 'chain' | 'audit' | 'policy' | 'alerts' | 'report' | 'settings';

const navItems: Array<{ key: PageKey; label: string; icon: JSX.Element }> = [
  { key: 'dashboard', label: '攻击面研究台', icon: <FlaskConical size={18} /> },
  { key: 'scenarios', label: '攻击剧本库', icon: <ClipboardList size={18} /> },
  { key: 'lab', label: '攻击复现实验室', icon: <Play size={18} /> },
  { key: 'chain', label: '多Agent攻击链', icon: <GitBranch size={18} /> },
  { key: 'audit', label: '行为监督记录', icon: <ScrollText size={18} /> },
  { key: 'policy', label: '防御策略中心', icon: <ShieldCheck size={18} /> },
  { key: 'alerts', label: '告警与阻断', icon: <ShieldAlert size={18} /> },
  { key: 'report', label: '评测报告', icon: <FileWarning size={18} /> },
  { key: 'settings', label: '模型与设置', icon: <Settings2 size={18} /> }
];

const riskLabel: Record<string, string> = {
  critical: '极高',
  high: '高',
  medium: '中',
  low: '低'
};

async function writeClipboardText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to a temporary textarea below.
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function createFallbackReport(): ReportData {
  return {
    markdown: '# 智安哨初赛报告素材\n\n后端未启动，暂无可导出的实验日志。',
    summary: {
      generated_at: new Date().toISOString(),
      surface_count: 0,
      scenario_count: 0,
      run_count: 0,
      guarded_run_count: 0,
      attack_success_rate: 0,
      control_rate: 0,
      avg_latency_ms: 0,
      enabled_policy_count: 0,
      policy_count: 0,
      benign_sample_count: 0,
      false_positive_count: 0,
      false_positive_rate: 0,
      expected_match_rate: 0,
      surface_conclusion_count: 0,
      output_filter_case_count: 0,
      output_filter_block_rate: 0,
      attack_reproduced_rate: 0,
      defense_effective_rate: 0,
      evidence_complete_rate: 0,
      policy_ablation_control_drop: 0,
      policy_ablation_risk_exposed_count: 0,
      anomaly_recommended_threshold: 0,
      anomaly_attack_recall_rate: 0,
      anomaly_false_alarm_rate: 0
    },
    surface_coverage: [],
    scenario_matrix: [],
    deliverables: [],
    policy_hits: [],
    decision_counts: [],
    benign_evaluation: {
      generated_at: new Date().toISOString(),
      filter: { category: null, guard_enabled: true },
      summary: {
        case_count: 0,
        category_count: 0,
        tool_count: 0,
        expected_allow_count: 0,
        expected_control_count: 0,
        allowed_count: 0,
        controlled_count: 0,
        false_positive_count: 0,
        false_positive_rate: 0,
        expected_match_count: 0,
        expected_match_rate: 0,
        avg_latency_ms: 0,
        max_risk_score: 0,
        max_anomaly_score: 0,
        category_distribution: {},
        tool_distribution: {}
      },
      cases: []
    },
    benign_workflow_evaluation: {
      generated_at: new Date().toISOString(),
      filter: { guard_enabled: true },
      summary: {
        workflow_count: 0,
        passed_workflow_count: 0,
        workflow_pass_rate: 0,
        step_count: 0,
        expected_allow_step_count: 0,
        expected_control_step_count: 0,
        allowed_step_count: 0,
        controlled_step_count: 0,
        executed_step_count: 0,
        false_positive_count: 0,
        false_positive_rate: 0,
        expected_match_count: 0,
        expected_match_rate: 0,
        tool_count: 0,
        tool_distribution: {},
        decision_distribution: {},
        audit_chain_valid_count: 0
      },
      workflows: []
    },
    surface_conclusions: {
      generated_at: new Date().toISOString(),
      summary: {
        surface_count: 0,
        conclusion_count: 0,
        with_run_evidence_count: 0,
        scenario_count: 0,
        tool_count: 0
      },
      conclusions: []
    },
    output_filter_evidence: {
      generated_at: new Date().toISOString(),
      summary: {
        case_count: 0,
        blocked_count: 0,
        block_rate: 0,
        policy_distribution: {}
      },
      cases: []
    },
    attack_effectiveness: {
      generated_at: new Date().toISOString(),
      summary: {
        scenario_count: 0,
        surface_count: 0,
        attack_reproduced_count: 0,
        attack_reproduced_rate: 0,
        defense_effective_count: 0,
        defense_effective_rate: 0,
        expected_match_count: 0,
        expected_match_rate: 0,
        evidence_complete_count: 0,
        evidence_complete_rate: 0,
        controlled_surface_distribution: {}
      },
      cases: [],
      requirement_alignment: []
    },
    policy_ablation: {
      generated_at: new Date().toISOString(),
      summary: {
        experiment_count: 0,
        scenario_count: 0,
        baseline_control_rate: 0,
        ablated_control_rate: 0,
        control_drop: 0,
        risk_exposed_count: 0,
        fallback_control_count: 0,
        primary_hit_count: 0
      },
      experiments: []
    },
    anomaly_calibration: {
      generated_at: new Date().toISOString(),
      objective: '等待后端生成异常检测阈值校准数据。',
      method: {
        attack_source: '',
        benign_source: '',
        score_range: '',
        selection_rule: '',
        important_note: ''
      },
      summary: {
        recommended_threshold: 0,
        max_false_alarm_rate: 0,
        attack_sample_count: 0,
        benign_sample_count: 0,
        benign_allowed_sample_count: 0,
        attack_detected_count: 0,
        attack_missed_count: 0,
        attack_recall_rate: 0,
        benign_false_alarm_count: 0,
        benign_false_alarm_rate: 0,
        policy_controlled_missed_count: 0,
        policy_controlled_missed_rate: 0,
        attack_score_median: 0,
        benign_score_median: 0,
        attack_score_range: { min: 0, max: 0 },
        benign_score_range: { min: 0, max: 0 }
      },
      threshold_curve: [],
      selected_confusion_matrix: {
        threshold: 0,
        true_positive_attack: 0,
        false_negative_attack: 0,
        false_positive_benign: 0,
        true_negative_benign: 0
      },
      missed_attack_review: [],
      benign_false_alarm_review: [],
      conclusion: ''
    },
    project_roadmap: {
      generated_at: new Date().toISOString(),
      direction: {
        verdict: '等待后端生成项目成熟度判断',
        score: 0,
        reason: '后端未启动，暂无路线图数据。',
        competition_fit: 0
      },
      summary: {
        overall_score: 0,
        dimension_count: 0,
        completed_count: 0,
        partial_count: 0,
        high_priority_gap_count: 0,
        p0_backlog_count: 0,
        surface_count: 0,
        scenario_count: 0,
        run_count: 0,
        evidence_gap_count: 0
      },
      dimensions: [],
      feature_backlog: [],
      next_sprint: [],
      risk_register: []
    },
    runs: []
  };
}

import { Dashboard } from './pages/Dashboard';
import { AuditLogPanel } from './pages/AuditLogPanel';
import { AlertsPanel } from './pages/AlertsPanel';
import { ReportPanel } from './pages/ReportPanel';
import { SettingsPanel } from './pages/SettingsPanel';
export default function App() {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('TOOL-HIJACK-001');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchCompareResult | null>(null);
  const [attackChains, setAttackChains] = useState<AttackChain[]>([]);
  const [selectedAttackChain, setSelectedAttackChain] = useState('multi-surface-exfiltration-chain');
  const [attackChainResult, setAttackChainResult] = useState<AttackChainRunResult | null>(null);
  const [attackChainCompareResult, setAttackChainCompareResult] = useState<AttackChainCompareResult | null>(null);
  const [running, setRunning] = useState(false);
  const [guardEnabled, setGuardEnabled] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [apiNotice, setApiNotice] = useState('');
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  async function refresh() {
    const data = await fetchOverview();
    setOverview(data);
    setScenarios(data.scenarios);
    setAuditLogs(data.audit_logs);
    setAlerts(data.alerts);
    setPolicies(await fetchPolicies());
    if (!data.recent_runs.length) {
      setApiNotice('当前使用内置样本。启动 FastAPI 后可写入真实实验日志。');
    } else {
      setApiNotice('');
    }
  }

  useEffect(() => {
    refresh();
    fetchScenarios().then(setScenarios).catch(() => undefined);
    fetchAttackChains()
      .then((data) => {
        setAttackChains(data);
        if (data[0]?.id) {
          setSelectedAttackChain((current) => current || data[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenario) ?? scenarios[0],
    [scenarios, selectedScenario]
  );

  async function handleRun(compare = false) {
    if (!activeScenario) return;
    setRunning(true);
    setApiNotice('');
    try {
      if (compare) {
        const comparison = await compareScenario(activeScenario.id);
        setCompareResult(comparison);
        setBatchResult(null);
        setLastResult(comparison.with_guard);
        setGuardEnabled(true);
        setApiNotice(`对比完成：无防护攻击${comparison.without_guard.attack_success ? '成功' : '未成功'}，有防护结果为${comparison.with_guard.attack_success ? '仍成功' : '已控制'}。`);
      } else {
        const result = await runScenario(activeScenario.id, guardEnabled);
        setCompareResult(null);
        setBatchResult(null);
        setLastResult(result);
      }
      await refresh();
      setPage('lab');
    } catch (error) {
      setApiNotice(`后端未启动或运行失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRunning(false);
    }
  }

  async function handleBatchCompare(scenarioIds?: string[], label = '全部剧本') {
    setRunning(true);
    setApiNotice('');
    try {
      const ids = scenarioIds?.length ? scenarioIds : scenarios.map((scenario) => scenario.id);
      const result = await batchCompareScenarios(ids);
      setBatchResult(result);
      const lastComparison = result.comparisons[result.comparisons.length - 1];
      setCompareResult(lastComparison ?? null);
      setLastResult(lastComparison?.with_guard ?? null);
      if (ids[0]) {
        setSelectedScenario(ids[0]);
      }
      setGuardEnabled(true);
      setApiNotice(`批量对比完成：${label} ${result.summary.total} 个剧本，无防护暴露 ${result.summary.exposed_without_guard} 个，有防护控制 ${result.summary.controlled_with_guard} 个。`);
      await refresh();
      if (page === 'report') {
        await loadReport();
      }
      setPage('lab');
    } catch (error) {
      setApiNotice(`批量运行失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRunning(false);
    }
  }

  async function handleAttackChain(compare = false) {
    const chainId = selectedAttackChain || attackChains[0]?.id;
    if (!chainId) return;
    setRunning(true);
    setApiNotice('');
    try {
      if (compare) {
        const result = await compareAttackChain(chainId);
        const lastComparison = result.comparisons[result.comparisons.length - 1];
        setAttackChainCompareResult(result);
        setAttackChainResult(null);
        setLastResult(lastComparison?.with_guard.run ?? null);
        setApiNotice(`组合链对比完成：无防护暴露 ${result.summary.without_guard_attack_success_count} 步，有防护控制率 ${result.summary.control_rate}%。`);
      } else {
        const result = await runAttackChain(chainId, true);
        const lastStage = result.stages[result.stages.length - 1];
        setAttackChainResult(result);
        setAttackChainCompareResult(null);
        setLastResult(lastStage?.run ?? null);
        setApiNotice(`组合链运行完成：${result.summary.stage_count} 步，控制率 ${result.summary.control_rate}%，平均延迟 ${result.summary.avg_latency_ms}ms。`);
      }
      await refresh();
      setPage('chain');
    } catch (error) {
      setApiNotice(`组合攻击链运行失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRunning(false);
    }
  }

  async function loadReport() {
    try {
      const data = await fetchReport();
      setReport(data);
    } catch {
      setReport(createFallbackReport());
    }
  }

  async function loadAuditLogs() {
    const logs = await fetchAuditLogs(100);
    setAuditLogs(logs);
  }

  async function loadAlerts() {
    const data = await fetchAlerts(100);
    setAlerts(data);
  }

  useEffect(() => {
    if (page === 'report') {
      loadReport();
    }
    if (page === 'audit') {
      loadAuditLogs();
    }
    if (page === 'alerts') {
      loadAlerts();
    }
  }, [page]);

  if (!overview) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--ant-color-bg-layout, #f5f7fa)' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ant-color-bg-container, #fff)', padding: '16px 24px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', gap: 16 }}>
          <img src="/favicon.svg" alt="logo" style={{ width: 32, height: 32 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ant-color-text, #000)' }}>智安哨</div>
            <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary, #888)' }}>正在加载工作台...</div>
          </div>
          <div style={{ marginLeft: 24 }}>
            <Spin size="small" />
          </div>
        </div>
      </div>
    );
  }

  return (
    // @ts-ignore
    <ConfigProvider theme={{ cssVar: true, hashed: false, algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm }}>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Sider
          breakpoint="lg"
          collapsedWidth="0"
          width={280}
          theme="light"
          style={{ 
            height: '100vh', 
            background: 'var(--ant-color-bg-container)',
            borderRight: theme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
            zIndex: 100
          }}
          className="desktop-sider"
        >
          <div style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: theme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0' }}>
            <img src="/favicon.svg" alt="logo" style={{ width: 32, height: 32 }} />
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>智安哨</Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>LLM Agent Attack Lab</Typography.Text>
            </div>
          </div>
          <Menu
            mode="inline"
            theme="light"
            selectedKeys={[page]}
            style={{ borderRight: 0, padding: '16px 8px', background: 'transparent' }}
            items={navItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: () => { setPage(item.key); setDrawerVisible(false); }
            }))}
          />
        </Sider>
        
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/favicon.svg" alt="logo" style={{ width: 24, height: 24 }} />
              <Typography.Title level={5} style={{ margin: 0 }}>智安哨</Typography.Title>
            </div>
          }
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          styles={{ body: { padding: 0 } }}
          size="default"
        >
          <Menu
            mode="inline"
            theme="light"
            selectedKeys={[page]}
            style={{ borderRight: 0, padding: '16px 8px', background: 'transparent' }}
            items={navItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: () => { setPage(item.key); setDrawerVisible(false); }
            }))}
          />
        </Drawer>
        
        <Layout style={{ height: '100vh' }}>
          <Header style={{ 
            padding: '0 24px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: theme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0',
            background: theme === 'dark' ? '#141414' : '#fff',
            zIndex: 1,
            width: '100%'
          }}>
            <Space>
              <AntButton type="text" icon={<MenuIcon size={20} />} onClick={() => setDrawerVisible(true)} className="mobile-menu-btn" />
              <Typography.Title level={3} style={{ margin: 0, fontSize: '18px' }}>
                {navItems.find((item) => item.key === page)?.label}
              </Typography.Title>
            </Space>
            <Space>
              <AntButton type="text" icon={theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                <span className="hide-on-mobile">{theme === 'light' ? '深色模式' : '浅色模式'}</span>
              </AntButton>
              <AntButton icon={<Activity size={16} />} onClick={() => refresh()}><span className="hide-on-mobile">刷新数据</span></AntButton>
              <AntButton type="primary" icon={<Play size={16} />} onClick={() => setPage('lab')}><span className="hide-on-mobile">运行剧本</span></AntButton>
            </Space>
          </Header>
          
          <Content className="main-content" style={{ margin: 0, overflowY: 'auto', background: 'var(--ant-color-bg-layout)' }}>
            {apiNotice && <Alert title={apiNotice} type="warning" showIcon style={{ marginBottom: 24 }} />}

            {page === 'dashboard' && (
              <Dashboard
                overview={overview}
                running={running}
                onSelectScenario={(id) => { setSelectedScenario(id); setPage('lab'); }}
                onBatchCompare={(ids, label) => handleBatchCompare(ids, label)}
              />
            )}
            {page === 'scenarios' && (
              <ScenarioLibrary
                scenarios={scenarios}
                selected={selectedScenario}
                onSelect={setSelectedScenario}
                onOpenLab={() => setPage('lab')}
              />
            )}
            {page === 'lab' && activeScenario && (
              <ExperimentLab
                scenario={activeScenario}
                scenarios={scenarios}
                selected={selectedScenario}
                setSelected={setSelectedScenario}
                guardEnabled={guardEnabled}
                setGuardEnabled={setGuardEnabled}
                running={running}
                run={() => handleRun(false)}
                compare={() => handleRun(true)}
                batchCompare={() => handleBatchCompare()}
                result={lastResult}
                compareResult={compareResult}
                batchResult={batchResult}
              />
            )}
            {page === 'chain' && (
              <AgentChain
                result={lastResult}
                runs={overview.recent_runs}
                chains={attackChains}
                selectedChainId={selectedAttackChain}
                onSelectChain={setSelectedAttackChain}
                chainResult={attackChainResult}
                chainCompareResult={attackChainCompareResult}
                chainRunning={running}
                onRunChain={() => handleAttackChain(false)}
                onCompareChain={() => handleAttackChain(true)}
              />
            )}
            {page === 'audit' && <AuditLogPanel logs={lastResult?.audit_logs?.length ? lastResult.audit_logs : auditLogs.length ? auditLogs : overview.audit_logs} refresh={loadAuditLogs} />}
            {page === 'policy' && <PolicyCenter policies={policies} setPolicies={setPolicies} />}
            {page === 'alerts' && <AlertsPanel alerts={lastResult?.alerts?.length ? lastResult.alerts : alerts.length ? alerts : overview.alerts} refresh={loadAlerts} />}
            {page === 'report' && (
              <ReportPanel
                report={report}
                onOpenScenario={(id) => {
                  setSelectedScenario(id);
                  setPage('lab');
                }}
              />
            )}
            {page === 'settings' && <SettingsPanel overview={overview} refresh={refresh} />}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

