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
