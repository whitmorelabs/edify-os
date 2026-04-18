-- Migration 00015: Tighten integrations RLS — drop INSERT/UPDATE/DELETE policies
--
-- All writes to the integrations table go through the service-role client (bypasses RLS).
-- The INSERT/UPDATE/DELETE policies added in 00014 are therefore dead code, and their
-- WITH CHECK clauses would allow forging connected_by if a user-client write ever happened.
--
-- To re-enable user-client writes in the future, add explicit WITH CHECK policies that
-- constrain BOTH org_id (to the caller's org) AND connected_by (to the caller's member id).
--
-- The SELECT policy is kept — read access from client components is intentional.

drop policy if exists "Members can insert org integrations" on integrations;
drop policy if exists "Members can update org integrations" on integrations;
drop policy if exists "Members can delete org integrations" on integrations;

-- SELECT policy from 00014 is intentionally retained:
-- "Members can view org integrations"
