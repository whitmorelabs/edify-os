export type MessageRole = 'user' | 'assistant' | 'system';

export interface Conversation {
  id: string;
  org_id: string;
  agent_config_id: string | null;
  member_id: string | null;
  slack_channel_id: string | null;
  slack_thread_ts: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  task_id: string | null;
  created_at: string;
}
