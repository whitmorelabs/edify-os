-- Migration: 00022_mcp_connections
-- Stores per-org OAuth tokens for MCP server connections.
-- Applied manually by Citlali — DO NOT apply automatically.
--
-- Usage:
--   supabase db push   (or paste into the Supabase SQL editor)
--
-- Sprint 1: table exists but is only read by the env-var fallback path in
--   apps/web/src/lib/mcp/registry.ts. Sprint 2 adds the admin UI and OAuth
--   flow that populates this table.

create table public.mcp_connections (
  id           uuid        primary key default gen_random_uuid(),
  org_id       uuid        not null references orgs(id) on delete cascade,
  server_name  text        not null,
  access_token text        not null,
  refresh_token text,
  expires_at   timestamptz,
  metadata     jsonb       default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, server_name)
);

-- Enable RLS. Service role bypasses all policies so the app server can read/write freely.
-- Row-level policies for end-users will be added in Sprint 2 when the admin UI ships.
alter table public.mcp_connections enable row level security;

create policy "Service role access"
  on public.mcp_connections
  for all
  using (true);

-- Keep updated_at in sync automatically.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Only create the trigger if it doesn't already exist (safe for re-runs).
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_mcp_connections_updated_at'
  ) then
    create trigger set_mcp_connections_updated_at
      before update on public.mcp_connections
      for each row execute function public.set_updated_at();
  end if;
end;
$$;
