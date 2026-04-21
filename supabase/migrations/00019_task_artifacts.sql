-- Migration 00019: Route completed agent artifacts to the Tasks page
--
-- Context: Previously every assistant response leaked into the Inbox via a
-- "long messages fallback" in /api/inbox/pending. Z's 2026-04-21 review:
-- "All messages are filtering into Inbox instead of completed tasks — like
-- written emails or social posts. So things that don't actually require
-- approval are making their way into the inbox."
--
-- Fix: Inbox = strictly approvals (require user decision).
--      Tasks page = completed agent work that does NOT require sign-off.
--
-- Schema additions on `tasks`:
--   - kind text                → artifact type label (chat_reply, email_draft,
--                                 social_post, etc.). Nullable; defaults NULL
--                                 for legacy / non-artifact rows.
--   - preview text             → short preview of the artifact output (first
--                                 ~400 chars of text, or file summary).
--   - agent_role text          → archetype slug of the producer. Nullable.
--                                 Mirrors task_steps.agent_role so we can
--                                 resolve producer without a join to
--                                 agent_configs (which is optional / not
--                                 always populated for web-chat tasks).
--
-- No data backfill: existing tasks stay as-is (they're already real task rows
-- written by the agent-task worker). Only NEW chat artifacts will carry kind/
-- preview/agent_role. Inbox filter change handles the old assistant-message
-- leak by simply not reading from messages anymore.

alter table tasks
  add column if not exists kind text,
  add column if not exists preview text,
  add column if not exists agent_role text;

create index if not exists idx_tasks_org_kind
  on tasks(org_id, kind)
  where kind is not null;
