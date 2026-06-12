import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Typography, Space, Flex, Button, Table, Tag, List, Badge, Progress, Divider, Alert, Descriptions, Tabs } from 'antd';
import { Activity, AlertTriangle, Play, TerminalSquare, ClipboardList, Settings2, FileWarning, ShieldCheck, ShieldAlert, ScrollText, GitBranch, FlaskConical, CheckCircle2, Copy, XCircle } from 'lucide-react';
import { UiButton, MetricCard as Metric, DecisionPill } from '../components/ui';
import { fetchOverview, fetchScenarios, fetchStudentCompetitionAttackMap, fetchPolicies, fetchAuditLogs, verifyRunAuditHash, fetchAlerts, fetchApprovalReviews, decideApprovalReview, updatePolicyEnabled, runScenario, compareScenario, batchCompareScenarios, fetchAttackChains, runAttackChain, compareAttackChain, fetchReport, fetchAttackCaseDataset, fetchSurfaceEvidencePack, fetchSurfaceEvidencePackIndex, writeAllSurfaceEvidencePacks, fetchOpenClawIntegrationBundle, writeOpenClawPluginPackage, writeOpenClawPluginValidation, fetchCompetitionReadiness, writeCompetitionReadiness, fetchDemoDrill, runDemoDrill, runExternalAgentDemo, createSubmissionPackage, createCleanSubmissionPackage, evaluateSupervisorEvent, evaluateSupervisorBatch } from '../api';
import type { RiskLevel, GuardDecision, AttackSurface, StudentCompetitionAttackProfile, Scenario, ModelStatus, Policy, AlertItem, AuditLog, AuditHashVerification, AgentTrace, RunResult, CompareResult, BatchCompareResult, AttackChainStage, AttackChain, AttackChainStageRun, AttackChainRunResult, AttackChainCompareResult, ReportSummary, ReportSurfaceCoverage, ReportScenarioMatrix, ReportDeliverable, ReportCounterItem, BenignEvaluationCase, BenignEvaluation, BenignWorkflowStep, BenignWorkflow, BenignWorkflowEvaluation, SurfaceConclusion, SurfaceConclusionReport, OutputFilterCase, OutputFilterEvidence, AttackEffectivenessCase, RequirementAlignmentItem, AttackEffectiveness, PolicyAblationCase, PolicyAblationExperiment, PolicyAblation, ProjectRoadmapBacklogItem, ProjectRoadmap, AnomalyCalibration, CompetitionPackageFile, CompetitionChecklistItem, CompetitionPackage, SubmissionPackageResult, ApprovalStatus, ApprovalReview, ApprovalReviewList, ApprovalDecisionResult, SupervisorEvaluation, SupervisorBatchEvaluation, ExternalAgentDemoRecord, ExternalAgentDemoResult, OpenClawIntegrationBundle, OpenClawCommandCheck, OpenClawPluginPackageResult, OpenClawPluginValidation, OpenClawPluginValidationWriteResult, CompetitionReadinessCheck, CompetitionReadiness, CompetitionReadinessWriteResult, DemoDrillStage, DemoDrillResult, AttackCaseDataset, SurfaceEvidencePack, SurfaceEvidencePackWriteResult, SurfaceEvidencePackIndex, ReportData, Overview } from '../types';
import { riskLabel, writeClipboardText, externalEventSample, externalBatchEventSample, competitionCapabilityRows } from '../utils';
import { SurfaceCard, SurfaceWorkbench } from '../components/surface/SurfaceWorkbench';
import { SurfaceResearchMatrix } from '../components/surface/SurfaceResearchMatrix';
import { SurfaceEvidenceIndexBoard } from '../components/surface/SurfaceEvidenceIndexBoard';
import { ProjectRoadmapBlock, AnomalyCalibrationBlock, ReportDefenseEvidenceBoard } from '../components/report';



export function ReportPanel({ report, onOpenScenario }: { report: ReportData | null; onOpenScenario: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState('');
  const [submissionPackage, setSubmissionPackage] = useState<SubmissionPackageResult | null>(null);
  const [creatingPackage, setCreatingPackage] = useState(false);
  const [creatingCleanPackage, setCreatingCleanPackage] = useState(false);
  const [packageError, setPackageError] = useState('');
  const markdown = report?.markdown ?? '正在加载报告...';
  const competitionPackage = report?.competition_package;
  const packageFiles = competitionPackage?.files ?? [];

  async function copyText(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    }
  }

  async function copyReport() {
    const ok = await copyText(markdown);
    setCopied(ok);
    if (ok) {
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  async function copyPackageFile(filename: string, content: string) {
    const ok = await copyText(content);
    if (ok) {
      setCopiedFile(filename);
      window.setTimeout(() => setCopiedFile(''), 1600);
    }
  }

  function downloadPackageFile(filename: string, content: string, contentType: string) {
    const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleCreateSubmissionPackage() {
    setCreatingPackage(true);
    setPackageError('');
    try {
      const result = await createSubmissionPackage();
      setSubmissionPackage(result);
    } catch (error) {
      setPackageError(error instanceof Error ? error.message : '生成提交包失败');
    } finally {
      setCreatingPackage(false);
    }
  }

  async function handleCreateCleanSubmissionPackage() {
    setCreatingCleanPackage(true);
    setPackageError('');
    try {
      const result = await createCleanSubmissionPackage();
      setSubmissionPackage(result);
    } catch (error) {
      setPackageError(error instanceof Error ? error.message : '生成干净提交包失败');
    } finally {
      setCreatingCleanPackage(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card variant="borderless">
        <Flex justify="space-between" align="center">
          <Typography.Title level={3} style={{ margin: 0 }}>初赛报告材料中心</Typography.Title>
          <Button icon={<Copy size={16} />} onClick={copyReport}>{copied ? '已复制' : '复制 Markdown'}</Button>
        </Flex>
      </Card>
      
      {report ? (

        <Tabs defaultActiveKey="1" size="large" items={[
          {
            key: '1',
            label: '📊 报告概览与成熟度',
            children: (
              <Space orientation="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
                          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={4}><Metric label="攻击面覆盖" value={`${report.summary.surface_count}/7`} tone="cyan" /></Col>
            <Col xs={24} sm={12} md={8} lg={4}><Metric label="攻击剧本" value={`${report.summary.scenario_count}`} tone="amber" /></Col>
            <Col xs={24} sm={12} md={8} lg={4}><Metric label="防护控制率" value={`${report.summary.control_rate}%`} tone="green" /></Col>
            <Col xs={24} sm={12} md={8} lg={4}><Metric label="正常误报率" value={`${report.summary.false_positive_rate}%`} tone={report.summary.false_positive_rate ? 'amber' : 'green'} /></Col>
            <Col xs={24} sm={12} md={8} lg={4}><Metric label="异常召回率" value={`${report.summary.anomaly_attack_recall_rate ?? report.anomaly_calibration?.summary.attack_recall_rate ?? 0}%`} tone="cyan" /></Col>
            <Col xs={24} sm={12} md={8} lg={4}><Metric label="平均延迟" value={`${report.summary.avg_latency_ms}ms`} tone="red" /></Col>
          </Row>
                          {report.project_roadmap && <ProjectRoadmapBlock roadmap={report.project_roadmap} />}
          {report.anomaly_calibration && <AnomalyCalibrationBlock calibration={report.anomaly_calibration} />}
                          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title={<Space><Typography.Text strong>核心评测曲线</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.summary.run_count} 次实验运行</Typography.Text></Space>} variant="borderless" style={{ height: '100%' }}>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  {[
                    { label: '防护控制率', value: report.summary.control_rate, color: 'var(--ant-color-success)' },
                    { label: '攻击成功率', value: report.summary.attack_success_rate, color: 'var(--ant-color-error)' },
                    { label: '正常比赛任务误报率', value: report.summary.false_positive_rate, color: 'var(--ant-color-warning)' },
                    { label: '期望决策匹配率', value: report.summary.expected_match_rate, color: 'var(--ant-color-info)' },
                    { label: '输出过滤阻断率', value: report.summary.output_filter_block_rate, color: 'var(--ant-color-success)' },
                    { label: '策略启用率', value: Math.round((report.summary.enabled_policy_count / Math.max(1, report.summary.policy_count)) * 100), color: 'var(--ant-color-info)' },
                  ].map(item => (
                    <div key={item.label}>
                      <Flex justify="space-between"><Typography.Text>{item.label}</Typography.Text><Typography.Text strong>{item.value}%</Typography.Text></Flex>
                      <Progress percent={Math.min(100, Math.max(0, item.value))} showInfo={false} strokeColor={item.color} size="small" />
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="攻击面剧本分布" variant="borderless" style={{ height: '100%' }}>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  {report.surface_coverage.map(surface => {
                    const maxCount = Math.max(1, ...report.surface_coverage.map(i => i.scenario_count));
                    return (
                      <div key={surface.id}>
                        <Flex justify="space-between"><Typography.Text>{surface.name}</Typography.Text><Typography.Text strong>{surface.scenario_count}</Typography.Text></Flex>
                        <Progress percent={Math.max(2, Math.round((surface.scenario_count / maxCount) * 100))} showInfo={false} strokeColor="var(--ant-color-primary)" size="small" />
                      </div>
                    );
                  })}
                </Space>
              </Card>
            </Col>
          </Row>
                          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title={<Space><Typography.Text strong>比赛预期成果对齐</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.deliverables.length} 项</Typography.Text></Space>} variant="borderless" style={{ height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {report.deliverables.map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid var(--ant-color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ paddingTop: 4 }}><Badge status="processing" /></div>
                        <div>
                          <div><Typography.Text strong>{item.name}</Typography.Text></div>
                          <div style={{ marginTop: 4 }}><Typography.Text type="secondary">{item.evidence}</Typography.Text></div>
                        </div>
                      </div>
                      <Typography.Text strong>{item.status}</Typography.Text>
                    </div>
                  ))}
                  {!report.deliverables.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>暂无数据</div>}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<Space><Typography.Text strong>策略命中统计</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.policy_hits.length || 0} 类策略</Typography.Text></Space>} variant="borderless" style={{ height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {report.policy_hits.map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid var(--ant-color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography.Text>{item.policy_id}</Typography.Text>
                      <Typography.Text strong>{item.count}</Typography.Text>
                    </div>
                  ))}
                  {!report.policy_hits.length && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ant-color-text-description)' }}>暂无策略命中记录，先运行一次攻击剧本。</div>}
                </div>
              </Card>
            </Col>
          </Row>
              </Space>
            )
          },
          {
            key: '2',
            label: '🛡️ 攻防实战评测',
            children: (
              <Space orientation="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
                          {report.attack_effectiveness && (
            <Card title={<Space><Typography.Text strong>攻防有效性评测</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.attack_effectiveness.summary.attack_reproduced_count}/{report.attack_effectiveness.summary.scenario_count} 个剧本已复现攻击</Typography.Text></Space>} variant="borderless">
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}><Metric label="无防护复现率" value={`${report.attack_effectiveness.summary.attack_reproduced_rate}%`} tone="red" /></Col>
                <Col span={6}><Metric label="有防护控制率" value={`${report.attack_effectiveness.summary.defense_effective_rate}%`} tone="green" /></Col>
                <Col span={6}><Metric label="策略匹配率" value={`${report.attack_effectiveness.summary.expected_match_rate}%`} tone="cyan" /></Col>
                <Col span={6}><Metric label="证据完整率" value={`${report.attack_effectiveness.summary.evidence_complete_rate}%`} tone="amber" /></Col>
              </Row>
              <ReportDefenseEvidenceBoard cases={report.attack_effectiveness.cases} onOpenScenario={onOpenScenario} />
              
              <Table 
                dataSource={report.attack_effectiveness.cases}
                rowKey="scenario_id"
                size="small"
                pagination={{ pageSize: 10 }}
                style={{ marginTop: 24 }}
                columns={[
                  { title: '剧本', dataIndex: 'scenario_id', render: t => <Typography.Text strong>{t}</Typography.Text> },
                  { title: '攻击面', dataIndex: 'surface_name' },
                  { title: '无防护', key: 'attack_reproduced_without_guard', render: (_, r) => <Tag variant="filled" color={r.attack_reproduced_without_guard ? 'error' : 'default'}>{r.attack_reproduced_without_guard ? '已复现' : '未复现'}</Tag> },
                  { title: '有防护', key: 'defense_effective_with_guard', render: (_, r) => <Tag variant="filled" color={r.defense_effective_with_guard ? 'success' : 'error'}>{r.defense_effective_with_guard ? '已控制' : '缺证据'}</Tag> },
                  { title: '策略', key: 'expected_decision_match', render: (_, r) => <Badge status={r.expected_decision_match ? 'success' : 'warning'} text={r.expected_decision_match ? '匹配' : '不完整'} /> },
                  { title: '证据', key: 'evidence_complete', render: (_, r) => <Typography.Text>{r.evidence_complete ? '完整' : '待补'} {r.guarded_hash_status?.valid && r.unguarded_hash_status?.valid ? ' / hash有效' : ' / hash待补'}</Typography.Text> },
                  { title: '缺口', key: 'evidence_gaps', render: (_, r) => <Typography.Text type="secondary">{r.evidence_gaps.join('；') || '无'}</Typography.Text> }
                ]}
              />
            </Card>
          )}
                          <Card title={<Space><Typography.Text strong>攻击面实验结论</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.surface_conclusions.summary.conclusion_count} 类结论 / {report.surface_conclusions.summary.with_run_evidence_count} 类已有运行证据</Typography.Text></Space>} variant="borderless">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {report.surface_conclusions.conclusions.map((item, idx) => (
                <div key={idx} style={{ padding: '16px 0', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      <Typography.Text strong>{item.surface_name}</Typography.Text>
                      <Tag variant="filled" color={item.risk === 'critical' ? 'error' : 'warning'}>{riskLabel[item.risk]}</Tag>
                      <Typography.Text type="secondary">{item.experiment_status}</Typography.Text>
                    </Space>
                  </div>
                  <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                    <Typography.Text>{item.key_findings[0]}</Typography.Text>
                    <Space>
                      <Typography.Text code>{Object.keys(item.expected_policies).join(' / ') || 'default-allow'}</Typography.Text>
                      <Typography.Text strong type="success">{item.control_rate}%</Typography.Text>
                    </Space>
                  </Space>
                </div>
              ))}
            </div>
          </Card>
                          <Card title={<Space><Typography.Text strong>模型输出过滤前后对比</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.output_filter_evidence.summary.case_count} 个输出风险样本 / 阻断率 {report.output_filter_evidence.summary.block_rate}%</Typography.Text></Space>} variant="borderless">
            <Table
              dataSource={report.output_filter_evidence.cases}
              rowKey="scenario_id"
              size="small"
              pagination={{ pageSize: 5 }}
              columns={[
                { title: '剧本', dataIndex: 'scenario_id', render: t => <Typography.Text strong>{t}</Typography.Text> },
                { title: '类型', dataIndex: 'filter_type' },
                { title: '关闭防护', key: 'without_guard', render: (_, r) => <Typography.Text type="danger">{r.without_guard.decision}</Typography.Text> },
                { title: '开启防护', key: 'with_guard', render: (_, r) => <Typography.Text type="success">{r.with_guard.decision}</Typography.Text> },
                { title: '命中策略', key: 'policy', render: (_, r) => <Typography.Text code>{r.with_guard.policy_id}</Typography.Text> },
                { title: '结论', key: 'reason', render: (_, r) => <Typography.Text type="secondary" ellipsis>{r.with_guard.reason}</Typography.Text> }
              ]}
            />
          </Card>
                          <Card title={<Space><Typography.Text strong>攻击面覆盖矩阵</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.surface_coverage.filter((item) => item.demo_ready).length} 类可演示</Typography.Text></Space>} variant="borderless">
            <Table
              dataSource={report.surface_coverage}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '攻击面', dataIndex: 'name', render: t => <Typography.Text strong>{t}</Typography.Text> },
                { title: '风险', dataIndex: 'risk', render: t => <Tag variant="filled" color={t === 'critical' ? 'error' : 'warning'}>{riskLabel[t]}</Tag> },
                { title: '样本', dataIndex: 'samples' },
                { title: '脚本', dataIndex: 'scripts' },
                { title: '状态', dataIndex: 'status' },
                { title: '防御策略', dataIndex: 'defense', render: t => <Typography.Text type="secondary">{t}</Typography.Text> }
              ]}
            />
          </Card>
                          <Card title={<Space><Typography.Text strong>攻击剧本证据矩阵</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.scenario_matrix.length} 个剧本</Typography.Text></Space>} variant="borderless">
            <Table
              dataSource={report.scenario_matrix}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
              columns={[
                { title: '剧本', dataIndex: 'id', render: t => <Typography.Text strong>{t}</Typography.Text> },
                { title: '攻击面', dataIndex: 'surface' },
                { title: '目标', dataIndex: 'target', render: t => <Typography.Text code>{t}</Typography.Text> },
                { title: '样本', dataIndex: 'has_adversarial_prompt', render: t => <Typography.Text type={t ? "success" : "secondary"}>{t ? '有' : '缺失'}</Typography.Text> },
                { title: '越狱', dataIndex: 'has_jailbreak_case', render: t => <Typography.Text type={t ? "success" : "secondary"}>{t ? '有' : '缺失'}</Typography.Text> },
                { title: '步骤', key: 'steps', render: (_, r) => <Typography.Text>{r.script_steps} 步 / {r.tool_calls} 调用</Typography.Text> },
                { title: '决策', dataIndex: 'last_decision', render: t => <DecisionPill decision={t} /> }
              ]}
            />
          </Card>
              </Space>
            )
          },
          {
            key: '3',
            label: '🚦 正常与消融评测',
            children: (
              <Space orientation="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
                          {report.policy_ablation && (
            <Card title={<Space><Typography.Text strong>策略消融实验</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.policy_ablation.summary.experiment_count} 组策略 / {report.policy_ablation.summary.scenario_count} 个剧本</Typography.Text></Space>} variant="borderless">
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={5}><Metric label="基线控制率" value={`${report.policy_ablation.summary.baseline_control_rate}%`} tone="green" /></Col>
                <Col span={5}><Metric label="消融后控制率" value={`${report.policy_ablation.summary.ablated_control_rate}%`} tone="amber" /></Col>
                <Col span={4}><Metric label="控制率下降" value={`${report.policy_ablation.summary.control_drop}%`} tone="red" /></Col>
                <Col span={5}><Metric label="风险暴露" value={`${report.policy_ablation.summary.risk_exposed_count}`} tone="red" /></Col>
                <Col span={5}><Metric label="兜底控制" value={`${report.policy_ablation.summary.fallback_control_count}`} tone="cyan" /></Col>
              </Row>
              <Row gutter={[16, 16]}>
                {report.policy_ablation.experiments.map(item => (
                  <Col xs={24} md={12} xl={8} key={item.id}>
                    <Card type="inner" title={<Space><Typography.Text strong>{item.name}</Typography.Text><Tag variant="filled" color={item.risk_exposed_count ? 'error' : 'success'}>{item.risk_exposed_count ? '出现暴露' : '有兜底'}</Tag></Space>} style={{ height: '100%' }}>
                      <Typography.Paragraph type="secondary" style={{ minHeight: 44 }}>{item.hypothesis}</Typography.Paragraph>
                      <Space size="large" style={{ marginBottom: 16 }}>
                        <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>关闭策略</Typography.Text><Typography.Text strong>{item.disabled_policies.length}</Typography.Text></div>
                        <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>剧本</Typography.Text><Typography.Text strong>{item.baseline.scenario_count}</Typography.Text></div>
                        <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>基线</Typography.Text><Typography.Text strong>{item.baseline.control_rate}%</Typography.Text></div>
                        <div><Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>消融后</Typography.Text><Typography.Text strong>{item.ablated.control_rate}%</Typography.Text></div>
                      </Space>
                      <div style={{ marginBottom: 16 }}>{item.disabled_policies.map(p => <Tag variant="filled" key={p}>{p}</Tag>)}</div>
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>{item.conclusion}</Typography.Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
                          <Card title={<Space><Typography.Text strong>正常比赛任务误报评测</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.benign_evaluation.summary.case_count} 个正常样本 / 误报 {report.benign_evaluation.summary.false_positive_count} 个</Typography.Text></Space>} variant="borderless">
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={4}><Metric label="正常样本" value={`${report.benign_evaluation.summary.case_count}`} tone="cyan" /></Col>
              <Col span={4}><Metric label="覆盖类别" value={`${report.benign_evaluation.summary.category_count}`} tone="cyan" /></Col>
              <Col span={4}><Metric label="工具类型" value={`${report.benign_evaluation.summary.tool_count}`} tone="amber" /></Col>
              <Col span={4}><Metric label="需确认/隔离" value={`${report.benign_evaluation.summary.expected_control_count}`} tone="amber" /></Col>
              <Col span={4}><Metric label="误报率" value={`${report.benign_evaluation.summary.false_positive_rate}%`} tone={report.benign_evaluation.summary.false_positive_rate > 0 ? "red" : "green"} /></Col>
              <Col span={4}><Metric label="匹配率" value={`${report.benign_evaluation.summary.expected_match_rate}%`} tone="green" /></Col>
            </Row>
            <Table
              dataSource={report.benign_evaluation.cases}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
              columns={[
                { title: '样本', dataIndex: 'id', render: t => <Typography.Text strong>{t}</Typography.Text> },
                { title: '类别', dataIndex: 'category' },
                { title: '工具', key: 'tool', render: (_, r) => <Typography.Text code>{r.tool_call.tool}</Typography.Text> },
                { title: '期望', dataIndex: 'expected_decision' },
                { title: '实际', dataIndex: 'decision' },
                { title: '误报', key: 'is_false_positive', render: (_, r) => <Tag variant="filled" color={r.is_false_positive ? 'error' : 'success'}>{r.is_false_positive ? '是' : '否'}</Tag> },
                { title: '策略', dataIndex: 'policy_id', render: t => <Typography.Text code>{t}</Typography.Text> }
              ]}
            />
          </Card>
                          {report.benign_workflow_evaluation && (
            <Card title={<Space><Typography.Text strong>连续正常赛事流程评测</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{report.benign_workflow_evaluation.summary.workflow_count} 条流程 / {report.benign_workflow_evaluation.summary.step_count} 个步骤</Typography.Text></Space>} variant="borderless">
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={5}><Metric label="流程通过率" value={`${report.benign_workflow_evaluation.summary.workflow_pass_rate}%`} tone="green" /></Col>
                <Col span={5}><Metric label="步骤误报率" value={`${report.benign_workflow_evaluation.summary.false_positive_rate}%`} tone="amber" /></Col>
                <Col span={5}><Metric label="匹配率" value={`${report.benign_workflow_evaluation.summary.expected_match_rate}%`} tone="cyan" /></Col>
                <Col span={5}><Metric label="边界控制" value={`${report.benign_workflow_evaluation.summary.expected_control_step_count}`} tone="amber" /></Col>
                <Col span={4}><Metric label="审计链有效" value={`${report.benign_workflow_evaluation.summary.audit_chain_valid_count}`} tone="green" /></Col>
              </Row>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {report.benign_workflow_evaluation.workflows.map((workflow, idx) => (
                  <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid var(--ant-color-border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 16 }}>
                      <div><Typography.Text strong>{workflow.title}</Typography.Text></div>
                      <div style={{ marginTop: 4 }}><Typography.Text type="secondary">{workflow.business_purpose}</Typography.Text></div>
                    </div>
                    <Space wrap>
                      <Tag variant="filled" color={workflow.passed ? 'success' : 'error'}>{workflow.passed ? '通过' : '需复核'}</Tag>
                      <Tag variant="filled">{workflow.step_count} 步 / 控制 {workflow.controlled_count}</Tag>
                      <Tag variant="filled">{workflow.audit_chain_valid ? 'hash 有效' : 'hash 异常'}</Tag>
                    </Space>
                  </div>
                ))}
              </div>
            </Card>
          )}
              </Space>
            )
          },
          {
            key: '4',
            label: '📦 比赛交付与接口',
            children: (
              <Space orientation="vertical" size="large" style={{ width: '100%', paddingTop: 8 }}>
                          {competitionPackage && (
            <Card title={<Space><Typography.Text strong>比赛交付材料包</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{competitionPackage.summary.file_count} 份材料 / {competitionPackage.summary.alert_count} 条告警证据</Typography.Text></Space>} variant="borderless">
              <Alert type="info" 
                showIcon 
                title="一键生成初赛提交包" 
                description="普通包使用当前历史记录；干净包会重新跑固定攻防对照，更适合最终提交。" 
                action={
                  <Space orientation="vertical">
                    <Button type="primary" onClick={handleCreateCleanSubmissionPackage} disabled={creatingCleanPackage || creatingPackage} loading={creatingCleanPackage} icon={<FileWarning size={14} />}>生成干净提交包</Button>
                    <Button onClick={handleCreateSubmissionPackage} disabled={creatingPackage || creatingCleanPackage} loading={creatingPackage} icon={<FileWarning size={14} />}>生成普通提交包</Button>
                  </Space>
                }
                style={{ marginBottom: 24 }}
              />
              
              {packageError && <Alert type="error" title={packageError} style={{ marginBottom: 24 }} />}
              
              {submissionPackage && (
                <Card type="inner" style={{ marginBottom: 24, background: 'var(--ant-color-success-bg)' }} variant="borderless">
                  <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }}>
                    <Descriptions.Item label="提交包目录"><Typography.Text code>{submissionPackage.package_dir}</Typography.Text></Descriptions.Item>
                    <Descriptions.Item label="Zip 文件"><Typography.Text code>{submissionPackage.zip_path}</Typography.Text></Descriptions.Item>
                    <Descriptions.Item label="文件数量"><Typography.Text strong>{submissionPackage.file_count}</Typography.Text></Descriptions.Item>
                    {submissionPackage.clean_summary && (
                      <Descriptions.Item label="干净运行"><Typography.Text strong>{submissionPackage.clean_summary.clean_run_count} (控制率 {submissionPackage.clean_summary.clean_control_rate}%)</Typography.Text></Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              )}

              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={6}><Metric label="可演示攻击面" value={`${competitionPackage.summary.demo_ready_surface_count}/7`} tone="green" /></Col>
                <Col span={6}><Metric label="材料文件" value={`${competitionPackage.summary.file_count}`} tone="cyan" /></Col>
                <Col span={6}><Metric label="实验记录" value={`${competitionPackage.summary.run_count}`} tone="amber" /></Col>
                <Col span={6}><Metric label="控制率" value={`${competitionPackage.summary.control_rate}%`} tone="red" /></Col>
              </Row>

              <Row gutter={[16, 16]}>
                {packageFiles.map(file => (
                  <Col xs={24} md={12} xl={8} key={file.filename}>
                    <Card type="inner" title={file.title} extra={<Typography.Text type="secondary" style={{fontSize: 12}}>{Math.max(1, Math.round(file.size / 1024))} KB</Typography.Text>} actions={[
                      <Button type="text" size="small" onClick={() => copyPackageFile(file.filename, file.content)}><Copy size={14} /> {copiedFile === file.filename ? '已复制' : '复制'}</Button>,
                      <Button type="text" size="small" onClick={() => downloadPackageFile(file.filename, file.content, file.content_type)}>下载</Button>
                    ]}>
                      <Typography.Paragraph type="secondary" style={{ minHeight: 44 }}>{file.description}</Typography.Paragraph>
                      <Typography.Text code>{file.filename}</Typography.Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
                          {competitionPackage && (
            <Card title={<Space><Typography.Text strong>赛题要求逐条检查</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{competitionPackage.checklist.length} 条验收项</Typography.Text></Space>} variant="borderless">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {competitionPackage.checklist.map((item, idx) => (
                  <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid var(--ant-color-border-secondary)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ paddingTop: 2 }}><Badge status={item.status === '满足' ? 'success' : 'processing'} text={item.status} /></div>
                    <div style={{ flex: 1 }}>
                      <div><Typography.Text strong>{item.requirement}</Typography.Text></div>
                      <div style={{ marginTop: 4 }}><Typography.Text type="secondary">{item.evidence}</Typography.Text></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
                          {competitionPackage && (
            <Card title={<Space><Typography.Text strong>OpenClaw / 通用智能体适配接口</Typography.Text><Typography.Text type="secondary" style={{fontSize: 12}}>{'工具调用事件 -> 监督决策'}</Typography.Text></Space>} variant="borderless">
              <pre style={{ background: 'var(--ant-color-bg-container-disabled)', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
                {JSON.stringify(competitionPackage.adapter_schema, null, 2)}
              </pre>
            </Card>
          )}
                          <Card title="Markdown 导出内容" variant="borderless">
            <pre style={{ background: 'var(--ant-color-bg-container-disabled)', padding: 16, borderRadius: 8, overflowX: 'auto', maxHeight: 600 }}>
              {markdown}
            </pre>
          </Card>
              </Space>
            )
          }
        ]} />

      ) : (
        <Card variant="borderless" style={{ textAlign: 'center', padding: 64 }}>
          <Typography.Text type="secondary">正在加载报告...</Typography.Text>
        </Card>
      )}
    </div>
  );
}









