-- Seed: Demo organization (for local development)
-- Note: In production, orgs are created through onboarding flow

-- This seed assumes a test user already exists in auth.users
-- When using Supabase locally, create a user first via the dashboard

-- Insert demo org
insert into orgs (id, name, slug, mission, timezone, autonomy_level, plan)
values (
  '00000000-0000-0000-0000-000000000001',
  'Hope Community Foundation',
  'hope-community',
  'Empowering underserved communities through education, mentorship, and sustainable development programs.',
  'America/New_York',
  'suggestion',
  'starter'
);

-- Default agent configs for the demo org
insert into agent_configs (org_id, role_slug, display_name, enabled) values
  ('00000000-0000-0000-0000-000000000001', 'development_director', 'Director of Development', true),
  ('00000000-0000-0000-0000-000000000001', 'marketing_director', 'Marketing Director', true),
  ('00000000-0000-0000-0000-000000000001', 'executive_assistant', 'Executive Assistant', true);

-- Default heartbeat jobs for the demo org
insert into heartbeat_jobs (org_id, name, description, job_type, cron_expression, enabled) values
  ('00000000-0000-0000-0000-000000000001', 'Morning Email Triage', 'Scan inbox and flag important items', 'email_check', '0 8 * * 1-5', true),
  ('00000000-0000-0000-0000-000000000001', 'Weekly Grant Scan', 'Check for upcoming grant deadlines', 'grant_deadline_scan', '0 9 * * 1', true),
  ('00000000-0000-0000-0000-000000000001', 'Social Media Check', 'Review engagement and suggest responses', 'social_media_monitor', '0 10 * * 1-5', true),
  ('00000000-0000-0000-0000-000000000001', 'Meeting Prep', 'Prepare briefs for today meetings', 'calendar_prep', '0 7 * * 1-5', true),
  ('00000000-0000-0000-0000-000000000001', 'Weekly Analytics', 'Generate weekly performance report', 'analytics_report', '0 9 * * 1', true),
  ('00000000-0000-0000-0000-000000000001', 'Monthly CRM Health', 'Flag stale donor records', 'crm_sync', '0 9 1 * *', true);

-- Seed memory entries for the demo org
insert into memory_entries (org_id, category, title, content, auto_generated) values
  ('00000000-0000-0000-0000-000000000001', 'mission', 'Organization Mission',
   'Hope Community Foundation empowers underserved communities through education, mentorship, and sustainable development programs. Founded in 2010, we serve over 5,000 families annually across three counties.',
   false),
  ('00000000-0000-0000-0000-000000000001', 'programs', 'Youth Mentoring Program',
   'Our flagship program matches at-risk youth ages 12-18 with trained adult mentors. Currently serving 200 youth with a 90% program completion rate.',
   false),
  ('00000000-0000-0000-0000-000000000001', 'programs', 'Community Garden Initiative',
   'Urban farming program providing fresh produce to food deserts. Operates 12 community gardens across the service area.',
   false),
  ('00000000-0000-0000-0000-000000000001', 'brand_voice', 'Brand Guidelines',
   'Tone: Warm, hopeful, professional. Avoid jargon. Use people-first language. Always center community voices in our storytelling.',
   false);
