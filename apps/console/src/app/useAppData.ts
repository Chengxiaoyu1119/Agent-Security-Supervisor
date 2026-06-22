import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAlerts,
  fetchAttackChains,
  fetchAuditLogs,
  fetchHealth,
  fetchOverview,
  fetchPolicies,
  fetchReport,
  fetchScenarios,
  subscribeRuntimeEvents
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
import { fallbackOverview, fallbackPolicies } from '../fallback';
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
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting' | 'offline'>('offline');
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState('');

  const refresh = useCallback(async () => {
    const backendHealthy = await fetchHealth();
    const data = backendHealthy ? await fetchOverview() : fallbackOverview;
    const nextPolicies = backendHealthy ? await fetchPolicies() : fallbackPolicies;
    setApiAvailable(backendHealthy);
    setOverview(data);
    setScenarios(data.scenarios);
    setAuditLogs(data.audit_logs);
    setAlerts(data.alerts);
    setPolicies(nextPolicies);
    if (!backendHealthy) {
      setRealtimeStatus('offline');
      setApiNotice('当前后端未连接，页面会使用内置样本数据；启动 FastAPI 后可写入真实实验日志。');
    } else if (!data.recent_runs.length) {
      setApiNotice('后端已连接，目前暂无真实实验日志；运行脚本后这里会展示最新结果。');
    } else {
      setApiNotice('');
    }
    return backendHealthy;
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
    let ignore = false;
    void Promise.resolve().then(async () => {
      const backendHealthy = await refresh();
      if (ignore || !backendHealthy) {
        return;
      }
      fetchScenarios()
        .then((data) => {
          if (!ignore) setScenarios(data);
        })
        .catch(() => undefined);
      fetchAttackChains()
        .then((data) => {
          if (ignore) return;
          setAttackChains(data);
          if (data[0]?.id) {
            setSelectedAttackChain((current) => current || data[0].id);
          }
        })
        .catch(() => undefined);
    });
    return () => {
      ignore = true;
    };
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

  useEffect(() => {
    if (!apiAvailable) {
      return;
    }
    let stopped = false;
    let refreshTimer: number | undefined;
    let controller: AbortController | undefined;

    const connect = async () => {
      while (!stopped) {
        controller = new AbortController();
        setRealtimeStatus('reconnecting');
        try {
          setRealtimeStatus('connected');
          await subscribeRuntimeEvents((event) => {
            setLastRealtimeEvent(event.type);
            if (refreshTimer !== undefined) {
              window.clearTimeout(refreshTimer);
            }
            refreshTimer = window.setTimeout(() => {
              void refresh();
            }, 180);
          }, controller.signal);
        } catch {
          if (!stopped) {
            setRealtimeStatus('reconnecting');
          }
        }
        if (!stopped) {
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }
      }
    };
    void connect();
    return () => {
      stopped = true;
      controller?.abort();
      if (refreshTimer !== undefined) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, [apiAvailable, refresh]);

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
    apiAvailable,
    realtimeStatus,
    lastRealtimeEvent,
    setApiNotice,
    refresh,
    loadReport,
    loadAuditLogs,
    loadAlerts,
    activeScenario
  };
}
