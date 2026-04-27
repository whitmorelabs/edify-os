-- Phase 3: The Story Engine -- impact data and story outputs tables

CREATE TABLE IF NOT EXISTS impact_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  program TEXT NOT NULL,
  period TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  context TEXT,
  source_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  program TEXT NOT NULL,
  period TEXT NOT NULL,
  format TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_impact_data_org_program ON impact_data (org_id, program);
CREATE INDEX IF NOT EXISTS idx_impact_data_org_period ON impact_data (org_id, period);
CREATE INDEX IF NOT EXISTS idx_story_outputs_org ON story_outputs (org_id);
