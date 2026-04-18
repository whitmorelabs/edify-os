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
