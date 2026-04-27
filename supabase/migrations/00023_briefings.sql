CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  date DATE NOT NULL,
  content JSONB NOT NULL,
  raw_responses JSONB,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, date)
);
