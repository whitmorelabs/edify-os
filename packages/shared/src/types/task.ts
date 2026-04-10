export type TaskStatus =
  | 'pending'
  | 'planning'
  | 'executing'
  | 'awaiting_approval'
  | 'approved'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TaskSource =
  | 'user_request'
  | 'slack'
  | 'heartbeat'
  | 'agent_delegated';

export interface Task {
  id: string;
  org_id: string;
  agent_config_id: string | null;
  parent_task_id: string | null;
  source: TaskSource;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  confidence_score: number | null;
  error_message: string | null;
  requested_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskStep {
  id: string;
  task_id: string;
  step_number: number;
  agent_role: string;
  action: string;
  input_summary: string | null;
  output_summary: string | null;
  claude_model: string | null;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    estimated_cost_usd: number;
  } | null;
  duration_ms: number | null;
  created_at: string;
}
