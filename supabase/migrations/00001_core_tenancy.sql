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
