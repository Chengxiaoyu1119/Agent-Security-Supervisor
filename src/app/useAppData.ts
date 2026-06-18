import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAlerts,
  fetchAttackChains,
  fetchAuditLogs,
  fetchOverview,
  fetchPolicies,
  fetchReport,
  fetchScenarios
} from '../api';
import type {
  AlertItem,
  AttackChain,
  AttackChainCompareResult,
  AttackChainRunResult,
  AuditLog,
  BatchCompareResult,
  CompareResult,
  Overview,
  Policy,
  ReportData,
  RunResult,
  Scenario
} from '../types';
import { createFallbackReport } from './fallbackReport';
import type { PageKey } from './navigation';

export function useAppData(page: PageKey) {
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

  const refresh = useCallback(async () => {
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
  }, []);

  const loadReport = useCallback(async () => {
    try {
      const data = await fetchReport();
      setReport(data);
    } catch {
      setReport(createFallbackReport());
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    const logs = await fetchAuditLogs(100);
    setAuditLogs(logs);
  }, []);

  const loadAlerts = useCallback(async () => {
    const data = await fetchAlerts(100);
    setAlerts(data);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => refresh());
    fetchScenarios()
      .then(setScenarios)
      .catch(() => undefined);
    fetchAttackChains()
      .then((data) => {
        setAttackChains(data);
        if (data[0]?.id) {
          setSelectedAttackChain((current) => current || data[0].id);
        }
      })
      .catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    if (page === 'report') {
      void Promise.resolve().then(() => loadReport());
    }
    if (page === 'audit') {
      void Promise.resolve().then(() => loadAuditLogs());
    }
    if (page === 'alerts') {
      void Promise.resolve().then(() => loadAlerts());
    }
  }, [loadAlerts, loadAuditLogs, loadReport, page]);

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenario) ?? scenarios[0],
    [scenarios, selectedScenario]
  );

  return {
    overview,
    scenarios,
    selectedScenario,
    setSelectedScenario,
    policies,
    setPolicies,
    auditLogs,
    alerts,
    lastResult,
    setLastResult,
    compareResult,
    setCompareResult,
    batchResult,
    setBatchResult,
    attackChains,
    selectedAttackChain,
    setSelectedAttackChain,
    attackChainResult,
    setAttackChainResult,
    attackChainCompareResult,
    setAttackChainCompareResult,
    running,
    setRunning,
    guardEnabled,
    setGuardEnabled,
    report,
    apiNotice,
    setApiNotice,
    refresh,
    loadReport,
    loadAuditLogs,
    loadAlerts,
    activeScenario
  };
}
