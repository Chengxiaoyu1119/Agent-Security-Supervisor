import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Typography, Space, Flex, Button, Input, Select, Tag, Descriptions, Badge } from 'antd';
import { Activity, AlertTriangle, Play, TerminalSquare, ClipboardList, Settings2, FileWarning, ShieldCheck, ShieldAlert, ScrollText, GitBranch, FlaskConical, CheckCircle2, Copy, XCircle } from 'lucide-react';
import { UiButton, MetricCard as Metric, DecisionPill } from '../components/ui';
import { fetchOverview, fetchScenarios, fetchStudentCompetitionAttackMap, fetchPolicies, fetchAuditLogs, verifyRunAuditHash, fetchAlerts, fetchApprovalReviews, decideApprovalReview, updatePolicyEnabled, runScenario, compareScenario, batchCompareScenarios, fetchAttackChains, runAttackChain, compareAttackChain, fetchReport, fetchAttackCaseDataset, fetchSurfaceEvidencePack, fetchSurfaceEvidencePackIndex, writeAllSurfaceEvidencePacks, fetchOpenClawIntegrationBundle, writeOpenClawPluginPackage, writeOpenClawPluginValidation, fetchCompetitionReadiness, writeCompetitionReadiness, fetchDemoDrill, runDemoDrill, runExternalAgentDemo, createSubmissionPackage, createCleanSubmissionPackage, evaluateSupervisorEvent, evaluateSupervisorBatch } from '../api';
import type { RiskLevel, GuardDecision, AttackSurface, StudentCompetitionAttackProfile, Scenario, ModelStatus, Policy, AlertItem, AuditLog, AuditHashVerification, AgentTrace, RunResult, CompareResult, BatchCompareResult, AttackChainStage, AttackChain, AttackChainStageRun, AttackChainRunResult, AttackChainCompareResult, ReportSummary, ReportSurfaceCoverage, ReportScenarioMatrix, ReportDeliverable, ReportCounterItem, BenignEvaluationCase, BenignEvaluation, BenignWorkflowStep, BenignWorkflow, BenignWorkflowEvaluation, SurfaceConclusion, SurfaceConclusionReport, OutputFilterCase, OutputFilterEvidence, AttackEffectivenessCase, RequirementAlignmentItem, AttackEffectiveness, PolicyAblationCase, PolicyAblationExperiment, PolicyAblation, ProjectRoadmapBacklogItem, ProjectRoadmap, AnomalyCalibration, CompetitionPackageFile, CompetitionChecklistItem, CompetitionPackage, SubmissionPackageResult, ApprovalStatus, ApprovalReview, ApprovalReviewList, ApprovalDecisionResult, SupervisorEvaluation, SupervisorBatchEvaluation, ExternalAgentDemoRecord, ExternalAgentDemoResult, OpenClawIntegrationBundle, OpenClawCommandCheck, OpenClawPluginPackageResult, OpenClawPluginValidation, OpenClawPluginValidationWriteResult, CompetitionReadinessCheck, CompetitionReadiness, CompetitionReadinessWriteResult, DemoDrillStage, DemoDrillResult, AttackCaseDataset, SurfaceEvidencePack, SurfaceEvidencePackWriteResult, SurfaceEvidencePackIndex, ReportData, Overview } from '../types';
import { riskLabel, writeClipboardText, externalEventSample, externalBatchEventSample, competitionCapabilityRows } from '../utils';
import { SurfaceCard, SurfaceWorkbench } from '../components/surface/SurfaceWorkbench';
import { SurfaceResearchMatrix } from '../components/surface/SurfaceResearchMatrix';
import { SurfaceEvidenceIndexBoard } from '../components/surface/SurfaceEvidenceIndexBoard';


export function AlertsPanel({ alerts, refresh }: { alerts: AlertItem[]; refresh: () => void }) {
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('全部');
  const [riskScoreFilter, setRiskScoreFilter] = useState('全部');
  const [decisionFilter, setDecisionFilter] = useState('全部');
  const [policyFilter, setPolicyFilter] = useState('全部');
  const [scenarioFilter, setScenarioFilter] = useState('全部');
  const [selectedAlertId, setSelectedAlertId] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedFiltered, setCopiedFiltered] = useState(false);

  const policies = useMemo(() => Array.from(new Set(alerts.map((alert) => alert.policy_id).filter(Boolean))), [alerts]);
  const scenarios = useMemo(() => Array.from(new Set(alerts.map((alert) => alert.scenario_id).filter(Boolean))), [alerts]);
  const filteredAlerts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const minRiskScore = riskScoreFilter === '全部' ? null : Number(riskScoreFilter);
    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return alerts.filter((alert) => {
      const text = `${alert.title} ${alert.evidence} ${alert.policy_id ?? ''} ${alert.tool ?? ''} ${alert.scenario_id ?? ''} ${alert.recommendation ?? ''} ${(alert.risk_factors ?? []).join(' ')} ${alert.risk_score ?? ''}`.toLowerCase();
      return (
        (!keyword || text.includes(keyword)) &&
        (severityFilter === '全部' || alert.severity === severityFilter) &&
        (riskScoreFilter === '全部' || (alert.risk_score ?? 0) >= (minRiskScore ?? 0)) &&
        (decisionFilter === '全部' || alert.decision === decisionFilter) &&
        (policyFilter === '全部' || alert.policy_id === policyFilter) &&
        (scenarioFilter === '全部' || alert.scenario_id === scenarioFilter)
      );
    }).sort((a, b) => {
      const riskScoreDiff = (b.risk_score ?? 0) - (a.risk_score ?? 0);
      if (riskScoreDiff !== 0) return riskScoreDiff;
      const severityDiff = (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
      if (severityDiff !== 0) return severityDiff;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [alerts, query, severityFilter, riskScoreFilter, decisionFilter, policyFilter, scenarioFilter]);

  useEffect(() => {
    if (!filteredAlerts.length) {
      setSelectedAlertId('');
      return;
    }
    if (!filteredAlerts.some((alert) => alert.id === selectedAlertId)) {
      setSelectedAlertId(filteredAlerts[0].id);
    }
  }, [filteredAlerts, selectedAlertId]);

  const selectedAlert = filteredAlerts.find((alert) => alert.id === selectedAlertId) ?? filteredAlerts[0];
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const highScoreCount = alerts.filter((alert) => (alert.risk_score ?? 0) >= 70).length;
  const blockedCount = alerts.filter((alert) => alert.decision === '拒绝').length;
  const askedCount = alerts.filter((alert) => alert.decision === '询问').length;
  const isolatedCount = alerts.filter((alert) => alert.decision === '隔离').length;

  function resetAlertFilters() {
    setQuery('');
    setSeverityFilter('全部');
    setRiskScoreFilter('全部');
    setDecisionFilter('全部');
    setPolicyFilter('全部');
    setScenarioFilter('全部');
  }

  function showCriticalAlerts() {
    setQuery('');
    setSeverityFilter('全部');
    setRiskScoreFilter('70');
    setDecisionFilter('全部');
    setPolicyFilter('全部');
    setScenarioFilter('全部');
  }

  function showBlockedAlerts() {
    setQuery('');
    setSeverityFilter('全部');
    setRiskScoreFilter('全部');
    setDecisionFilter('拒绝');
    setPolicyFilter('全部');
    setScenarioFilter('全部');
  }

  function showAskAlerts() {
    setQuery('');
    setSeverityFilter('全部');
    setRiskScoreFilter('全部');
    setDecisionFilter('询问');
    setPolicyFilter('全部');
    setScenarioFilter('全部');
  }

  async function copyAlertEvidence() {
    if (!selectedAlert) return;
    const text = [
      `告警：${selectedAlert.title}`,
      `剧本：${selectedAlert.scenario_id ?? '未知'}`,
      `工具：${selectedAlert.tool ?? '未知'}`,
      `决策：${selectedAlert.decision}`,
      `风险：${riskLabel[selectedAlert.severity]}`,
      `风险分：${selectedAlert.risk_score ?? '-'}`,
      `异常分：${selectedAlert.anomaly_score ?? '-'}`,
      `风险因子：${selectedAlert.risk_factors?.join(' / ') || '-'}`,
      `异常信号：${selectedAlert.anomaly_signals?.join(' / ') || '-'}`,
      `策略：${selectedAlert.policy_id ?? '未知'}`,
      `证据：${selectedAlert.evidence}`,
      `建议：${selectedAlert.recommendation ?? '暂无'}`,
      `参数：${JSON.stringify(selectedAlert.arguments ?? {}, null, 2)}`,
      `输出：${selectedAlert.tool_output?.output ?? '暂无'}`
    ].join('\n');
    const ok = await writeClipboardText(text);
    setCopied(ok);
    if (ok) {
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  async function copyFilteredAlerts() {
    const text = filteredAlerts.map((alert, index) => [
      `#${index + 1} ${alert.title}`,
      `剧本：${alert.scenario_id ?? '未知'}`,
      `工具：${alert.tool ?? '未知'}`,
      `决策：${alert.decision}`,
      `风险：${riskLabel[alert.severity]} / ${alert.risk_score ?? '-'}分`,
      `异常分：${alert.anomaly_score ?? '-'}`,
      `风险因子：${alert.risk_factors?.join(' / ') || '-'}`,
      `异常信号：${alert.anomaly_signals?.join(' / ') || '-'}`,
      `策略：${alert.policy_id ?? '未知'}`,
      `证据：${alert.evidence}`,
      `建议：${alert.recommendation ?? '暂无'}`
    ].join('\n')).join('\n\n');
    const ok = await writeClipboardText(text || '当前筛选条件下没有告警记录。');
    setCopiedFiltered(ok);
    if (ok) {
      window.setTimeout(() => setCopiedFiltered(false), 1500);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card variant="borderless">
        <Flex justify="space-between" align="center">
          <Typography.Title level={3} style={{ margin: 0 }}>实时告警与阻断记录</Typography.Title>
          <Button onClick={refresh}>刷新告警</Button>
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Metric label="告警总数" value={`${alerts.length}`} tone="cyan" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="极高风险" value={`${criticalCount}`} tone="red" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="拒绝阻断" value={`${blockedCount}`} tone="green" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="询问/隔离" value={`${askedCount + isolatedCount}`} tone="amber" />
        </Col>
      </Row>

      <Card variant="borderless">
        <Flex gap={16} wrap="wrap" style={{ marginBottom: 16 }}>
          <Input placeholder="剧本、策略、工具、证据" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 200 }} />
          <Select value={severityFilter} onChange={setSeverityFilter} style={{ width: 120 }} options={['全部', 'critical', 'high', 'medium', 'low'].map(v => ({label: v==='全部'?'全部级别':riskLabel[v], value: v}))} />
          <Select value={riskScoreFilter} onChange={setRiskScoreFilter} style={{ width: 120 }} options={[['全部', '全部风险分'], ['50', '≥ 50'], ['70', '≥ 70'], ['90', '≥ 90']].map(([v, l]) => ({label: l, value: v}))} />
          <Select value={decisionFilter} onChange={setDecisionFilter} style={{ width: 120 }} options={['全部', '拒绝', '询问', '隔离', '允许'].map(v => ({label: v==='全部'?'全部决策':v, value: v}))} />
          <Select value={policyFilter} onChange={setPolicyFilter} style={{ width: 150 }} options={['全部', ...policies].map(v => ({label: v==='全部'?'全部策略':v, value: v}))} />
          <Select value={scenarioFilter} onChange={setScenarioFilter} style={{ width: 150 }} options={['全部', ...scenarios].map(v => ({label: v==='全部'?'全部剧本':v, value: v}))} />
          <div style={{ flex: 1 }} />
          <Button onClick={resetAlertFilters}>重置</Button>
          <Button onClick={copyFilteredAlerts}>{copiedFiltered ? '已复制' : '复制当前告警'}</Button>
        </Flex>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <div style={{ maxHeight: 600, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  style={{ cursor: 'pointer', background: selectedAlert?.id === alert.id ? 'var(--ant-color-primary-bg)' : 'transparent', padding: '12px 16px', borderLeft: selectedAlert?.id === alert.id ? '3px solid var(--ant-color-primary)' : '3px solid transparent', borderBottom: '1px solid var(--ant-color-border-secondary)', display: 'flex', gap: 16 }}
                >
                  <div style={{ paddingTop: 2 }}>
                    <AlertTriangle size={20} color={alert.severity === 'critical' || alert.severity === 'high' ? 'var(--ant-color-error)' : 'var(--ant-color-warning)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Space><Typography.Text strong style={{ color: selectedAlert?.id === alert.id ? 'var(--ant-color-primary)' : 'inherit' }}>{alert.title}</Typography.Text><Tag variant="filled" color={alert.decision === '允许' ? 'success' : alert.decision === '拒绝' ? 'error' : 'warning'}>{alert.decision}</Tag></Space>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 4 }}>{alert.evidence}</Typography.Paragraph>
                      <Space wrap size={[0, 4]}>
                        <Typography.Text style={{ fontSize: 12 }}>{alert.scenario_id ?? '未知剧本'}</Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>·</Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>{alert.policy_id ?? '未知策略'}</Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>·</Typography.Text>
                        <Typography.Text type="danger" style={{ fontSize: 12 }}>{alert.risk_score ?? '-'}分</Typography.Text>
                      </Space>
                    </div>
                  </div>
                </div>
              ))}
              {!filteredAlerts.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>暂无告警记录</div>}
            </div>
          </Col>
          <Col xs={24} md={14}>
            {selectedAlert ? (
              <Card type="inner" title={<Space><Typography.Text>{selectedAlert.title}</Typography.Text><Tag variant="filled">{selectedAlert.decision}</Tag></Space>} extra={<Typography.Text type="secondary">{selectedAlert.created_at.slice(0, 19).replace('T', ' ')}</Typography.Text>}>
                <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="严重级别"><Tag variant="filled" color={['critical', 'high'].includes(selectedAlert.severity) ? 'error' : 'default'}>{riskLabel[selectedAlert.severity]}</Tag></Descriptions.Item>
                  <Descriptions.Item label="风险分"><Typography.Text type="danger">{selectedAlert.risk_score ?? '-'}</Typography.Text></Descriptions.Item>
                  <Descriptions.Item label="异常分">{selectedAlert.anomaly_score ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="策略编号">{selectedAlert.policy_id ?? '未知'}</Descriptions.Item>
                  <Descriptions.Item label="攻击剧本">{selectedAlert.scenario_id ?? '未知'}</Descriptions.Item>
                  <Descriptions.Item label="目标工具">{selectedAlert.tool ?? selectedAlert.target ?? '未知'}</Descriptions.Item>
                </Descriptions>
                
                <Typography.Title level={5}>阻断证据</Typography.Title>
                <Typography.Paragraph>{selectedAlert.evidence}</Typography.Paragraph>

                <Typography.Title level={5}>推荐处置</Typography.Title>
                <Typography.Paragraph>{selectedAlert.recommendation || '暂无推荐处置。'}</Typography.Paragraph>

                {(selectedAlert.risk_factors?.length || 0) > 0 && (
                  <>
                    <Typography.Title level={5}>风险因子</Typography.Title>
                    <Space wrap style={{ marginBottom: 16 }}>{selectedAlert.risk_factors?.map((f: string) => <Tag variant="filled" key={f}>{f}</Tag>)}</Space>
                  </>
                )}

                {(selectedAlert.anomaly_signals?.length || 0) > 0 && (
                  <>
                    <Typography.Title level={5}>异常信号</Typography.Title>
                    <Space wrap style={{ marginBottom: 16 }}>{selectedAlert.anomaly_signals?.map((s: string) => <Tag variant="filled" key={s} color="warning">{s}</Tag>)}</Space>
                  </>
                )}

                <Typography.Title level={5}>工具参数</Typography.Title>
                <pre style={{ background: 'var(--ant-color-bg-container-disabled)', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
                  {JSON.stringify(selectedAlert.arguments ?? {}, null, 2)}
                </pre>

                <Typography.Title level={5}>工具输出</Typography.Title>
                <pre style={{ background: 'var(--ant-color-bg-container-disabled)', padding: 12, borderRadius: 6, overflowX: 'auto', maxHeight: 200 }}>
                  {selectedAlert.tool_output?.output ?? '未执行或暂无输出。'}
                </pre>
                
                <Flex justify="flex-end" style={{ marginTop: 16 }}>
                  <Button icon={<Copy size={16} />} onClick={copyAlertEvidence}>{copied ? '已复制' : '复制证据'}</Button>
                </Flex>
              </Card>
            ) : (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>选择一条告警查看详情。</div>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
}

