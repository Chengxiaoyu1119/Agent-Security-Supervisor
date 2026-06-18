import { useCallback, useMemo, useState } from 'react';
import type { AlertItem } from '@/types';
import { riskLabel, writeClipboardText } from '@/utils';

interface UseAlertsViewModelParams {
  alerts: AlertItem[];
}

const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function useAlertsViewModel({ alerts }: UseAlertsViewModelParams) {
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
  const scenarios = useMemo(
    () => Array.from(new Set(alerts.map((alert) => alert.scenario_id).filter(Boolean))),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const minRiskScore = riskScoreFilter === '全部' ? null : Number(riskScoreFilter);

    return alerts
      .filter((alert) => {
        const text =
          `${alert.title} ${alert.evidence} ${alert.policy_id ?? ''} ${alert.tool ?? ''} ${alert.scenario_id ?? ''} ${alert.recommendation ?? ''} ${(alert.risk_factors ?? []).join(' ')} ${alert.risk_score ?? ''}`.toLowerCase();

        return (
          (!keyword || text.includes(keyword)) &&
          (severityFilter === '全部' || alert.severity === severityFilter) &&
          (riskScoreFilter === '全部' || (alert.risk_score ?? 0) >= (minRiskScore ?? 0)) &&
          (decisionFilter === '全部' || alert.decision === decisionFilter) &&
          (policyFilter === '全部' || alert.policy_id === policyFilter) &&
          (scenarioFilter === '全部' || alert.scenario_id === scenarioFilter)
        );
      })
      .sort((a, b) => {
        const riskScoreDiff = (b.risk_score ?? 0) - (a.risk_score ?? 0);
        if (riskScoreDiff !== 0) return riskScoreDiff;
        const severityDiff = (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
        if (severityDiff !== 0) return severityDiff;
        return b.created_at.localeCompare(a.created_at);
      });
  }, [alerts, decisionFilter, policyFilter, query, riskScoreFilter, scenarioFilter, severityFilter]);

  const selectedAlert = filteredAlerts.find((alert) => alert.id === selectedAlertId) ?? filteredAlerts[0];
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const blockedCount = alerts.filter((alert) => alert.decision === '拒绝').length;
  const askedCount = alerts.filter((alert) => alert.decision === '询问').length;
  const isolatedCount = alerts.filter((alert) => alert.decision === '隔离').length;

  const resetAlertFilters = useCallback(() => {
    setQuery('');
    setSeverityFilter('全部');
    setRiskScoreFilter('全部');
    setDecisionFilter('全部');
    setPolicyFilter('全部');
    setScenarioFilter('全部');
  }, []);

  const copyAlertEvidence = useCallback(async () => {
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
  }, [selectedAlert]);

  const copyFilteredAlerts = useCallback(async () => {
    const text = filteredAlerts
      .map((alert, index) =>
        [
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
        ].join('\n')
      )
      .join('\n\n');
    const ok = await writeClipboardText(text || '当前筛选条件下没有告警记录。');
    setCopiedFiltered(ok);
    if (ok) {
      window.setTimeout(() => setCopiedFiltered(false), 1500);
    }
  }, [filteredAlerts]);

  return {
    query,
    setQuery,
    severityFilter,
    setSeverityFilter,
    riskScoreFilter,
    setRiskScoreFilter,
    decisionFilter,
    setDecisionFilter,
    policyFilter,
    setPolicyFilter,
    scenarioFilter,
    setScenarioFilter,
    selectedAlert,
    setSelectedAlertId,
    copied,
    copiedFiltered,
    policies,
    scenarios,
    filteredAlerts,
    criticalCount,
    blockedCount,
    askedCount,
    isolatedCount,
    resetAlertFilters,
    copyAlertEvidence,
    copyFilteredAlerts
  };
}
