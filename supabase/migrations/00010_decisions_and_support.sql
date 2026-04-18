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
