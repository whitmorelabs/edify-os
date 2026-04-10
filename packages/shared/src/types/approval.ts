export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'auto_approved';

export type ApprovalUrgency = 'low' | 'normal' | 'high' | 'critical';

export interface Approval {
  id: string;
  org_id: string;
  task_id: string;
  agent_config_id: string | null;
  title: string;
  summary: string;
  proposed_action: Record<string, unknown>;
  output_preview: string | null;
  confidence_score: number | null;
  urgency: ApprovalUrgency;
  status: ApprovalStatus;
  decided_by: string | null;
  decision_note: string | null;
  slack_message_ts: string | null;
  expires_at: string | null;
  decided_at: string | null;
  created_at: string;
}

export type DigestChannel = 'email' | 'slack' | 'web';
export type DigestFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';

export interface DigestPreference {
  id: string;
  member_id: string;
  org_id: string;
  channel: DigestChannel;
  frequency: DigestFrequency;
  delivery_time: string;
  enabled: boolean;
}
