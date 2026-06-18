import { Space } from 'antd';
import { AttackDatasetPanel } from './AttackDatasetPanel';
import { CompetitionReadinessPanel } from './CompetitionReadinessPanel';
import { DemoDrillPanel } from './DemoDrillPanel';
import type { DemoReadinessTabProps } from './DemoReadinessTab.types';

export function DemoReadinessTab({
  overview,
  attackDataset,
  demoDrill,
  runningDemoDrill,
  handleRunDemoDrill,
  competitionReadiness,
  competitionReadinessOutput,
  checkingReadiness,
  handleRunReadiness
}: DemoReadinessTabProps) {
  return (
    <Space orientation="vertical" size="large" className="zh-tab-stack">
      <DemoDrillPanel
        demoDrill={demoDrill}
        runningDemoDrill={runningDemoDrill}
        handleRunDemoDrill={handleRunDemoDrill}
      />
      <CompetitionReadinessPanel
        competitionReadiness={competitionReadiness}
        competitionReadinessOutput={competitionReadinessOutput}
        checkingReadiness={checkingReadiness}
        handleRunReadiness={handleRunReadiness}
      />
      <AttackDatasetPanel overview={overview} attackDataset={attackDataset} />
    </Space>
  );
}
