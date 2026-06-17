import type {
  AlertItem,
  ApprovalDecisionResult,
  ApprovalReviewList,
  AttackCaseDataset,
  AttackChain,
  AttackChainCompareResult,
  AttackChainRunResult,
  AuditHashVerification,
  AuditLog,
  BatchCompareResult,
  CompareResult,
  CompetitionReadiness,
  CompetitionReadinessWriteResult,
  DemoDrillResult,
  ExternalAgentDemoResult,
  OpenClawIntegrationBundle,
  OpenClawPluginPackageResult,
  OpenClawPluginValidationWriteResult,
  Overview,
  Policy,
  ReportData,
  RunResult,
  Scenario,
  StudentCompetitionAttackProfile,
  SubmissionPackageResult,
  SupervisorBatchEvaluation,
  SupervisorEvaluation,
  SurfaceEvidencePack,
  SurfaceEvidencePackIndex,
  SurfaceEvidencePackWriteResult
} from './types';
import { fallbackOverview, fallbackPolicies, fallbackScenarios } from './fallback';

type RequestOptions = {
  timeoutMs?: number;
};

async function request<T>(path: string, init?: RequestInit, options: RequestOptions = {}): Promise<T> {
  const controller = options.timeoutMs ? new AbortController() : undefined;
  const timeoutId = controller ? window.setTimeout(() => controller.abort(), options.timeoutMs) : undefined;

  try {
    const response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
      signal: controller?.signal ?? init?.signal
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json() as Promise<T>;
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

export async function fetchOverview(): Promise<Overview> {
  try {
    return await request<Overview>('/api/overview');
  } catch {
    return fallbackOverview;
  }
}

export async function fetchScenarios(): Promise<Scenario[]> {
  try {
    return await request<Scenario[]>('/api/scenarios');
  } catch {
    return fallbackScenarios;
  }
}

export async function fetchStudentCompetitionAttackMap(): Promise<StudentCompetitionAttackProfile[]> {
  try {
    return await request<StudentCompetitionAttackProfile[]>('/api/student_competition_attack_map');
  } catch {
    return fallbackOverview.student_competition_attack_map ?? [];
  }
}

export async function fetchPolicies(): Promise<Policy[]> {
  try {
    return await request<Policy[]>('/api/policies');
  } catch {
    return fallbackPolicies;
  }
}

export async function fetchAuditLogs(limit = 100): Promise<AuditLog[]> {
  try {
    return await request<AuditLog[]>(`/api/audit_logs?limit=${limit}`);
  } catch {
    return fallbackOverview.audit_logs;
  }
}

export async function verifyRunAuditHash(runId: string): Promise<AuditHashVerification> {
  return request<AuditHashVerification>(`/api/runs/${encodeURIComponent(runId)}/audit_hash/verify`);
}

export async function fetchAlerts(limit = 100): Promise<AlertItem[]> {
  try {
    return await request<AlertItem[]>(`/api/alerts?limit=${limit}`);
  } catch {
    return fallbackOverview.alerts;
  }
}

export async function fetchApprovalReviews(status = '全部', limit = 100): Promise<ApprovalReviewList> {
  return request<ApprovalReviewList>(`/api/approvals?status=${encodeURIComponent(status)}&limit=${limit}`);
}

export async function decideApprovalReview(
  reviewId: string,
  action: 'approve' | 'reject',
  comment = '',
  executeInSandbox = false
): Promise<ApprovalDecisionResult> {
  return request<ApprovalDecisionResult>(`/api/approvals/${encodeURIComponent(reviewId)}/decision`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      operator: 'security-reviewer',
      comment,
      execute_in_sandbox: executeInSandbox
    })
  });
}

export async function updatePolicyEnabled(policyId: string, enabled: boolean): Promise<Policy> {
  return request<Policy>(`/api/policies/${policyId}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled })
  });
}

export async function runScenario(scenarioId: string, guardEnabled: boolean): Promise<RunResult> {
  return request<RunResult>('/api/run', {
    method: 'POST',
    body: JSON.stringify({ scenario_id: scenarioId, guard_enabled: guardEnabled })
  });
}

export async function compareScenario(scenarioId: string): Promise<CompareResult> {
  return request<CompareResult>('/api/compare', {
    method: 'POST',
    body: JSON.stringify({ scenario_id: scenarioId, guard_enabled: true })
  });
}

export async function batchCompareScenarios(scenarioIds?: string[]): Promise<BatchCompareResult> {
  return request<BatchCompareResult>('/api/batch_compare', {
    method: 'POST',
    body: JSON.stringify({ scenario_ids: scenarioIds })
  });
}

export async function fetchAttackChains(): Promise<AttackChain[]> {
  return request<AttackChain[]>('/api/attack_chains');
}

export async function runAttackChain(chainId: string, guardEnabled = true): Promise<AttackChainRunResult> {
  return request<AttackChainRunResult>(`/api/attack_chains/${encodeURIComponent(chainId)}/run`, {
    method: 'POST',
    body: JSON.stringify({ guard_enabled: guardEnabled })
  });
}

export async function compareAttackChain(chainId: string): Promise<AttackChainCompareResult> {
  return request<AttackChainCompareResult>(`/api/attack_chains/${encodeURIComponent(chainId)}/compare`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function fetchReport(): Promise<ReportData> {
  return request<ReportData>('/api/report', undefined, { timeoutMs: 8000 });
}

export async function fetchAttackCaseDataset(): Promise<AttackCaseDataset> {
  return request<AttackCaseDataset>('/api/datasets/attack_cases');
}

export async function fetchSurfaceEvidencePack(surfaceId: string): Promise<SurfaceEvidencePack> {
  return request<SurfaceEvidencePack>(`/api/attack_surfaces/${encodeURIComponent(surfaceId)}/evidence_pack`);
}

export async function fetchSurfaceEvidencePackIndex(): Promise<SurfaceEvidencePackIndex> {
  return request<SurfaceEvidencePackIndex>('/api/attack_surfaces/evidence_packs');
}

export async function writeAllSurfaceEvidencePacks(): Promise<SurfaceEvidencePackWriteResult> {
  return request<SurfaceEvidencePackWriteResult>('/api/attack_surfaces/evidence_packs/write', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function fetchOpenClawIntegrationBundle(): Promise<OpenClawIntegrationBundle> {
  return request<OpenClawIntegrationBundle>('/api/integrations/openclaw/bundle');
}

export async function writeOpenClawPluginPackage(): Promise<OpenClawPluginPackageResult> {
  return request<OpenClawPluginPackageResult>('/api/integrations/openclaw/plugin_package/write', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function writeOpenClawPluginValidation(): Promise<OpenClawPluginValidationWriteResult> {
  return request<OpenClawPluginValidationWriteResult>('/api/integrations/openclaw/plugin_package/validation/write', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function fetchCompetitionReadiness(): Promise<CompetitionReadiness> {
  return request<CompetitionReadiness>('/api/readiness');
}

export async function writeCompetitionReadiness(): Promise<CompetitionReadinessWriteResult> {
  return request<CompetitionReadinessWriteResult>('/api/readiness/write', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function fetchDemoDrill(): Promise<DemoDrillResult> {
  return request<DemoDrillResult>('/api/demo_drill');
}

export async function runDemoDrill(): Promise<DemoDrillResult> {
  return request<DemoDrillResult>('/api/demo_drill/run', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function runExternalAgentDemo(): Promise<ExternalAgentDemoResult> {
  return request<ExternalAgentDemoResult>('/api/integrations/openclaw/minimal_agent_demo', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function createSubmissionPackage(): Promise<SubmissionPackageResult> {
  return request<SubmissionPackageResult>('/api/submission_package', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function createCleanSubmissionPackage(): Promise<SubmissionPackageResult> {
  return request<SubmissionPackageResult>('/api/submission_package/clean', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function evaluateSupervisorEvent(event: Record<string, unknown>): Promise<SupervisorEvaluation> {
  return request<SupervisorEvaluation>('/api/supervisor/evaluate', {
    method: 'POST',
    body: JSON.stringify(event)
  });
}

export async function evaluateSupervisorBatch(
  events: Record<string, unknown>[],
  options: { guard_enabled?: boolean; execute_in_sandbox?: boolean } = {}
): Promise<SupervisorBatchEvaluation> {
  return request<SupervisorBatchEvaluation>('/api/supervisor/batch_evaluate', {
    method: 'POST',
    body: JSON.stringify({
      events,
      guard_enabled: options.guard_enabled ?? true,
      execute_in_sandbox: options.execute_in_sandbox ?? false
    })
  });
}
