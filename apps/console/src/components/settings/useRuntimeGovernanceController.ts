import { useEffect, useState } from 'react';
import {
  fetchAuthContext,
  fetchMemoryGovernance,
  fetchObservabilityMetrics,
  fetchPolicyConfig,
  rollbackLatestMemory,
  updateMemoryStatus,
  updatePolicySettings
} from '@/api';
import type { AuthContext, MemoryGovernance, ObservabilityMetrics, PolicySettings } from '@/types';

export function useRuntimeGovernanceController(setSharedError: (message: string) => void) {
  const [authContext, setAuthContext] = useState<AuthContext | null>(null);
  const [policySettings, setPolicySettings] = useState<PolicySettings | null>(null);
  const [observabilityMetrics, setObservabilityMetrics] = useState<ObservabilityMetrics | null>(null);
  const [memoryGovernance, setMemoryGovernance] = useState<MemoryGovernance | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [refreshingGovernance, setRefreshingGovernance] = useState(false);

  useEffect(() => {
    void loadGovernanceData()
      .then(({ auth, config, metrics, memory }) => {
        setAuthContext(auth);
        setPolicySettings(config.settings);
        setObservabilityMetrics(metrics);
        setMemoryGovernance(memory);
      })
      .catch((error: unknown) => {
        setSharedError(error instanceof Error ? error.message : '运行治理状态刷新失败');
      });
  }, [setSharedError]);

  async function handleRefreshGovernance() {
    setRefreshingGovernance(true);
    setSharedError('');
    try {
      const { auth, config, metrics, memory } = await loadGovernanceData();
      setAuthContext(auth);
      setPolicySettings(config.settings);
      setObservabilityMetrics(metrics);
      setMemoryGovernance(memory);
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : '运行治理状态刷新失败');
    } finally {
      setRefreshingGovernance(false);
    }
  }

  async function handleSavePolicySettings() {
    if (!policySettings) return;
    setSavingSettings(true);
    setSharedError('');
    try {
      setPolicySettings(
        await updatePolicySettings({
          ...policySettings,
          operator: 'security-admin',
          comment: '通过运行治理中心更新策略阈值'
        })
      );
      await handleRefreshGovernance();
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : '策略阈值保存失败');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleMemoryStatus(memoryId: string, status: string) {
    setSharedError('');
    try {
      await updateMemoryStatus(memoryId, status);
      setMemoryGovernance(await fetchMemoryGovernance());
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : '记忆状态更新失败');
    }
  }

  async function handleRollbackMemory() {
    setSharedError('');
    try {
      await rollbackLatestMemory();
      setMemoryGovernance(await fetchMemoryGovernance());
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : '记忆回滚失败');
    }
  }

  return {
    authContext,
    handleMemoryStatus,
    handleRefreshGovernance,
    handleRollbackMemory,
    handleSavePolicySettings,
    memoryGovernance,
    observabilityMetrics,
    policySettings,
    refreshingGovernance,
    savingSettings,
    setPolicySettings
  };
}

async function loadGovernanceData() {
  const [auth, config, metrics, memory] = await Promise.all([
    fetchAuthContext(),
    fetchPolicyConfig(),
    fetchObservabilityMetrics(),
    fetchMemoryGovernance()
  ]);
  return { auth, config, metrics, memory };
}
