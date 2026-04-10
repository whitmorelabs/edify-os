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
