# Edify Plugin Pipeline — Citlali's Manual Next Steps

## 0. Blocked: upload-plugin-skills needs a fix before smoke test can proceed

The upload script ran but hit a 400 error from Anthropic's Skills API:

```
Skills API error 400: {"type":"error","error":{"type":"invalid_request_error",
"message":"No files provided. Please provide files using 'files[]' field."}}
```

**Root cause:** `scripts/upload-plugin-skills.ts` sends the ZIP as `name="file"` in the
multipart body. The Skills API expects the field name to be `files[]`.
Lopmon needs to patch line ~250 in that script before the upload can succeed.
No skill_id was returned — `apps/web/plugins/uploaded-ids.json` remains `{}`.

Additionally, `pnpm --filter web build` fails locally because the `next` package
directory in the pnpm virtual store is empty (Next.js binary missing). This appears
to be a pre-existing environment issue — Vercel handles the production build, so
this does not block deploy. Lopmon should investigate if local builds are needed.

---

## 1. Apply this Supabase migration in the SQL editor
(paste the SQL below into Supabase SQL editor, run it)

```sql
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
```

## 2. (Optional) Add Slack MCP token to Vercel
Set `SLACK_MCP_OAUTH_TOKEN=xoxb-...` in Vercel env if you want Slack MCP wired up.

## 3. Smoke test in chat
After the upload script bug is fixed and re-run, and after the next Vercel deploy lands,
chat Marketing Director:
"Draft a LinkedIn post for a community gala next month"
Expected: response uses content-creation skill structure (hook -> body -> CTA -> hashtags).
Server logs should show `container.skills: [{ type: "custom", skill_id: "skl_..." }]`.
