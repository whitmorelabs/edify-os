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
