import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlertTriangle, Play, TerminalSquare, ClipboardList, Settings2, FileWarning, ShieldCheck, ShieldAlert, ScrollText, GitBranch, FlaskConical, CheckCircle2, Copy, XCircle } from 'lucide-react';
import { UiButton, MetricCard as Metric, DecisionPill } from '../components/ui';
import { Card, Row, Col, Typography, Space, Button, Input, Select, Tag, Divider, Alert, Badge, Descriptions, Tabs, Steps, Flex } from 'antd';

import { fetchOverview, fetchScenarios, fetchStudentCompetitionAttackMap, fetchPolicies, fetchAuditLogs, verifyRunAuditHash, fetchAlerts, fetchApprovalReviews, decideApprovalReview, updatePolicyEnabled, runScenario, compareScenario, batchCompareScenarios, fetchAttackChains, runAttackChain, compareAttackChain, fetchReport, fetchAttackCaseDataset, fetchSurfaceEvidencePack, fetchSurfaceEvidencePackIndex, writeAllSurfaceEvidencePacks, fetchOpenClawIntegrationBundle, writeOpenClawPluginPackage, writeOpenClawPluginValidation, fetchCompetitionReadiness, writeCompetitionReadiness, fetchDemoDrill, runDemoDrill, runExternalAgentDemo, createSubmissionPackage, createCleanSubmissionPackage, evaluateSupervisorEvent, evaluateSupervisorBatch } from '../api';
import type { RiskLevel, GuardDecision, AttackSurface, StudentCompetitionAttackProfile, Scenario, ModelStatus, Policy, AlertItem, AuditLog, AuditHashVerification, AgentTrace, RunResult, CompareResult, BatchCompareResult, AttackChainStage, AttackChain, AttackChainStageRun, AttackChainRunResult, AttackChainCompareResult, ReportSummary, ReportSurfaceCoverage, ReportScenarioMatrix, ReportDeliverable, ReportCounterItem, BenignEvaluationCase, BenignEvaluation, BenignWorkflowStep, BenignWorkflow, BenignWorkflowEvaluation, SurfaceConclusion, SurfaceConclusionReport, OutputFilterCase, OutputFilterEvidence, AttackEffectivenessCase, RequirementAlignmentItem, AttackEffectiveness, PolicyAblationCase, PolicyAblationExperiment, PolicyAblation, ProjectRoadmapBacklogItem, ProjectRoadmap, AnomalyCalibration, CompetitionPackageFile, CompetitionChecklistItem, CompetitionPackage, SubmissionPackageResult, ApprovalStatus, ApprovalReview, ApprovalReviewList, ApprovalDecisionResult, SupervisorEvaluation, SupervisorBatchEvaluation, ExternalAgentDemoRecord, ExternalAgentDemoResult, OpenClawIntegrationBundle, OpenClawCommandCheck, OpenClawPluginPackageResult, OpenClawPluginValidation, OpenClawPluginValidationWriteResult, CompetitionReadinessCheck, CompetitionReadiness, CompetitionReadinessWriteResult, DemoDrillStage, DemoDrillResult, AttackCaseDataset, SurfaceEvidencePack, SurfaceEvidencePackWriteResult, SurfaceEvidencePackIndex, ReportData, Overview } from '../types';
import { riskLabel, writeClipboardText, externalEventSample, externalBatchEventSample, competitionCapabilityRows } from '../utils';
import { SurfaceCard, SurfaceWorkbench } from '../components/surface/SurfaceWorkbench';
import { SurfaceResearchMatrix } from '../components/surface/SurfaceResearchMatrix';
import { SurfaceEvidenceIndexBoard } from '../components/surface/SurfaceEvidenceIndexBoard';


export function SettingsPanel({ overview, refresh }: { overview: Overview; refresh: () => Promise<void> }) {
  const [eventJson, setEventJson] = useState(JSON.stringify(externalEventSample, null, 2));
  const [batchJson, setBatchJson] = useState(JSON.stringify(externalBatchEventSample, null, 2));
  const [evaluation, setEvaluation] = useState<SupervisorEvaluation | null>(null);
  const [batchEvaluation, setBatchEvaluation] = useState<SupervisorBatchEvaluation | null>(null);
  const [externalAgentDemo, setExternalAgentDemo] = useState<ExternalAgentDemoResult | null>(null);
  const [attackDataset, setAttackDataset] = useState<AttackCaseDataset | null>(null);
  const [integrationBundle, setIntegrationBundle] = useState<OpenClawIntegrationBundle | null>(null);
  const [demoDrill, setDemoDrill] = useState<DemoDrillResult | null>(null);
  const [openClawPluginPackage, setOpenClawPluginPackage] = useState<OpenClawPluginPackageResult | null>(null);
  const [openClawPluginValidation, setOpenClawPluginValidation] = useState<OpenClawPluginValidationWriteResult | null>(null);
  const [competitionReadiness, setCompetitionReadiness] = useState<CompetitionReadiness | null>(null);
  const [competitionReadinessOutput, setCompetitionReadinessOutput] = useState<CompetitionReadinessWriteResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [batchEvaluating, setBatchEvaluating] = useState(false);
  const [runningExternalAgentDemo, setRunningExternalAgentDemo] = useState(false);
  const [runningDemoDrill, setRunningDemoDrill] = useState(false);
  const [writingOpenClawPlugin, setWritingOpenClawPlugin] = useState(false);
  const [validatingOpenClawPlugin, setValidatingOpenClawPlugin] = useState(false);
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const [evaluateError, setEvaluateError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchAttackCaseDataset().then(setAttackDataset).catch(() => undefined),
      fetchOpenClawIntegrationBundle().then(setIntegrationBundle).catch(() => undefined),
      fetchDemoDrill().then(setDemoDrill).catch(() => undefined),
      fetchCompetitionReadiness().then(setCompetitionReadiness).catch(() => undefined)
    ]);
  }, []);

  async function handleEvaluateEvent() {
    setEvaluating(true);
    setEvaluateError('');
    try {
      const parsed = JSON.parse(eventJson) as Record<string, unknown>;
      const result = await evaluateSupervisorEvent(parsed);
      setEvaluation(result);
      await refresh();
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '事件 JSON 解析或监督接口调用失败');
    } finally {
      setEvaluating(false);
    }
  }

  async function handleBatchEvaluate() {
    setBatchEvaluating(true);
    setEvaluateError('');
    try {
      const parsed = JSON.parse(batchJson) as unknown;
      const events = Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { events?: unknown }).events)
          ? (parsed as { events: unknown[] }).events
          : null;
      if (!events) {
        throw new Error('批量事件必须是 JSON 数组，或形如 { "events": [...] } 的对象。');
      }
      const result = await evaluateSupervisorBatch(events as Record<string, unknown>[]);
      setBatchEvaluation(result);
      await refresh();
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '批量事件 JSON 解析或监督接口调用失败');
    } finally {
      setBatchEvaluating(false);
    }
  }

  async function handleRunExternalAgentDemo() {
    setRunningExternalAgentDemo(true);
    setEvaluateError('');
    try {
      const result = await runExternalAgentDemo();
      setExternalAgentDemo(result);
      await refresh();
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '外部 Agent 演示运行失败');
    } finally {
      setRunningExternalAgentDemo(false);
    }
  }

  async function handleRunDemoDrill() {
    setRunningDemoDrill(true);
    setEvaluateError('');
    try {
      const result = await runDemoDrill();
      setDemoDrill(result);
      await refresh();
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '答辩一键演示运行失败');
    } finally {
      setRunningDemoDrill(false);
    }
  }

  async function handleWriteOpenClawPlugin() {
    setWritingOpenClawPlugin(true);
    setEvaluateError('');
    try {
      const result = await writeOpenClawPluginPackage();
      setOpenClawPluginPackage(result);
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : 'OpenClaw 插件包生成失败');
    } finally {
      setWritingOpenClawPlugin(false);
    }
  }

  async function handleValidateOpenClawPlugin() {
    setValidatingOpenClawPlugin(true);
    setEvaluateError('');
    try {
      const result = await writeOpenClawPluginValidation();
      setOpenClawPluginValidation(result);
      setOpenClawPluginPackage(result.validation.package);
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : 'OpenClaw 插件包验收失败');
    } finally {
      setValidatingOpenClawPlugin(false);
    }
  }

  async function handleRunReadiness() {
    setCheckingReadiness(true);
    setEvaluateError('');
    try {
      const result = await writeCompetitionReadiness();
      setCompetitionReadinessOutput(result);
      setCompetitionReadiness(result.readiness);
    } catch (error) {
      setEvaluateError(error instanceof Error ? error.message : '赛前一键体检运行失败');
    } finally {
      setCheckingReadiness(false);
    }
  }

  function loadSingleExternalSample() {
    setEventJson(JSON.stringify(externalEventSample, null, 2));
    setEvaluation(null);
    setEvaluateError('');
  }

  function loadBatchExternalSample() {
    setBatchJson(JSON.stringify(externalBatchEventSample, null, 2));
    setBatchEvaluation(null);
    setEvaluateError('');
  }

  function clearExternalResults() {
    setEvaluation(null);
    setBatchEvaluation(null);
    setExternalAgentDemo(null);
    setOpenClawPluginPackage(null);
    setOpenClawPluginValidation(null);
    setCompetitionReadinessOutput(null);
    setEvaluateError('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Typography.Title level={2}>模型与系统设置</Typography.Title>
      <Tabs defaultActiveKey="1" size="large" items={[
        {
          key: '1',
          label: '🤖 基础配置与成果对齐',
          children: (
            <Space orientation="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
              <Row gutter={[16, 16]}>
        {overview.models.map((model) => (
          <Col xs={24} sm={12} md={8} lg={6} key={model.provider}>
            <Card type="inner" size="small" hoverable style={{ height: '100%' }}>
              <Typography.Text strong style={{ display: 'block' }}>{model.provider}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{model.model}</Typography.Text>
              <div style={{ marginBottom: 8 }}>
                <Tag variant="filled" color="processing" style={{ fontFamily: 'monospace', whiteSpace: 'normal', wordBreak: 'break-all', display: 'inline-block', padding: '2px 6px', lineHeight: 1.4 }}>{model.endpoint ?? model.mode}</Tag>
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{model.configured ? '已配置真实 API' : '未配置，使用模拟兜底'}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="赛题成果对齐" type="inner">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {competitionCapabilityRows.map((item, idx) => (
            <div key={idx} style={{ padding: '16px 0', borderBottom: idx === competitionCapabilityRows.length - 1 ? 'none' : '1px solid var(--ant-color-border-secondary)' }}>
              <div><Typography.Text strong>{item.requirement}</Typography.Text></div>
              <div style={{ marginTop: 8 }}>
                <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                  <Typography.Text type="secondary">{item.implementation}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{item.evidence}</Typography.Text>
                </Space>
              </div>
            </div>
          ))}
        </div>
      </Card>
            </Space>
          )
        },
        {
          key: '2',
          label: '🎯 演示体验与赛前体检',
          children: (
            <Space orientation="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
              <Card title="Judge Demo Mode (答辩一键演示)" extra={<Button type="primary" icon={<Play size={16} />} onClick={handleRunDemoDrill} loading={runningDemoDrill}>运行答辩演示</Button>} type="inner">
        <Typography.Paragraph type="secondary">一键跑完正常放行、外发复核、批量导出审批和记忆隔离，自动生成 audit_hash、review_hash 与报告文件。</Typography.Paragraph>
        {demoDrill && demoDrill.summary.stage_count > 0 ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={8} md={4}><Metric label="演示步骤" value={`${demoDrill.summary.stage_count}`} /></Col>
              <Col xs={12} sm={8} md={4}><Metric label="监督控制" value={`${demoDrill.summary.controlled_count}`} tone="green" /></Col>
              <Col xs={12} sm={8} md={4}><Metric label="人工批准" value={`${demoDrill.summary.approved_count}`} tone="cyan" /></Col>
              <Col xs={12} sm={8} md={4}><Metric label="人工驳回" value={`${demoDrill.summary.rejected_count}`} tone="red" /></Col>
              <Col xs={12} sm={8} md={4}><Metric label="审计 hash" value={`${demoDrill.summary.audit_hash_count}`} /></Col>
              <Col xs={12} sm={8} md={4}><Metric label="复核 hash" value={`${demoDrill.summary.review_hash_count}`} /></Col>
            </Row>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {demoDrill.stages.map((stage) => (
                <div key={stage.index} style={{ padding: '16px 0', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                  <Row style={{ width: '100%' }} align="middle" gutter={[16, 16]}>
                    <Col xs={4} md={2}><Typography.Text strong style={{ fontSize: 24, color: 'var(--ant-color-text-quaternary)' }}>{String(stage.index).padStart(2, '0')}</Typography.Text></Col>
                    <Col xs={20} md={8}>
                      <Typography.Text strong style={{ display: 'block' }}>{stage.title}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>{stage.objective}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{stage.reason}</Typography.Text>
                    </Col>
                    <Col xs={24} md={6}>
                      <Space orientation="vertical" size={2}>
                        <Tag variant="filled" style={{ margin: 0 }}>{stage.tool}</Tag>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>策略: {stage.policy_id}</Typography.Text>
                      </Space>
                    </Col>
                    <Col xs={12} md={4}>
                      <Space orientation="vertical" size={2}>
                        <DecisionPill decision={stage.decision} />
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>复核: {stage.approval_action_label}</Typography.Text>
                      </Space>
                    </Col>
                    <Col xs={12} md={4}>
                      <Space orientation="vertical" size={2}>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>audit: {stage.audit_hash?.slice(0, 14) ?? '-'}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>review: {stage.review_hash?.slice(0, 14) ?? '-'}</Typography.Text>
                      </Space>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
            <Space style={{ marginTop: 16 }} wrap>
              <Tag variant="filled" icon={<ScrollText size={14} />} style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{demoDrill.markdown_path}</Tag>
              <Tag variant="filled" icon={<TerminalSquare size={14} />} style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{demoDrill.json_path}</Tag>
            </Space>
          </>
        ) : (
          <Alert title="还没有运行答辩一键演示。点击按钮后会生成 4 步演示、审计证据和本地报告。" type="info" showIcon />
        )}
      </Card>

      <Card title="赛前一键体检" extra={<Button type="primary" icon={<ShieldCheck size={16} />} onClick={handleRunReadiness} loading={checkingReadiness}>运行体检并写报告</Button>} type="inner">
        <Typography.Paragraph type="secondary">自动检查攻击面、误报、连续流程、OpenClaw 插件、截图和提交包，直接给出可提交状态与 P0 补证项。</Typography.Paragraph>
        {competitionReadiness ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24, padding: 24, background: 'var(--ant-color-fill-tertiary)', borderRadius: 8 }}>
              <Col xs={12} md={6}>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>就绪分</Typography.Text>
                <Typography.Title level={2} style={{ margin: 0, color: 'var(--ant-color-primary)' }}>{competitionReadiness.readiness_score}%</Typography.Title>
              </Col>
              <Col xs={12} md={6}>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{competitionReadiness.status_label}</Typography.Text>
                <Typography.Text strong>{competitionReadiness.verdict}</Typography.Text>
              </Col>
              <Col xs={24} md={12}>
                <Space size="large" wrap>
                  <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>通过</Typography.Text><Typography.Text strong>{competitionReadiness.summary.passed_count}</Typography.Text></div>
                  <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>阻塞</Typography.Text><Typography.Text strong>{competitionReadiness.summary.blocker_count}</Typography.Text></div>
                  <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>截图</Typography.Text><Typography.Text strong>{competitionReadiness.summary.screenshot_count}</Typography.Text></div>
                  <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>提交包文件</Typography.Text><Typography.Text strong>{competitionReadiness.summary.latest_package_file_count}</Typography.Text></div>
                </Space>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              {competitionReadiness.checks.map((check, idx) => (
                <Col xs={24} lg={12} key={idx}>
                  <Card size="small" style={{ borderLeft: `3px solid var(--ant-color-${check.status === 'pass' ? 'success' : check.status === 'block' ? 'error' : 'warning'})` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{check.category} · {check.severity}</Typography.Text>
                      <Tag variant="filled" color={check.status === 'pass' ? 'success' : check.status === 'block' ? 'error' : 'warning'}>{check.status_label}</Tag>
                    </div>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>{check.title}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>{check.evidence}</Typography.Text>
                  </Card>
                </Col>
              ))}
            </Row>

            {competitionReadiness.blockers.length > 0 && (
              <Alert title="阻断项 (Blockers)"
                type="error"
                showIcon
                style={{ marginBottom: 24, marginTop: 24 }}
                description={
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {competitionReadiness.blockers.map((item, idx) => (
                      <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                        <Typography.Text strong>{item.severity}: {item.title}</Typography.Text>
                        <div style={{ color: 'var(--ant-color-text-secondary)' }}>{item.next_action}</div>
                      </div>
                    ))}
                  </div>
                }
              />
            )}

            <Space orientation="vertical" style={{ width: '100%', marginTop: 24 }}>
              {competitionReadiness.acceptance_commands.map((command) => <Tag variant="filled" key={command} style={{ fontFamily: 'monospace', whiteSpace: 'normal', wordBreak: 'break-all' }}>{command}</Tag>)}
              {competitionReadiness.summary.latest_package_zip && <Typography.Text code style={{ wordBreak: 'break-all' }}>{competitionReadiness.summary.latest_package_zip}</Typography.Text>}
              {competitionReadinessOutput && <Typography.Text code style={{ wordBreak: 'break-all' }}>{competitionReadinessOutput.markdown_path}</Typography.Text>}
              {competitionReadinessOutput && <Typography.Text code style={{ wordBreak: 'break-all' }}>{competitionReadinessOutput.json_path}</Typography.Text>}
            </Space>
          </>
        ) : (
          <Alert title="暂无体检结果。点击按钮后会生成本地 JSON 和 Markdown，并在这里显示就绪分与补证项。" type="info" showIcon />
        )}
      </Card>

      <Card title="攻击样本数据集" type="inner">
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={4}><Metric label="攻击面" value={`${attackDataset?.summary.surface_count ?? overview.summary.surface_count}`} /></Col>
          <Col xs={12} sm={8} md={4}><Metric label="剧本" value={`${attackDataset?.summary.scenario_count ?? overview.summary.scenario_count}`} /></Col>
          <Col xs={12} sm={8} md={4}><Metric label="对抗样本" value={`${attackDataset?.summary.adversarial_sample_count ?? overview.summary.scenario_count}`} /></Col>
          <Col xs={12} sm={8} md={4}><Metric label="越狱用例" value={`${attackDataset?.summary.jailbreak_case_count ?? overview.summary.scenario_count}`} /></Col>
          <Col xs={12} sm={8} md={4}><Metric label="复现入口" value={`${attackDataset?.summary.replay_recipe_count ?? '-'}`} /></Col>
          <Col xs={12} sm={8} md={4}><Metric label="工具调用" value={`${attackDataset?.summary.tool_call_count ?? '-'}`} /></Col>
        </Row>
        <Space style={{ marginBottom: 24 }} wrap>
          <Button href="/api/datasets/attack_cases" target="_blank" type="link" style={{ paddingLeft: 0 }}>查看 JSON</Button>
          <Button href="/api/datasets/attack_cases.md" target="_blank" type="link">查看 Markdown</Button>
          <Tag variant="filled" style={{ fontFamily: 'monospace', margin: 0 }}>npm run cli -- samples --format json</Tag>
        </Space>
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>按攻击面筛选</Typography.Text>
          <Space wrap>
            {overview.attack_surfaces.map((surface) => (
              <Button key={surface.id} href={`/api/datasets/attack_cases?surface_id=${encodeURIComponent(surface.id)}`} target="_blank" size="small">{surface.name}</Button>
            ))}
          </Space>
        </div>
      </Card>
            </Space>
          )
        },
        {
          key: '3',
          label: '🔗 外部接入与开放集成',
          children: (
            <Space orientation="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
              <Card title="外部智能体监督接入" type="inner">
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" type="inner" style={{ height: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>HTTP 接口</Typography.Text>
              <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>POST /api/supervisor/evaluate</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" type="inner" style={{ height: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>OpenClaw 兼容</Typography.Text>
              <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>POST /api/integrations/openclaw/events</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" type="inner" style={{ height: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>适配器代码</Typography.Text>
              <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>GET /api/integrations/openclaw/adapter.py</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" type="inner" style={{ height: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>CLI 验证</Typography.Text>
              <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>npm run cli -- demo-external</Typography.Text>
            </Card>
          </Col>
        </Row>

        {integrationBundle && (
          <Card title={<Space>OpenClaw 兼容接入包 <Tag variant="filled" color="blue">{integrationBundle.version}</Tag></Space>} style={{ marginBottom: 24 }} type="inner" variant="borderless" styles={{ body: { background: 'var(--ant-color-fill-quaternary)'  }}}>
            <Typography.Paragraph>{integrationBundle.purpose}</Typography.Paragraph>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} md={6}>
                <Card size="small" variant="borderless">
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>接口数量</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 20 }}>{integrationBundle.endpoints.length}</Typography.Text>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" variant="borderless">
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>样例事件</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 20 }}>{integrationBundle.sample_events.length}</Typography.Text>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" variant="borderless">
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>最低控制</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 20 }}>{integrationBundle.validation.expected.controlled_min}</Typography.Text>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" variant="borderless">
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>安全默认</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 20 }}>{integrationBundle.event_contract.safe_default.includes('false') ? '只审计' : '需确认'}</Typography.Text>
                </Card>
              </Col>
            </Row>
            
            <Space orientation="vertical" style={{ width: '100%', marginBottom: 24 }} size="middle">
              {integrationBundle.endpoints.map((endpoint) => (
                <Card key={endpoint.path} size="small" styles={{ body: { padding: 12 } }}>
                  <Flex justify="space-between" align="flex-start" wrap="wrap" gap={8}>
                    <div>
                      <Typography.Text strong style={{ marginRight: 8, display: 'block' }}>{endpoint.name}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>{endpoint.description}</Typography.Text>
                    </div>
                    <Tag variant="filled" color="purple" style={{ margin: 0, fontFamily: 'monospace', whiteSpace: 'normal', wordBreak: 'break-all' }}>{endpoint.method} {endpoint.path}</Tag>
                  </Flex>
                </Card>
              ))}
            </Space>

            <Card size="small" style={{ marginBottom: 24, background: 'rgba(0,0,0,0.02)' }} variant="borderless">
              <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                <Typography.Text code style={{ fontSize: 14, whiteSpace: 'normal', wordBreak: 'break-all' }}>{integrationBundle.validation.cli}</Typography.Text>
                <Space wrap>
                  <Button size="small" href="/api/integrations/openclaw/bundle" target="_blank">查看接入包 JSON</Button>
                  <Button size="small" href="/api/integrations/openclaw/adapter.py" target="_blank">查看适配器代码</Button>
                </Space>
              </Flex>
            </Card>

            <div style={{ marginTop: 24 }}>
              <Typography.Title level={5} style={{ marginBottom: 16 }}>接入步骤</Typography.Title>
              <Steps
                orientation="vertical"
                size="small"
                current={integrationBundle.acceptance_steps.length}
                items={integrationBundle.acceptance_steps.map((step) => ({
                  title: <Typography.Text>{step}</Typography.Text>,
                }))}
              />
            </div>
          </Card>
        )}

        <Card title="OpenClaw 源码级插件包" style={{ marginBottom: 24 }} type="inner" extra={<Space><Button type="primary" onClick={handleWriteOpenClawPlugin} loading={writingOpenClawPlugin} icon={<TerminalSquare size={16} />}>生成插件包</Button><Button onClick={handleValidateOpenClawPlugin} loading={validatingOpenClawPlugin}>运行验收</Button></Space>}>
          <Typography.Paragraph type="secondary">生成可安装的 native plugin 目录，使用 before_tool_call 在 OpenClaw 工具执行前接入智安哨监督器。</Typography.Paragraph>
          
          {openClawPluginPackage ? (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}><Typography.Text type="secondary" style={{ display: 'block' }}>插件类型</Typography.Text><Typography.Text strong>{openClawPluginPackage.summary.package_type}</Typography.Text></Col>
                <Col xs={12} sm={6}><Typography.Text type="secondary" style={{ display: 'block' }}>核心 Hook</Typography.Text><Typography.Text strong>{openClawPluginPackage.summary.core_hooks.length}</Typography.Text></Col>
                <Col xs={12} sm={6}><Typography.Text type="secondary" style={{ display: 'block' }}>文件数</Typography.Text><Typography.Text strong>{openClawPluginPackage.file_count}</Typography.Text></Col>
                <Col xs={12} sm={6}><Typography.Text type="secondary" style={{ display: 'block' }}>检查通过</Typography.Text><Typography.Text strong>{Object.values(openClawPluginPackage.summary.runtime_checks).filter(Boolean).length}</Typography.Text></Col>
              </Row>
              <Space orientation="vertical" style={{ width: '100%', marginBottom: 16 }}>
                <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{openClawPluginPackage.package_dir}</Typography.Text>
                <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{openClawPluginPackage.zip_path}</Typography.Text>
                <Typography.Text code style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>{openClawPluginPackage.markdown_path}</Typography.Text>
              </Space>
              <Space wrap style={{ marginBottom: 16 }}>
                {Object.entries(openClawPluginPackage.summary.runtime_checks).map(([key, value]) => (
                  <Tag variant="filled" key={key} color={value ? 'success' : 'error'}>{key}: {String(value)}</Tag>
                ))}
              </Space>
              <Space orientation="vertical" style={{ width: '100%' }}>
                {openClawPluginPackage.summary.install_commands.map((command) => <Typography.Text key={command} code>{command}</Typography.Text>)}
                {integrationBundle?.validation.plugin_validation_cli && <Typography.Text code>{integrationBundle.validation.plugin_validation_cli}</Typography.Text>}
              </Space>
            </>
          ) : (
            <Alert title="还没有生成 OpenClaw 插件包。生成后会在本地输出 `zhian-openclaw-guard` 目录、zip 和说明文档。" type="info" showIcon />
          )}

          {openClawPluginValidation && (
            <Card size="small" type="inner" style={{ marginTop: 16, background: 'var(--ant-color-fill-quaternary)' }}>
              <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="验收状态"><Tag variant="filled" color={openClawPluginValidation.validation.overall_status === 'static-validated' ? 'success' : 'warning'}>{openClawPluginValidation.validation.overall_status === 'static-validated' ? '静态通过' : openClawPluginValidation.validation.overall_status}</Tag></Descriptions.Item>
                <Descriptions.Item label="文件完整"><Tag variant="filled" color={openClawPluginValidation.validation.files_passed ? 'success' : 'error'}>{openClawPluginValidation.validation.files_passed ? '通过' : '未通过'}</Tag></Descriptions.Item>
                <Descriptions.Item label="Hook 结构"><Tag variant="filled" color={openClawPluginValidation.validation.static_passed ? 'success' : 'error'}>{openClawPluginValidation.validation.static_passed ? '通过' : '未通过'}</Tag></Descriptions.Item>
                <Descriptions.Item label="JS 语法"><Tag variant="filled" color={openClawPluginValidation.validation.node_syntax_passed ? 'success' : 'error'}>{openClawPluginValidation.validation.node_syntax_passed ? '通过' : '未通过'}</Tag></Descriptions.Item>
                <Descriptions.Item label="OpenClaw runtime"><Tag variant="filled" color={openClawPluginValidation.validation.runtime_inspect_passed ? 'success' : 'processing'}>{openClawPluginValidation.validation.runtime_inspect_passed ? '通过' : '待真实环境'}</Tag></Descriptions.Item>
              </Descriptions>
              <Space orientation="vertical" style={{ width: '100%', marginBottom: 16 }}>
                <Typography.Text code>{openClawPluginValidation.markdown_path}</Typography.Text>
                <Typography.Text code>{openClawPluginValidation.json_path}</Typography.Text>
              </Space>
              <Space wrap style={{ marginBottom: 16 }}>
                {Object.entries(openClawPluginValidation.validation.file_checks).map(([key, value]) => (
                  <Tag variant="filled" key={key} color={value ? 'success' : 'error'}>{key}: {value ? '存在' : '缺失'}</Tag>
                ))}
              </Space>
              {openClawPluginValidation.validation.remaining_gap.length > 0 && (
                <div style={{ color: 'var(--ant-color-error)' }}>
                  {openClawPluginValidation.validation.remaining_gap.map((gap) => <div key={gap}>{gap}</div>)}
                </div>
              )}
            </Card>
          )}
        </Card>
      </Card>
            </Space>
          )
        },
        {
          key: '4',
          label: '🛠️ 测试与手工调试',
          children: (
            <Space orientation="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
              <Card title="真实 Agent 工具调度演示" type="inner" extra={<Button type="primary" onClick={handleRunExternalAgentDemo} loading={runningExternalAgentDemo} icon={<TerminalSquare size={16} />}>运行真实 Agent demo</Button>} style={{ marginBottom: 24 }}>
          <Typography.Paragraph type="secondary">从页面直接运行最小外部 Agent，让监督器在工具执行前做允许、拒绝或询问决策，并生成可提交的证据文件。</Typography.Paragraph>
          
          {externalAgentDemo ? (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={4}><Metric label="任务总数" value={`${externalAgentDemo.summary.task_count}`} /></Col>
                <Col span={4}><Metric label="被控制" value={`${externalAgentDemo.summary.controlled_count}`} tone="green" /></Col>
                <Col span={4}><Metric label="真实执行" value={`${externalAgentDemo.summary.executed_count}`} /></Col>
                <Col span={4}><Metric label="控制率" value={`${externalAgentDemo.summary.control_rate}%`} tone="amber" /></Col>
                <Col span={4}><Metric label="审计 hash" value={`${externalAgentDemo.summary.audit_hash_count}`} /></Col>
              </Row>
              <Space orientation="vertical" style={{ width: '100%', marginBottom: 24 }}>
                <Typography.Text code>{externalAgentDemo.markdown_path}</Typography.Text>
                <Typography.Text code>{externalAgentDemo.json_path}</Typography.Text>
              </Space>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {externalAgentDemo.records.map((record, index) => (
                  <div key={index} style={{ padding: '16px 0', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                    <Row style={{ width: '100%' }} align="top" gutter={16}>
                      <Col span={2}><Typography.Text strong style={{ fontSize: 24, color: 'var(--ant-color-text-quaternary)' }}>{String(index + 1).padStart(2, '0')}</Typography.Text></Col>
                      <Col span={10}>
                        <Typography.Text strong style={{ display: 'block' }}>{record.title}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{record.reason}</Typography.Text>
                        <Typography.Text code style={{ fontSize: 12, wordBreak: 'break-all' }}>{record.tool} {JSON.stringify(record.arguments)}</Typography.Text>
                      </Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Space orientation="vertical" align="end" size={4}>
                          <DecisionPill decision={record.decision} />
                          <Tag variant="filled" color={record.executed ? 'success' : 'default'}>{record.executed ? '已执行' : '未执行'}</Tag>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.policy_id}</Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{record.audit_hash ? record.audit_hash.slice(0, 12) : 'no-hash'}</Typography.Text>
                        </Space>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Alert title="还没有运行真实 Agent demo。点击按钮后，系统会自动跑 4 个工具调用并写入审计证据。" type="info" showIcon />
          )}
        </Card>

        <Card title="手工调试" type="inner" extra={
          <Space>
            <Button size="small" onClick={loadSingleExternalSample}>单事件样例</Button>
            <Button size="small" onClick={loadBatchExternalSample}>批量样例</Button>
            <Button size="small" danger onClick={clearExternalResults}>清空评估</Button>
          </Space>
        }>
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>工具调用事件 JSON</Typography.Text>
              <Input.TextArea value={eventJson} onChange={(event) => setEventJson(event.target.value)} rows={10} style={{ fontFamily: 'monospace', marginBottom: 16 }} spellCheck={false} />
              <Space>
                <Button type="primary" onClick={handleEvaluateEvent} loading={evaluating} icon={<ShieldCheck size={16} />}>评估并写入审计</Button>
                <Button onClick={loadSingleExternalSample}>重置样例</Button>
              </Space>
              {evaluateError && <Alert title={evaluateError} type="error" showIcon style={{ marginTop: 16 }} />}
            </Col>
            <Col xs={24} lg={12}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>评估结果</Typography.Text>
              {evaluation ? (
                <Card size="small" style={{ background: 'var(--ant-color-fill-quaternary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <Typography.Text strong style={{ display: 'block', fontSize: 16 }}>{evaluation.risk_evidence.tool}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{evaluation.surface_id} · {evaluation.policy_id}</Typography.Text>
                    </div>
                    <DecisionPill decision={evaluation.decision} />
                  </div>
                  <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="风险分">{evaluation.risk_score ?? evaluation.risk_evidence.risk_score ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="异常分">{evaluation.anomaly_score ?? evaluation.risk_evidence.anomaly_score ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="审计编号" span={2}><Typography.Text code>{evaluation.audit_id.slice(0, 8)}</Typography.Text></Descriptions.Item>
                    <Descriptions.Item label="已落库">{evaluation.persisted ? '是' : '否'}</Descriptions.Item>
                    <Descriptions.Item label="告警">{evaluation.alert ? '已生成' : '未生成'}</Descriptions.Item>
                  </Descriptions>
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <div><Typography.Text type="secondary" style={{ fontSize: 12 }}>判定原因</Typography.Text><Typography.Paragraph style={{ margin: 0 }}>{evaluation.reason}</Typography.Paragraph></div>
                    <div><Typography.Text type="secondary" style={{ fontSize: 12 }}>检测信号</Typography.Text><Typography.Paragraph style={{ margin: 0 }}>{evaluation.risk_evidence.detection_points.join(' / ')}</Typography.Paragraph></div>
                    <div><Typography.Text type="secondary" style={{ fontSize: 12 }}>风险因子</Typography.Text><Typography.Paragraph style={{ margin: 0 }}>{(evaluation.risk_factors ?? evaluation.risk_evidence.risk_factors ?? []).join(' / ') || '暂无风险因子记录'}</Typography.Paragraph></div>
                  </Space>
                </Card>
              ) : (
                <Alert title="暂无评估结果" type="info" showIcon />
              )}
            </Col>
          </Row>

          <Divider />

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>批量事件 JSON</Typography.Text>
              <Input.TextArea value={batchJson} onChange={(event) => setBatchJson(event.target.value)} rows={10} style={{ fontFamily: 'monospace', marginBottom: 16 }} spellCheck={false} />
              <Space>
                <Button type="primary" onClick={handleBatchEvaluate} loading={batchEvaluating} icon={<ClipboardList size={16} />}>批量评估并写入审计</Button>
                <Button onClick={loadBatchExternalSample}>重置批量样例</Button>
              </Space>
            </Col>
            <Col xs={24} lg={12}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>批量评估结果</Typography.Text>
              {batchEvaluation ? (
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={8}><Metric label="事件总数" value={`${batchEvaluation.total}`} /></Col>
                    <Col span={8}><Metric label="已管控" value={`${batchEvaluation.controlled}`} tone="green" /></Col>
                    <Col span={8}><Metric label="控制率" value={`${batchEvaluation.control_rate}%`} tone="amber" /></Col>
                  </Row>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                    {batchEvaluation.results.map((item, idx) => (
                      <div key={idx} style={{ padding: '8px 12px', background: 'var(--ant-color-fill-quaternary)', borderRadius: 6 }}>
                        <Row style={{ width: '100%' }} align="middle">
                          <Col span={6}><Typography.Text code>{item.risk_evidence.tool}</Typography.Text></Col>
                          <Col span={4}><DecisionPill decision={item.decision} /></Col>
                          <Col span={14}>
                            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>策略: {item.policy_id}</Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.reason} · 风险分 {item.risk_score ?? item.risk_evidence.risk_score ?? '-'} · 异常分 {item.anomaly_score ?? item.risk_evidence.anomaly_score ?? '-'}</Typography.Text>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                </Space>
              ) : (
                <Alert title="暂无批量评估结果" type="info" showIcon />
              )}
            </Col>
          </Row>
        </Card>
            </Space>
          )
        }
      ]} />
    </div>
  );
}