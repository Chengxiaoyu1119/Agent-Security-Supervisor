import { useMemo, useState } from 'react';
import type {
  AttackChain,
  AttackChainCompareResult,
  AttackChainRunResult,
  AttackChainStageRun,
  RunResult
} from '../../types';

export const chainNodes = ['规划 Agent', '样本生成 Agent', '执行 Agent', '目标智能体', '行为监督器', '评测 Agent'];

export function formatRunLabel(run: RunResult) {
  const time = run.created_at.slice(5, 19).replace('T', ' ');
  return `${time} · ${run.scenario.id} · 防护${run.guard_enabled ? '开' : '关'} · ${
    run.attack_success ? '攻击成功' : '已控制'
  }`;
}

export function useAgentChainViewModel({
  result,
  runs,
  chains,
  selectedChainId,
  chainResult,
  chainCompareResult
}: {
  result: RunResult | null;
  runs: RunResult[];
  chains: AttackChain[];
  selectedChainId: string;
  chainResult: AttackChainRunResult | null;
  chainCompareResult: AttackChainCompareResult | null;
}) {
  const activeChain = chains.find((chain) => chain.id === selectedChainId) ?? chains[0] ?? null;
  const currentChainResult = chainResult?.chain.id === activeChain?.id ? chainResult : null;
  const currentChainCompare = chainCompareResult?.chain.id === activeChain?.id ? chainCompareResult : null;
  const stageEvidence = useMemo<AttackChainStageRun[]>(() => {
    if (currentChainCompare) {
      return currentChainCompare.comparisons.map((item) => item.with_guard);
    }
    return currentChainResult?.stages ?? [];
  }, [currentChainCompare, currentChainResult]);

  const candidates = useMemo(() => {
    const map = new Map<string, RunResult>();
    stageEvidence.forEach((stage) => map.set(stage.run_id, stage.run));
    if (result) {
      map.set(result.run_id, result);
    }
    runs.forEach((run) => map.set(run.run_id, run));
    return Array.from(map.values());
  }, [result, runs, stageEvidence]);

  const [selectedRunId, setSelectedRunId] = useState('');
  const defaultRunId = stageEvidence[0]?.run_id ?? result?.run_id ?? candidates[0]?.run_id ?? '';
  const resolvedRunId = candidates.some((run) => run.run_id === selectedRunId) ? selectedRunId : defaultRunId;
  const activeRun = candidates.find((run) => run.run_id === resolvedRunId) ?? candidates[0] ?? null;
  const trace = useMemo(() => activeRun?.agent_trace ?? [], [activeRun?.agent_trace]);
  const activeAgents = useMemo(() => new Set(trace.map((item) => item.agent)), [trace]);

  return {
    activeChain,
    currentChainResult,
    currentChainCompare,
    stageEvidence,
    candidates,
    selectedRunId,
    setSelectedRunId,
    activeRun,
    trace,
    activeAgents
  };
}
