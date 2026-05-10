# SESSION-LOG — Zapier MCP Auth Reconcile Agent

**Identity:** Zapier MCP Auth Reconcile Agent (Sonnet)
**Branch:** `lopmon/zapier-mcp-auth-reconcile`
**Worktree:** `C:/Users/Araly/edify-os-zapier-mcp-fix`
**Date:** 2026-05-03
**Task:** Reconcile the Zapier MCP wiring landed in PR #67 against the
authentication model Zapier MCP actually supports today. The original entry
in `apps/web/src/lib/mcp/server-catalog.ts` used `authMode: "bearer-env"`
with `bearerEnv: "ZAPIER_MCP_API_KEY"` against a static URL
`https://mcp.zapier.com/api/mcp/mcp`, but Citlali's signup attempt at
https://mcp.zapier.com/ on 2026-05-03 surfaced no path to a static
bearer-token URL — every client option either ran a copy-paste consumer
wizard or initiated an OAuth handshake.

---

## Research findings

**Zapier MCP supports two auth models today (2026-05-03):**

1. **API Key (URL-as-credential)** — best for personal use and local
   development. The user provisions an MCP server at
   https://mcp.zapier.com/, picks the **"Anthropic API"** client type, opens
   the Connect tab, and copies a per-server URL whose path embeds the secret
   token. Zapier's blog says verbatim: **"copy your server URL (keep this
   secret — it's like a password)"**. Anthropic's Messages API receives that
   URL with NO `authorization_token` field — the URL itself is the credential.

2. **OAuth** — best for apps where end users connect their own Zapier
   accounts. Initiated at `https://mcp.zapier.com/api/v1/connect`. This is
   the URL Citlali saw under the "ChatGPT" client option. Not applicable to
   single-tenant Edify and would require Anthropic-side OAuth flows we don't
   have today.

The static URL `https://mcp.zapier.com/api/mcp/mcp` referenced by the
awesome-remote-mcp-servers index is NOT a public bearer-auth endpoint — it's
the OAuth host. The "Claude" / "Cursor" / "ChatGPT" client wizards Citlali
found are consumer-friendly variants of the OAuth flow; the **"Anthropic
API" client option** (which Citlali did not see surfaced because the wizard
hides it behind the typical client list) yields the static URL with embedded
secret.

**Citation URLs:**
- https://zapier.com/blog/zapier-mcp-anthropic-api/ — sample `mcp_servers`
  payload showing `{ type: "url", url: "<YOUR_ZAPIER_MCP_SERVER_URL>", name:
  "zapier" }` with NO `authorization_token`.
- https://github.com/zapier/zapier-mcp — splits auth into "API Key (best for
  personal/local)" and "OAuth (best for apps)".
- https://help.zapier.com/hc/en-us/articles/36265392843917-Use-Zapier-MCP-with-your-client
  — confirms the "Other" / custom client option produces the API-key URL.

## Reconciliation path chosen: **A (URL-as-credential)**

- Path B (drop Zapier entirely) was rejected — the auth model is supportable,
  the previous wiring just had the wrong shape.
- Path C (account-level Zapier API key as bearer) was rejected — that
  product doesn't exist today; Zapier's developer API keys are for the
  Platform CLI, not MCP.

## Implementation

Added a new `AuthMode` value `"url-from-env"` to capture Zapier's
URL-as-credential pattern. The catalog entry now points at a new env var
`ZAPIER_MCP_URL` (full URL with embedded token); the registry resolves that
URL at request time and forwards it untouched, with no `authorization_token`
field.

Files touched (Zapier-only, no scope creep):

- `apps/web/src/lib/mcp/server-catalog.ts` — extended `AuthMode` union,
  added `urlEnv` field on `ServerCatalogEntry`, refactored `ZAPIER_ENTRY` to
  the new mode, updated `listServersForArchetype` to skip when `urlEnv`
  unset. Updated file-header docstring with the 2026-05-03 reconcile
  rationale and citations to Zapier's blog + repo.
- `apps/web/src/lib/mcp/registry.ts` — added `"url-from-env"` branch in
  `resolveOne`. Reads `process.env[entry.urlEnv]` and assigns it as the URL;
  no token is emitted, so `authorization_token` stays absent in the
  resolved server payload.
- `apps/web/src/app/api/admin/mcp-status/route.ts` — added a status branch
  for `"url-from-env"` that reports `ready` / `missing_env_url` without
  echoing the secret URL back. Hardened `base.url` and `url_configured` so
  Zapier's URL never appears in the diagnostic response (the URL itself is
  the secret).
- `apps/web/.env.example` — added `ZAPIER_MCP_URL` block with the 5-step
  provisioning instructions and a "treat as a credential" warning. Removed
  the implicit reliance on `ZAPIER_MCP_API_KEY` (which never had an example
  entry, so nothing to delete).

## Decisions / Notes

- **Why a new auth mode instead of overloading `bearer-env`**: the wire shape
  is genuinely different. `bearer-env` sends `Authorization: Bearer <token>`
  alongside a static URL; `url-from-env` sends NO header and a dynamic URL.
  Conflating them would mean either always sending a blank `Authorization`
  header (some servers reject that) or carrying ambiguous semantics inside
  the registry. A new variant keeps the dispatch table readable.
- **Why `url: ""` on the static field**: kept for type-safety so existing
  call sites (`SERVER_CATALOG[id].url`) don't crash on the Zapier entry.
  `listServersForArchetype` short-circuits before any URL access.
- **Why no DB migration**: `url-from-env` is single-tenant (one URL across
  the whole deployment), same scope as `bearer-env`. Per-org Zapier
  connections would require a separate Sprint 2 migration to store URLs in
  `mcp_connections.metadata` — out of scope for this reconcile.
- **/simplify pass**: collapsed a duplicated `Boolean(entry.urlEnv &&
  process.env[entry.urlEnv])` check in `mcp-status/route.ts` into a single
  `urlEnvPresent` const reused by both `base` and the response branch.
- **Typecheck**: `pnpm --filter web typecheck` CLEAN (0 errors).

## Files Changed

- `apps/web/src/lib/mcp/server-catalog.ts` — +69 / -19 lines (mostly
  docstring + new `urlEnv` field + new auth-mode branch in
  `listServersForArchetype`).
- `apps/web/src/lib/mcp/registry.ts` — +14 / -5 lines.
- `apps/web/src/app/api/admin/mcp-status/route.ts` — +21 / -3 lines.
- `apps/web/.env.example` — +16 / 0 lines.

Total: 4 files, ~120 / -27 lines (largely docstring; ~25 lines of actual
code change).

## Follow-ups

1. Once Citlali provisions the Zapier MCP server and pastes
   `ZAPIER_MCP_URL` into Vercel, run a smoke test: pick the Marketing
   Director archetype, ask Lopmon to "list available Zapier tools", confirm
   the model lists Mailchimp / Eventbrite / etc. tools instead of the empty
   set it returns today.
2. The existing `ZAPIER_MCP_API_KEY` env var (if it was ever set in Vercel)
   is now dead and can be removed. No code path reads it.
3. Sprint 2 may want to revisit Path B (Zapier OAuth) if Edify pivots to
   end-user-connects-their-own-Zapier-account — that would require
   Anthropic-side OAuth wiring on `mcp_servers` that doesn't exist today,
   and a new `mcp_connections` row shape for storing URLs.

---

# SESSION-LOG — Cron Idempotency + Ternary Precedence Agent

**Identity:** Cron Idempotency + Ternary Precedence Agent (Sonnet)
**Branch:** `lopmon/fix-cron-idempotency-and-ternary`
**Worktree:** `C:/Users/Araly/edify-os-fixpr-20260510`
**Date:** 2026-05-09
**Task:** One PR with two fixes: (1) idempotency guards on the two cron
endpoints in `apps/web/vercel.json` so duplicate fires from the legacy
`whitmorelabs/edify-os` Vercel project (sharing this Supabase) stop wasting
LLM tokens; (2) operator-precedence bug in `report-event.ts` where
`NEXT_PUBLIC_APP_URL || VERCEL_URL ? https://${VERCEL_URL} : ...` always
used `VERCEL_URL` when either was set.

---

## Findings during research

- `heartbeat_jobs` already has `UNIQUE(org_id, name)` from migration 00011,
  but that constraint is on the JOB DEFINITION (the per-archetype job row).
  It does NOT prevent multiple `heartbeat_runs` rows in a single day, and it
  does not gate the LLM work in `runArchetypeTurn`. Fix #1 is therefore not
  a no-op for heartbeat — we still need a per-day claim to short-circuit
  duplicate executions.
- `briefings` already has `UNIQUE(org_id, date)` from migration 00023, so
  the result row is dedup'd at upsert time, but `generateBriefing` runs all
  6 agents in parallel on Haiku BEFORE the upsert. Without the guard the
  duplicate cron still burns a full briefing's worth of tokens. The guard
  saves those tokens.
- Both `/api/heartbeat/trigger` and `/api/briefing/generate` currently
  require `getAuthContext()` (a Supabase auth session). That means Vercel
  cron cannot actually invoke them as-is — the cron config in
  `vercel.json` would 401. Out of scope for this PR (the PRD said don't
  modify business logic), but worth flagging to Lopmon as a separate
  follow-up: the cron paths either need a `CRON_SECRET` shared header
  check OR they need to be wired through a server-trigger endpoint that
  loops over orgs. Filed mentally for next round.

## What shipped

1. **Migration `supabase/migrations/00033_cron_idempotency.sql`**:
   - New table `cron_runs (id, kind, org_id → orgs, run_date_utc, created_at)`
     with `UNIQUE(kind, org_id, run_date_utc)`.
   - Index `idx_cron_runs_org_kind_date` for the hot-path lookup.
   - RLS enabled but no tenant policy: this is operational metadata, only
     the service role (used by the cron handlers) needs to read/write it.
   - SECURITY DEFINER function `public.claim_cron_run(p_kind, p_org_id,
     p_run_date)` returns boolean: true if the caller claimed the slot
     (proceed), false if it was already claimed (skip). Pattern mirrors
     the helper functions added in migration 00028 (locked search_path,
     execute granted only to service_role).
2. **New module `apps/web/src/lib/cron-idempotency.ts`**:
   - `CronKind` template-literal type so `heartbeat_trigger:<archetype>` is
     well-typed. Heartbeat is per-archetype-per-org-per-day, briefing is
     per-org-per-day (no archetype dimension).
   - `claimCronRun(serviceClient, kind, orgId)` thin wrapper around the
     SQL helper. Fails open on RPC error (logs + returns true) so a
     transient DB hiccup never silently drops a real cron fire.
3. **`apps/web/src/app/api/heartbeat/trigger/route.ts`**: imports
   `claimCronRun`, calls it with `heartbeat_trigger:${archetype}` after
   archetype validation but before any LLM work. Duplicate returns 200
   `{ skipped: true, reason: "already_ran_today", archetype }`.
4. **`apps/web/src/app/api/briefing/generate/route.ts`**: imports
   `claimCronRun`, calls it with `briefing_generate` immediately after
   service client init. Duplicate returns 200 `{ skipped: true, reason:
   "already_ran_today" }`. The GET handler already serves today's
   briefing once it lands, so the duplicate caller is no worse off.
5. **`apps/web/src/lib/tools/report-event.ts:131-149`**: replaced the
   buggy `||`/ternary mix with a `??`-chained expression that honors
   `NEXT_PUBLIC_APP_URL` when set, falls back to `https://${VERCEL_URL}`
   only when `NEXT_PUBLIC_APP_URL` is absent, and finally
   `http://localhost:3000` when neither is set. Comment block in the
   file documents the precedence trap so it doesn't regress.

## Verification

- `pnpm install` (workspace) — clean, 416 packages resolved.
- `pnpm --filter @edify/web typecheck` — clean, no errors introduced.
- No test infrastructure exists in the repo (no `test` script in
  `apps/web/package.json` or root `package.json`), so per the PRD I did
  not introduce one.
- Manually confirmed `baseUrl` only appears once in `report-event.ts`
  (line 141 declaration + line 147 fetch consumer); no other call sites
  in the file affected.
- `git diff --stat` shows only the four intended files (3 modified, 2
  new). Unrelated `apps/web/tsconfig.tsbuildinfo` was reverted before
  commit.

## Action required from Citlali

Migration `00033_cron_idempotency.sql` needs to be applied manually in the
Supabase SQL Editor against the production database (same workflow as
00027 / 00028 / etc.). Until applied, `claim_cron_run` does not exist,
the RPC will error, and the cron handlers will fall through to the
fail-open path (which preserves current behavior — duplicate runs still
happen but nothing breaks). After the migration is applied the dedup
takes effect immediately.

## Known unknowns / open questions for Lopmon

1. The cron endpoints can't actually be reached by Vercel cron today
   because they require an auth session. If Citlali confirms that the
   crons in `vercel.json` are real (i.e. dual-Vercel-project duplication
   is the active risk), then a follow-up PR needs to either:
   (a) add a `CRON_SECRET` header bypass for cron, OR
   (b) point the crons at a service-role endpoint that loops orgs.
   Either way, the dedup table built here will still be the correct
   guard once those endpoints exist.
2. Migration numbers 00029, 00030, 00031, 00032 are reserved by
   Minervamon per the PRD. If any of those land first and renumber 00033
   becomes a conflict, the migration file will need to bump (the table
   and function names won't change).

## PR

PR URL will be appended below once `gh pr create` returns.

---
