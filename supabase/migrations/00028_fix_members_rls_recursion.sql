-- Migration 00028: Break members<->orgs RLS policy recursion (Postgres 42P17)
--
-- Context: 2026-05-03, the production PostgREST request
--   GET /rest/v1/members?select=org_id,orgs(*)&user_id=eq.<uuid>
-- (fired by the dashboard for user db2c1533-d5e0-460b-9363-e1ba68a5c4be —
-- Citlali) returned a 500 with body:
--   { "code": "42P17",
--     "message": "infinite recursion detected in policy for relation \"members\"" }
--
-- Root cause (introduced in 00001_core_tenancy.sql):
--   The `members` SELECT policy "Members can view fellow members" is defined as
--     org_id IN (SELECT org_id FROM members WHERE user_id = auth.uid())
--   The subquery itself reads from `members`, so when Postgres evaluates the
--   policy on a row of `members` it has to apply the SELECT policy to the
--   subquery's `members` rows, which re-applies the same policy forever.
--   The same shape exists in:
--     - "Admins can manage members"  (members FOR ALL)
--     - "Users can insert their own first member row"  (members FOR INSERT,
--       added in 00012)  -- via NOT EXISTS (SELECT 1 FROM members ...)
--
-- For the failing query the recursion fires immediately on the SELECT of
-- members.* (the embedded `orgs(*)` PostgREST join is not even reached).
--
-- Fix: replace the self-referential subqueries with calls to two
-- SECURITY DEFINER helper functions that read `members` with the function
-- owner's privileges, bypassing RLS inside the function body. This breaks
-- the cycle while preserving the original semantics ("a user can see/manage
-- members of orgs they belong to").
--
-- This migration only touches policies on `members`. The `orgs` policies in
-- 00001 (which subquery from `members`) are NOT recursive on their own —
-- once the members SELECT policy is fixed, the `orgs(*)` embed in the
-- failing PostgREST query also resolves without looping.
--
-- Manual apply: run this file in the Supabase SQL Editor. Same workflow as
-- 00027.

-- ---------------------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER => bypass RLS within the body)
-- ---------------------------------------------------------------------------

-- Returns the set of org_ids the *currently authenticated* user is a member of.
-- Marked STABLE so the planner can fold it; SET search_path is the standard
-- guard against search_path hijacking on SECURITY DEFINER functions.
create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.members where user_id = auth.uid();
$$;

-- Returns the set of org_ids where the current user has admin/owner role.
create or replace function public.current_user_admin_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.members
  where user_id = auth.uid()
    and role in ('owner', 'admin');
$$;

-- Lock down execution: only authenticated users (and service_role) need these.
revoke all on function public.current_user_org_ids()       from public;
revoke all on function public.current_user_admin_org_ids() from public;
grant execute on function public.current_user_org_ids()       to authenticated, service_role;
grant execute on function public.current_user_admin_org_ids() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Drop the recursive policies (idempotent)
-- ---------------------------------------------------------------------------

-- From 00001_core_tenancy.sql
drop policy if exists "Members can view fellow members" on public.members;
drop policy if exists "Admins can manage members"       on public.members;

-- From 00012_orgs_self_create_policy.sql
drop policy if exists "Users can insert their own first member row" on public.members;

-- ---------------------------------------------------------------------------
-- 3. Recreate the policies using the helper functions
-- ---------------------------------------------------------------------------

-- Mirror of original "Members can view fellow members"
-- Semantic preserved: a member can see other members in any org they belong to.
create policy "Members can view fellow members"
  on public.members
  for select
  using (
    org_id in (select public.current_user_org_ids())
  );

-- Mirror of original "Admins can manage members" (FOR ALL)
-- Semantic preserved: owner/admin of an org can do anything on its members.
create policy "Admins can manage members"
  on public.members
  for all
  using (
    org_id in (select public.current_user_admin_org_ids())
  )
  with check (
    org_id in (select public.current_user_admin_org_ids())
  );

-- Mirror of original "Users can insert their own first member row" (00012)
-- Semantic preserved: an authenticated user can insert exactly one member row
-- for themselves, and only if they don't already have one. The NOT EXISTS
-- subquery is now wrapped in the helper so it doesn't re-trigger members RLS.
create policy "Users can insert their own first member row"
  on public.members
  for insert
  with check (
    user_id = auth.uid()
    and not exists (select 1 from public.current_user_org_ids())
  );
