import type { RunResult } from './runtime';
import type {
  ReportCounterItem,
  ReportDeliverable,
  ReportScenarioMatrix,
  ReportSummary,
  ReportSurfaceCoverage
} from './report/base';
import type { BenignEvaluation, BenignWorkflowEvaluation } from './report/benign';
import type { AttackEffectiveness, OutputFilterEvidence, SurfaceConclusionReport } from './report/evidence';
import type { CompetitionPackage } from './report/package';
import type { AnomalyCalibration, PolicyAblation, ProjectRoadmap } from './report/roadmap';

export * from './report/base';
export * from './report/benign';
export * from './report/evidence';
export * from './report/roadmap';
export * from './report/package';

export interface ReportData {
  markdown: string;
  summary: ReportSummary;
  surface_coverage: ReportSurfaceCoverage[];
  scenario_matrix: ReportScenarioMatrix[];
  deliverables: ReportDeliverable[];
  policy_hits: ReportCounterItem[];
  decision_counts: ReportCounterItem[];
  benign_evaluation: BenignEvaluation;
  benign_workflow_evaluation?: BenignWorkflowEvaluation;
  surface_conclusions: SurfaceConclusionReport;
  output_filter_evidence: OutputFilterEvidence;
  attack_effectiveness?: AttackEffectiveness;
  policy_ablation?: PolicyAblation;
  anomaly_calibration?: AnomalyCalibration;
  project_roadmap?: ProjectRoadmap;
  runs: RunResult[];
  competition_package?: CompetitionPackage;
}
