-- Migration 00033: Cron-run idempotency guards
--
-- Context: a legacy frozen Vercel project (whitmorelabs/edify-os deployed at
-- edifyos.vercel.app) is still online and shares this Supabase backend with
-- the active project (clm-studios/edify-os deployed at edify-os.vercel.app).
-- Both deployments execute the SAME crons defined in apps/web/vercel.json
-- against the SAME database, so each scheduled fire happens twice. We cannot
-- decommission the legacy deploy right now (Z is AFK indefinitely), so we
-- mitigate at the database level: dedup at the (cron_kind, org_id, run_date)
-- granularity. The first call wins, the duplicate short-circuits before
-- doing any expensive LLM work.
--
-- The same guard also prevents accidental same-day re-runs from manual
-- triggers on top of a cron run.
--
-- Manual apply: run this file in the Supabase SQL Editor (Citlali). Same
-- workflow as 00027/00028.

-- ---------------------------------------------------------------------------
-- 1. cron_runs ledger table
-- ---------------------------------------------------------------------------

create table if not exists public.cron_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  org_id uuid not null references public.orgs(id) on delete cascade,
  run_date_utc date not null,
  created_at timestamptz not null default now(),
  unique (kind, org_id, run_date_utc)
);

create index if not exists idx_cron_runs_org_kind_date
  on public.cron_runs (org_id, kind, run_date_utc desc);

alter table public.cron_runs enable row level security;

-- No tenant SELECT policy: cron_runs is operational metadata. The service
-- role bypasses RLS, which is what the cron handlers use. Authenticated
-- users have no need to read this table directly.

-- ---------------------------------------------------------------------------
-- 2. SECURITY DEFINER helper to claim a cron run atomically
-- ---------------------------------------------------------------------------
--
-- Returns true if this caller successfully claimed the (kind, org_id, today)
-- slot (caller should proceed with the work). Returns false if another caller
-- already claimed it (caller should skip).
--
-- We rely on the UNIQUE(kind, org_id, run_date_utc) constraint above: the
-- INSERT either succeeds or raises 23505 (unique_violation). ON CONFLICT DO
-- NOTHING swallows the violation; we then check whether a row was inserted
-- by comparing FOUND. SECURITY DEFINER + locked-down search_path follows
-- the pattern from migration 00028.

create or replace function public.claim_cron_run(
  p_kind text,
  p_org_id uuid,
  p_run_date date default (now() at time zone 'utc')::date
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cron_runs (kind, org_id, run_date_utc)
  values (p_kind, p_org_id, p_run_date)
  on conflict (kind, org_id, run_date_utc) do nothing;
  return found;
end;
$$;

revoke all on function public.claim_cron_run(text, uuid, date) from public;
grant execute on function public.claim_cron_run(text, uuid, date) to service_role;
