-- 00013: Tighten orgs INSERT policy to prevent any authed user from creating multiple orgs.
--
-- The API route already enforces a 409 when the user has a member row, but RLS is the
-- safety net for direct database access that bypasses the API.
--
-- Previous policy (from 00012): WITH CHECK (auth.uid() IS NOT NULL)
-- New policy: also requires the user has no existing member row.

DROP POLICY IF EXISTS "Authenticated users can create orgs" ON orgs;

CREATE POLICY "Authenticated users can create orgs"
  ON orgs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM members WHERE user_id = auth.uid())
  );
