-- M1: Add UNIQUE constraint on heartbeat_jobs(org_id, name)
-- Required for upsert with onConflict: 'org_id,name' to work correctly.
ALTER TABLE heartbeat_jobs
  ADD CONSTRAINT heartbeat_jobs_org_name_unique UNIQUE (org_id, name);

-- M2: Add index on members(user_id) for faster single-column user_id lookups.
-- The existing UNIQUE(org_id, user_id) constraint is not used for user_id-only queries
-- (e.g., getAuthContext queries members by user_id alone on every request).
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- M4: Add anthropic_api_key_hint column to orgs.
-- Stores the last 4 characters of the real plaintext key set at BYOK submission time.
-- Shown in UI instead of slicing the encrypted blob, which could leak real key material.
ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS anthropic_api_key_hint TEXT;
