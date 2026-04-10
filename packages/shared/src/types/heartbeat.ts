export type HeartbeatJobType =
  | 'email_check'
  | 'grant_deadline_scan'
  | 'social_media_monitor'
  | 'crm_sync'
  | 'calendar_prep'
  | 'analytics_report'
  | 'custom';

export type HeartbeatRunStatus = 'running' | 'completed' | 'failed' | 'skipped';

export interface HeartbeatJob {
  id: string;
  org_id: string;
  agent_config_id: string | null;
  name: string;
  description: string | null;
  job_type: HeartbeatJobType;
  cron_expression: string;
  config: Record<string, unknown>;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export interface HeartbeatRun {
  id: string;
  job_id: string;
  task_id: string | null;
  status: HeartbeatRunStatus;
  findings_summary: string | null;
  items_found: number;
  started_at: string;
  completed_at: string | null;
}
