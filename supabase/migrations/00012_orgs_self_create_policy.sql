-- 00012: Self-service org creation RLS policies
--
-- Allows a new authenticated user (with no existing org/member row) to create
-- their own org and claim it as owner during onboarding.
--
-- Existing policies (from 00001_core_tenancy.sql):
--   orgs:   SELECT "Members can view their org"
--           UPDATE "Admins can update their org"
--   members: SELECT "Members can view fellow members"
--            ALL    "Admins can manage members"  (requires existing membership)
--
-- Neither table has an INSERT policy for users who have NO membership yet.
-- This migration adds those two policies.

-- Policy 1: Any authenticated user can INSERT a new org.
-- (No self-referential check needed — they don't have a member row yet.)
CREATE POLICY "Authenticated users can create orgs"
  ON orgs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: An authenticated user can INSERT a members row for themselves,
-- but only if they don't already have one. Prevents joining a second org accidentally.
CREATE POLICY "Users can insert their own first member row"
  ON members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM members WHERE user_id = auth.uid()
    )
  );
