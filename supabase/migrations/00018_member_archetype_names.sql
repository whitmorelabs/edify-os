-- Migration 00018: Per-member custom archetype names
--
-- Adds an archetype_names JSONB column to the members table.
-- Each member can store a map of archetype slug -> custom name.
-- Example: { "executive_assistant": "Anna", "marketing_director": "Mira" }
-- Missing keys fall back to the role's default title in the UI.

alter table members
  add column if not exists archetype_names jsonb not null default '{}'::jsonb;
