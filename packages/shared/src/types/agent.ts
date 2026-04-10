import type { AutonomyLevel } from './org';

export type AgentRoleSlug =
  | 'development_director'
  | 'marketing_director'
  | 'executive_assistant';

export interface AgentConfig {
  id: string;
  org_id: string;
  role_slug: AgentRoleSlug;
  display_name: string;
  persona_overrides: Record<string, unknown>;
  enabled: boolean;
  autonomy_level: AutonomyLevel | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRoleDefinition {
  slug: AgentRoleSlug;
  display_name: string;
  description: string;
  icon: string;
  subagents: string[];
}
