-- Phase 2: The Ripple — cross-agent event system
-- Stores organizational events and their generated follow-up actions

CREATE TABLE IF NOT EXISTS org_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  source_agent TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ripple_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES org_events(id),
  org_id UUID NOT NULL,
  target_agent TEXT NOT NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
