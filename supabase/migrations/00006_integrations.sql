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
