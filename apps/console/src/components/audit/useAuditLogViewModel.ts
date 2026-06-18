import { useCallback, useEffect, useMemo, useState } from 'react';
import { decideApprovalReview, fetchApprovalReviews } from '@/api';
import type { ApprovalReview, ApprovalReviewList, AuditLog } from '@/types';
import { riskLabel, writeClipboardText } from '@/utils';

type ApprovalAction = 'approve' | 'reject';

interface UseAuditLogViewModelParams {
  logs: AuditLog[];
  refresh: () => void | Promise<void>;
}

const emptyApprovalQueue: ApprovalReviewList = {
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
};

export function useAuditLogViewModel({ logs, refresh }: UseAuditLogViewModelParams) {
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
  const [approvalQueue, setApprovalQueue] = useState<ApprovalReviewList>(emptyApprovalQueue);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [approvalBusyId, setApprovalBusyId] = useState('');

  const tools = useMemo(() => Array.from(new Set(logs.map((log) => log.tool))), [logs]);

  const filteredLogs = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const minRiskScore = riskScoreFilter === '全部' ? null : Number(riskScoreFilter);

    return logs
      .filter((log) => {
        const text =
          `${log.tool} ${log.decision} ${log.risk_level} ${log.policy_id} ${log.reason} ${log.recommendation} ${(log.risk_factors ?? []).join(' ')} ${log.risk_score ?? ''}`.toLowerCase();

        return (
          (!keyword || text.includes(keyword)) &&
          (decisionFilter === '全部' || log.decision === decisionFilter) &&
          (riskFilter === '全部' || log.risk_level === riskFilter) &&
          (riskScoreFilter === '全部' || (log.risk_score ?? 0) >= (minRiskScore ?? 0)) &&
          (toolFilter === '全部' || log.tool === toolFilter) &&
          (executionFilter === '全部' ||
            (executionFilter === '已执行' ? log.tool_output.executed : !log.tool_output.executed))
        );
      })
      .sort((a, b) => {
        const riskScoreDiff = (b.risk_score ?? 0) - (a.risk_score ?? 0);
        if (riskScoreDiff !== 0) return riskScoreDiff;
        return b.timestamp.localeCompare(a.timestamp);
      });
  }, [decisionFilter, executionFilter, logs, query, riskFilter, riskScoreFilter, toolFilter]);

  const selectedLog = filteredLogs.find((log) => log.id === selectedLogId) ?? filteredLogs[0];
  const controlledCount = logs.filter((log) => ['拒绝', '询问', '隔离'].includes(log.decision)).length;
  const highRiskCount = logs.filter((log) => ['high', 'critical'].includes(log.risk_level)).length;
  const executedCount = logs.filter((log) => log.tool_output.executed).length;

  const latestReviews = useMemo(
    () => [...approvalQueue.reviews].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [approvalQueue.reviews]
  );

  const loadApprovalReviews = useCallback(async () => {
    setApprovalLoading(true);
    setApprovalError('');
    try {
      setApprovalQueue(await fetchApprovalReviews('全部', 100));
    } catch {
      setApprovalError('复核队列暂时不可用，请确认后端服务已经启动。');
    } finally {
      setApprovalLoading(false);
    }
  }, []);

  const handleApprovalDecision = useCallback(
    async (review: ApprovalReview, action: ApprovalAction) => {
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
    },
    [loadApprovalReviews, refresh]
  );

  const copyApprovalEvidence = useCallback(async (review: ApprovalReview) => {
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
  }, []);

  const resetAuditFilters = useCallback(() => {
    setQuery('');
    setDecisionFilter('全部');
    setRiskFilter('全部');
    setRiskScoreFilter('全部');
    setToolFilter('全部');
    setExecutionFilter('全部');
  }, []);

  const copyEvidence = useCallback(async () => {
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
  }, [selectedLog]);

  const copyFilteredAuditEvidence = useCallback(async () => {
    const text = filteredLogs
      .map((log, index) =>
        [
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
        ].join('\n')
      )
      .join('\n\n');
    const ok = await writeClipboardText(text || '当前筛选条件下没有审计记录。');
    setCopiedFiltered(ok);
    if (ok) {
      window.setTimeout(() => setCopiedFiltered(false), 1500);
    }
  }, [filteredLogs]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadApprovalReviews();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadApprovalReviews]);

  return {
    query,
    setQuery,
    decisionFilter,
    setDecisionFilter,
    riskFilter,
    setRiskFilter,
    riskScoreFilter,
    setRiskScoreFilter,
    toolFilter,
    setToolFilter,
    executionFilter,
    setExecutionFilter,
    selectedLog,
    selectedLogId,
    setSelectedLogId,
    copied,
    copiedFiltered,
    copiedApprovalId,
    approvalQueue,
    approvalLoading,
    approvalError,
    approvalBusyId,
    tools,
    filteredLogs,
    controlledCount,
    highRiskCount,
    executedCount,
    latestReviews,
    loadApprovalReviews,
    handleApprovalDecision,
    copyApprovalEvidence,
    resetAuditFilters,
    copyEvidence,
    copyFilteredAuditEvidence
  };
}
