-- Activity events table — tracks every tool call / chat turn / heartbeat
-- run through an archetype, per org. Used to compute hours saved on read
-- (no precomputed aggregate — multiply count × estimate at query time so
-- we can tune estimates without data migration).

CREATE TABLE activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_key text NOT NULL,        -- one of the keys from TIME_SAVED_ESTIMATES_MINUTES
  archetype_slug text,            -- which director triggered it (null for system events)
  metadata jsonb DEFAULT '{}',    -- optional extras (e.g. tool_call_id, conversation_id)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_events_org_created
  ON activity_events(org_id, created_at DESC);

-- RLS: org members can read their own org's events.
-- Inserts are service-role only (no policy → anon/authed users cannot insert).
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read their activity events"
  ON activity_events FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM members WHERE user_id = auth.uid()
    )
  );
