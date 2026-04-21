-- Migration 00020: Composio social-media connection references
--
-- Context: Z wants zero-BYOK friction for social posting. Composio
-- (https://composio.dev) brokers OAuth to Instagram, Facebook, LinkedIn, TikTok,
-- X/Twitter, Threads, WhatsApp on behalf of end-user orgs. We pass `org_id` as
-- the Composio `user_id`, so the OAuth flow lives entirely inside Composio —
-- we never hold the platform's access tokens ourselves.
--
-- This table stores the cross-reference between (org_id, toolkit) and the
-- Composio connection ID so we can:
--   1. Show which social accounts an org has connected on the Settings page
--   2. Disconnect via the Composio API when the user clicks "Disconnect"
--   3. Detect "not connected yet" at tool-call time without round-tripping
--      to Composio (fast path — Composio is still the source of truth).
--
-- We deliberately don't reuse the generic `integrations` table because:
--   - Its `type` check constraint (see 00007) is a finite enum and already
--     includes 'instagram', 'facebook', 'linkedin', 'twitter'. Adding 'tiktok'
--     and 'threads' would work but the `integrations.access_token_encrypted`
--     column is meaningless for Composio (we don't hold tokens).
--   - A separate table keeps the contract clean: rows here ↔ Composio
--     connections, not OAuth tokens we manage.
--
-- Manual apply: like 00019, this file needs to be applied manually against
-- Supabase (supabase db push or pgAdmin). It's also concatenated into
-- combined_migration.sql for fresh bootstraps.

create table if not exists composio_connections (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  toolkit text not null,
  composio_connection_id text not null,
  -- Optional Composio user_id we passed (usually the org_id itself). Stored so
  -- we can reconstruct the Composio session context without guessing.
  composio_user_id text,
  -- Human-readable label shown in the UI ("@citlali_art" / "CLM Studios Page").
  -- Populated lazily from the first successful tool call if available.
  display_name text,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  connected_by uuid references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, toolkit)
);

create index if not exists idx_composio_connections_org
  on composio_connections(org_id);

create index if not exists idx_composio_connections_connection_id
  on composio_connections(composio_connection_id);

alter table composio_connections enable row level security;

create policy "Tenant isolation — composio_connections"
  on composio_connections
  for all using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

create trigger composio_connections_updated_at
  before update on composio_connections
  for each row execute function update_updated_at();
