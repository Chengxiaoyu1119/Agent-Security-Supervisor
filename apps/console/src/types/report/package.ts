export interface CompetitionPackageFile {
  filename: string;
  title: string;
  description: string;
  content_type: string;
  content: string;
  size: number;
}

export interface CompetitionChecklistItem {
  requirement: string;
  status: string;
  evidence: string;
}

export interface CompetitionPackage {
  generated_at: string;
  summary: {
    surface_count: number;
    scenario_count: number;
    demo_ready_surface_count: number;
    file_count: number;
    run_count: number;
    alert_count: number;
    control_rate: number;
  };
  checklist: CompetitionChecklistItem[];
  files: CompetitionPackageFile[];
  adapter_schema: Record<string, unknown>;
}

export interface SubmissionPackageResult {
  generated_at: string;
  package_dir: string;
  zip_path: string;
  file_count: number;
  summary: CompetitionPackage['summary'];
  clean_mode?: boolean;
  clean_summary?: {
    clean_run_count: number;
    clean_scenario_count: number;
    clean_guarded_run_count: number;
    clean_unguarded_run_count: number;
    clean_unguarded_attack_success_count: number;
    clean_guarded_controlled_count: number;
    clean_control_rate: number;
  };
  files: Array<{
    filename: string;
    relative_path: string;
    size: number;
  }>;
}
