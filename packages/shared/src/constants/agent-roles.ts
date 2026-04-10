import type { AgentRoleDefinition } from '../types/agent';

export const AGENT_ROLES: AgentRoleDefinition[] = [
  {
    slug: 'development_director',
    display_name: 'Director of Development',
    description:
      'Manages fundraising, grant research, donor engagement, and revenue strategy.',
    icon: 'landmark',
    subagents: [
      'grant_research',
      'grant_writing',
      'donor_outreach',
      'crm_update',
      'reporting',
    ],
  },
  {
    slug: 'marketing_director',
    display_name: 'Marketing Director',
    description:
      'Handles brand messaging, social media, email campaigns, and content strategy.',
    icon: 'megaphone',
    subagents: [
      'social_media',
      'email_campaign',
      'content_writing',
      'analytics',
    ],
  },
  {
    slug: 'executive_assistant',
    display_name: 'Executive Assistant',
    description:
      'Manages schedules, triages emails, preps meetings, and coordinates tasks.',
    icon: 'calendar-check',
    subagents: [
      'calendar_agent',
      'email_triage',
      'meeting_prep',
      'task_management',
    ],
  },
];

export const AGENT_ROLE_MAP = Object.fromEntries(
  AGENT_ROLES.map((r) => [r.slug, r])
) as Record<string, AgentRoleDefinition>;
