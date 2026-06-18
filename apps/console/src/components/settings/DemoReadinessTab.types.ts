import type {
  AttackCaseDataset,
  CompetitionReadiness,
  CompetitionReadinessWriteResult,
  DemoDrillResult,
  Overview
} from '@/types';

export type DemoReadinessTabProps = {
  overview: Overview;
  attackDataset: AttackCaseDataset | null;
  demoDrill: DemoDrillResult | null;
  runningDemoDrill: boolean;
  handleRunDemoDrill: () => void | Promise<void>;
  competitionReadiness: CompetitionReadiness | null;
  competitionReadinessOutput: CompetitionReadinessWriteResult | null;
  checkingReadiness: boolean;
  handleRunReadiness: () => void | Promise<void>;
};
