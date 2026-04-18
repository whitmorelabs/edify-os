-- Migration 00014: Explicit RLS policies for integrations table
--
-- Context: 00006_integrations.sql already adds a blanket "Tenant isolation" policy
-- (for all using org_id in members). This migration adds explicit per-operation
-- policies that are more readable and match the conventions on orgs/members tables.
-- The blanket policy is dropped first to avoid conflicts.
--
-- All API routes that write integrations use the service client (RLS-bypassing),
-- so these policies mainly govern any future direct-from-client use and read access
-- for client components that may be added in Phase 2b/c/d.

-- Drop the blanket policy added in 00006
drop policy if exists "Tenant isolation" on integrations;

-- SELECT: any member of the org can see their org's integrations
create policy "Members can view org integrations"
  on integrations for select
  using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- INSERT: any member of the org can insert integrations for their org
create policy "Members can insert org integrations"
  on integrations for insert
  with check (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- UPDATE: any member of the org can update their org's integrations
create policy "Members can update org integrations"
  on integrations for update
  using (
    org_id in (select org_id from members where user_id = auth.uid())
  );

-- DELETE: any member of the org can delete their org's integrations
create policy "Members can delete org integrations"
  on integrations for delete
  using (
    org_id in (select org_id from members where user_id = auth.uid())
  );
