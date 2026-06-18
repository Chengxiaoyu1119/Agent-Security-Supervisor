import { useMemo, useState } from 'react';
import type { AttackEffectivenessCase } from '../../types';

interface UseDefenseEvidenceBoardParams {
  cases: AttackEffectivenessCase[];
}

export function useDefenseEvidenceBoard({ cases }: UseDefenseEvidenceBoardParams) {
  const [surfaceFilter, setSurfaceFilter] = useState('全部');
  const [evidenceFilter, setEvidenceFilter] = useState('全部');
  const [query, setQuery] = useState('');

  const surfaces = useMemo(() => Array.from(new Set(cases.map((item) => item.surface_name))).sort(), [cases]);

  const filteredCases = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesSurface = surfaceFilter === '全部' || item.surface_name === surfaceFilter;
      const matchesEvidence =
        evidenceFilter === '全部' ||
        (evidenceFilter === '高风险' && ['critical', 'high'].includes(item.severity)) ||
        (evidenceFilter === '缺证据' && !item.evidence_complete) ||
        (evidenceFilter === 'hash待验' && !(item.guarded_hash_status?.valid && item.unguarded_hash_status?.valid)) ||
        (evidenceFilter === '已控制' && item.defense_effective_with_guard);
      const searchable =
        `${item.scenario_id} ${item.surface_name} ${item.title} ${item.target} ${item.observed_decisions.map((decision) => `${decision.policy_id} ${decision.decision}`).join(' ')}`.toLowerCase();

      return matchesSurface && matchesEvidence && (!keyword || searchable.includes(keyword));
    });
  }, [cases, evidenceFilter, query, surfaceFilter]);

  const sortedCases = [...filteredCases].sort((a, b) => {
    const aScore = Math.max(...a.observed_decisions.map((item) => item.risk_score ?? 0), 0);
    const bScore = Math.max(...b.observed_decisions.map((item) => item.risk_score ?? 0), 0);
    return bScore - aScore || a.scenario_id.localeCompare(b.scenario_id);
  });

  const completeCount = cases.filter((item) => item.evidence_complete).length;
  const hashValidCount = cases.filter(
    (item) => item.guarded_hash_status?.valid && item.unguarded_hash_status?.valid
  ).length;

  function resetFilters() {
    setQuery('');
    setSurfaceFilter('全部');
    setEvidenceFilter('全部');
  }

  return {
    query,
    setQuery,
    surfaceFilter,
    setSurfaceFilter,
    evidenceFilter,
    setEvidenceFilter,
    surfaces,
    sortedCases,
    completeCount,
    hashValidCount,
    resetFilters
  };
}
