# Edify Plugin Skills

This directory contains vendored copies of Anthropic's open-source `knowledge-work-plugins`
that power each archetype's domain expertise.

## What is a plugin skill?

A plugin skill is a directory containing a `SKILL.md` file (and optionally supporting scripts).
The `SKILL.md` encodes domain knowledge — writing frameworks, structured templates, best-practice
checklists — that the Anthropic Skills API bundles into a skill object and makes available to
Claude during inference.

Plugin skills are **different** from Edify's pre-built skills (`docx`, `xlsx`, `pptx`, `pdf`):
- Pre-built skills ship with Anthropic and are referenced by a fixed `skill_id` string.
- Plugin skills are uploaded from source via `POST /v1/skills` and return a dynamic `skill_id`
  that we store in `uploaded-ids.json`.

## Directory layout

```
plugins/
  uploaded-ids.json          — maps "plugin/skill" → Anthropic skill_id (written by upload script)
  README.md                  — this file
  marketing/
    content-creation/
      SKILL.md               — vendored from anthropics/knowledge-work-plugins
  <future plugins…>
```

## Adding a new plugin

1. Copy the skill directory from `anthropics/knowledge-work-plugins/<domain>/skills/<name>/`
   into the matching path under `apps/web/plugins/<domain>/<name>/`.
2. Add the archetype mapping in `apps/web/src/lib/plugins/registry.ts`.
3. Run `pnpm --filter web upload-plugin-skills` (requires `ANTHROPIC_API_KEY`).
4. The `uploaded-ids.json` file will be updated with the new `skill_id`.
5. The next deploy picks up the new ID automatically — no further code changes needed.

## Refreshing from upstream

To pull in upstream changes to an existing skill:

```bash
# Compare local vs upstream SKILL.md
gh api repos/anthropics/knowledge-work-plugins/contents/marketing/skills/content-creation/SKILL.md \
  --jq '.content' | base64 -d > /tmp/upstream-skill.md
diff apps/web/plugins/marketing/content-creation/SKILL.md /tmp/upstream-skill.md

# If changes look good, overwrite the local copy and re-run the upload script.
```

After updating a `SKILL.md`, re-run the upload script. The script is idempotent by hash —
it will re-upload changed skills and update `uploaded-ids.json` with the new `skill_id`.

## Upstream source

All skills in this directory are sourced from:
[anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins)
(Apache 2.0 license).
