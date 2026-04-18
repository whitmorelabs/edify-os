-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Organizations (tenants)
create table orgs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  mission text,
  website text,
  timezone text default 'America/New_York',
  autonomy_level text default 'suggestion'
    check (autonomy_level in ('suggestion', 'assisted', 'autonomous')),
  onboarding_completed_at timestamptz,
  plan text default 'free' check (plan in ('free', 'starter', 'pro', 'enterprise')),
  stripe_customer_id text,
  -- BYOK: each org provides their own Anthropic API key
  anthropic_api_key_encrypted text,
  anthropic_api_key_set_at timestamptz,
  anthropic_api_key_valid boolean default false,
  ai_enabled boolean generated always as (anthropic_api_key_encrypted is not null) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Members (human users within an org)
create table members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  slack_user_id text,
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- Row Level Security
alter table orgs enable row level security;
alter table members enable row level security;

create policy "Members can view their org"
  on orgs for select using (
    id in (select org_id from members where user_id = auth.uid())
  );

create policy "Admins can update their org"
  on orgs for update using (
    id in (select org_id from members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

create policy "Members can view fellow members"
  on members for select using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "Admins can manage members"
  on members for all using (
    org_id in (select org_id from members where user_id = auth.uid() and role in ('owner', 'admin'))
  );

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orgs_updated_at
  before update on orgs
  for each row execute function update_updated_at();
-- Agent configurations per org
create table agent_configs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  role_slug text not null,
  display_name text not null,
  persona_overrides jsonb default '{}',
  enabled boolean default true,
  autonomy_level text check (autonomy_level is null or autonomy_level in ('suggestion', 'assisted', 'autonomous')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, role_slug)
);

-- Tasks (unit of work)
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  agent_config_id uuid references agent_configs(id),
  parent_task_id uuid references tasks(id),
  source text not null check (source in (
    'user_request', 'slack', 'heartbeat', 'agent_delegated'
  )),
  title text not null,
  description text,
  status text default 'pending' check (status in (
    'pending', 'planning', 'executing', 'awaiting_approval',
    'approved', 'completed', 'failed', 'cancelled'
  )),
  priority int default 5 check (priority between 1 and 10),
  input_data jsonb default '{}',
  output_data jsonb,
  confidence_score numeric(3,2),
  error_message text,
  requested_by uuid references members(id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_tasks_org_status on tasks(org_id, status);
create index idx_tasks_parent on tasks(parent_task_id);
create index idx_tasks_agent on tasks(agent_config_id, status);

-- Task execution log
create table task_steps (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  step_number int not null,
  agent_role text not null,
  action text not null,
  input_summary text,
  output_summary text,
  claude_model text,
  token_usage jsonb,
  duration_ms int,
  created_at timestamptz default now()
);

create index idx_task_steps_task on task_steps(task_id, step_number);

-- RLS
alter table agent_configs enable row level security;
alter table tasks enable row level security;
alter table task_steps enable row level security;

create policy "Tenant isolation" on agent_configs
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "Tenant isolation" on tasks
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "Tenant isolation" on task_steps
  for all using (
    task_id in (select id from tasks where org_id in (
      select org_id from members where user_id = auth.uid()
    ))
  );

create trigger agent_configs_updated_at
  before update on agent_configs
  for each row execute function update_updated_at();

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();
-- Org knowledge base (persistent memory)
create table memory_entries (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  category text not null check (category in (
    'mission', 'programs', 'donors', 'grants', 'campaigns',
    'brand_voice', 'contacts', 'processes', 'general'
  )),
  title text not null,
  content text not null,
  embedding vector(1536),
  source text,
  created_by uuid references members(id),
  auto_generated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_memory_org_cat on memory_entries(org_id, category);
create index idx_memory_embedding on memory_entries
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Conversations (chat threads with agents)
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  agent_config_id uuid references agent_configs(id),
  member_id uuid references members(id),
  slack_channel_id text,
  slack_thread_ts text,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_conversations_org on conversations(org_id);
create index idx_conversations_slack on conversations(slack_channel_id, slack_thread_ts);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}',
  task_id uuid references tasks(id),
  created_at timestamptz default now()
);

create index idx_messages_convo on messages(conversation_id, created_at);

-- RLS
alter table memory_entries enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Tenant isolation" on memory_entries
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "Tenant isolation" on conversations
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "Tenant isolation" on messages
  for all using (
    conversation_id in (select id from conversations where org_id in (
      select org_id from members where user_id = auth.uid()
    ))
  );

create trigger memory_entries_updated_at
  before update on memory_entries
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();
-- Heartbeat job definitions
create table heartbeat_jobs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  agent_config_id uuid references agent_configs(id),
  name text not null,
  description text,
  job_type text not null check (job_type in (
    'email_check', 'grant_deadline_scan', 'social_media_monitor',
    'crm_sync', 'calendar_prep', 'analytics_report', 'custom'
  )),
  cron_expression text not null,
  config jsonb default '{}',
  enabled boolean default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz default now()
);

create index idx_heartbeat_jobs_org on heartbeat_jobs(org_id, enabled);

-- Heartbeat execution history
create table heartbeat_runs (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references heartbeat_jobs(id) on delete cascade,
  task_id uuid references tasks(id),
  status text default 'running' check (status in (
    'running', 'completed', 'failed', 'skipped'
  )),
  findings_summary text,
  items_found int default 0,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_heartbeat_runs_job on heartbeat_runs(job_id, started_at desc);

-- RLS
alter table heartbeat_jobs enable row level security;
alter table heartbeat_runs enable row level security;

create policy "Tenant isolation" on heartbeat_jobs
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "Tenant isolation" on heartbeat_runs
  for all using (
    job_id in (select id from heartbeat_jobs where org_id in (
      select org_id from members where user_id = auth.uid()
    ))
  );
-- Approval queue items
create table approvals (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  task_id uuid not null references tasks(id),
  agent_config_id uuid references agent_configs(id),
  title text not null,
  summary text not null,
  proposed_action jsonb not null,
  output_preview text,
  confidence_score numeric(3,2),
  urgency text default 'normal' check (urgency in ('low', 'normal', 'high', 'critical')),
  status text default 'pending' check (status in (
    'pending', 'approved', 'rejected', 'expired', 'auto_approved'
  )),
  decided_by uuid references members(id),
  decision_note text,
  slack_message_ts text,
  expires_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz default now()
);

create index idx_approvals_org_status on approvals(org_id, status);
create index idx_approvals_task on approvals(task_id);

-- Digest preferences
create table digest_preferences (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  channel text not null check (channel in ('email', 'slack', 'web')),
  frequency text default 'daily' check (frequency in (
    'realtime', 'hourly', 'daily', 'weekly'
  )),
  delivery_time time default '09:00',
  enabled boolean default true,
  unique(member_id, org_id, channel)
);

-- RLS
alter table approvals enable row level security;
alter table digest_preferences enable row level security;

create policy "Tenant isolation" on approvals
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create policy "Tenant isolation" on digest_preferences
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );
-- OAuth tokens and integration configs
create table integrations (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  type text not null check (type in (
    'slack', 'gmail', 'google_calendar', 'google_drive',
    'salesforce', 'mailchimp', 'constant_contact'
  )),
  config jsonb default '{}',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  connected_by uuid references members(id),
  status text default 'active' check (status in ('active', 'expired', 'revoked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, type)
);

create index idx_integrations_org on integrations(org_id);

-- RLS
alter table integrations enable row level security;

create policy "Tenant isolation" on integrations
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create trigger integrations_updated_at
  before update on integrations
  for each row execute function update_updated_at();

-- Enable realtime for key tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table approvals;
alter publication supabase_realtime add table messages;
-- Expand integration types to support all 34 connectors
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_type_check;

ALTER TABLE integrations ADD CONSTRAINT integrations_type_check
  CHECK (type IN (
    -- Email
    'gmail', 'outlook',
    -- Calendar
    'google_calendar', 'outlook_calendar',
    -- CRM & Donors
    'salesforce', 'hubspot', 'bloomerang', 'donorperfect', 'little_green_light',
    -- Marketing
    'mailchimp', 'constant_contact',
    -- Social Media
    'facebook', 'instagram', 'linkedin', 'twitter',
    -- Documents
    'google_drive', 'dropbox', 'onedrive',
    -- Grants
    'instrumentl', 'grantstation', 'foundation_directory',
    -- Project Management
    'asana', 'monday', 'trello',
    -- Finance
    'quickbooks', 'xero',
    -- Website
    'wordpress', 'squarespace',
    -- Communication
    'slack', 'microsoft_teams',
    -- Events
    'eventbrite', 'givesmart',
    -- Payments
    'stripe', 'paypal'
  ));
-- Add missing memory categories for new archetypes (Finance, HR/Volunteer, Events)
ALTER TABLE memory_entries DROP CONSTRAINT IF EXISTS memory_entries_category_check;

ALTER TABLE memory_entries ADD CONSTRAINT memory_entries_category_check
  CHECK (category IN (
    'mission', 'programs', 'donors', 'grants', 'campaigns',
    'brand_voice', 'contacts', 'processes', 'general',
    'financials', 'volunteers', 'events'
  ));
-- Documents: uploaded files attached to org memory
create table documents (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  uploaded_by uuid references members(id),
  file_name text not null,
  file_size_bytes int,
  mime_type text,
  storage_path text,                -- Supabase Storage object path
  category text not null check (category in (
    'strategic_plan', 'grant_proposal', 'donor_list', 'financial_statement',
    'program_description', 'marketing_materials', 'event_plan',
    'staff_roster', 'board_documents', 'other'
  )),
  parsed_text text,                 -- extracted text for memory injection
  processing_status text default 'pending' check (processing_status in (
    'pending', 'processing', 'done', 'failed'
  )),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_documents_org on documents(org_id, category);

alter table documents enable row level security;

create policy "Tenant isolation" on documents
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

-- Notifications: in-app notifications per member
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  type text not null check (type in ('checkin', 'message', 'system', 'approval')),
  title text not null,
  body text,
  archetype text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_member on notifications(member_id, read, created_at desc);
create index idx_notifications_org on notifications(org_id, created_at desc);

alter table notifications enable row level security;

create policy "Members see their own notifications" on notifications
  for all using (
    member_id in (select id from members where user_id = auth.uid())
  );
-- Decision Lab scenarios and responses
create table decisions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  created_by uuid references members(id),
  scenario_text text not null,
  selected_archetypes text[],
  responses jsonb default '[]',     -- array of ArchetypeResponse objects
  synthesis jsonb,                  -- SynthesisResult object
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_decisions_org on decisions(org_id, created_at desc);

alter table decisions enable row level security;

create policy "Tenant isolation" on decisions
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create trigger decisions_updated_at
  before update on decisions
  for each row execute function update_updated_at();

-- Support chat messages (separate from team conversation messages)
create table support_messages (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  member_id uuid references members(id),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index idx_support_messages_member on support_messages(member_id, created_at desc);
create index idx_support_messages_org on support_messages(org_id, created_at desc);

alter table support_messages enable row level security;

create policy "Members see their own support messages" on support_messages
  for all using (
    member_id in (select id from members where user_id = auth.uid())
  );

-- 00011: heartbeat_jobs UNIQUE, members index, orgs key hint
-- M1: UNIQUE on heartbeat_jobs(org_id, name) for upsert correctness
ALTER TABLE heartbeat_jobs
  ADD CONSTRAINT heartbeat_jobs_org_name_unique UNIQUE (org_id, name);

-- M2: Index on members(user_id) for fast single-column lookups (getAuthContext)
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- M4: Store last-4-chars hint of plaintext Anthropic key (safe to display)
ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS anthropic_api_key_hint TEXT;
