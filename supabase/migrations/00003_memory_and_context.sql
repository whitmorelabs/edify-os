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
