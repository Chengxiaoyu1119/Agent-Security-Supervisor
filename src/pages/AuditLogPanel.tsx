import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Typography, Space, Tag, Input, Select, Button, Flex, Descriptions, Statistic, Badge } from 'antd';
import { Activity, AlertTriangle, Play, TerminalSquare, ClipboardList, Settings2, FileWarning, ShieldCheck, ShieldAlert, ScrollText, GitBranch, FlaskConical, CheckCircle2, Copy, XCircle } from 'lucide-react';
import { UiButton, MetricCard as Metric, DecisionPill } from '../components/ui';
import { fetchOverview, fetchScenarios, fetchStudentCompetitionAttackMap, fetchPolicies, fetchAuditLogs, verifyRunAuditHash, fetchAlerts, fetchApprovalReviews, decideApprovalReview, updatePolicyEnabled, runScenario, compareScenario, batchCompareScenarios, fetchAttackChains, runAttackChain, compareAttackChain, fetchReport, fetchAttackCaseDataset, fetchSurfaceEvidencePack, fetchSurfaceEvidencePackIndex, writeAllSurfaceEvidencePacks, fetchOpenClawIntegrationBundle, writeOpenClawPluginPackage, writeOpenClawPluginValidation, fetchCompetitionReadiness, writeCompetitionReadiness, fetchDemoDrill, runDemoDrill, runExternalAgentDemo, createSubmissionPackage, createCleanSubmissionPackage, evaluateSupervisorEvent, evaluateSupervisorBatch } from '../api';
import type { RiskLevel, GuardDecision, AttackSurface, StudentCompetitionAttackProfile, Scenario, ModelStatus, Policy, AlertItem, AuditLog, AuditHashVerification, AgentTrace, RunResult, CompareResult, BatchCompareResult, AttackChainStage, AttackChain, AttackChainStageRun, AttackChainRunResult, AttackChainCompareResult, ReportSummary, ReportSurfaceCoverage, ReportScenarioMatrix, ReportDeliverable, ReportCounterItem, BenignEvaluationCase, BenignEvaluation, BenignWorkflowStep, BenignWorkflow, BenignWorkflowEvaluation, SurfaceConclusion, SurfaceConclusionReport, OutputFilterCase, OutputFilterEvidence, AttackEffectivenessCase, RequirementAlignmentItem, AttackEffectiveness, PolicyAblationCase, PolicyAblationExperiment, PolicyAblation, ProjectRoadmapBacklogItem, ProjectRoadmap, AnomalyCalibration, CompetitionPackageFile, CompetitionChecklistItem, CompetitionPackage, SubmissionPackageResult, ApprovalStatus, ApprovalReview, ApprovalReviewList, ApprovalDecisionResult, SupervisorEvaluation, SupervisorBatchEvaluation, ExternalAgentDemoRecord, ExternalAgentDemoResult, OpenClawIntegrationBundle, OpenClawCommandCheck, OpenClawPluginPackageResult, OpenClawPluginValidation, OpenClawPluginValidationWriteResult, CompetitionReadinessCheck, CompetitionReadiness, CompetitionReadinessWriteResult, DemoDrillStage, DemoDrillResult, AttackCaseDataset, SurfaceEvidencePack, SurfaceEvidencePackWriteResult, SurfaceEvidencePackIndex, ReportData, Overview } from '../types';
import { riskLabel, writeClipboardText, externalEventSample, externalBatchEventSample, competitionCapabilityRows } from '../utils';
import { SurfaceCard, SurfaceWorkbench } from '../components/surface/SurfaceWorkbench';
import { SurfaceResearchMatrix } from '../components/surface/SurfaceResearchMatrix';
import { SurfaceEvidenceIndexBoard } from '../components/surface/SurfaceEvidenceIndexBoard';


export function AuditLogPanel({ logs, refresh }: { logs: AuditLog[]; refresh: () => void }) {
  const [query, setQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('全部');
  const [riskFilter, setRiskFilter] = useState('全部');
  const [riskScoreFilter, setRiskScoreFilter] = useState('全部');
  const [toolFilter, setToolFilter] = useState('全部');
  const [executionFilter, setExecutionFilter] = useState('全部');
  const [selectedLogId, setSelectedLogId] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedFiltered, setCopiedFiltered] = useState(false);
  const [copiedApprovalId, setCopiedApprovalId] = useState('');
  const [approvalQueue, setApprovalQueue] = useState<ApprovalReviewList>({
    generated_at: '',
    status_filter: '全部',
    summary: {
      total: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
      high_risk_count: 0,
      hash_valid_count: 0,
      latest_created_at: '',
      latest_reviewed_at: ''
    },
    reviews: []
  });
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [approvalBusyId, setApprovalBusyId] = useState('');
  const [hashVerification, setHashVerification] = useState<AuditHashVerification | null>(null);
  const [hashVerifying, setHashVerifying] = useState(false);
  const [hashVerifyError, setHashVerifyError] = useState('');

  const tools = useMemo(() => Array.from(new Set(logs.map((log) => log.tool))), [logs]);
  const filteredLogs = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const minRiskScore = riskScoreFilter === '全部' ? null : Number(riskScoreFilter);
    return logs.filter((log) => {
      const text = `${log.tool} ${log.decision} ${log.risk_level} ${log.policy_id} ${log.reason} ${log.recommendation} ${(log.risk_factors ?? []).join(' ')} ${log.risk_score ?? ''}`.toLowerCase();
      return (
        (!keyword || text.includes(keyword)) &&
        (decisionFilter === '全部' || log.decision === decisionFilter) &&
        (riskFilter === '全部' || log.risk_level === riskFilter) &&
        (riskScoreFilter === '全部' || (log.risk_score ?? 0) >= (minRiskScore ?? 0)) &&
        (toolFilter === '全部' || log.tool === toolFilter) &&
        (executionFilter === '全部' || (executionFilter === '已执行' ? log.tool_output.executed : !log.tool_output.executed))
      );
    }).sort((a, b) => {
      const riskScoreDiff = (b.risk_score ?? 0) - (a.risk_score ?? 0);
      if (riskScoreDiff !== 0) return riskScoreDiff;
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [logs, query, decisionFilter, riskFilter, riskScoreFilter, toolFilter, executionFilter]);

  useEffect(() => {
    if (!filteredLogs.length) {
      setSelectedLogId('');
      return;
    }
    if (!filteredLogs.some((log) => log.id === selectedLogId)) {
      setSelectedLogId(filteredLogs[0].id);
    }
  }, [filteredLogs, selectedLogId]);

  const selectedLog = filteredLogs.find((log) => log.id === selectedLogId) ?? filteredLogs[0];
  const controlledCount = logs.filter((log) => ['拒绝', '询问', '隔离'].includes(log.decision)).length;
  const highRiskCount = logs.filter((log) => ['high', 'critical'].includes(log.risk_level)).length;
  const highScoreCount = logs.filter((log) => (log.risk_score ?? 0) >= 70).length;
  const executedCount = logs.filter((log) => log.tool_output.executed).length;
  const pendingReviews = approvalQueue.reviews.filter((review) => review.status === '待复核');
  const latestReviews = [...approvalQueue.reviews].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  useEffect(() => {
    void loadApprovalReviews();
  }, []);

  useEffect(() => {
    setHashVerification(null);
    setHashVerifyError('');
  }, [selectedLogId]);

  async function loadApprovalReviews() {
    setApprovalLoading(true);
    setApprovalError('');
    try {
      setApprovalQueue(await fetchApprovalReviews('全部', 100));
    } catch {
      setApprovalError('复核队列暂时不可用，请确认后端服务已经启动。');
    } finally {
      setApprovalLoading(false);
    }
  }

  function approvalStatusClass(status: string) {
    if (status === '已批准') return 'approved';
    if (status === '已驳回') return 'rejected';
    return 'pending';
  }

  async function handleApprovalDecision(review: ApprovalReview, action: 'approve' | 'reject') {
    setApprovalBusyId(review.id);
    setApprovalError('');
    try {
      await decideApprovalReview(
        review.id,
        action,
        action === 'approve'
          ? '演示批准：复核后确认可由上游比赛平台按最小权限重新发起。'
          : '演示驳回：外部收件人或敏感数据范围未满足授权条件。',
        action === 'approve'
      );
      await loadApprovalReviews();
      await refresh();
    } catch {
      setApprovalError('审批动作写入失败，请检查后端接口或复核单状态。');
    } finally {
      setApprovalBusyId('');
    }
  }

  async function copyApprovalEvidence(review: ApprovalReview) {
    const text = [
      `复核单：${review.id}`,
      `状态：${review.status}`,
      `最终结论：${review.final_decision}`,
      `工具：${review.tool}`,
      `策略：${review.policy_id}`,
      `风险：${riskLabel[review.risk_level]} / ${review.risk_score ?? '-'}分`,
      `异常分：${review.anomaly_score ?? '-'}`,
      `原审计 hash：${review.audit_hash || '-'}`,
      `复核 hash：${review.review_hash || '-'}`,
      `操作人：${review.operator || '-'}`,
      `备注：${review.comment || '-'}`,
      `原因：${review.reason}`,
      `建议：${review.recommendation}`,
      `参数：${JSON.stringify(review.arguments, null, 2)}`
    ].join('\n');
    const ok = await writeClipboardText(text);
    if (ok) {
      setCopiedApprovalId(review.id);
      window.setTimeout(() => setCopiedApprovalId(''), 1500);
    }
  }

  function resetAuditFilters() {
    setQuery('');
    setDecisionFilter('全部');
    setRiskFilter('全部');
    setRiskScoreFilter('全部');
    setToolFilter('全部');
    setExecutionFilter('全部');
  }

  function showHighRiskAudit() {
    setQuery('');
    setDecisionFilter('全部');
    setRiskFilter('全部');
    setRiskScoreFilter('70');
    setToolFilter('全部');
    setExecutionFilter('全部');
  }

  function showControlledAudit() {
    setQuery('');
    setDecisionFilter('拒绝');
    setRiskFilter('全部');
    setRiskScoreFilter('全部');
    setToolFilter('全部');
    setExecutionFilter('全部');
  }

  function showExecutedAudit() {
    setQuery('');
    setDecisionFilter('全部');
    setRiskFilter('全部');
    setRiskScoreFilter('全部');
    setToolFilter('全部');
    setExecutionFilter('已执行');
  }

  async function copyEvidence() {
    if (!selectedLog) return;
    const text = [
      `工具：${selectedLog.tool}`,
      `决策：${selectedLog.decision}`,
      `风险：${riskLabel[selectedLog.risk_level]}`,
      `风险分：${selectedLog.risk_score ?? '-'}`,
      `异常分：${selectedLog.anomaly_score ?? '-'}`,
      `风险因子：${selectedLog.risk_factors?.join(' / ') || '-'}`,
      `异常信号：${selectedLog.anomaly_signals?.join(' / ') || '-'}`,
      `审计哈希：${selectedLog.audit_hash ?? '-'}`,
      `上一条哈希：${selectedLog.previous_hash ?? '-'}`,
      `策略：${selectedLog.policy_id}`,
      `原因：${selectedLog.reason}`,
      `建议：${selectedLog.recommendation}`,
      `参数：${JSON.stringify(selectedLog.arguments, null, 2)}`,
      `输出：${selectedLog.tool_output.output}`
    ].join('\n');
    const ok = await writeClipboardText(text);
    setCopied(ok);
    if (ok) {
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  async function copyFilteredAuditEvidence() {
    const text = filteredLogs.map((log, index) => [
      `#${index + 1} ${log.tool}`,
      `决策：${log.decision}`,
      `风险：${riskLabel[log.risk_level]} / ${log.risk_score ?? '-'}分`,
      `异常分：${log.anomaly_score ?? '-'}`,
      `风险因子：${log.risk_factors?.join(' / ') || '-'}`,
      `异常信号：${log.anomaly_signals?.join(' / ') || '-'}`,
      `审计哈希：${log.audit_hash ?? '-'}`,
      `策略：${log.policy_id}`,
      `原因：${log.reason}`,
      `建议：${log.recommendation}`,
      `执行：${log.tool_output.executed ? '是' : '否'} / 沙箱：${log.tool_output.sandboxed ? '是' : '否'}`
    ].join('\n')).join('\n\n');
    const ok = await writeClipboardText(text || '当前筛选条件下没有审计记录。');
    setCopiedFiltered(ok);
    if (ok) {
      window.setTimeout(() => setCopiedFiltered(false), 1500);
    }
  }

  async function verifySelectedRunHash() {
    if (!selectedLog) return;
    setHashVerifying(true);
    setHashVerifyError('');
    try {
      setHashVerification(await verifyRunAuditHash(selectedLog.run_id));
    } catch (error) {
      setHashVerifyError(error instanceof Error ? error.message : '审计 hash 验证失败');
    } finally {
      setHashVerifying(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card variant="borderless">
        <Flex justify="space-between" align="center">
          <Typography.Title level={3} style={{ margin: 0 }}>工具调用、代码执行、文件访问审计</Typography.Title>
          <Button onClick={refresh}>刷新审计</Button>
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Metric label="审计记录" value={`${logs.length}`} tone="cyan" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="已管控" value={`${controlledCount}`} tone="green" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="高危/极高" value={`${highRiskCount}`} tone="red" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Metric label="实际执行" value={`${executedCount}`} tone="amber" />
        </Col>
      </Row>

      <Card title="人工复核队列" extra={<Button onClick={loadApprovalReviews} loading={approvalLoading}>刷新队列</Button>} variant="borderless">
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}><Statistic title="待复核" value={approvalQueue.summary.pending_count} /></Col>
          <Col span={6}><Statistic title="已批准" value={approvalQueue.summary.approved_count} /></Col>
          <Col span={6}><Statistic title="已驳回" value={approvalQueue.summary.rejected_count} /></Col>
          <Col span={6}><Statistic title="hash 有效" value={`${approvalQueue.summary.hash_valid_count}/${approvalQueue.summary.total}`} /></Col>
        </Row>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {latestReviews.map(review => (
            <div
              key={review.id}
              style={{ padding: '12px 0', borderBottom: '1px solid var(--ant-color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <Space><Tag variant="filled" color={review.status === '待复核' ? 'processing' : review.status === '已批准' ? 'success' : 'error'}>{review.status}</Tag><Typography.Text strong>{review.tool}</Typography.Text><Typography.Text code>{review.policy_id}</Typography.Text></Space>
                <div style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary">{review.reason}</Typography.Text>
                </div>
              </div>
              <Space>
                {review.status === '待复核' ? <Button size="small" type="primary" onClick={() => handleApprovalDecision(review, 'approve')}>批准</Button> : null}
                {review.status === '待复核' ? <Button size="small" danger onClick={() => handleApprovalDecision(review, 'reject')}>驳回</Button> : null}
                <Button size="small" onClick={() => copyApprovalEvidence(review)}>{copiedApprovalId === review.id ? '已复制' : '复制'}</Button>
              </Space>
            </div>
          ))}
          {!latestReviews.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>暂无复核单。运行外部邮件或批量导出样例后，系统会自动生成待复核记录。</div>}
        </div>
      </Card>

      <Card variant="borderless">
        <Flex gap={16} wrap="wrap" style={{ marginBottom: 16 }} justify="space-between">
          <Flex gap={16} wrap="wrap" style={{ flex: 1 }}>
            <Input placeholder="搜索工具、策略、原因..." value={query} onChange={e => setQuery(e.target.value)} style={{ width: 200, maxWidth: '100%' }} />
            <Select value={decisionFilter} onChange={setDecisionFilter} style={{ width: 120, flex: '1 1 auto' }} options={['全部', '允许', '拒绝', '询问', '隔离'].map(v => ({label: v==='全部'?'全部决策':v, value: v}))} />
            <Select value={riskFilter} onChange={setRiskFilter} style={{ width: 120, flex: '1 1 auto' }} options={['全部', 'critical', 'high', 'medium', 'low'].map(v => ({label: v==='全部'?'全部风险':riskLabel[v], value: v}))} />
            <Select value={riskScoreFilter} onChange={setRiskScoreFilter} style={{ width: 120, flex: '1 1 auto' }} options={[['全部', '全部风险分'], ['50', '≥ 50'], ['70', '≥ 70'], ['90', '≥ 90']].map(([v, l]) => ({label: l, value: v}))} />
            <Select value={toolFilter} onChange={setToolFilter} style={{ width: 150, flex: '1 1 auto' }} options={['全部', ...tools].map(v => ({label: v==='全部'?'全部工具':v, value: v}))} />
            <Select value={executionFilter} onChange={setExecutionFilter} style={{ width: 120, flex: '1 1 auto' }} options={['全部', '已执行', '未执行'].map(v => ({label: v==='全部'?'全部执行状态':v, value: v}))} />
          </Flex>
          <Flex gap={16} wrap="wrap">
            <Button onClick={resetAuditFilters}>重置</Button>
            <Button onClick={copyFilteredAuditEvidence}>{copiedFiltered ? '已复制' : '复制当前筛选'}</Button>
          </Flex>
        </Flex>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={10}>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {filteredLogs.map(log => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  style={{ cursor: 'pointer', background: selectedLog?.id === log.id ? 'var(--ant-color-primary-bg)' : 'transparent', padding: '12px 16px', borderLeft: selectedLog?.id === log.id ? '3px solid var(--ant-color-primary)' : '3px solid transparent', borderBottom: '1px solid var(--ant-color-border-secondary)' }}
                >
                  <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <Space wrap><Typography.Text strong style={{ color: selectedLog?.id === log.id ? 'var(--ant-color-primary)' : 'inherit' }}>{log.tool}</Typography.Text><Tag variant="filled" color={log.decision === '允许' ? 'success' : log.decision === '拒绝' ? 'error' : 'warning'}>{log.decision}</Tag></Space>
                      <div style={{ marginTop: 4 }}>
                        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0 }}>{log.reason}</Typography.Paragraph>
                      </div>
                    </div>
                    <div>
                      <Typography.Text style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)' }}>{log.policy_id}</Typography.Text>
                    </div>
                  </Flex>
                </div>
              ))}
              {!filteredLogs.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>没有匹配的审计记录。</div>}
            </div>
          </Col>
          <Col xs={24} md={14}>
            {selectedLog ? (
              <Card type="inner" title={<Space><Typography.Text>{selectedLog.tool}</Typography.Text><Tag variant="filled">{selectedLog.decision}</Tag></Space>} extra={<Typography.Text type="secondary">{selectedLog.timestamp.slice(0, 19).replace('T', ' ')}</Typography.Text>}>
                <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="风险等级"><Tag variant="filled" color={['critical', 'high'].includes(selectedLog.risk_level) ? 'error' : 'default'}>{riskLabel[selectedLog.risk_level]}</Tag></Descriptions.Item>
                  <Descriptions.Item label="风险分">{selectedLog.risk_score ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="异常分">{selectedLog.anomaly_score ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="策略编号">{selectedLog.policy_id}</Descriptions.Item>
                  <Descriptions.Item label="实际执行"><Badge status={selectedLog.tool_output.executed ? 'success' : 'default'} text={selectedLog.tool_output.executed ? '是' : '否'} /></Descriptions.Item>
                  <Descriptions.Item label="沙箱执行"><Badge status={selectedLog.tool_output.sandboxed ? 'processing' : 'default'} text={selectedLog.tool_output.sandboxed ? '是' : '否'} /></Descriptions.Item>
                </Descriptions>
                
                <Typography.Title level={5}>命中原因</Typography.Title>
                <Typography.Paragraph>{selectedLog.reason}</Typography.Paragraph>

                <Typography.Title level={5}>推荐处置</Typography.Title>
                <Typography.Paragraph>{selectedLog.recommendation}</Typography.Paragraph>

                {selectedLog.risk_factors && selectedLog.risk_factors.length > 0 && (
                  <>
                    <Typography.Title level={5}>风险因子</Typography.Title>
                    <Space wrap style={{ marginBottom: 16 }}>{selectedLog.risk_factors.map(f => <Tag variant="filled" key={f}>{f}</Tag>)}</Space>
                  </>
                )}

                <Typography.Title level={5}>工具参数</Typography.Title>
                <pre style={{ background: 'var(--ant-color-bg-container-disabled)', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
                  {JSON.stringify(selectedLog.arguments, null, 2)}
                </pre>

                <Typography.Title level={5}>工具输出</Typography.Title>
                <pre style={{ background: 'var(--ant-color-bg-container-disabled)', padding: 12, borderRadius: 6, overflowX: 'auto', maxHeight: 200 }}>
                  {selectedLog.tool_output.output}
                </pre>
                
                <Flex justify="flex-end" style={{ marginTop: 16 }}>
                  <Button icon={<Copy size={16} />} onClick={copyEvidence}>{copied ? '已复制' : '复制证据'}</Button>
                </Flex>
              </Card>
            ) : (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>选择一条记录查看详情。</div>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
}

