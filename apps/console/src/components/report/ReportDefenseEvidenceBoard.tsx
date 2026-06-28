import { Space, Typography } from 'antd';
import type { AttackEffectivenessCase } from '@/types';
import { PanelCard } from '../ui';
import { DefenseEvidenceCard } from './DefenseEvidenceCard';
import { DefenseEvidenceFilters } from './DefenseEvidenceFilters';
import { DefenseEvidenceHeader } from './DefenseEvidenceHeader';
import { useDefenseEvidenceBoard } from './useDefenseEvidenceBoard';

export { EvidenceRunCell } from './EvidenceRunCell';

export function ReportDefenseEvidenceBoard({
  cases,
  onOpenScenario
}: {
  cases: AttackEffectivenessCase[];
  onOpenScenario: (id: string) => void;
}) {
  const view = useDefenseEvidenceBoard({ cases });

  return (
    <PanelCard variant="borderless" className="zh-mb-24">
      <DefenseEvidenceHeader
        completeCount={view.completeCount}
        hashValidCount={view.hashValidCount}
        totalCount={cases.length}
        visibleCount={view.sortedCases.length}
      />

      <DefenseEvidenceFilters
        query={view.query}
        surfaceFilter={view.surfaceFilter}
        evidenceFilter={view.evidenceFilter}
        surfaces={view.surfaces}
        onQueryChange={view.setQuery}
        onSurfaceFilterChange={view.setSurfaceFilter}
        onEvidenceFilterChange={view.setEvidenceFilter}
        onReset={view.resetFilters}
      />

      <Space orientation="vertical" className="zh-defense-evidence-list" size="large">
        {view.sortedCases.length ? (
          view.sortedCases.map((item) => (
            <DefenseEvidenceCard key={item.scenario_id} item={item} onOpenScenario={onOpenScenario} />
          ))
        ) : (
          <Typography.Text type="secondary" className="zh-defense-evidence-empty">
            没有匹配的证据卡，清空筛选后可查看全部脚本。
          </Typography.Text>
        )}
      </Space>
    </PanelCard>
  );
}
