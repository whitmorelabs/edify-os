# SESSION LOG -- Edify OS

---

## 2026-04-20 — Phase 2d Drive Tools + Date Injection (Phase 2d + Date Injection Agent)

**Identity:** Phase 2d + Date Injection Agent
**Date:** 2026-04-20
**Commit:** `3305b02`

### Files Created
- `apps/web/src/lib/google-drive.ts` — Drive v3 REST wrappers: listFiles, searchFiles, getFile, createTextFile, shareFile, downloadFileContent + DriveError class. Mirrors google-gmail.ts pattern exactly. Google Docs use export endpoint (text/plain); text/plain+markdown use alt=media; binary files return a "non-text file" error string.
- `apps/web/src/lib/tools/drive.ts` — 6 Anthropic tool definitions + executeDriveTool dispatcher + DRIVE_TOOLS_ADDENDUM. Mirrors gmail.ts layout exactly.

### Files Modified
- `apps/web/src/lib/tools/registry.ts` — Imported driveTools/executeDriveTool/DRIVE_TOOLS_ADDENDUM; re-exported DRIVE_TOOLS_ADDENDUM; added `drive` branch to buildSystemAddendums; updated ARCHETYPE_TOOLS; added `drive_` dispatch branch in executeTool (mirrors gmail_ branch, uses "google_drive" integration type).
- `apps/web/src/app/api/team/[slug]/chat/route.ts` — Added `needsDriveToken` pre-fetch to the parallel token fetch; prepended temporalBlock at the top of fullSystemPrompt for current-date injection.

### Date Injection Structure
A `temporalBlock` is computed dynamically on every chat call (not cached):
```
Current date and time: <nowUtc.toISOString()> (<nowLocal> America/New_York — UTC-4)
When the user refers to "today", "tomorrow", "this week", "next month", etc., interpret relative to this date. Always use ISO 8601 format with the user's timezone offset for calendar operations.
```
Prepended at the very top of fullSystemPrompt so it appears before any base prompt or tool addendums. TODO comment left noting that `America/New_York` should come from `orgs.timezone` once onboarding collects it.

### Archetype Tool Assignments
| Archetype | Tools |
|---|---|
| executive_assistant | calendar + gmail + drive |
| events_director | calendar + drive |
| development_director | grants + crm + gmail + drive |
| marketing_director | drive only |
| programs_director | grants + drive |
| hr_volunteer_coordinator | (none) |

### Build Result
`npm run build` — PASSED. Zero type errors. 80 pages generated.

### Blockers / Follow-ups
- None. Clean build on first attempt.
- Follow-up: add `orgs.timezone` column in onboarding depth PRD (noted in TODO comment in route.ts).

---

## 2026-04-20 — Model ID Update (Model ID Update Agent)

**Identity:** Model ID Update Agent
**Date:** 2026-04-20
**Commit:** `f1baf48`

**Task:** Replace retired Claude model IDs that were causing 404 errors from the Anthropic API.

**Files changed (23 total):**
- `apps/web/src/lib/claude-client.ts` — MODEL constant
- `apps/web/src/app/dashboard/admin/ai-config/page.tsx` — test connection call
- `apps/web/src/app/api/team/[slug]/chat/route.ts` — chat route (the one that fired the error)
- `apps/web/src/app/api/decision-lab/route.ts` — decision lab (Haiku)
- `apps/web/src/app/api/support/chat/route.ts` — support chat (Haiku)
- `apps/api/src/routes/orgs.ts` — API key validation test call
- `services/agents/src/config.py` — DEFAULT_MODEL setting
- `services/agents/src/llm/anthropic_client.py` — _DEFAULT_MODEL constant
- `services/agents/src/prompts/loader.py` — fallback model in PromptTemplate
- `services/agents/src/agents/base.py` — BaseAgent default model
- `services/agents/src/agents/sub/base_subagent.py` — BaseSubagent default model
- 6x `services/agents/src/agents/primary/*.py` — per-agent model class attributes
- 6x `services/agents/src/prompts/primary/*.md` — frontmatter model fields

**Model ID mappings applied:**
- `claude-sonnet-4-20250514` → `claude-sonnet-4-6` (19 occurrences)
- `claude-haiku-4-20250514` → `claude-haiku-4-5-20251001` (2 occurrences)

**Build result:** `npm run build` passed — 0 type errors, 80 pages generated.
**Grep confirmation:** Zero remaining `claude-sonnet-4-20250514` or `claude-haiku-4-20250514` in live code (SESSION-LOG.md historical entries only).

---

## 2026-04-19 — Night Simplify Pass (Night Simplify Agent)

**Identity:** Night Simplify Agent
**Date:** 2026-04-19
**Commits:**
- `2ca32e1` — docs: add PRDs + session logs from 2026-04-19 night session
- `133c268` — simplify: night-session cleanup (chat reliability, dashboard polish, chat rewire)

### Simplifications Applied

**Reuse**
- `apps/web/src/app/dashboard/inbox/page.tsx` — Replaced inline `validAgentSlugs = ["development_director", ...]` array with the existing `ARCHETYPE_SLUGS` constant from `@/lib/archetypes`. The hardcoded subset was already redundant — any valid archetype can have a team chat page.
- `apps/web/src/app/api/dashboard/summary/route.ts` — `(ARCHETYPE_SLUGS as readonly string[])` cast was repeated twice 15 lines apart. Extracted to a single `validSlugs` local constant, used in both the activeSlugSet loop and the activity feed validator.

**Quality**
- `apps/web/src/app/dashboard/team/[slug]/TeamChatClient.tsx` — Removed `handlePromptSelect` single-line passthrough function (`setPendingPrompt(prompt)`). Passed `setPendingPrompt` directly as `onPromptSelect` to `EmptyState`. Passthrough functions that don't transform the argument add indirection without value.
- `apps/web/src/app/dashboard/team/[slug]/TeamChatClient.tsx` — Deleted six what-not-why comments in `handleSend`: the optimistic-render 3-liner, `// Pass conversationId only when we already have...`, `// The server is authoritative on conversationId — adopt it now.`, `// Hydrate or update activeConversation from the server's ID.`, `// If this was a new conversation, save user message under the real ID.`, `// Update UI messages to use the real conversationId`, and `// Surface the real error so users know what failed`. The code names and structure explain all of these.
- `apps/web/src/app/api/dashboard/summary/route.ts` — Deleted `// Run independent queries in parallel` comment above `Promise.all`. The construct speaks for itself.

**Efficiency**
- No efficiency issues found in tonight's three commits. The dashboard summary route already uses `Promise.all` for its four queries. The chat rewire already moved API calls to the server side with no sequential-that-should-be-parallel patterns.

### Files Touched
- `apps/web/src/app/api/dashboard/summary/route.ts`
- `apps/web/src/app/dashboard/inbox/page.tsx`
- `apps/web/src/app/dashboard/team/[slug]/TeamChatClient.tsx`

### Build Result
`cd apps/web && npm run build` — 80 pages, 0 TypeScript errors. Clean.

### Skipped / Not Simplified

- **`dashboard/page.tsx` `stats` array inside component**: Rebuilds on every render but derives from `summary` state. A `useMemo` would save 3 object allocations per render — not worth the complexity for 3 static-template items. Left alone.
- **`TeamChatClient.tsx` `pendingPrompt` state**: Could theoretically call `handleSend` directly from `EmptyState` via a callback, eliminating the state + effect. Skipped — the effect exists to guard against calling `handleSend` while `isTyping` is true, which is a valid constraint the direct-call approach would lose.
- **`summary/route.ts` `agent_config_id` in activity query select**: The join select includes `agent_config_id` in both queries but only `role_slug` is used. A tighter select might reduce payload, but the Supabase join syntax requires it for the relation traversal — left alone.

### Blockers
None.

---

## 2026-04-19 — Chat Backend Rewire (Chat Backend Rewire Agent)

**Identity:** Chat Backend Rewire Agent
**PRD:** PRD-chat-backend-rewire.md
**Commit:** `c6346da` (fix: wire team chat to server-side route (use tool-use loop, encrypted key))
**Date:** 2026-04-19

### Files Changed

- `apps/web/src/app/dashboard/team/[slug]/api.ts` — Rewrote `sendMessage()` to POST to `/api/team/[slug]/chat`. Deleted `createConversation()` (local-only, no longer needed). Removed all legacy imports (`getApiKey`, `getOrgContext`, `getSystemPrompt`, `callClaude`, `ClaudeMessage`, `getStoredMessages`).
- `apps/web/src/app/dashboard/team/[slug]/TeamChatClient.tsx` — Removed `createConversation` import and the ~25-line pre-creation block in `handleSend`. Removed `isCreatingConv` state (no longer needed). Rewrote `handleNewConversation()` to simply reset `activeConversation` to null and `messages` to `[]`. Updated `ConversationSidebar` call to pass `isCreating={false}`.
- `apps/web/src/lib/api-key.ts` — Added top-of-file comment noting it's vestigial for chat (still used by admin/ai-config and decision-lab).

### Root Cause Summary

`sendMessage()` in `team/[slug]/api.ts` was reading the Claude API key from `localStorage` (`getApiKey()`). Onboarding saves the key encrypted in Supabase `orgs.encrypted_claude_key` — NOT in localStorage. Any user who signed up via the onboarding flow had an empty localStorage key, causing the immediate "No API key set" error. Even if a user manually pasted a key via admin/ai-config (which does save to localStorage), the chat would still bypass the server-side tool-use loop, meaning Calendar/Gmail/Grants/CRM never fired.

Fix: `sendMessage()` now POSTs to `/api/team/[slug]/chat` which decrypts the key from Supabase, runs the full Phase 2b/2c tool-use loop, and persists conversations + messages server-side.

### conversationId Reconciliation Approach

**Before:** Client pre-created a conversation with a client-generated UUID before the first message send. This UUID was passed to `sendMessage()` and used for all localStorage storage.

**After:**
1. User types → `handleSend(content)` fires
2. `apiSendMessage(slug, content, activeConversation?.id)` — passes `undefined` if no active conversation
3. Server creates conversation, returns `response.conversationId` (server-generated UUID)
4. Client adopts server's ID: hydrates `activeConversation`, saves user message under `serverConvId`, updates conversations list
5. Subsequent messages pass `activeConversation.id` which is now the server's UUID

A `tempConvId` is used for the optimistic user message UI render while the server responds. On success, UI messages are patched to use `serverConvId`. On failure, the temp ID is retained in the error message — no localStorage pollution.

### Build Result

`npm run build` passed cleanly — 80 pages, 0 TypeScript errors.

### Manual Reasoning Check

- **New user onboards → goes to chat → types message:** Server route hits `getAuthContext()` (reads Supabase session cookie), fetches encrypted key from `orgs.encrypted_claude_key`, decrypts, calls Claude with tool-use loop. Returns real assistant response. No "No API key set" error.
- **Calendar query (Google not connected):** `getValidGoogleAccessToken` returns error shape → `executeTool` returns `is_error: true` with "Google Calendar not connected" — Claude surfaces this as a friendly message.
- **Conversation continuity:** Old localStorage conversations with client-only UUIDs will not have server-side history (acceptable per PRD — pre-launch test data loss). New conversations work correctly.

### Acceptance Criteria Check

- ✅ `sendMessage()` POSTs to `/api/team/[slug]/chat`
- ✅ `sendMessage()` no longer imports `getApiKey`, `getOrgContext`, `getSystemPrompt`, `callClaude`
- ✅ `handleSend` no longer pre-creates a client-only conversation
- ✅ First message sends `conversationId: undefined`; server-returned ID hydrates `activeConversation`
- ✅ Subsequent messages pass the server's conversationId
- ✅ `handleNewConversation` just resets local state
- ✅ `lib/api-key.ts` still exists, still imports resolve for admin/ai-config and decision-lab
- ✅ `npm run build` passes with zero type errors
- ✅ Single commit `c6346da` on main

### Blockers

None.

### Flagged Follow-ups for Lopmon

1. **`decision-lab/api.ts` still uses legacy client-side BYOK** — needs its own rewire to a server-side route. Marked out-of-scope tonight per PRD.
2. **Admin AI Config test-connection still uses localStorage** — acceptable diagnostic tool, not the user path. No action needed unless Z demos admin flow.
3. **ConversationSidebar `isCreating` prop** — now hardcoded to `false`. If a "New conversation" loading spinner is desired in the future, the prop is already wired; just restore a boolean state on `handleNewConversation`.

---

## 2026-04-19 — Phase 2c Gmail Tools (Phase 2c Gmail Agent)

**Identity:** Phase 2c Gmail Agent
**PRD:** PRD-phase-2c-gmail-tools.md
**Commits:** `6b29668` (feat), `efdcf9e` (/simplify pass)

### Pre-work Findings

- OAuth scope `gmail.modify` already in `GOOGLE_INTEGRATION_TYPES` as `"gmail"` — no new token infrastructure needed.
- `lib/google-calendar.ts` and `lib/tools/calendar.ts` are the direct pattern templates; both mirror almost exactly.
- `lib/http.ts` shared `handleJsonResponse` already exists — used for `GmailError` extraction.
- Chat route already has the H3 token pre-fetch pattern for calendar; Gmail pre-fetch is additive.
- `buildSystemAddendums` in registry already handles the addendum chain via prefix scanning; adding `"gmail"` is one line.

### What Was Built

**`apps/web/src/lib/google-gmail.ts` (NEW)**
- Types: `GmailMessage`, `GmailThread`, `GmailDraft`, `GmailLabel` (slim shapes)
- `GmailError` class matching `GoogleCalendarError` shape exactly (status + message)
- Internal helpers: `authHeaders`, `handleResponse` (wraps `handleJsonResponse`), `toBase64Url` (RFC 2822 base64url — replace +/- /_ strip = padding), `buildEncodedMime` (RFC 2822 MIME builder with threading headers), `parseMessage` (extracts From/Subject/Date headers + UNREAD label + Message-ID), `extractBody` (recursive multipart, 8000-char truncation), `decodeBase64Url`
- Exported API functions: `listMessages`, `getMessage`, `listThreads`, `getThread`, `createDraft`, `sendMessage`, `modifyLabels`, `listLabels`

**`apps/web/src/lib/tools/gmail.ts` (NEW)**
- `GMAIL_TOOLS_ADDENDUM` — instructs Claude to prefer drafts, never fabricate content, use threadId/inReplyTo
- `gmailTools: Anthropic.Tool[]` — 8 tool definitions with model-facing descriptions
- `executeGmailTool({ name, input, accessToken })` — switch-based executor, required-field guards, `GmailError`-aware catch

**`apps/web/src/lib/tools/registry.ts` (MODIFIED)**
- Import + re-export `gmailTools`, `executeGmailTool`, `GMAIL_TOOLS_ADDENDUM`
- `buildSystemAddendums`: added `families.has("gmail")` branch
- `ARCHETYPE_TOOLS`: `executive_assistant` → `[...calendarTools, ...gmailTools]`; `development_director` → `[...grantsTools, ...crmTools, ...gmailTools]`; others unchanged
- `executeTool`: added `gmail_` dispatch branch with pre-fetched token support, mirrors `calendar_` branch exactly

**`apps/web/src/app/api/team/[slug]/chat/route.ts` (MODIFIED)**
- Added `needsGmailToken` detection alongside `needsCalendarToken`
- `/simplify`: refactored both token pre-fetches to run in `Promise.all` (calendar + gmail fetched in parallel when both needed in same round)

### /simplify Fixes Applied (commit `efdcf9e`)
1. Dead `metaParams` variable + `void metaParams` suppressor in `listMessages` — deleted, `msgParams` built inside the loop directly
2. Spurious `format: "metadata"` param on `messages.list` URL (not valid for that endpoint) — removed
3. `GmailLabel.type` narrowed from `string` to `"system" | "user" | undefined` — cast at mapping site
4. What-not-why comments stripped (`btoa works in both...`, `// Convert base64url...`, `// Pad to 4-char...`, `// If this part is plain text...`, `// For multipart...`)
5. Parallel token pre-fetch in chat route (both calendar + gmail tokens fetched concurrently via `Promise.all`)

### Acceptance Criteria Check
- ✅ EA can list inbox, create drafts (Gmail tools wired)
- ✅ No Google connected → friendly error from `getValidGoogleAccessToken`
- ✅ Development Director has grants + crm + gmail (verified in registry)
- ✅ Marketing, Programs, Events, HR do NOT get gmail tools
- ✅ Token pre-fetch deduplicates gmail lookups per round
- ✅ `npx tsc --noEmit` passes with 0 errors
- ✅ `npm run build` — compiled and type-checked cleanly; ENOENT on pages-manifest.json is a pre-existing env issue (reproduces on clean main, not caused by this PR)
- ✅ Single feature commit `feat: Gmail tools (Phase 2c)` on main, then /simplify commit
- ✅ /simplify pass complete

### Open Questions / Notes for Lopmon
- None blocking. The build ENOENT (`pages-manifest.json`) pre-dates this change — visible on bare `main` too. Not a Gmail issue.
- `gmail.modify` scope was already on the consent screen per PRD — no Google re-verification needed for test users.

---

## 2026-04-17 — /simplify pass on Phase 3 (coding agent)

**Task:** Apply /simplify findings to commit `83c2717` (Phase 3 Grants & CRM).

### What Was Applied

**H1 — Shared HTTP helper (`apps/web/src/lib/http.ts` — NEW FILE)**
Created `handleJsonResponse<T>()` generic that accepts `extractMessage` and `makeError` callbacks. Refactored `google-calendar.ts` and `grants-gov.ts` to call it — the 204 No Content edge case in the calendar is handled by a short-circuit before the shared helper. Both modules keep their domain error classes (`GoogleCalendarError`, `GrantsGovError`).

**H2 + H3 — Trigger full lifecycle + single aggregation query**
Created `supabase/migrations/00017_donation_aggregates_full_lifecycle.sql`. Drops `donations_update_aggregates`, replaces `update_donor_aggregates()` to:
- Handle DELETE via `coalesce(new.donor_id, old.donor_id)`
- Run a single `SELECT sum/min/max INTO agg` instead of 3 independent subqueries
- Fires on `AFTER INSERT OR UPDATE OR DELETE`
Also applied to `supabase/combined_migration.sql` (same function + trigger definition).
**Citlali must apply migration `00017` to the live Supabase project.**

**M1 — `CrmError` class in `lib/crm.ts`**
Added `CrmError` with `action` + `cause` fields. All five CRM lib functions now throw `new CrmError('action', supabaseError)`. `executeCrmTool` catches `instanceof CrmError` first and returns its `message` as `is_error: true`.

**M2 — Fix `interactionType` cast**
`input.interaction_type as Donor["donor_type"] extends string ? ... : never` → `input.interaction_type as Interaction["interaction_type"]`. Also added `Interaction` to the import from `@/lib/crm`.

**M3 — `Math.max(1, ...)` guard on limit**
`crm_list_donors` tool: `Math.min(input.limit, 25)` → `Math.max(1, Math.min(input.limit, 25))`.

**M4 — Currency formatting**
`centsToDollars(cents): number` → `centsToDollarsString(cents): string` returning `.toFixed(2)`. Updated all 4 callsites in `tools/crm.ts` (`slimDonor.lifetime_giving_dollars`, `crm_get_donor` output `lifetime_giving_dollars`, `crm_get_donor` `amount_dollars`, `crm_log_donation` `amount_dollars`).

**M5 — `MAX_DONORS_LIMIT = 100` cap in `lib/crm.ts`**
`listDonors` now computes `safeLimit = Math.max(1, Math.min(limit, MAX_DONORS_LIMIT))` before the Supabase query — defense in depth if the tool dispatcher is bypassed.

**M6 — `buildSystemAddendums` + `getToolFamilies` in registry**
Added both helpers to `lib/tools/registry.ts`. All three addendum constants now re-exported from registry (`CALENDAR_TOOLS_ADDENDUM`, `GRANTS_TOOLS_ADDENDUM`, `CRM_TOOLS_ADDENDUM`). Chat route `apps/web/src/app/api/team/[slug]/chat/route.ts` now calls `buildSystemAddendums(tools)` — three `.some()` scans + separate import of `CALENDAR_TOOLS_ADDENDUM` removed.

**L1 — `eligibilityCategories` in grants_search slim projection**
Added `eligibilityCategories: g.eligibilityCategories` to the mapped output in `tools/grants.ts` so Claude can answer eligibility questions from search results without N follow-up `grants_get_details` calls.

### Build

`npm run build` (web app): passed cleanly — 79 pages, 0 TS errors. Pre-existing `@edify/slack` failure (`@slack/types` missing) is unrelated to Phase 3 / /simplify changes.

### Commit

`e94be28` (`simplify: shared http helper, trigger lifecycle + perf, currency formatting, registry helpers`) pushed to origin/main.

### Action Required

**Apply migration 00017 to Supabase:**
`supabase/migrations/00017_donation_aggregates_full_lifecycle.sql`
This is a drop-and-recreate of the existing trigger — safe to run on empty or populated `donations` tables. No schema changes (no new columns, no table drops).

---

## 2026-04-17 — Phase 3 Grants + CRM (coding agent)

**Task:** Implement Phase 3 — Grants & Fundraising per PRD-phase-3-grants-and-crm.md.

### Pre-work Findings

**PRD:** Three tables (donors, donations, donor_interactions), trigger for aggregate updates, RLS SELECT-only (service client does all writes). Two Grants.gov endpoints (search2, fetchOpportunity). 2 grants tools + 5 CRM tools. development_director gets all 7; programs_director gets grants-only (read-only).

**`lib/tools/calendar.ts` shape (to replicate):**
- Exports `calendarTools: Anthropic.Tool[]`, `CALENDAR_TOOLS_ADDENDUM`, `executeCalendarTool({ name, input, accessToken })`.
- try/catch around switch, `is_error: true` on errors, JSON.stringify (no indent).

**`lib/tools/registry.ts`:**
- `ARCHETYPE_TOOLS` keyed on underscore slugs, `development_director: []` currently (to fill with grants+CRM).
- `executeTool` dispatches on `calendar_` prefix via startsWith — extend with else-if branches for `grants_` and `crm_`.
- `executeTool` signature: `{ name, input, orgId, serviceClient, preFetchedTokens? }` — need to add `memberId` for CRM tools. Chat route already extracts `memberId` from `getAuthContext()`.

**`lib/google-calendar.ts` pattern:**
- Custom error class, `authHeaders` helper, `handleResponse<T>` helper, individual typed REST functions.

**Migrations:** 00015 is the latest. 00016_crm_tables.sql is new. RLS pattern: `org_id in (select org_id from members where user_id = auth.uid())` — same as all prior migrations.

**Chat route:**
- `memberId` already extracted from `getAuthContext()` at line 36.
- System prompt currently appends `CALENDAR_TOOLS_ADDENDUM` unconditionally when `tools.length > 0`. Need to replace with addendum-chain logic for calendar/grants/CRM.
- `executeTool` call site does NOT currently pass `memberId` — need to add it to the signature and call site.

### What Was Built

**Step 1 — `supabase/migrations/00016_crm_tables.sql` (NEW)**
- Three tables: `donors`, `donations`, `donor_interactions`
- RLS SELECT-only policies using `org_id in (select org_id from members where user_id = auth.uid())` pattern
- `update_donor_aggregates()` trigger: fires after INSERT on donations, updates `lifetime_giving_cents`, `first_gift_at`, `last_gift_at` on the parent donor row. `security definer` so the trigger runs as the definer, not the caller.
- Appended to `supabase/combined_migration.sql` — Citlali can run the full combined file in one go.

**Step 2 — `apps/web/src/lib/grants-gov.ts` (NEW)**
- `Grant` and `GrantDetail` types, `GrantsGovError` class
- `grantsGovHeaders()`: includes `X-Api-Key` header if `process.env.API_DATA_GOV_KEY` is set
- `searchGrants()`: POST to `https://api.grants.gov/v1/api/search2`. `deadlineWithinDays` convenience param → `closeDate: { startDate, endDate }` in MM/DD/YYYY format. Rows capped at 50. Handles both `oppHits` and `hits` response field names (API can vary).
- `fetchGrantDetails()`: POST to `https://api.grants.gov/v1/api/fetchOpportunity`.
- `projectGrant()` helper maps API camelCase fields to our typed shape.

**Step 3 — `apps/web/src/lib/crm.ts` (NEW)**
- `Donor`, `Donation`, `Interaction` types
- `listDonors()`: `ilike` search on name/email, `contains` filter on tags, configurable sort + limit
- `getDonor()`: 3 queries in `Promise.all` (donor, 10 recent donations, 10 recent interactions)
- `createDonor()`: returns inserted row via `.select('*').single()`
- `logDonation()`: inserts row; trigger handles aggregate updates; no manual aggregate logic
- `logInteraction()`: inserts touchpoint record with follow-up tracking
- All functions enforce `.eq('org_id', orgId)` defense-in-depth

**Step 4 — `apps/web/src/lib/tools/grants.ts` (NEW)**
- `grantsTools: Anthropic.Tool[]` — 2 tools with careful model-facing descriptions
- `GRANTS_TOOLS_ADDENDUM` const
- `executeGrantsTool({ name, input })` — switch on name, slim projection for `grants_search`, full detail for `grants_get_details`, required-field guards, `GrantsGovError` aware catch

**Step 5 — `apps/web/src/lib/tools/crm.ts` (NEW)**
- `crmTools: Anthropic.Tool[]` — 5 tools with model-facing descriptions
- `CRM_TOOLS_ADDENDUM` const (clarifies dollar input, warns against making up donor data)
- `executeCrmTool({ name, input, orgId, memberId, serviceClient })` — dollar→cents conversion (×100, Math.round) in `crm_log_donation`; cents→dollars conversion in all outputs; slim projection for list
- Type complexity note: `interactionType` cast uses the explicit union type inline (avoids a confusing `Donor["donor_type"]` cross-reference that was a leftover in the type parameter)

**Step 6 — `apps/web/src/lib/tools/registry.ts` (UPDATED)**
- Added imports for `grantsTools`, `executeGrantsTool`, `crmTools`, `executeCrmTool`
- Re-exports `GRANTS_TOOLS_ADDENDUM` and `CRM_TOOLS_ADDENDUM` from registry for route convenience
- `development_director`: `[...grantsTools, ...crmTools]` (7 tools total)
- `programs_director`: `[...grantsTools]` (2 tools, read-only grants for compliance research)
- `executeTool` signature: added `memberId: string | null` parameter
- Dispatch branches: `grants_` → `executeGrantsTool`, `crm_` → `executeCrmTool`

**Step 7 — `apps/web/src/app/api/team/[slug]/chat/route.ts` (UPDATED)**
- Imports `GRANTS_TOOLS_ADDENDUM` and `CRM_TOOLS_ADDENDUM` from registry
- Replaced single `CALENDAR_TOOLS_ADDENDUM` conditional with addendum-chain logic: checks `hasCalendar`, `hasGrants`, `hasCrm` via `tools.some(t => t.name.startsWith(...))`, pushes applicable addendums, joins them
- `executeTool` call site now passes `memberId: memberId ?? null`

### Build
- `npm run build` in `apps/web/` passed cleanly (79 static pages, no TypeScript errors, no warnings).

### Acceptance Check
- ✅ Step 1: Migration file + combined_migration.sql updated
- ✅ Step 2: grants-gov.ts with searchGrants + fetchGrantDetails
- ✅ Step 3: crm.ts with 5 typed Supabase wrappers
- ✅ Step 4: tools/grants.ts matching calendar.ts shape
- ✅ Step 5: tools/crm.ts matching calendar.ts shape, dollar→cents conversion
- ✅ Step 6: registry.ts updated, development_director gets 7 tools, programs_director gets 2
- ✅ Step 7: chat route addendum chain + memberId plumbed through
- ✅ Build clean

### Env Var Checklist Note
`API_DATA_GOV_KEY` should be added to Vercel env vars for production Grants.gov higher rate limits. Key is already in `.env.local` per PRD. Add alongside the other env vars on the morning checklist.

### Migration Apply Note
`00016_crm_tables.sql` is the new migration. Citlali still needs to apply 00009–00016. Full `combined_migration.sql` covers all of them — run it in one go in Supabase SQL editor.

---

## 2026-04-17 — Phase 2b Calendar tools (coding agent)

**Task:** Implement Phase 2b — Calendar tools + Anthropic tool-use loop per PRD-phase-2b-calendar-tools.md.

### Pre-work Findings

**Chat route (`team/[slug]/chat/route.ts`):**
- Single `messages.create` call, no tool-use loop
- System prompt built inline: `basePrompt + orgContext` — system prompt addendum goes here
- Model: `claude-sonnet-4-20250514` (kept unchanged)
- Post-Claude persistence uses `Promise.all` pattern (from Phase 1 /simplify)

**`lib/anthropic.ts`:**
- `getAnthropicClientForOrg` returns `{ client: Anthropic; orgName; org }` or `{ error: NextResponse }`
- `client` is a full `Anthropic` instance — call `.messages.create()` on it

**`lib/google.ts`:**
- `getValidGoogleAccessToken(serviceClient, orgId, integrationType)` returns `{ accessToken: string } | { error: NextResponse }`
- Error path translated in `executeTool` by returning a string-form tool error (approach (a) from PRD — simpler)

**SDK version:** `@anthropic-ai/sdk ^0.90.0` — fully supports tool use

**Archetype slugs:** underscores, not hyphens: `executive_assistant`, `events_director`, etc. Registry keys must match.

### What Was Built

**Step 1 — `apps/web/src/lib/google-calendar.ts` (NEW)**
- `CalendarEvent` type + `GoogleCalendarError` class
- 5 typed REST wrappers: `listEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent`
- All use `fetch` to `https://www.googleapis.com/calendar/v3`, Bearer auth, throw `GoogleCalendarError` on non-2xx

**Step 2 — `apps/web/src/lib/tools/calendar.ts` (NEW)**
- 5 `Anthropic.Tool` objects with carefully written model-facing descriptions
- `executeCalendarTool({ name, input, accessToken })` dispatcher

**Step 3 — `apps/web/src/lib/tools/registry.ts` (NEW)**
- `ARCHETYPE_TOOLS` map keyed on underscore slugs (matching `ARCHETYPE_SLUGS`)
- `executeTool({ name, input, orgId, serviceClient })` dispatches on `calendar_` prefix

**Step 4 — `team/[slug]/chat/route.ts` refactored**
- Tool-use loop, max 8 rounds
- Parallel `Promise.all` for tool results within each round
- Only final user+assistant turn persisted; intermediate tool rounds not stored

**Step 5 — System prompt addendum**
- Appended calendar tools instruction when `tools.length > 0`

### Build

- `npm run build` in `apps/web/` passed cleanly (79 static pages, no TypeScript errors, no warnings beyond CRLF line endings from Git on Windows).

### Commit

- `feat: Calendar tools + Anthropic tool-use loop (Phase 2b)` — commit `777ec0c`
- Pushed to origin/main (9476a8b → 777ec0c). 5 files changed, 772 insertions.

---

## 2026-04-17 — /simplify pass on encryption (coding agent)

**Task:** Apply /simplify findings to commit d88aa0b (encryption). Hardening call sites, key caching, label constants.

### What Was Done

**H1 — Try/catch around `decrypt()` calls**
- `apps/web/src/lib/anthropic.ts`: wrapped `decryptIfEncrypted` call in try/catch; logs `[anthropic] Failed to decrypt API key` with orgId context; returns clean 500 NextResponse to caller.
- `apps/web/src/lib/google.ts`: wrapped both `decryptIfEncrypted` calls (access token + refresh token) in separate try/catch blocks; logs `[google] Failed to decrypt access/refresh token` with orgId + integrationType; returns clean 500 NextResponse.

**H2 — Null narrowing, removed as-string casts**
- Removed `apiKey as string` cast in `anthropic.ts`; used explicit `const safeKey: string = apiKey` after the null check instead.
- `google.ts`: no `as string` casts existed after null checks — TypeScript narrows correctly via control flow.

**M1 — Key caching singleton in `crypto.ts`**
- Added `let _cachedKey: Buffer | null = null` module-level variable.
- `getKey()` now returns cached key on subsequent calls instead of re-parsing `process.env.ENCRYPTION_KEY` every time.

**M2 — Label constants exported from `crypto.ts`**
- Added `CRYPTO_LABEL_ANTHROPIC_KEY`, `CRYPTO_LABEL_GOOGLE_ACCESS_TOKEN`, `CRYPTO_LABEL_GOOGLE_REFRESH_TOKEN`.
- `anthropic.ts` and `google.ts` now import and use these instead of inline strings.

**L1 — JSDoc on `doRefreshToken` refreshToken parameter**
- Added note: "must be DECRYPTED plaintext, not the raw DB value".

### Build
- `npm run build` in `apps/web/` passed cleanly (79 static pages, no TypeScript errors).

### Commit
- `simplify: encryption error handling, key caching, label constants` — commit `9476a8b`
- Pushed to origin/main (d88aa0b → 9476a8b).

---

## 2026-04-17 — Encryption (coding agent)

**Task:** Implement real AES-256-GCM encryption for sensitive columns per PRD-encryption.md.

### What Was Built

**Step 1 — `apps/web/src/lib/crypto.ts` (NEW)**
- Exports `encrypt`, `decrypt`, `isEncrypted`, `decryptIfEncrypted`.
- Algorithm: AES-256-GCM, 12-byte random IV per encryption.
- Format: `enc:v1:${ivBase64}.${ciphertextBase64}.${authTagBase64}` — versioned prefix enables format detection.
- Key: 32 bytes from `ENCRYPTION_KEY` env var (base64-encoded). Throws clearly if missing or wrong length.
- `decryptIfEncrypted` handles legacy plaintext rows gracefully: passes through as-is + logs a one-time console warning. Enables in-place migration without downtime.
- Note: import uses `'crypto'` (not `'node:crypto'`) — Next.js 14 webpack does not handle the `node:` URI scheme.

**Step 2 — `buildAnthropicKeyPayload` in `lib/supabase/server.ts`**
- Now calls `encrypt(plaintextKey)` before storing to `anthropic_api_key_encrypted`.
- Hint (`slice(-4)`) still computed on plaintext BEFORE encryption. Unchanged UI behavior.

**Step 3 — `getAnthropicClientForOrg` in `lib/anthropic.ts`**
- Calls `decryptIfEncrypted(org["anthropic_api_key_encrypted"], "orgs.anthropic_api_key")` before passing to `new Anthropic({ apiKey })`.
- Graceful fallback handles any plaintext rows from before this PRD.

**Step 4 — `/api/integrations/google/callback/route.ts`**
- `access_token_encrypted` = `encrypt(tokens.access_token)` before upsert.
- `refresh_token_encrypted` = `encrypt(tokens.refresh_token)` when present.

**Step 5 — `lib/google.ts` — `getValidGoogleAccessToken` + `doRefreshToken`**
- Reads `rawAccessToken` / `rawRefreshToken` from DB, then decrypts via `decryptIfEncrypted` before use.
- Returns the DECRYPTED access token (callers use it as a Bearer token — must be plaintext).
- `doRefreshToken`: stores `encrypt(newAccessToken)` when updating the 3 Google rows after refresh.
- `refreshInFlight` dedup map unchanged.

**Step 6 — `/api/admin/ai-config` PATCH**
- Verified: uses `buildAnthropicKeyPayload` — encryption inherited transparently from Step 2. No direct plaintext writes.

**Step 7 — `apps/web/.env.local`**
- Appended `ENCRYPTION_KEY=REPLACE_ME_GENERATE_VIA_OPENSSL_RAND_BASE64_32` placeholder with generation instructions.

**Step 8 — SESSION-LOG backfill**
- Added "Updated 2026-04-17 (encryption PRD): now actually encrypted" notes to Phase 2a and Phase 1.5 entries that described plaintext storage.

### CRITICAL: Citlali Action Required

**BEFORE pushing to Vercel, you MUST:**

1. **Generate the encryption key locally:**
   ```
   openssl rand -base64 32
   ```
   Copy the output.

2. **Replace the placeholder in `apps/web/.env.local`:**
   Change `REPLACE_ME_GENERATE_VIA_OPENSSL_RAND_BASE64_32` to the generated value.

3. **Add to Vercel environment variables (Production + Preview):**
   - Variable name: `ENCRYPTION_KEY`
   - Value: the same base64 string from step 1
   - Without this, EVERY API route touching encrypted columns will 500 in production.

4. **Key loss = data loss.** If `ENCRYPTION_KEY` is ever lost, all encrypted Anthropic keys + Google tokens become unrecoverable. Users would need to re-enter their keys / reconnect Google. Store it safely (password manager, Vercel env var).

5. **Existing plaintext rows** (if any from earlier tonight): the graceful fallback passes them through unencrypted + logs a warning. They will be re-encrypted on next write (e.g., user re-saves their Anthropic key or reconnects Google). No migration script needed.

### Build
`npm run build` passed cleanly in `apps/web/`. All 79 static pages generated, no type errors.

---

## 2026-04-17 — /simplify pass on Phase 2a (coding agent)

**Task:** Apply /simplify findings from commit `23ad4bb` (Phase 2a Google Workspace OAuth). All HIGH + MEDIUM + LOW fixes applied. Build verified before push.

### What Was Fixed

**H1 — Pinned redirect_uri and post-callback redirects via `getAppOrigin()`**
- Added `getAppOrigin()` to `lib/google.ts`. Priority: `NEXT_PUBLIC_APP_URL` → `VERCEL_URL` → `localhost:3000`.
- Both `connect/route.ts` and `callback/route.ts` now use `getAppOrigin()` — headers no longer control the redirect target. Open-redirect vulnerability closed.
- ACTION FOR CITLALI: Set `NEXT_PUBLIC_APP_URL=https://edifyos.vercel.app` in Vercel project environment variables (Production + Preview).

**H2 — State cookie cleared on every callback exit path**
- Extracted `clearAndRedirect()` helper inside callback route. All exit paths (error from Google, token exchange failure, auth gate failure, server config error, DB error, userinfo failure, success) now call it, ensuring the state cookie is always deleted before redirecting.
- CSRF mismatch path intentionally does NOT clear the cookie (it's either absent or mismatched — clearing would be meaningless and slightly less informative).

**H3 — Batched 3 upserts into one call**
- `callback/route.ts` now builds `upsertRows` array and calls `.upsert(upsertRows, ...)` once instead of 3 sequential calls in a `for...of` loop.

**H4 — In-process token-refresh dedup**
- Added `refreshInFlight` Map in `lib/google.ts`. Concurrent refresh calls for the same org share the same Promise. Entry is deleted via `.finally()` when resolved or rejected.
- Cross-instance dedup (multiple Vercel function instances) is out of scope — that requires a Postgres advisory lock or RPC. In-process dedup is the right level for serverless functions.

**M1 — Centralized `STATE_COOKIE` constant**
- `STATE_COOKIE = "google_oauth_state"` now exported from `lib/google.ts`. Both routes import from there — no more duplicated declaration.

**M2 — Soft-delete Google integration (status='revoked')**
- `route.ts` DELETE handler now uses `.update({ status: 'revoked', updated_at: ... })` instead of `.delete()`. Matches the pattern in `/api/integrations` DELETE. Audit history preserved.
- GET handler already had `.eq('status', 'active')` filter, so revoked rows won't appear as connected.

**M3 — Hard-fail on userinfo non-200 in callback**
- If userinfo fetch returns non-200, callback now redirects with `?google=denied&reason=userinfo_failed` and clears the cookie. No tokens are upserted. Previous behavior (upsert with `google_email: null`) removed.

**M4 — Lighter Google SDK imports**
- Replaced `import { google } from 'googleapis'` (~4MB bundle) with `import { OAuth2Client } from 'google-auth-library'` (~50KB) in connect and callback routes.
- `test-calendars` route switched from `google.calendar()` client to direct `fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', ...)`. No googleapis import needed.
- `googleapis` removed from `apps/web/package.json`. `google-auth-library` added as direct dependency.

**M5 — Dropped dead INSERT/UPDATE/DELETE RLS policies**
- Created `supabase/migrations/00015_tighten_integrations_policies.sql`. Drops the INSERT/UPDATE/DELETE policies added in 00014 (dead code — all writes use service-role client which bypasses RLS).
- SELECT policy retained. Migration 00015 appended to `combined_migration.sql`.

**M6 — Typed `config` column**
- `GoogleIntegrationConfig = { google_email: string | null }` exported from `lib/google.ts`.
- `route.ts` GET handler casts as `(data![0].config as GoogleIntegrationConfig)?.google_email` — no more `as any`.

**L1 — Trim `reason` query param in toast**
- `integrations/page.tsx`: `const reason = rawReason.slice(0, 100)` before rendering toast. Prevents oversized UI from a crafted URL.

### Skipped (per instructions)
- NODE_ENV gate on test-calendars — intentional PRD smoke test, replaced in Phase 2b
- UI useEffect consolidation — cosmetic
- `select("config")` column trim — micro-optimization
- Cross-instance Postgres advisory lock for refresh dedup — explicitly out of scope

### Build
- `npm run build` passed cleanly in `apps/web/`. All 79 static pages generated, no type errors.

---

## 2026-04-17 — Phase 2a Google OAuth (coding agent)

**Task:** Implement Google Workspace OAuth foundation per PRD-phase-2a-google-oauth.md.

### Pre-work Audit Findings

**1. /api/integrations/route.ts shape:**
GET returns `{ success: true, connected: [{ id, integrationId, type, connectedAt }] }` — note it only selects `id, type, status, created_at, updated_at` and returns type as `integrationId`. The new Google rows will follow this exact shape naturally.

**2. Integrations UI:**
Already exists at `apps/web/src/app/dashboard/integrations/page.tsx`. Large page component with all 34 integrations listed. `gmail`, `google_calendar`, and `google_drive` are already in the catalog. Current OAuth flow goes through a generic OAuthModal that calls `/api/integrations` POST (mock flow). Will update so Google-type integrations redirect to the real `/api/integrations/google/connect` endpoint instead. The page fetches connected status from server at load time — will convert to fetch from API.

**3. RLS on integrations table:**
`00006_integrations.sql` already has: `create policy "Tenant isolation" on integrations for all using (org_id in (select org_id from members where user_id = auth.uid()))`. This covers SELECT, INSERT, UPDATE, DELETE for all members of the org. Migration 00014 will add explicit granular policies matching the existing pattern on orgs/members tables (SELECT/INSERT/UPDATE/DELETE separately) for clarity and future-proofing, but the blanket policy already covers us.

**4. googleapis package:**
NOT installed. `apps/web/package.json` only has `@anthropic-ai/sdk`, `@supabase/*`, `next`, `react`, `lucide-react`, `clsx`, `tailwind-merge`. Need to `pnpm add googleapis`.

**5. `integrations` type CHECK constraint:**
`00007_expand_integrations.sql` already includes `'gmail'`, `'google_calendar'`, `'google_drive'` in the allowed values. No constraint change needed.

**6. Token storage pattern:**
`buildAnthropicKeyPayload` in server.ts stores plaintext in `*_encrypted` columns. Will match this — `access_token_encrypted` and `refresh_token_encrypted` store plaintext for now, column names aspirational.
> Updated 2026-04-17 (encryption PRD): now actually encrypted via AES-256-GCM. See Encryption section below.

**7. SUPABASE_URL note:**
`server.ts` reads `SUPABASE_URL ?? NEXT_PUBLIC_SUPABASE_URL`. The `.env.local` only has `NEXT_PUBLIC_SUPABASE_URL`. That's fine — the fallback handles it.

### Files Created
- `apps/web/src/lib/google.ts` — Token helper: `getValidGoogleAccessToken`, `GOOGLE_SCOPES`, `GOOGLE_INTEGRATION_TYPES`, `SCOPES_BY_TYPE`. Reads integration row, returns cached token if >60s from expiry, else refreshes via `POST https://oauth2.googleapis.com/token` (form-urlencoded), updates all 3 Google rows.
- `apps/web/src/app/api/integrations/google/connect/route.ts` — GET: auth-gates, generates CSRF state (randomBytes 32), sets httpOnly cookie `google_oauth_state` (10min), builds Google auth URL via `googleapis` OAuth2 with all 4 scopes + `access_type:offline` + `prompt:consent`, redirects.
- `apps/web/src/app/api/integrations/google/callback/route.ts` — GET: validates CSRF cookie, exchanges code for tokens, fetches userinfo email, upserts 3 rows (gmail/google_calendar/google_drive) via service client, clears state cookie, redirects to `/dashboard/integrations?google=connected`.
- `apps/web/src/app/api/integrations/google/route.ts` — GET: returns `{ connected, email }` status. DELETE: removes all 3 Google integration rows.
- `apps/web/src/app/api/integrations/google/test-calendars/route.ts` — GET: calls `getValidGoogleAccessToken`, uses `googleapis` calendar v3 to list calendars, returns `{ calendars: [{ id, summary, primary }] }`.
- `supabase/migrations/00014_integrations_policies.sql` — Drops blanket "Tenant isolation" policy, adds explicit SELECT/INSERT/UPDATE/DELETE policies for org members.

### Files Modified
- `apps/web/src/app/api/integrations/callback/route.ts` — Updated stub comment per PRD step 9.
- `apps/web/src/app/dashboard/integrations/page.tsx` — Added real Google status load (fetch `/api/integrations/google` on mount), `useSearchParams` for toast handling (`?google=connected` / `?google=denied`), `handleConnectClick` routes Google IDs to `/api/integrations/google/connect`, `handleDisconnect` calls real DELETE for Google IDs, Google email badge on connected cards, toast UI, Suspense wrapper (required by useSearchParams in Next.js 14).
- `apps/web/package.json` + `pnpm-lock.yaml` — Added `googleapis ^171.4.0`.
- `supabase/combined_migration.sql` — Appended 00014 policies.

### Steps Completed
- ✅ Step 1: `googleapis` installed via pnpm
- ✅ Step 2: `apps/web/src/lib/google.ts` token refresh helper
- ✅ Step 3: OAuth initiate route `/api/integrations/google/connect`
- ✅ Step 4: OAuth callback route `/api/integrations/google/callback`
- ✅ Step 5: Disconnect endpoint + status GET at `/api/integrations/google`
- ✅ Step 6: Test-calendars endpoint `/api/integrations/google/test-calendars`
- ✅ Step 7: Integrations UI updated — real OAuth connect, real disconnect, email display, toast notifications
- ✅ Step 8: RLS migration `00014_integrations_policies.sql` + combined_migration.sql
- ✅ Step 9: `/api/integrations/callback` stub comment updated

### Decisions Made
- `prompt: 'consent'` set on OAuth URL to force refresh token issuance even for previously-consented users. Without this, Google only issues a refresh token on first consent.
- Token refresh via raw `fetch` (not googleapis) as specified — lighter, avoids full OAuth2 sub-library for a single POST.
- Upsert uses `serviceClient` (RLS-bypassing) — consistent with all other API routes. RLS policies still added for completeness/future client use.
- `useSearchParams` required wrapping IntegrationsPage in `Suspense` — matches pattern from `/dashboard/guide/search/page.tsx`.
- Disconnect deletes rows entirely (not soft-delete to "revoked") — PRD says "nukes the 3 rows" and re-connecting should work cleanly.

### Skipped / Not Built
- None. All 9 steps complete.

### CRITICAL: Citlali Action Required
**Add these two redirect URIs to Google Cloud Console before OAuth will work in any environment:**
1. `https://edifyos.vercel.app/api/integrations/google/callback`
2. `http://localhost:3000/api/integrations/google/callback`

Steps: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs → click the client → Authorized redirect URIs → Add URI.

**Also:** The OAuth client is in **Testing** mode. Only users explicitly added to the test users list at [OAuth consent screen → Test users] can authorize. Before real clients can use this, Google verification must be completed (separate weeks-long process — Z's call).

To add a test user: Google Cloud Console → APIs & Services → OAuth consent screen → Test users → Add Users → add the Google account email you want to test with.

### Build
`npm run build` passed cleanly. 79 routes total. New routes:
- `ƒ /api/integrations/google` (GET + DELETE)
- `ƒ /api/integrations/google/callback` (GET)
- `ƒ /api/integrations/google/connect` (GET)
- `ƒ /api/integrations/google/test-calendars` (GET)
- `○ /dashboard/integrations` (static shell, client-rendered)

### Commit
`feat: Google Workspace OAuth (Phase 2a)` — commit `23ad4bb`, pushed to origin/main. Vercel deploy triggered.

---

## 2026-04-17 — Phase 1.5 Onboarding (coding agent)

**Task:** Implement org creation + onboarding flow per PRD-phase-1-onboarding.md.

### Pre-work Audit Findings

**1. Encryption story:**
`anthropic_api_key_encrypted` stores PLAINTEXT. The column name is aspirational — no pgsodium/Vault wired up. Confirmed by reading `lib/anthropic.ts` which does `new Anthropic({ apiKey: org["anthropic_api_key_encrypted"] as string })` and the PATCH handler in `/api/admin/ai-config` which stores `keyValue` (trimmed plaintext) directly. The `/api/org/create` route will store plaintext in `anthropic_api_key_encrypted` and `keyValue.slice(-4)` as `anthropic_api_key_hint` — identical to the PATCH handler pattern. **Encryption is a follow-up PRD.**
> Updated 2026-04-17 (encryption PRD): now actually encrypted via AES-256-GCM. See Encryption section below.

**2. RLS policy audit (orgs table):**
- SELECT: "Members can view their org" — EXISTS
- UPDATE: "Admins can update their org" — EXISTS
- INSERT: NONE (00012 migration must add it)
- DELETE: NONE (not needed for this PRD)

**3. RLS policy audit (members table):**
- SELECT: "Members can view fellow members" — EXISTS
- ALL (insert/update/delete): "Admins can manage members" — EXISTS (but requires membership, not usable by new users)
- Self-service INSERT: NONE (00012 migration must add it)

**4. Auth callback:** File exists at `apps/web/src/app/auth/callback/route.ts`. Currently always redirects to `/dashboard`. Will update to check for `members` row and route to `/onboarding` if none found.

**5. Middleware:** `/dashboard` is the only protected prefix. `/onboarding` currently has no protection — will add it to PROTECTED_PREFIXES.

**6. Existing (auth)/onboarding/page.tsx:** Old multi-step mock-only UI exists at `apps/web/src/app/(auth)/onboarding/page.tsx`. Not wired to any API. PRD wants a new root-level `/onboarding` page — created separately, leaving the old file in place (it's a different route under the `(auth)` group).

### Files Created
- `apps/web/src/app/onboarding/page.tsx` — New onboarding form (org name + API key, calls POST /api/org/create)
- `apps/web/src/app/api/org/create/route.ts` — Org creation API: validates session, checks for existing member, validates Anthropic key via tiny API call, inserts orgs + members rows
- `supabase/migrations/00012_orgs_self_create_policy.sql` — RLS INSERT policies for self-service org creation

### Files Modified
- `apps/web/src/app/auth/callback/route.ts` — After code exchange, check members table; redirect to /onboarding if no row found, /dashboard if row exists
- `apps/web/src/middleware.ts` — Added /onboarding to PROTECTED_PREFIXES
- `supabase/combined_migration.sql` — Appended 00012 policies

### Decisions
- Anthropic key stored as plaintext in `anthropic_api_key_encrypted` (matches existing PATCH handler pattern). Encryption flagged as follow-up.
  > Updated 2026-04-17 (encryption PRD): now actually encrypted via AES-256-GCM. See Encryption section below.
- Model for key validation: `claude-haiku-4-5-20251001` per PRD. `max_tokens: 1`, content `"hi"`.
- Used `serviceClient` for all DB writes in `/api/org/create` (bypasses RLS, consistent with other API routes).
- Org `slug` auto-generated from org name (lowercase, non-alphanum → hyphens, max 50 chars + UUID suffix for uniqueness).
- `/onboarding` page uses same dark theme as `(auth)` layout (standalone page with matching CSS).
- `(auth)/onboarding/page.tsx` left untouched — different route, different purpose (old mock content).

### Additional notes
- `(auth)/onboarding/page.tsx` was renamed to `(auth)/_onboarding-old/page.tsx` — it resolved to the same `/onboarding` URL as the new root-level page, causing a Next.js build error. The old file was stale mock content (not wired to any API). Renamed instead of deleted per security rules.
- Onboarding layout (`/onboarding/layout.tsx`) is a server component that redirects existing members to /dashboard on direct navigation. Middleware handles unauthenticated users.
- `anthropic_api_key_valid: true` is set at org creation time (key was just validated). The PATCH handler in ai-config sets it to `false` on update (validated on first use). Difference is intentional.

### Build
`npm run build` passed cleanly. 75 routes generated (76 minus the deprecated (auth)/onboarding page). `/onboarding` is `ƒ` (server-rendered), `/api/org/create` is `ƒ` (dynamic API route).

### Commit
`feat: org creation + onboarding flow (Phase 1.5)` — commit `3131f01`, pushed to origin/main. Vercel deploy triggered.

---

## 2026-04-17 — /simplify pass (coding agent)

**Task:** Apply /simplify pass on Phase 1 Foundation commits. One clean commit on main.

### Fixes Applied

**H1 — Cross-tenant data leak in admin/usage (FIXED)**
- `messages` count now joins through `conversations!inner(org_id)` with `.eq("conversations.org_id", orgId)`
- `heartbeat_runs` count now joins through `heartbeat_jobs!inner(org_id)` with `.eq("heartbeat_jobs.org_id", orgId)`
- All 5 count queries now run via `Promise.all` (was sequential).
- Per-archetype breakdown now maps from `ARCHETYPE_SLUGS` constant instead of `Object.entries(ARCHETYPE_LABELS)`.

**H2 — N+1 auth lookup in admin/members GET (FIXED)**
- Replaced per-member `getUserById` calls with a single `listUsers({ perPage: 200 })`, built a `Map<user_id, userData>`, mapped locally.

**H3 — Archetype slug list consolidation (FIXED)**
- Created `apps/web/src/lib/archetypes.ts` (server-safe, no React imports) exporting `ARCHETYPE_SLUGS`, `ArchetypeSlug`, `ARCHETYPE_LABELS`, `ARCHETYPE_COLORS`.
- Updated all 6 routes to import from there: `admin/usage`, `admin/ai-config`, `admin/members` (indirectly via labels), `team/[slug]/chat`, `team/[slug]/conversations`, `api/heartbeat`, `api/decision-lab`.
- `lib/archetype-config.ts` (client-side, Lucide icons) left untouched.

**M1 — heartbeat_jobs UNIQUE constraint (FIXED)**
- New migration `supabase/migrations/00011_heartbeat_jobs_unique_and_indexes.sql` adds `UNIQUE(org_id, name)`.
- Also appended to `supabase/combined_migration.sql`.

**M2 — members.user_id index (FIXED)**
- `CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id)` added to same migration file and combined_migration.

**M3 — Anthropic client extraction (FIXED)**
- Created `apps/web/src/lib/anthropic.ts` exporting `getAnthropicClientForOrg(serviceClient, orgId, extraFields?)`.
- Used in `team/[slug]/chat`, `support/chat`, `decision-lab`. Error message wording preserved identically.

**M4 — API key preview leaks encrypted blob suffix (FIXED)**
- Added `anthropic_api_key_hint TEXT` column to `orgs` via migration 00011.
- `ai-config PATCH` now stores `keyValue.slice(-4)` as hint at save time.
- `ai-config GET` now returns `anthropic_api_key_hint` instead of `encrypted.slice(-8)`.
- Column is nullable — orgs that haven't re-saved their key get `accessKeyPreview: null` (not the encrypted blob).

**M5 — requestingMemberId null guard (FIXED)**
- Added `if (!requestingMemberId) return 403` at top of POST, PATCH, and DELETE in `admin/members` before any role check.

**M6 — Parallelize post-Claude writes in team/chat (FIXED)**
- `messages.insert` and `conversations.update` now run via `Promise.all`.

**L1 — User-visible "Phase 2" string (FIXED)**
- Removed `(Email delivery wired in Phase 2)` from POST success message in `admin/members`.

**L2 — integrations/callback silently swallows real OAuth codes (FIXED)**
- When a real `code` param is present (non-mock path), now returns `{ error: "OAuth token exchange not yet implemented..." }` with status 501.
- Mock path (`?mock=true`) still returns success HTML as before.
- TODO comment updated to note Phase 2 / Google Workspace as first target.

### Fixes Skipped
None — all HIGH, MEDIUM, and LOW fixes from the spec were applied.

### Build
`npm run build` in `apps/web/` passed cleanly. 74 routes generated.

### Commit
`simplify: cross-tenant fixes, slug consolidation, perf + safety polish` — pushed to origin/main. Vercel deploy triggered.

---

## 2026-04-10 — Proactive Heartbeat Backend

**Task:** Build the scheduling and execution system for proactive archetype heartbeats.

### Files Created

**`services/agents/src/heartbeat/__init__.py`**
Empty package init.

**`services/agents/src/heartbeat/models.py`**
Pydantic v2 models: `HeartbeatConfig`, `HeartbeatResult`, `HeartbeatConfigUpdate`, `OrgHeartbeatSettings`. All fields have sensible defaults (enabled=True, frequency_hours=4, active_start=8, active_end=20, timezone="America/New_York").

**`services/agents/src/heartbeat/prompts.py`**
`HEARTBEAT_BASE_PROMPT` shared preamble and `ARCHETYPE_SCAN_FOCUS` dict with domain-specific instructions for all 7 archetypes. Prompts instruct Claude to respond with `[NOTHING_NEW]` or `[TITLE:...] ... [ACTION:...]` structured markers.

**`services/agents/src/heartbeat/executor.py`**
`HeartbeatExecutor` class: takes `ClaudeClient`, `MemoryRetriever`, `org_id`. `run_scan()` method builds system prompt, retrieves up to 10 memory items, calls Claude at max_tokens=500/temperature=0.25, and parses the structured response. Full fallback parsing for missing markers. Returns `HeartbeatResult` with `skipped=True` when `[NOTHING_NEW]` is detected.

**`services/agents/src/heartbeat/notifier.py`**
`HeartbeatNotifier` class: `deliver()` saves results to `heartbeat_logs` DB table (or in-memory deque of 500 items for dev). `get_history()` fetches results, optionally filtered by archetype. Skipped results are logged but not stored.

**`services/agents/src/heartbeat/config.py`**
`HeartbeatConfigManager` class: manages per-org, per-archetype configs. `get_org_config()` returns all 7 archetype configs (creates defaults on first access). `update_archetype_config()` applies partial updates. `toggle_all()` enables/disables all in one call. Full in-memory fallback when db_pool is None. Uses `heartbeat_configs` DB table with `(org_id, archetype)` unique key.

**`services/agents/src/heartbeat/scheduler.py`**
`HeartbeatScheduler` class: asyncio background task (no APScheduler dependency). Wakes every 15 minutes, checks which (org, archetype) pairs are due based on `frequency_hours` + last-run timestamp. Respects `active_start`/`active_end` via `zoneinfo` (Python 3.9+ stdlib). Supports `schedule_org()`, `pause_archetype()`, `resume_archetype()`. Executor and org context are injected via factory callables to keep scheduler free of API-key concerns.

**`services/agents/src/heartbeat/router.py`**
FastAPI router at `/api/v1/heartbeat` with 5 endpoints:
- `GET /config?org_id=` -- get all 7 archetype configs
- `PATCH /config/{archetype}?org_id=` -- update one archetype config
- `POST /config/toggle-all?org_id=&enabled=` -- enable/disable all
- `GET /history?org_id=&archetype=&limit=` -- heartbeat result history
- `POST /trigger/{archetype}?org_id=&anthropic_api_key=` -- manual scan (for testing)

### Files Modified

**`services/agents/src/main.py`**
Added `from src.heartbeat.router import router as heartbeat_router` and mounted it at `/api/v1`.

### Design Decisions
- Used asyncio background task instead of APScheduler to avoid adding a new dependency.
- Scheduler is factory-injected: the router handles per-request executor creation; the scheduler calls passed-in async factories.
- All DB operations have in-memory fallbacks so the service runs cleanly in dev with no database.
- `zoneinfo` (stdlib since Python 3.9) handles timezone-aware active window checks.
- Skipped scans are logged at DEBUG but not stored -- only actionable results go to the inbox.

---

## 2026-04-10 — User Guide Content (Markdown Files)

**Task:** Create all user guide content files for the Edify OS help center.

### Files Created

**`content/guide/getting-started.md`**
Platform overview for new users. Covers the "you just hired a team" framing, a one-line summary of each of the 7 specialists, a 3-step getting started flow, and a first-week expectations section.

**`content/guide/meet-your-team/development-director.md`**
Development Director profile. Covers fundraising, grants, donor stewardship, and CRM. Includes 10 copy-paste prompts and tips for working with them.

**`content/guide/meet-your-team/marketing-director.md`**
Marketing & Comms Director profile. Covers social media, email campaigns, content writing, brand voice, and analytics. Includes 10 prompts.

**`content/guide/meet-your-team/executive-assistant.md`**
Executive Assistant profile. Covers email triage, scheduling, meeting prep, task tracking. Includes 10 prompts.

**`content/guide/meet-your-team/programs-director.md`**
Programs Director profile. Covers logic models, outcome tracking, grant reporting, needs assessments, funder compliance. Includes 10 prompts.

**`content/guide/meet-your-team/finance-director.md`**
Finance Director profile. Covers budgets, cash flow, grant financial reports, audit prep. Includes "always verify with a CPA" guardrails and 10 prompts.

**`content/guide/meet-your-team/hr-volunteer-coordinator.md`**
HR & Volunteer Coordinator profile. Covers hiring, onboarding, policies, volunteer programs, training. Includes legal review guardrails and 10 prompts.

**`content/guide/meet-your-team/events-director.md`**
Events Director profile. Covers event planning, run-of-show, sponsorships, post-event ROI. Includes 10 prompts.

**`content/guide/working-with-your-team.md`**
How to get the best results. Covers clear instructions, reviewing outputs, requesting revisions, common mistakes, and how org memory works. (Note: this file was pre-populated by the project linter; content was retained as-is.)

**`content/guide/organization-setup.md`**
Org configuration guide. Covers profile setup, memory, account connections (email/calendar/social via OAuth explained simply), and team member activation. (Note: this file was pre-populated by the project linter; content was retained as-is.)

**`content/guide/faq.md`**
12 FAQs covering privacy, accuracy, financial limitations, legal/medical advice guardrails, pricing, and support. (Note: this file was pre-populated by the project linter; content was retained as-is.)

**`content/guide/troubleshooting.md`**
6 common issues with step-by-step fixes: unresponsive team member, mismatched output, OAuth connection failures, wrong financial numbers, resetting a conversation, and plan changes.

**`content/guide/live-chat-support.md`**
How to use the support chat. Covers chat button location, what the support assistant handles, human escalation triggers, chat history, and alternate contact options.

**`content/onboarding/first-interaction-prompts.json`**
JSON file with 5 first-interaction prompts per archetype (35 total, 7 keys). Validated via Node.js -- JSON parses cleanly.

### Language rules applied
- Never said "agent," "LLM," "model," "token," or "API" in user-facing content
- All team members framed as specialists on a hired team
- Reading level targeted at grade 8 -- short paragraphs, bullet lists, plain language
- Every article includes a "Try this now" callout
- Friendly, coworker tone throughout -- not a manual

### Status
Complete. 14 files created (or confirmed pre-created by linter). All content follows PRD language rules and style guidance.

---

## 2026-04-10 — Decision Lab /simplify Pass

**Task:** Review all Decision Lab code (backend + frontend) for duplication, bugs, inconsistencies, and clean it up.

### Issues Found and Fixed

**Critical bug — archetype slug mismatches (would break filtering end-to-end):**
- `TeamSelector.tsx` had slug `executive_director` — backend uses `executive_assistant`. Fixed.
- `TeamSelector.tsx` had slug `hr_coordinator` — backend uses `hr_volunteer_coordinator`. Fixed.
- `route.ts` mock data used the same wrong slugs. Fixed to match backend canonical list.

**Data contract mismatch — follow-up API body:**
- `api.ts` was sending `{ archetype, question }` but the backend `FollowUpRequest` model expects `archetype_slug`. Fixed to send `{ archetype_slug, question }`.

**Duplication — `_extract_text` static method:**
- Identical implementation existed in both `orchestrator.py` and `synthesis.py`. Extracted to a module-level `extract_text()` function in `prompts.py` (neutral file both already imported). Both files updated to call the shared version.

**Abstraction leak — private attribute access in router:**
- `router.py` called `orchestrator._client.close()` directly. Added a public `close()` method to `DecisionLabOrchestrator` that delegates to the client. Router updated to call `orchestrator.close()`.

**Dead abstraction — trivial wrapper functions in `history.py`:**
- `_result_to_dict()` and `_dict_to_result()` were one-liner wrappers around `.model_dump()` and `.model_validate()`. Removed both functions and inlined the calls at their four use sites.

**Unused prop — `role_slug` on `ArchetypeCard`:**
- Declared in the props interface and passed from `page.tsx` but never used inside the component. Removed from interface and removed from the call site in `page.tsx`.

**Unused props — `roleSlug` and `scenarioId` on `FollowUp`:**
- Both declared in the `FollowUpProps` interface but never used inside the component. Removed from interface. Removed from the `<FollowUp>` usage in `page.tsx`.

**Dead import — `Any` in `synthesis.py`:**
- After removing the `_extract_text` static method (its only user of `Any`), the `from typing import Any` import was dead. Removed.

### No Changes Made To
- `sidebar.tsx` — Decision Lab entry is correct, no issues.
- `ScenarioInput.tsx`, `SynthesisPanel.tsx`, `ScenarioHistory.tsx` — clean, no issues.
- `models.py`, `prompts.py` (except adding `extract_text`), `router.py` error handling — all correct.
- Backend/frontend type shapes for `ScenarioResult` and `Synthesis` — consistent across layers.

### Status
Complete. 9 fixes across 9 files. No features added.

---

## 2026-04-10 — Subagent Infrastructure Layer

**Task:** Build the foundation for primary agents to delegate tasks to specialized subagents.

### What was built

**1. `services/agents/src/agents/sub/__init__.py`**
Empty package init.

**2. `services/agents/src/agents/sub/base_subagent.py`**
- `SubagentResult` dataclass with `text`, `structured_data`, and `artifact_type` fields.
- `BaseSubagent` ABC (independent of `BaseAgent`) with class attributes `slug`, `display_name`, `parent_role`, `max_tokens`.
- Abstract `execute(instruction, context) -> SubagentResult` method.
- Helper methods shared by all subagents: `_load_system_prompt()`, `_build_system_prompt()` (injects org context + memory retrieval), `_extract_text()`.
- Path resolution: `_PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts" / "sub"` (resolves to `src/prompts/sub/`).

**3. `services/agents/src/agents/sub/dispatcher.py`**
- `SubagentDispatcher` class.
- Constructor takes `registry: dict[str, type[BaseSubagent]]`, `client`, `memory`.
- `dispatch(slug, instruction, context) -> SubagentResult` — instantiates the subagent class, passes `instruction_hint` into context for targeted memory retrieval, calls `execute`, logs slug + parent_role + approximate output tokens.
- `registered_slugs()` utility method.

**4. `services/agents/src/agents/sub/grant_research.py`**
Concrete subagent for grant research. Calls Claude at temperature 0.2, returns `artifact_type="ranked_grant_list"`.

**5. `services/agents/src/agents/sub/grant_writing.py`**
Concrete subagent for grant writing/drafting. Calls Claude at temperature 0.4 (slightly more generative), returns `artifact_type="grant_draft"`.

**6. `services/agents/src/prompts/sub/grant_research.md`**
Prompt instructs the subagent to return a ranked list with funder name, funding range, eligibility notes, deadline, and priority rating.

**7. `services/agents/src/prompts/sub/grant_writing.md`**
Prompt instructs the subagent to draft clean grant copy grounded in org memory numbers, flag missing info with `[INSERT: ...]` markers, and follow funder guidelines.

**8. `services/agents/src/agents/primary/development_director.py` (updated)**
- Added import of `SubagentDispatcher`, `GrantResearchSubagent`, `GrantWritingSubagent`.
- `_SUBAGENT_REGISTRY` dict maps slugs to classes.
- `SubagentDispatcher` instantiated in `__init__`.
- `_should_delegate(user_input) -> str | None`: keyword-based detection. Returns `"grant_writing"` if input contains "grant" + a writing verb (write/draft/compose/prepare). Returns `"grant_research"` if input contains "grant" + a research verb (research/find/identify/search/list/look for). Returns `None` otherwise.
- `execute()` checks `_should_delegate()` first; if matched, calls `_delegate_and_present()`.
- `_delegate_and_present()` dispatches to the subagent and wraps the result with a Director-voice preamble via `_frame_subagent_result()`. On subagent failure, falls back to inline handling via `_inline_fallback()`.
- All existing inline handling preserved exactly as before.

### Design decisions

- `BaseSubagent` is intentionally NOT a subclass of `BaseAgent`. The contracts differ: primary agents take raw user input and return a generic dict; subagents take a focused instruction and return a typed dataclass. Mixing them would require awkward shims.
- The dispatcher owns class instantiation (not instance registration) to keep subagents stateless and avoid shared mutable state.
- Delegation detection is keyword-based to keep it simple and deterministic at this stage. Replacing it with an LLM classifier is a natural next step once the pattern is proven.
- On subagent dispatch failure, the Director falls back to inline handling silently so the user always gets a response.

### Status
Complete. All files created, path resolution verified against the actual filesystem.

---

## 2026-04-10 — Subagents for Development Director, Marketing Director, Executive Assistant

**Task:** Build 12 concrete subagent classes + prompt files for the 3 existing archetypes.

### What was built

**Development Director subagents (3 new):**

- `donor_outreach.py` + `donor_outreach.md` — Drafts personalized donor emails, thank-you letters, and impact reports. Artifact: `donor_email`. Temp: 0.4.
- `crm_update.py` + `crm_update.md` — Generates CRM update summaries, flags stale records, suggests next actions. Artifact: `crm_summary`. Temp: 0.2.
- `reporting.py` + `reporting.md` — Produces fundraising reports, dashboards, and board summaries. Artifact: `fundraising_report`. Temp: 0.25.

**Marketing & Comms Director subagents (5 new):**

- `social_media.py` + `social_media.md` — Drafts platform-specific posts (LinkedIn, Instagram, Facebook, X) with per-platform constraints. Artifact: `social_post`. Temp: 0.5.
- `email_campaign.py` + `email_campaign.md` — Designs email sequences, newsletters, drip campaigns with CTA structure. Artifact: `email_sequence`. Temp: 0.4.
- `content_writing.py` + `content_writing.md` — Produces blog posts, press releases, case studies. Artifact: `content_draft`. Temp: 0.45.
- `comms_strategy.py` + `comms_strategy.md` — Builds communication plans, messaging matrices, content calendars. Artifact: `comms_plan`. Temp: 0.3.
- `analytics.py` + `analytics.md` — Analyzes campaign performance, produces optimization recommendations. Artifact: `campaign_analysis`. Temp: 0.2.

**Executive Assistant subagents (4 new):**

- `email_triage.py` + `email_triage.md` — Categorizes/prioritizes incoming comms, drafts responses for urgent items. Artifact: `email_triage_result`. Temp: 0.25.
- `calendar_agent.py` + `calendar_agent.md` — Meeting scheduling, conflict detection, prep reminders. Artifact: `calendar_suggestion`. Temp: 0.2.
- `meeting_prep.py` + `meeting_prep.md` — Creates agendas + briefing notes from org memory. Artifact: `meeting_agenda`. Temp: 0.3.
- `task_management.py` + `task_management.md` — Extracts and organizes action items from any input type. Artifact: `task_list`. Temp: 0.2.

**`__init__.py` updated:**
All 31 subagent classes now exported (12 new + 19 previously existing from other archetypes).

### Design decisions

- Temperatures set by task type: analytical/extraction tasks (CRM, analytics, calendar, task management) use 0.2; structured writing (reporting, email triage, comms strategy) uses 0.25-0.3; creative/personalized writing (donor outreach, campaigns, content) uses 0.4-0.5; social media (highest creative latitude) uses 0.5.
- All prompt files use `[INSERT: ...]` and `[CLARIFY: ...]` bracket conventions matching grant_writing.md for consistency.
- Prompt constraints enforce a "no fabrication" rule across all 12 subagents -- each explicitly tells the agent to flag gaps rather than invent data.
- `__init__.py` updated to include all pre-existing subagents (programs, finance, HR, events archetypes) that were already present in the repo, not just the 12 new ones.

### Status
Complete. All 12 Python files and 12 prompt files created. `__init__.py` exports all 31 subagent classes.

---

## Session: 2026-04-10 — Build 4 New Primary Archetypes

### Task
Create 4 new primary agent classes and their prompt files, following the `development_director.py` pattern.

### Files Created

**1. `services/agents/src/agents/primary/programs_director.py`**
- Class: `ProgramsDirector`, `role_slug = "programs_director"`, `temperature = 0.35`
- Delegation: `logic model`/`theory of change` -> `program_design`; `outcome`/`metric`/`data` -> `outcome_tracking`; `grant report`/`funder report` -> `grant_reporting`; `needs assessment`/`gap analysis` -> `needs_assessment`; `deliverable`/`compliance`/`deadline` -> `compliance_monitor`
- Voice: grounded, empathetic, evidence-based; frames output around participant journeys

**2. `services/agents/src/agents/primary/finance_director.py`**
- Class: `FinanceDirector`, `role_slug = "finance_director"`, `temperature = 0.25`
- Delegation: `budget` -> `budget_builder`; `cash flow`/`runway` -> `cash_flow_forecast`; `grant financial`/`spending report` -> `grant_financial_report`; `audit`/`internal controls` -> `audit_prep`
- Voice: precise, measured, compliance-first; surfaces risk with clear severity labels

**3. `services/agents/src/agents/primary/hr_volunteer_coordinator.py`**
- Class: `HRVolunteerCoordinator`, `role_slug = "hr_volunteer_coordinator"`, `temperature = 0.4`
- Delegation: `volunteer` -> `volunteer_management`; `policy`/`handbook`/`workplace` -> `hr_policy`; `hire`/`job description`/`interview` -> `hiring_support`; `training`/`onboarding`/`orientation` -> `training_design`
- Voice: warm, people-centered, naturally inclusive; makes compliance approachable

**4. `services/agents/src/agents/primary/events_director.py`**
- Class: `EventsDirector`, `role_slug = "events_director"`, `temperature = 0.4`
- Delegation: `run of show`/`day-of` -> `run_of_show` (checked first to avoid collision with generic "plan"); `sponsor`/`sponsorship` -> `sponsorship_manager`; `debrief`/`roi`/`post-event` -> `post_event_eval`; `event plan`/`timeline`/`schedule` + planning intent -> `event_planner`
- Voice: high-energy, deadline-obsessed; always works backwards from the event date

### Prompt Files Created

- `services/agents/src/prompts/primary/programs_director.md`
- `services/agents/src/prompts/primary/finance_director.md`
- `services/agents/src/prompts/primary/hr_volunteer_coordinator.md`
- `services/agents/src/prompts/primary/events_director.md`

Each prompt includes: YAML frontmatter (role, model, temperature, subagents), personality block, expertise list, instructions with output format, and a few-shot example interaction that locks in the agent's voice.

### Files Updated

**`services/agents/src/agents/primary/__init__.py`**
- Was empty; now exports all 7 primary agent classes: `DevelopmentDirector`, `EventsDirector`, `ExecutiveAssistant`, `FinanceDirector`, `HRVolunteerCoordinator`, `MarketingDirector`, `ProgramsDirector`

### Design Decisions

- Each new agent has an empty `_SUBAGENT_REGISTRY` dict typed `dict[str, Any]`. Subagent classes for these roles don't exist yet; the dispatcher will raise a `KeyError` on dispatch, triggering the inline fallback. This is intentional -- the primary agent structure is complete and production-safe without subagents wired in.
- `EventsDirector._should_delegate` checks `run_of_show` before the generic `event_planner` path to prevent "run of show" requests from matching the broader "plan" keyword and landing in the wrong subagent.
- Temperature follows the spec: Finance Director is lowest (0.25, precision-critical), Programs and the rest are 0.35 and 0.4 respectively.
- All files use `from __future__ import annotations` per the Python 3.11+ requirement.

### Status
Complete. 4 agent files, 4 prompt files, 1 `__init__.py` update. All follow the `development_director.py` pattern exactly.

---

## 2026-04-10 — Subagent Classes + Prompts for 4 New Archetypes (17 subagents)

**Task:** Build concrete subagent classes and prompt files for Programs Director, Finance Director, HR/Volunteer Coordinator, and Events Director.

### What was built

**Programs Director subagents (5, parent_role = `programs_director`):**

- `program_design.py` + `program_design.md` — Logic models, theories of change, program frameworks. Artifact: `logic_model`. Temp: 0.35.
- `outcome_tracking.py` + `outcome_tracking.md` — Data collection instruments, outcome data analysis. Artifact: `outcome_dashboard`. Temp: 0.2.
- `grant_reporting.py` + `grant_reporting.md` — Program narrative sections of grant reports, outcome data compilation. Artifact: `program_report`. Temp: 0.25.
- `needs_assessment.py` + `needs_assessment.md` — Community needs assessments, gap analyses. Artifact: `needs_analysis`. Temp: 0.3.
- `compliance_monitor.py` + `compliance_monitor.md` — Funder requirements, reporting deadlines, grant deliverables. Artifact: `compliance_checklist`. Temp: 0.2.

**Finance Director subagents (4, parent_role = `finance_director`):**

- `budget_builder.py` + `budget_builder.md` — Org/program budgets, variance analysis, budget-to-actual. Artifact: `budget_document`. Temp: 0.2.
- `cash_flow_forecast.py` + `cash_flow_forecast.md` — 30/60/90-day cash position projections, shortfall flagging. Artifact: `cash_flow_projection`. Temp: 0.2.
- `grant_financial_report.py` + `grant_financial_report.md` — Financial sections of grant reports, spending-by-grant tracking. Artifact: `financial_report`. Temp: 0.2.
- `audit_prep.py` + `audit_prep.md` — Audit checklists, internal controls review. Artifact: `audit_checklist`. Temp: 0.2.

**HR & Volunteer Coordinator subagents (4, parent_role = `hr_volunteer_coordinator`):**

- `volunteer_management.py` + `volunteer_management.md` — Volunteer role descriptions, onboarding plans, recognition programs. Artifact: `volunteer_document`. Temp: 0.4.
- `hr_policy.py` + `hr_policy.md` — Handbook sections, workplace policies, compliance docs. Artifact: `policy_draft`. Temp: 0.25.
- `hiring_support.py` + `hiring_support.md` — Job descriptions, interview process design, scoring rubrics. Artifact: `hiring_document`. Temp: 0.35.
- `training_design.py` + `training_design.md` — Orientation materials, training curricula. Artifact: `training_plan`. Temp: 0.35.

**Events Director subagents (4, parent_role = `events_director`):**

- `event_planner.py` + `event_planner.md` — Comprehensive event plans: timelines, budgets, vendor lists, staffing. Artifact: `event_plan`. Temp: 0.35.
- `run_of_show.py` + `run_of_show.md` — Minute-by-minute schedules, stage cues, day-of coordination docs. Artifact: `run_of_show_document`. Temp: 0.25.
- `sponsorship_manager.py` + `sponsorship_manager.md` — Tiered sponsorship packages, prospectus, outreach templates. Artifact: `sponsorship_package`. Temp: 0.35.
- `post_event_eval.py` + `post_event_eval.md` — Attendee surveys, ROI calculation, debrief reports. Artifact: `event_evaluation`. Temp: 0.25.

### Design decisions

- All Finance Director subagents use temperature 0.2 -- financial output demands precision; lower temp reduces number hallucination risk.
- Compliance-sensitive prompts (hr_policy, audit_prep, grant_financial_report) explicitly instruct the agent to flag items for attorney or auditor review rather than providing legal or accounting advice.
- `[INSERT: ...]` and `[LEGAL REVIEW NEEDED: ...]` bracket conventions carried through from existing subagent prompts for consistency.
- `__init__.py` not touched per task instructions.

### Status
Complete. 17 Python files and 17 prompt files created and verified on disk.

---

## 2026-04-10 — Wire Subagent Registries + Add Delegation to Remaining Primary Agents

**Task:** Part A: populate empty `_SUBAGENT_REGISTRY` dicts in the 4 new primary agents. Part B: add full delegation logic to `marketing_director.py` and `executive_assistant.py`.

### Part A — Subagent registries wired

**`programs_director.py`**
- Added imports: `ProgramDesignSubagent`, `OutcomeTrackingSubagent`, `GrantReportingSubagent`, `NeedsAssessmentSubagent`, `ComplianceMonitorSubagent`
- Registry populated with all 5 slugs.

**`finance_director.py`**
- Added imports: `BudgetBuilderSubagent`, `CashFlowForecastSubagent`, `GrantFinancialReportSubagent`, `AuditPrepSubagent`
- Registry populated with all 4 slugs.

**`hr_volunteer_coordinator.py`**
- Added imports: `VolunteerManagementSubagent`, `HrPolicySubagent`, `HiringSupportSubagent`, `TrainingDesignSubagent`
- Registry populated with all 4 slugs.

**`events_director.py`**
- Added imports: `EventPlannerSubagent`, `RunOfShowSubagent`, `SponsorshipManagerSubagent`, `PostEventEvalSubagent`
- Registry populated with all 4 slugs.

### Part B — Delegation logic added

**`marketing_director.py`** (full rewrite to add delegation layer)
- Added `logging` import, `SubagentDispatcher`, `SubagentResult`, and all 5 subagent imports.
- `_SUBAGENT_REGISTRY` added at module level with 5 slugs.
- `SubagentDispatcher` instantiated in `__init__`.
- `_should_delegate`: `social_media`/`post`/`instagram`/`linkedin` -> `social_media`; `email`/`newsletter`/`drip` -> `email_campaign`; `blog`/`press release`/`case study` -> `content_writing`; `content calendar`/`messaging`/`communication plan` -> `comms_strategy`; `analytics`/`metrics`/`performance`/`campaign report` -> `analytics`.
- `execute()` checks delegation first; falls through to existing inline handling unchanged.
- `_delegate_and_present()`, `_frame_subagent_result()`, `_inline_fallback()` added following the `development_director.py` pattern exactly.

**`executive_assistant.py`** (full rewrite to add delegation layer)
- Added `logging` import, `SubagentDispatcher`, `SubagentResult`, and all 4 subagent imports.
- `_SUBAGENT_REGISTRY` added at module level with 4 slugs.
- `SubagentDispatcher` instantiated in `__init__`.
- `_should_delegate`: `email`/`inbox`/`triage` -> `email_triage`; `schedule`/`calendar`/`meeting time` -> `calendar_agent`; `agenda`/`briefing`/`prep` -> `meeting_prep`; `action items`/`tasks`/`track`/`remind` -> `task_management`.
- `execute()` checks delegation first; existing inline handling preserved including the "Retrieve relevant memories" comment.
- `_delegate_and_present()`, `_frame_subagent_result()`, `_inline_fallback()` added following the `development_director.py` pattern exactly.

### Status
Complete. All 6 files updated. All subagents now connected end-to-end from primary agent through dispatcher to concrete subagent class.

---

## 2026-04-10 — External Integration Tools (Step 4)

**Task:** Build the integration infrastructure that lets archetypes interact with external services via OAuth connections stored in the DB.

### Files Created

**`services/agents/src/integrations/__init__.py`**
Empty package init.

**`services/agents/src/integrations/oauth.py`**
- `OAuthTokenManager` class. Takes `db_pool: asyncpg.Pool` and `org_id`.
- `get_token(provider)` — queries `oauth_connections` table (columns: `org_id`, `provider`, `access_token`, `refresh_token`, `expires_at`) and returns the raw access token or `None` if not connected.
- `refresh_if_expired(provider)` — checks `expires_at` vs `now(UTC)`, falls through to existing token with a TODO comment for the actual refresh flow. Never logs token values.
- `SUPPORTED_PROVIDERS` frozenset guards both methods against unsupported strings.

**`services/agents/src/integrations/base_integration.py`**
- `BaseIntegration` ABC. Constructor takes `OAuthTokenManager`. Abstract `execute(action, params) -> dict[str, Any]`. `provider` class attribute to be overridden.

**`services/agents/src/integrations/calendar.py`**
- `CalendarIntegration(BaseIntegration)`. `provider = "google_calendar"`.
- Actions: `list_events` (GET `/calendars/{id}/events`), `create_event` (POST), `check_conflicts` (wraps list_events, returns conflict list + boolean flag).
- All calls use `Authorization: Bearer {token}` header via httpx. Returns structured dicts. try/except on HTTPStatusError and RequestError.

**`services/agents/src/integrations/email.py`**
- `EmailIntegration(BaseIntegration)`. `provider = "gmail"`.
- Actions: `list_messages` (GET `/messages` with Gmail query), `read_message` (GET `/messages/{id}`, returns headers + snippet), `send_draft` (creates MIME message, POSTs to `/drafts`, then `/drafts/send`).
- Uses stdlib `email.mime.text.MIMEText` + `base64.urlsafe_b64encode` for RFC-compliant message encoding.

**`services/agents/src/integrations/social.py`**
- `SocialMediaIntegration(BaseIntegration)`. Platform-aware: `facebook`, `instagram`, `linkedin`, `x`.
- Constructor takes `platform` arg; sets `self.provider = "social_{platform}"` dynamically.
- Actions: `post` (dispatches to `_build_post_payload` for platform-specific endpoint + body shape), `schedule_post` (returns informational placeholder with TODO for native scheduling), `get_analytics` (placeholder with TODO for per-platform insights endpoints).
- Platform-specific API roots and payload shapes documented with TODO comments.

**`services/agents/src/integrations/grants.py`**
- `GrantDatabaseIntegration(BaseIntegration)`. `provider = "grant_databases"`.
- Actions: `search` (GET `/grants/search` with keywords, amount_min/max, deadline_before, location params), `get_details` (GET `/grants/{id}`), `check_eligibility` (POST `/grants/{id}/eligibility` with org_profile body).
- Base URL is a placeholder with a TODO; structure is correct for any REST grant API.

### Files Updated

**`services/agents/src/claude/tools.py`**
Added 6 new Claude tool definitions matching Anthropic tool schema:
- `SEARCH_EXTERNAL_GRANTS` — keywords, amount_range, deadline_before, location
- `POST_TO_SOCIAL` — platform (enum), content, optional schedule_time
- `LIST_CALENDAR_EVENTS` — date_range object, calendar_id
- `CREATE_CALENDAR_EVENT` — title, start/end (Google Calendar format objects), attendees array, description
- `SEARCH_EMAILS` — query (Gmail syntax), max_results
- `DRAFT_EMAIL` — to, subject, body (sends immediately; description warns of this)

All 6 added to `ALL_TOOLS`. Total tools: 10 (4 existing + 6 new).

### Design decisions

- `SocialMediaIntegration` takes `platform` in its constructor (not `execute`) because the provider string embedded in OAuth tokens is platform-specific. A single class avoids 4 nearly-identical classes while still dispatching correctly.
- Tokens are never interpolated into error strings -- errors only report HTTP status codes, not token values.
- `httpx` was already in `pyproject.toml`; no dependency changes needed.
- `refresh_if_expired` contains the full plumbing for expiry detection but defers the actual token exchange to a TODO. The interface is correct so implementing the refresh later requires only filling in that one block.
- `check_conflicts` reuses `_list_events` rather than duplicating the API call logic.

### Status
Complete. 7 files created, 1 file updated. All 8 files parse cleanly (verified with `ast.parse`).

---

## 2026-04-10 — Refactor: Data-Driven Subagents + Infrastructure Fixes

**Task:** Fix 4 through Fix 7 from the review. Focused on model config, calendar conflict logic, and integrations __init__.

### Fix 4 — Subagents already data-driven

All 31 concrete subagent files were already in the correct simplified form (~15 lines each, no `execute()` override). No changes needed. The base class already had a concrete `execute()` implementation.

### Fix 5 — Add `model` class attribute to BaseSubagent

**`services/agents/src/agents/sub/base_subagent.py`** updated:
- Added `model: str = "claude-sonnet-4-20250514"` as a class attribute alongside the other overridable attributes.
- Changed the hardcoded string `"claude-sonnet-4-20250514"` in `execute()` to `self.model`.
- Subclasses can now override the model with a single line. Previously, changing the model required editing `base_subagent.py` internals.

### Fix 6 — Fix `_check_conflicts` in CalendarIntegration

**`services/agents/src/integrations/calendar.py`** updated:
- Old `_check_conflicts`: accepted arbitrary params, passed them straight to `_list_events`, then returned ALL events with non-null start/end as "conflicts". This meant any event in any window would be flagged as a conflict regardless of the proposed slot.
- New `_check_conflicts`: requires `start` and `end` params representing the proposed time slot. Fetches events in that window from Google (using timeMin/timeMax). Then applies the standard overlap condition: `event_start < proposed_end AND event_end > proposed_start`. Returns only events that truly overlap.
- Returns a helpful error dict if `start` or `end` params are missing.

### Fix 7 — Populate integrations/__init__.py

**`services/agents/src/integrations/__init__.py`** rewritten (was empty):
- Exports: `BaseIntegration`, `CalendarIntegration`, `EmailIntegration`, `GrantDatabaseIntegration`, `OAuthTokenManager`, `SocialMediaIntegration`.
- Full `__all__` list included.
- All 6 class names verified against actual class definitions in their respective files.

### Verification
- All 3 modified files parse cleanly via `ast.parse`.
- All 31 subagent files parse cleanly (no regressions).
- Integration class names confirmed to match `__init__.py` exports.

### Status
Complete. 3 files modified. No regressions.

---

## 2026-04-10 — /simplify Pass: Agents Service

**Task:** Review all recently built agent code for duplication, inconsistency, dead code, and over-engineering. Fix everything found.

### Issues found and fixed

**1. 31 subagents with identical `execute()` bodies (massive duplication)**
- Every subagent had the same 12-line `execute()` method varying only in `temperature` and `artifact_type`.
- Fix: Added `artifact_type` and `temperature` as class attributes to `BaseSubagent`. Implemented `execute()` once in `BaseSubagent`. All 31 subclasses now only declare class attributes -- no methods.
- Each subagent went from ~40 lines to ~14 lines. Total reduction: ~800 lines of boilerplate.

**2. Dead `max_tokens = 2048` in all 31 subclasses**
- Already the default in `BaseSubagent`. Removed from all subclasses.

**3. Dead import: `SubagentResult` in 6 of 7 primary agents**
- `events_director`, `executive_assistant`, `finance_director`, `hr_volunteer_coordinator`, `marketing_director`, `programs_director` all imported `SubagentResult` but never used it.
- Fix: Removed the import from all six files.

**4. Duplicate `tool_executor` closure in all 7 primary agents**
- Identical 12-line async closure defined inside `execute()` in every primary agent.
- Fix: Moved to `BaseAgent._tool_executor()` as an instance method. All primaries now pass `tool_executor=self._tool_executor`.

**5. Duplicate inline handling logic in all 7 primary agents**
- `execute()` body (prompt building + memory retrieval + client call) duplicated 7 times.
- `_inline_fallback()` method duplicated 7 times.
- Fix: `_build_system_prompt()`, `_extract_text()`, and `_inline_fallback()` moved to `BaseAgent`. Removed from all primary agents.

**6. Duplicate delegation pipeline in all 7 primary agents**
- `__init__()`, `execute()`, `_delegate_and_present()`, and `_frame_subagent_result()` were duplicated across all 7 files.
- Fix: Created `services/agents/src/agents/primary/base_primary.py` (`BasePrimaryAgent`) which centralises the full pipeline. Each primary agent now only declares `_SUBAGENT_REGISTRY`, `_PREAMBLES`, and `_should_delegate()`.
- All 7 primary agents now inherit from `BasePrimaryAgent` instead of `BaseAgent` directly.

**7. Inconsistent `_SUBAGENT_REGISTRY` typing**
- Some files had `dict[str, Any]`, one had no annotation. Standardised to `dict[str, Any]` as class attribute on each subclass.

**8. Unused `ALL_TOOLS` import in `base.py`**
- Added during helpers migration but not needed there (used in `base_primary.py`). Removed.

**9. `_frame_subagent_result` preamble pattern made data-driven**
- Was a `@staticmethod` with hardcoded preamble dict per agent. Now driven by `_PREAMBLES` class dict on each subclass, resolved by `BasePrimaryAgent._frame_subagent_result()` via `getattr`.

### Files changed
- `src/agents/base.py` — added shared helpers
- `src/agents/primary/base_primary.py` — new, centralises execute pipeline
- `src/agents/primary/__init__.py` — added `BasePrimaryAgent` export
- `src/agents/primary/development_director.py` — migrated to `BasePrimaryAgent`
- `src/agents/primary/events_director.py` — migrated to `BasePrimaryAgent`
- `src/agents/primary/executive_assistant.py` — migrated to `BasePrimaryAgent`
- `src/agents/primary/finance_director.py` — migrated to `BasePrimaryAgent`
- `src/agents/primary/hr_volunteer_coordinator.py` — already migrated by linter
- `src/agents/primary/marketing_director.py` — already migrated by linter
- `src/agents/primary/programs_director.py` — already migrated by linter
- `src/agents/sub/base_subagent.py` — added `artifact_type`, `temperature`, `model` class attrs; `execute()` no longer abstract
- All 31 subagent files — stripped to class attributes only

### Verification
All 52 modified files parsed cleanly with `ast.parse`.

---

## 2026-04-10 — Fix: Register Orphaned DevelopmentDirector Subagents + Delegation Keywords

**Task:** The 3 subagents built for DevelopmentDirector (donor_outreach, crm_update, reporting) existed as classes but were never registered in the agent's registry or reachable via `_should_delegate`.

### What was fixed

**`development_director.py`** (the only file that required a content change not covered by the /simplify pass):
- Added imports: `DonorOutreachSubagent`, `CrmUpdateSubagent`, `ReportingSubagent`.
- `_SUBAGENT_REGISTRY` expanded from 2 to 5 entries.
- `_should_delegate` extended with:
  - `donor_outreach`: ("donor", "outreach", "thank you", "stewardship")
  - `crm_update`: ("crm", "stale", "donor record")
  - `reporting`: ("report", "dashboard", "board summary", "fundraising report")
- Grant delegation path unchanged (still checks "grant" keyword first).

### Verification
All 9 primary-agent files (`base_primary.py` + 7 agents + `__init__.py`) pass `ast.parse` clean.

### Status
Complete. 1 file content change. All tests pass syntax check.

---

## 2026-04-10 — Live Chat Support Widget + Contextual Help System

**Task:** Build the in-app live chat widget and contextual help components for the Next.js frontend.

### Files created

**`apps/web/src/components/support/ChatProvider.tsx`**
- React context provider for the support chat widget (independent of the existing `ChatPanelProvider` which handles agent-specific chats).
- Manages open/closed state, message history, and loading state.
- Sends messages via POST to `/api/support/chat` with full conversation history.
- Persists chat history in `localStorage` per session (key: `edify_support_chat_history`).
- Exposes `openChat()`, `closeChat()`, `sendMessage()` via `useSupportChat()` hook.
- Error-safe: bad API responses produce a friendly fallback message.

**`apps/web/src/components/support/ChatWidget.tsx`**
- Floating button (bottom-right, Intercom-style) that expands into a 400px-wide, 500px-tall chat panel.
- Header: "Need help? Ask your support assistant" in brand-500 purple.
- Message bubbles: user on right (brand-500), assistant on left (white card).
- Animated open/close (scale + opacity transition), minimize-to-bar mode, close button.
- Auto-scroll, auto-resize textarea, Enter-to-send (Shift+Enter for newline).
- Shows `TypingIndicator` while awaiting API response.
- Mobile-responsive (full width on small screens).
- Uses `TypingIndicator` from existing component library.
- Reuses `.input-field`, `.brand-500` design tokens from globals.css.

**`apps/web/src/components/support/ProactiveHelper.tsx`**
- Tracks user idle time (default: 60 seconds) and shows a tooltip near the chat button.
- Also watches for repeated `invalid` form events (default threshold: 3) to detect struggling users.
- Tooltip: "Stuck? Your support assistant can help." with a "Get help now" button that opens the chat.
- Dismissable — uses `sessionStorage` to prevent reshowing on same page visit.
- Hides automatically if user opens chat manually.

**`apps/web/src/app/api/support/chat/route.ts`**
- Next.js App Router POST handler at `/api/support/chat`.
- Accepts `{ message: string, history: Array<{role, content}> }`.
- Attempts to forward to agent service (`AGENT_SERVICE_URL/api/agents/executive_assistant/chat`).
- Graceful fallback: returns varied placeholder responses when agent service is unavailable.
- 15-second timeout on upstream call via `AbortSignal.timeout`.

**`apps/web/src/components/help/Tooltip.tsx`** (`HelpTooltip`)
- Wraps any UI element; shows help text on first hover/focus only.
- Tracks seen state in `localStorage` (key: `edify_seen_tooltips`) — won't re-show once dismissed.
- Props: `id`, `content`, `children`, `position` (top/bottom/left/right), `alwaysShow` (debug flag).
- Clean dark tooltip with `animate-fade-in` transition.

**`apps/web/src/components/help/EmptyState.tsx`**
- Reusable empty state: icon + title + description + optional CTA button.
- Props: `icon` (LucideIcon), `title`, `description`, `actionLabel`, `onAction`, `className`.
- Uses `.btn-primary` and `brand-50` palette from globals.css.

**`apps/web/src/components/help/AnnouncementBanner.tsx`**
- Dismissable top-of-dashboard banner for feature announcements.
- Props: `id` (localStorage key), `title`, `description`, `ctaLabel`, `ctaHref`, `className`.
- Remembers dismissals in `localStorage` (key: `edify_dismissed_banners`).
- Subtle `brand-50` background, not aggressive.
- Sparkles icon, X dismiss button.

### Files updated

**`apps/web/src/app/dashboard/layout.tsx`**
- Wrapped layout with `SupportChatProvider`.
- Added `<ChatWidget />` and `<ProactiveHelper />` as siblings to `<ChatPanel />` so they appear on all dashboard pages.

### Design decisions

- `SupportChatProvider` is a separate context from `ChatPanelProvider` — the existing panel is for talking to specific agent team members, while the new widget is for platform support. Mixing them would require breaking the existing agent-selection flow.
- Never says "AI" or "agent" in user-facing strings — uses "support assistant" throughout.
- API route tries the real agent service first (Executive Assistant archetype handles support) and falls back gracefully. Shape is correct so wiring the real service later requires only confirming the URL/endpoint.
- ProactiveHelper uses the native `invalid` event (bubbled from form inputs) to detect failed form actions — no custom event system needed.
- localStorage keys are all prefixed `edify_` to avoid namespace collisions.

### Status
Complete. 7 new files, 1 file updated. TypeScript check passes clean (`npx tsc --noEmit` with no errors).

---

## 2026-04-10 — Help Center & Onboarding Frontend Pages

**Task:** Build Next.js pages and components for the user guide help center and in-app onboarding flow (PRD-user-guide.md).

### Content Files Created

All markdown content for the help center lives in `content/guide/`:

- `meet-your-team/executive-assistant.md` — Who they are, strengths, when to use them, 10 example prompts, tips
- `meet-your-team/programs-director.md` — Program design, outcomes, logic models, compliance
- `meet-your-team/finance-director.md` — Budgets, cash flow, grant financials, audit prep
- `meet-your-team/hr-volunteer-coordinator.md` — Hiring, volunteers, policies, training
- `meet-your-team/events-director.md` — Event planning, run of show, sponsorships
- `working-with-your-team.md` — How to give good instructions, review outputs, request revisions
- `organization-setup.md` — Org profile, Memory, integrations, team activation
- `faq.md` — Privacy, accuracy, pricing, limitations, common questions
- `troubleshooting.md` — 7 common issues with specific fixes

(development-director.md and marketing-director.md already existed.)

### Library Files Created

**`apps/web/src/lib/markdown.ts`**
- Zero-dependency markdown-to-HTML renderer. Handles headings (h1-h4 with ID anchors), bold, italic, inline code, blockquotes, ordered/unordered lists, horizontal rules, links.
- `extractHeadings()` returns heading metadata for ToC generation.

**`apps/web/src/lib/guide-content.ts`**
- Server-side utility for reading markdown content files from `content/guide/`.
- `readGuideFile(relativePath)` — reads and returns a markdown file.
- `getAllGuideArticles()` — returns all guide articles with slugs and titles for search indexing.
- `getAdjacentArticles(slug)` — returns prev/next article for navigation.
- `ARTICLE_ORDER` — canonical article sequence for consistent prev/next navigation.

### Pages and Components Created

**1. `apps/web/src/app/dashboard/guide/layout.tsx`**
- Wraps all guide pages with a collapsible sidebar navigation.
- Sidebar shows all top-level articles; "Meet Your Team" expands to show 7 sub-links when active.
- Auto-breadcrumbs from the URL path.
- Live Chat link at sidebar bottom.

**2. `apps/web/src/app/dashboard/guide/page.tsx`**
- Help Center landing. Hero with search bar (submits to /dashboard/guide/search).
- 6 category cards with icons, descriptions, and links.
- "Meet Your Team" card shows all 7 sub-article links inline.
- Live Chat CTA at bottom.

**3. `apps/web/src/app/dashboard/guide/[slug]/page.tsx`** + `ArticleFeedback.tsx`
- Dynamic server component that renders any top-level guide article from markdown.
- Auto-generated Table of Contents sidebar (h2+ headings, sticky, xl screens).
- Prev/Next navigation at bottom.
- "Was this helpful?" feedback widget (client component). Yes/No state, textarea for negative feedback.

**4. `apps/web/src/app/dashboard/guide/meet-your-team/page.tsx`**
- Index page showing all 7 team members as interactive cards.
- Each card shows archetype-colored icon, role tagline, and description.
- "Not sure who to ask?" tip at bottom.

**5. `apps/web/src/app/dashboard/guide/meet-your-team/[slug]/page.tsx`**
- Dynamic server component for individual archetype guide articles.
- Archetype-specific color accent badge at top (each of the 7 has a distinct color: emerald, amber, sky, violet, teal, rose, orange).
- Same ToC sidebar and feedback widget as the general article renderer.
- Team member prev/next navigation cycling through the 7 archetypes.

**6. `apps/web/src/app/dashboard/guide/search/page.tsx`** + `SearchBox.tsx`
- Server-side full-text search across all guide content (no client-side JS bundle weight).
- Title matches ranked above content matches.
- Results show article title, 200-char snippet centered on the matching term, and path.
- Client `SearchBox` component handles submit and router navigation.

**7. `apps/web/src/app/dashboard/guide/live-chat/page.tsx`**
- Support message form (email + message textarea).
- After submit: confirmation state with "back to help center" link.
- Quick links to 4 key help center articles for self-service.

**8. Onboarding Flow — `apps/web/src/app/dashboard/onboarding/`**

`page.tsx` — State machine: welcome → pick → chat → done. Persists completed slugs to localStorage (`edify_onboarding_completed`).

`components/WelcomeScreen.tsx` — Big visual intro. 7 archetype icons displayed as a grid. Three value-prop cards ("They know your mission", "They specialize", "You stay in charge"). CTA to begin.

`components/ArchetypePicker.tsx` — 7 archetype cards in a 2-col grid. Each shows icon, role name, tagline, description. Completed ones marked with a green "Done" badge. Exports `ARCHETYPES` array used across components.

`components/GuidedConversation.tsx` — Preview chat interface. 5 role-specific suggested prompts per archetype. User can click a prompt or type their own. Simulated assistant response. After first interaction: celebration banner with "You just worked with your [Role]!" and a Continue button.

`components/ProgressTracker.tsx` — Sidebar component. Shows "X of 7 team members" with a progress bar and percentage. Per-row status for each archetype with checkmark/circle. Clicking a row navigates directly to that conversation. "Try now" label on uncompleted members.

### Files Updated

**`apps/web/src/components/sidebar.tsx`**
- Added `BookOpen` icon import.
- Added `{ href: '/dashboard/guide', label: 'Help Center', icon: BookOpen }` to `navLinks` between Integrations and Settings.

### Language Compliance
All user-facing strings follow the PRD language guidelines: no "agent", "LLM", "API", "model". Uses "specialist", "team member", "AI hire", "your Development Director", etc. throughout.

### Design Decisions

- **No new dependencies.** Built a simple markdown renderer rather than adding MDX/react-markdown (saves bundle weight; the content is simple enough that a 100-line renderer handles it cleanly).
- **Server-side search.** Search runs as a Next.js server component reading markdown at request time. No client-side bundle for the search index. Fast enough for this content volume.
- **`guide-content.ts` reads from `../../content/guide` relative to `process.cwd()`** — this works because Next.js runs from `apps/web/` and the content directory is at the monorepo root.
- **Onboarding uses localStorage** (not server state) to track which archetypes have been explored -- keeps it zero-infrastructure as specified in the PRD.
- **Simulated conversation in onboarding** — the GuidedConversation component shows a preview response rather than calling a real backend. When the live chat backend is wired in, swapping the simulated response for a real API call is a one-function change.
- **Meet Your Team sub-pages have independent slug/prev/next logic** separate from the main ARTICLE_ORDER. This lets the team member pages cycle through all 7 archetypes without being tangled with the broader article ordering.

### Status
Complete. 14 new frontend files, 7 new content files, 2 new library files, 1 sidebar update. `npx tsc --noEmit` passes clean with zero errors.

---

## 2026-04-10 — /simplify Pass: User Guide Code Review

### What Was Done

Full read of all user guide and onboarding code, then fixed every issue found.

### Issues Fixed

**1. ArticleFeedback.tsx -- fragile import path removed**
- Moved `ArticleFeedback.tsx` from `guide/[slug]/` to shared `guide/` directory.
- Updated import in `guide/[slug]/page.tsx` to `../ArticleFeedback`.
- Updated import in `guide/meet-your-team/[slug]/page.tsx` from `../../[slug]/ArticleFeedback` (traversing through a dynamic route segment -- fragile) to `../../ArticleFeedback`.
- Deleted the original file from the `[slug]` directory.

**2. Duplicate TEAM_SLUG_ORDER removed**
- `meet-your-team/[slug]/page.tsx` had a hardcoded `TEAM_SLUG_ORDER` array that duplicated the meet-your-team entries in `guide-content.ts`'s `ARTICLE_ORDER`.
- Now derives dynamically from `ARTICLE_ORDER` via filter + map -- single source of truth.

**3. Dead code: `unreadCount` in ChatWidget.tsx**
- `const unreadCount = 0` was declared and referenced in a conditional that could never be true (always 0). Removed the variable and the dead JSX block.

**4. Dead state: `setFailedActions` in ProactiveHelper.tsx**
- `[, setFailedActions] = useState(0)` was called only to trigger re-renders after incrementing `failedActionsRef`. But the render is already triggered by `show()` which calls `setVisible(true)`. The state was never read, making it pure dead code. Removed.

**5. Bug: HelpTooltip would never display**
- `visible && !hasBeenSeen` -- after `showTooltip` ran, it set both `visible=true` and `hasBeenSeen=true` in the same call, so the render condition was always false. The tooltip opened and immediately closed.
- Fixed: render condition is now just `visible`.

**6. Bug: handleConversationComplete stale closure**
- `completedSlugs` was read after calling `markComplete(slug)`, but `markComplete` updates state asynchronously -- so `completedSlugs` still reflected the old count. The `>= total` check used stale data and could skip the `done` step.
- Fixed: compute `newCount` from the pre-update `completedSlugs.length` + 1 (if not already done), which is accurate without needing the state update to flush.

**7. Forbidden words in faq.md**
- "Is my Anthropic API key secure?" and "What is the Anthropic API key for?" exposed "API" and "Anthropic" to users.
- Rewritten as "Is my access key secure?" and "What is the access key for?" with matching body text.

**8. Broken internal link in live-chat-support.md**
- `[Troubleshooting](troubleshooting.md)` was a relative markdown path that would not resolve in the rendered help center.
- Changed to `/dashboard/guide/troubleshooting`.

**9. Marketing Director naming inconsistency**
- Content file `marketing-director.md` called this role "Your Marketing & Comms Director" but all UI (layout, pages, ArchetypePicker, getting-started.md) used "Marketing Director".
- Renamed in `marketing-director.md` and `getting-started.md` to match.

### Files Changed
- `apps/web/src/app/dashboard/guide/ArticleFeedback.tsx` -- created (moved from [slug]/)
- `apps/web/src/app/dashboard/guide/[slug]/ArticleFeedback.tsx` -- deleted
- `apps/web/src/app/dashboard/guide/[slug]/page.tsx` -- updated import
- `apps/web/src/app/dashboard/guide/meet-your-team/[slug]/page.tsx` -- updated import + removed duplicate TEAM_SLUG_ORDER
- `apps/web/src/components/support/ChatWidget.tsx` -- removed dead unreadCount
- `apps/web/src/components/support/ProactiveHelper.tsx` -- removed dead state
- `apps/web/src/components/help/Tooltip.tsx` -- fixed tooltip visibility bug
- `apps/web/src/app/dashboard/onboarding/page.tsx` -- fixed stale closure in handleConversationComplete
- `content/guide/faq.md` -- removed forbidden words (API key references)
- `content/guide/live-chat-support.md` -- fixed broken internal link
- `content/guide/meet-your-team/marketing-director.md` -- consistent naming
- `content/guide/getting-started.md` -- consistent naming

---

## 2026-04-10 — Decision Lab Backend

**Task:** Build the Decision Lab backend service -- runs a decision scenario through all 7 AI archetypes in parallel and synthesizes the results.

### Files Created

- `services/agents/src/decision_lab/__init__.py` -- empty package init
- `services/agents/src/decision_lab/models.py` -- Pydantic v2 models: ScenarioRequest, ArchetypeResponse, Synthesis, ScenarioResult, FollowUpRequest
- `services/agents/src/decision_lab/prompts.py` -- three prompt templates: DECISION_LAB_SYSTEM_PROMPT, SYNTHESIS_PROMPT, FOLLOW_UP_PROMPT
- `services/agents/src/decision_lab/orchestrator.py` -- DecisionLabOrchestrator: dispatches to all archetypes via asyncio.gather(), parses [STANCE: X] [CONFIDENCE: Y] headers, supports follow-up queries on individual archetypes
- `services/agents/src/decision_lab/synthesis.py` -- SynthesisEngine: calls LLM as neutral facilitator, parses structured output into Synthesis model (consensus, disagreements, top_risks, recommended_action)
- `services/agents/src/decision_lab/history.py` -- ScenarioHistory: saves/retrieves ScenarioResult to Postgres when pool available, falls back to in-memory dict for dev
- `services/agents/src/decision_lab/router.py` -- FastAPI router: POST /run, GET /history, GET /{scenario_id}, POST /{scenario_id}/follow-up

### Files Modified

- `services/agents/src/main.py` -- registered decision_lab_router at /api/v1 prefix

### Design Decisions

- Each archetype is queried in parallel with asyncio.gather(); max_tokens=500 per archetype, 1000 for synthesis
- Archetype responses prefixed with [STANCE: X] [CONFIDENCE: Y] on first line for reliable parsing; fallback to "caution"/"low" on parse failure
- Synthesis prompt uses explicit section headers (## CONSENSUS, ## DISAGREEMENTS, ## TOP RISKS, ## RECOMMENDED ACTION) and a regex parser with list-item fallback
- History uses a module-level dict as in-memory fallback so no DB is required for local dev
- DB schema expected: decision_lab_scenarios table with (scenario_id, org_id, scenario_text, result_json, created_at); graceful fallback to memory on DB failure
- ClaudeClient.close() called in finally blocks on all API routes to prevent connection leaks

### Endpoints

- POST /api/v1/decision-lab/run -- takes ScenarioRequest (scenario_text, org_id, anthropic_api_key, optional selected_archetypes), returns ScenarioResult
- GET /api/v1/decision-lab/history?org_id=X -- returns list of recent scenarios
- GET /api/v1/decision-lab/{scenario_id}?org_id=X -- returns full ScenarioResult
- POST /api/v1/decision-lab/{scenario_id}/follow-up?org_id=X -- drills into one archetype, returns ArchetypeResponse

---

## 2026-04-10 — Decision Lab Frontend

**Task:** Build the Decision Lab frontend — where users describe a scenario and get instant feedback from their full AI team.

### Files Created

- `apps/web/src/app/dashboard/decision-lab/page.tsx` — Main page with header, input, example prompts, results grid, synthesis, and follow-up wiring
- `apps/web/src/app/dashboard/decision-lab/api.ts` — Client-side API wrapper (`runScenario`, `getHistory`, `getScenario`, `askFollowUp`)
- `apps/web/src/app/dashboard/decision-lab/components/ScenarioInput.tsx` — Large textarea with animated loading state and Cmd+Enter shortcut
- `apps/web/src/app/dashboard/decision-lab/components/TeamSelector.tsx` — 7 toggle pills (one per archetype), all selected by default, click to deselect
- `apps/web/src/app/dashboard/decision-lab/components/ArchetypeCard.tsx` — Per-team-member card with stance badge (Support/Caution/Oppose), confidence indicator, and follow-up button
- `apps/web/src/app/dashboard/decision-lab/components/SynthesisPanel.tsx` — Four-section summary: consensus, disagreements, top risks, recommended action
- `apps/web/src/app/dashboard/decision-lab/components/FollowUp.tsx` — Slide-over panel for asking follow-up questions to individual team members
- `apps/web/src/app/dashboard/decision-lab/components/ScenarioHistory.tsx` — Collapsible sidebar list of past scenarios with empty state
- `apps/web/src/app/api/decision-lab/route.ts` — Next.js API route with full mock data (7 archetypes, varied stances, synthesis); proxies to backend if available

### Files Modified

- `apps/web/src/components/sidebar.tsx` — Added "Decision Lab" nav link with `FlaskConical` icon, placed after Team

### Architecture Notes

- All language follows the "no LLM/agent/token" rule: "team member", "specialist", "your team", "Run it by the team"
- Mock data is fully realistic (7 archetypes with distinct voices, mixed stances, real synthesis)
- TypeScript: zero errors (`tsc --noEmit` passes clean)
- Mobile-responsive grid layout (1 col → 2 col for cards, sidebar collapses below lg)


---

## 2026-04-10 — Proactive Heartbeat Frontend

**Task:** Build the configuration UI and inbox integration for the heartbeat system.

**Status:** Complete. TypeScript typecheck passed with 0 errors.

### Files Created

1. `apps/web/src/lib/archetype-config.ts`
   - Central metadata registry for all 7 archetypes (icon, colors, labels, scan descriptions)
   - `buildSchedulePreview()` utility that generates human-readable schedule text (e.g. "Your Director of Development will check in at 8 AM, 12 PM, 4 PM, and 8 PM")

2. `apps/web/src/app/dashboard/inbox/heartbeats.ts`
   - TypeScript types: `ArchetypeSlug`, `HeartbeatConfig`, `OrgHeartbeatSettings`, `HeartbeatResult`
   - API wrapper functions: `getHeartbeatConfig`, `updateArchetypeConfig`, `toggleAllHeartbeats`, `getHeartbeatHistory`, `triggerHeartbeat`
   - Mock fallback data for dev use when API is unavailable

3. `apps/web/src/app/api/heartbeat/route.ts`
   - GET: returns full mock config (7 archetypes, default schedule settings)
   - PATCH: handles enable/disable, timezone, emailDigest, digestTime, per-archetype config
   - In-memory mock persistence for dev

4. `apps/web/src/app/api/heartbeat/history/route.ts`
   - GET: returns 7 mock heartbeat results (5 completed, 2 skipped) across archetypes
   - Supports optional `?archetype=` query filter
   - Realistic content for all major archetypes

5. `apps/web/src/app/dashboard/settings/heartbeats/components/GlobalSettings.tsx`
   - Master enable/disable toggle
   - Timezone dropdown (7 US timezones + UTC)
   - Email digest toggle with delivery time picker (hidden unless digest is on)
   - Quiet hours note

6. `apps/web/src/app/dashboard/settings/heartbeats/components/ArchetypeScheduleRow.tsx`
   - One row per archetype: icon, label, scan description
   - Enable/disable toggle (grays out row when off)
   - Frequency dropdown (every 1/2/4/8 hours, once daily)
   - Start time + end time hour pickers (filters invalid combos)
   - Live schedule preview text generated from `buildSchedulePreview()`

7. `apps/web/src/app/dashboard/settings/heartbeats/page.tsx`
   - "Your Team's Schedule" page at `/dashboard/settings/heartbeats`
   - Loads config from API on mount
   - GlobalSettings + 7 ArchetypeScheduleRow components
   - Tracks pending changes per archetype; Save button disabled until changes exist
   - Shows "Saved" confirmation with checkmark

8. `apps/web/src/app/dashboard/inbox/components/HeartbeatUpdate.tsx`
   - Card component for rendering a check-in update in the inbox
   - Header: archetype icon + colored label + relative timestamp
   - Bold title, body text, suggested action box (with link if URL provided)
   - "Discuss" button that opens chat panel with that team member
   - Matches existing inbox border-l-4 card styling

### Files Modified

- `apps/web/src/app/dashboard/settings/page.tsx`
  - Added "Your Team's Schedule" card with link to `/dashboard/settings/heartbeats`
  - Uses Clock icon from lucide-react

- `apps/web/src/app/dashboard/inbox/page.tsx`
  - Renamed page header to "Inbox" (was "Approval Queue")
  - Added top-level section tabs: "Approval Queue" | "Team Updates"
  - Team Updates tab fetches heartbeat history via API, renders HeartbeatUpdate cards
  - Empty state with link to configure check-ins in Settings
  - Approval Queue section unchanged functionally

### Language decisions
- Used "check-in" not "heartbeat" in all user-facing copy
- "Your Team's Schedule" for settings section
- "Team Updates" for inbox tab
- "Configure check-ins" for CTAs

### No sidebar changes needed
- Inbox was already present in the sidebar nav.

---

## 2026-04-10 — /simplify Pass: Heartbeat Code

**Task:** Read all heartbeat backend and frontend files, fix bugs and inconsistencies.

### Bugs Fixed

**Critical: Archetype slug mismatches (frontend vs backend)**
- Frontend had 4 wrong slugs: `program_director`, `volunteer_coordinator`, `finance_manager`, `hr_director`
- Backend canonical slugs: `programs_director`, `finance_director`, `hr_volunteer_coordinator`, `events_director`
- Frontend was also missing `events_director` entirely (had 7 entries but 4 were wrong)
- Fixed in: `heartbeats.ts` (ArchetypeSlug type + MOCK_CONFIG), `archetype-config.ts` (ARCHETYPE_CONFIG), `api/heartbeat/route.ts` (defaultConfig), `api/heartbeat/history/route.ts` (mock data)

**Mock data slug fix**
- `hb-005` used `finance_manager` → corrected to `finance_director`
- `hb-007` used `program_director` → corrected to `programs_director`

**Forbidden words in backend user-facing strings (executor.py)**
- `"The heartbeat scan encountered an error"` → `"This team member could not complete their check-in"`
- `"Heartbeat update"` (3 occurrences in fallback title) → `"Update from your team"`
- `"LLM error: ..."` in `skipped_reason` → `"Scan error: ..."`

**Unused import removed**
- `import json` in `executor.py` was imported but never used — removed

### No-change decisions
- Backend `HeartbeatResult` has `token_usage` field not in frontend type — not a runtime bug (JSON ignores extra fields in mock layer), deferred until real API integration
- Backend uses `created_at`, frontend uses `timestamp` — consistent within the frontend mock layer; will need a mapping layer when real backend is wired
- `config.py` `model_copy` filter `if v is not None` is correct — `False` passes through, so `enabled=False` works

### Files Changed
- `apps/web/src/app/dashboard/inbox/heartbeats.ts`
- `apps/web/src/lib/archetype-config.ts`
- `apps/web/src/app/api/heartbeat/route.ts`
- `apps/web/src/app/api/heartbeat/history/route.ts`
- `services/agents/src/heartbeat/executor.py`

---

## 2026-04-10 -- Generic LLM Client (provider-swappable)

**Task:** Replace the Claude-only client with a generic LLM client that defaults to Claude but supports pluggable providers.

### Files Created
- services/agents/src/llm/__init__.py -- package init, exports BaseLLMClient + LLMClientFactory
- services/agents/src/llm/base.py -- BaseLLMClient ABC defining the complete() + close() interface
- services/agents/src/llm/anthropic_client.py -- AnthropicClient(BaseLLMClient), moved from claude/client.py
- services/agents/src/llm/openai_compat_client.py -- OpenAICompatClient(BaseLLMClient) for OpenAI, Qwen, Groq, Together
- services/agents/src/llm/factory.py -- LLMClientFactory.create(provider, api_key, **kwargs)

### Files Updated (consumers)
- services/agents/src/claude/client.py -- converted to backwards-compat shim (AnthropicClient as ClaudeClient)
- services/agents/src/claude/__init__.py -- re-exports ClaudeClient, LLMClientFactory, BaseLLMClient
- services/agents/src/orchestrator/engine.py -- uses LLMClientFactory.create(), added llm_provider param
- services/agents/src/orchestrator/executor.py -- type hint: ClaudeClient -> BaseLLMClient
- services/agents/src/orchestrator/planner.py -- type hint: ClaudeClient -> BaseLLMClient
- services/agents/src/agents/base.py -- TYPE_CHECKING import updated to BaseLLMClient
- services/agents/src/agents/primary/base_primary.py -- type hint: ClaudeClient -> BaseLLMClient
- services/agents/src/agents/sub/base_subagent.py -- type hint: ClaudeClient -> BaseLLMClient
- services/agents/src/agents/sub/dispatcher.py -- type hint: ClaudeClient -> BaseLLMClient
- services/agents/src/decision_lab/orchestrator.py -- type hint: ClaudeClient -> BaseLLMClient
- services/agents/src/decision_lab/synthesis.py -- type hint: ClaudeClient -> BaseLLMClient
- services/agents/src/decision_lab/router.py -- uses LLMClientFactory.create()
- services/agents/src/heartbeat/executor.py -- type hint: ClaudeClient -> BaseLLMClient
- services/agents/src/heartbeat/router.py -- uses LLMClientFactory.create()

### Architecture Notes
- All consumers use BaseLLMClient interface; zero provider awareness required downstream
- OpenAICompatClient translates Anthropic tool schemas to OpenAI function calling format and normalises responses back to Anthropic format, so all parsing helpers remain unchanged
- Factory supports: anthropic (default), openai, qwen (DashScope), groq, together
- claude/client.py kept as shim -- no existing imports break
- openai SDK is imported lazily in OpenAICompatClient so it is not required unless that provider is actually used

---

## 2026-04-10 — Core Chat Interface for Talking to Archetypes

**Task:** Build the full conversational UI where users talk to their AI team members.

### Files Created

**API Routes:**
- `apps/web/src/app/api/team/[slug]/chat/route.ts` — POST endpoint accepting `{ message, conversationId? }`. Returns archetype-appropriate mock responses (5 per archetype, voice-matched). Falls through to real backend if `AGENT_SERVICE_URL` env var is set. 800-1600ms simulated latency.
- `apps/web/src/app/api/team/[slug]/conversations/route.ts` — GET returns conversation list (local mock + seeded defaults per archetype). POST creates new conversation.

**Client API Wrapper:**
- `apps/web/src/app/dashboard/team/[slug]/api.ts` — Full typed API layer: `sendMessage`, `getConversations`, `getMessages`, `saveMessage`, `createConversation`, `generateTitle`. Messages persisted to localStorage keyed by `chat:messages:{conversationId}`. Conversations persisted at `chat:conversations:{slug}`.

**Chat Components:**
- `apps/web/src/app/dashboard/team/[slug]/components/ChatMessages.tsx` — Message list with auto-scroll, relative timestamps ("just now", "2 min ago"), inline markdown rendering (bold, italic, code, headers, lists), archetype avatar on assistant messages, typing indicator.
- `apps/web/src/app/dashboard/team/[slug]/components/ChatInput.tsx` — Auto-resizing textarea, Enter to send / Shift+Enter for newline, disabled while waiting for response, character hint at 200+, collapsible suggested prompts row.
- `apps/web/src/app/dashboard/team/[slug]/components/ConversationSidebar.tsx` — List of past conversations with dates, "New conversation" button, active conversation highlight, collapsible to icon strip.

**Pages:**
- `apps/web/src/app/dashboard/team/[slug]/page.tsx` — Full-height chat page. Header with archetype icon + name + description. Empty state with 4 suggested prompts per archetype. Messages persisted to localStorage. Conversations auto-created on first send, titled from first message. Falls back to local-only if API unavailable.
- `apps/web/src/app/dashboard/team/page.tsx` (updated) — Now shows all 7 archetype cards (was 3). Card links to `/dashboard/team/[slug]`. Shows last conversation title from localStorage as preview. Green active pulse indicator. Uses `ARCHETYPE_CONFIG` and `ARCHETYPE_SLUGS`.

### Key Decisions
- Messages stored in localStorage per conversation until real backend wires up — no data loss on page refresh
- Markdown rendered with a custom lightweight parser (no external deps) — handles bold, italic, code, headers, lists
- Mock responses are voice-matched per archetype and rotate based on message content hash for variety
- Language follows rules: "team member", "your [Role]" — no agent/LLM/model language
- Chat page breaks out of dashboard's padded layout using `-m-6 lg:-m-8` + `calc(100vh)` for true full-height chat

### TypeScript
`tsc --noEmit` passed with 0 errors.

---

## 2026-04-10 — Organization Onboarding Briefing Flow

**Task:** Build the multi-step briefing flow where nonprofits brief their AI team with org info and documents.

### Files Created

**`apps/web/src/app/dashboard/briefing/page.tsx`**
Main briefing page. 4-step flow with step indicator (numbered circles, progress bar, "Step X of 4" label). Handles localStorage draft persistence (org profile + programs + goals auto-save on every change). Completion state stored at `edify_briefing_completed`. Calls `POST /api/briefing` on finish. Navigation: Back/Next with validation gates (step 0 requires org name, step 1 requires at least one program). "Skip for now" option on docs step when no files are added.

**`apps/web/src/app/dashboard/briefing/components/Step1OrgProfile.tsx`**
Org profile form: org name, mission statement, website (optional), annual budget range dropdown (5 tiers), org type dropdown (8 categories), full-time staff, regular volunteers, primary service area, founded year. Responsive 2-column grid on sm+. Exports `OrgProfileData` interface.

**`apps/web/src/app/dashboard/briefing/components/Step2Programs.tsx`**
Dynamic multi-program form. Each program has: name, description, annual budget (optional), people served/year (optional), key outcomes (comma-separated text). "Add another program" button with dashed border. Remove button per program (disabled when only 1 program). Exports `Program` and `ProgramsData` interfaces.

**`apps/web/src/app/dashboard/briefing/components/Step3Goals.tsx`**
Goals selection: 12 common nonprofit goals as checkbox-style toggle buttons in a 2-column responsive grid. Free-text "anything else" textarea. Selected count shown below grid. Exports `GoalsData` interface.

**`apps/web/src/app/dashboard/briefing/components/Step4Documents.tsx`**
Document upload: drag-and-drop zone + file input. Accepts PDF, DOC, DOCX, TXT, CSV, XLS, XLSX up to 10MB. Per-file category dropdown (10 categories). Internal state with functional updates for concurrent upload safety. Simulated progress bar with 200ms ticks to 85% then real fetch completes to 100%. Error states: file too large, wrong type, upload failure. "Your team has this document" confirmation on success. Exports `UploadedDoc` and `DocumentsData` interfaces.

**`apps/web/src/app/dashboard/briefing/components/BriefingComplete.tsx`**
Completion screen: celebration icon, personalized message with org name, 3-number summary (programs briefed, priorities set, documents shared), 3 quick-link cards (Development Director, Decision Lab, Check-in Schedules), Settings footer note.

**`apps/web/src/app/api/briefing/route.ts`**
`POST /api/briefing` — accepts `{ orgProfile, programs, goals }`. Shapes data to match `orgs` table + `memory_entries` table structure. Returns shaped memory entries for programs (category: `programs`) and goals (category: `general`). Category mapping documented inline. Returns success + shaped data.

**`apps/web/src/app/api/briefing/upload/route.ts`**
`POST /api/briefing/upload` — accepts multipart/form-data with `file` + `category`. Validates file type (by MIME + extension fallback) and size (10MB cap). Returns mock `docId`, `memoryCategories` array, and friendly message. Category map aligns with valid `memory_entries` categories in schema: `financial_statement -> general`, `event_plan -> general`, `staff_roster -> contacts` (schema doesn't have financials/events/volunteers yet).

### Files Modified

**`apps/web/src/app/dashboard/settings/page.tsx`**
Added "Organization Briefing" card at the top of the settings page (above "Your Team's Schedule"). Links to `/dashboard/briefing`. Uses `FileText` icon from lucide-react.

**`apps/web/src/components/sidebar.tsx`**
Added `useEffect` to check `edify_briefing_completed` localStorage flag on mount. When briefing is not complete, shows a "Brief Your Team" link between the main nav and the divider -- styled with a `Setup` badge and subtle branded border to draw attention. Defaults to `briefingComplete = true` to avoid flash of the prompt on first render.

### Language Rules Applied
- "Brief your team" / "your team will use this" throughout -- no mention of AI, models, data ingestion
- "Upload documents to brief your team" not "document ingestion"
- "Your team has this document" on upload success
- "Your team will refer to these when thinking about strategy" not "this data trains the model"

### Design Decisions
- Step4Documents uses internal `useState` for docs to enable functional updates in async upload callbacks -- prevents concurrent upload race conditions
- `makeDefaultPrograms()` is a function (not a module-level const) to defer `crypto.randomUUID()` call until client-side render
- Category mapping in both API routes comments explain the schema mismatch (no `financials`/`events`/`volunteers` categories in schema yet) and fall back to `general`
- Sidebar briefing prompt defaults to hidden (`briefingComplete = true`) to avoid hydration flash, then shows after client-side localStorage read

---

## 2026-04-10 — In-App Notification System

**Task:** Build a real-time notification system for team check-in updates, messages, and system events.

### Files Created

**`apps/web/src/components/notifications/types.ts`**
TypeScript types: `NotificationType` ("checkin" | "message" | "system"), `ArchetypeSlug` (all 7 archetypes), `Notification` interface (id, type, title, body, archetype?, link, timestamp, read), and `NotificationContextType`.

**`apps/web/src/components/notifications/NotificationProvider.tsx`**
React context provider wrapping the full dashboard. Polls `/api/notifications` every 30 seconds. Merges server data with localStorage-persisted read/dismissed state. Dispatches a `edify:new-notifications` CustomEvent for the toast system when new items arrive. Exposes: `notifications`, `unreadCount`, `markAsRead()`, `markAllAsRead()`, `dismissNotification()`.

**`apps/web/src/components/notifications/NotificationBell.tsx`**
Bell icon button for the sidebar header. Shows a red badge with unread count. Pulses for 2 seconds when unread count increases. Opens/closes `NotificationDropdown` on click.

**`apps/web/src/components/notifications/NotificationDropdown.tsx`**
Dropdown panel. Shows up to 20 recent notifications. "Mark all as read" link in header when there are unreads. Closes on outside click and Escape key. Empty state ("You're all caught up!") when no notifications. Footer "View all in Inbox" link.

**`apps/web/src/components/notifications/NotificationItem.tsx`**
Individual notification row. Archetype notifications show the archetype icon and bg color; system notifications show an Info icon; others show a Bell icon. Unread: bold title + blue left border. Relative timestamp formatting (just now, 5 min ago, etc.).

**`apps/web/src/components/notifications/ToastNotification.tsx`**
Fixed top-right toast stack (max 3). Slides in on arrival, auto-dismisses after 5 seconds. Click navigates to notification link and marks read. Dismiss (X) button. Listens for `edify:new-notifications` event from the provider.

**`apps/web/src/app/api/notifications/route.ts`**
GET: returns 6 realistic mock notifications (3 check-ins from team members, 2 messages, 1 system). PATCH: accepts `{ ids: string[] }` and returns confirmation (ready to wire to a real DB).

### Files Modified

**`apps/web/src/app/dashboard/layout.tsx`**
Wrapped layout in `<NotificationProvider>`. Added `<ToastNotification />` renderer inside the layout.

**`apps/web/src/components/sidebar.tsx`**
Added `<NotificationBell />` to the header (right side, next to the "AI Teams" badge). Added `unreadCount` badge to the Inbox nav link via `useNotifications()`.

### Language Rules Applied
- "check-in" not "heartbeat"
- "Your Director of Development has an update" not "agent notification"
- "Your team member checked in" throughout mock data

### Design Decisions
- `NotificationProvider` placed as the outermost wrapper so all child providers (chat, support) can consume it
- Read/dismissed state kept entirely in localStorage — no server round-trips needed until real auth/persistence exists
- Toast system uses a CustomEvent bridge rather than prop-drilling through the provider tree
- `ArchetypeSlug` type is duplicated in `types.ts` (not imported from heartbeats.ts) to keep the notifications module self-contained and avoid cross-app-layer imports in a component directory
- TypeScript check passes with zero errors

---

## 2026-04-10 — OAuth Connection Flow Frontend

**Task:** Build the UI where users connect external accounts so the AI team can take real actions on their behalf.

### Files Created

**`apps/web/src/app/dashboard/integrations/components/PermissionsInfo.tsx`**
Per-service permission explanation component. Maps 20+ integration IDs to plain-English capability lists (what the team will be able to do). Includes a privacy note: "Your data stays within your organization." Shown inside OAuthModal and the detail modal. Falls back to generic permissions for any integration not explicitly listed.

**`apps/web/src/app/dashboard/integrations/components/OAuthModal.tsx`**
Full OAuth flow modal with four states: `idle` (shows PermissionsInfo + Continue button), `pending` (spinner while popup is open), `success` (green checkmark, auto-closes), `error` (message + retry). Opens the OAuth URL in a popup window via `window.open()`. Listens for `postMessage` from the callback page. Falls back to simulated success if popup is blocked. Calls `POST /api/integrations` to get the OAuth URL server-side.

**`apps/web/src/app/dashboard/integrations/components/IntegrationCard.tsx`**
Standalone card component for a single integration. Handles both oauth and api_key connection types. Routes to OAuthModal for OAuth services; expands detail view for API key services. Shows connected status badge, agent dots, capability bullets, and disconnect affordance.

**`apps/web/src/app/api/integrations/route.ts`**
Next.js API route: GET returns connected integrations list, POST generates the (mock) OAuth start URL pointing at the callback route, DELETE removes a connection. All operations have mock implementations; documented TODO comments mark where real Supabase calls and token exchange go.

**`apps/web/src/app/api/integrations/callback/route.ts`**
OAuth callback handler. Returns a minimal HTML page that fires `window.postMessage` back to the opener (OAuthModal) and calls `window.close()`. Handles success, error from provider, and `mock=true` fast-path for development. Includes documented TODO for real code-for-token exchange.

### Files Modified

**`apps/web/src/app/dashboard/integrations/page.tsx`**
Full rewrite. Integrated OAuthModal for all OAuth-type integrations. Added PermissionsInfo inside the detail modal. Rewrote all descriptions and button labels in plain language (no "API", "OAuth", "authenticate" etc.) -- "Link your Gmail", "Connect your account", "Give your team access". Split connect handling: OAuth services open OAuthModal, API key services open the detail modal with input fields. Added `animate-fade-in` to page root. Disabled Save & Connect button until required fields are filled.

### Language Rules Applied
- "Link your Gmail" / "Link your [service]" -- not "Connect via OAuth"
- "Give your team access to..." -- not "Authenticate"
- "Access key" -- not "API key" in UI labels
- Permission descriptions: "Read and send emails on your behalf" -- not "email scope granted"
- Privacy note: plain English, no technical jargon

### Design Decisions
- OAuthModal is a standalone component so it can be used from both the card grid and the detail modal without duplication
- postMessage-based callback is the industry-standard pattern for popup OAuth; pop-up close polling is a fallback for blocked popups
- Callback page is pure HTML/script (no React) since it runs in the popup, not the app shell
- PermissionsInfo is data-driven: a simple map of integration ID -> permission list, easy to extend
- TypeScript check passes with zero errors

---

## 2026-04-10 — /simplify Pass: LLM Client, Chat Interface, Org Briefing, OAuth Flow, Notifications

**Task:** Code quality and simplify pass over all newly built code from the batch.

### Issues Fixed

**Forbidden words in user-facing text:**
- `settings/page.tsx`: Replaced "Anthropic API Key" → "Anthropic Access Key", "API key is encrypted" → "access key is encrypted", "API key configured" → "Access key saved"
- `settings/page.tsx`: Replaced "Agents operate within guardrails" → "Your team operates within guardrails" (removed forbidden word "Agents")
- `settings/page.tsx`: Replaced "Low-risk tasks auto-execute" kept; removed "Agents operate" phrasing

**Dead code / unused exports:**
- `api/briefing/route.ts`: Removed exported `BriefingPayload` interface (was only used in-file; changed to `interface`)
- `api/briefing/route.ts`: Removed unused `CATEGORY_MAP` constant (was leaking implementation details in the API response; also removed `categoryMap` from the response body)
- `notifications/types.ts`: Removed duplicate `ArchetypeSlug` type definition; now re-exports from the canonical `@/app/dashboard/inbox/heartbeats`

**Duplicate code:**
- `briefing/page.tsx` + `Step2Programs.tsx`: Both defined identical `newProgram()` factory function. Exported it from `Step2Programs.tsx`, removed local copy from `briefing/page.tsx`, updated import.

**Unused import:**
- `briefing/page.tsx`: Removed unused `type Program` import (was only needed as return type of the now-removed `newProgram()`)
- `NotificationItem.tsx`: Removed redundant `key={id}` prop on a button element inside a component (keys are only meaningful on elements at the mapping call site, not inside the component body; also removed `id` from destructuring since it became unused)

**Missing import:**
- `ChatMessages.tsx`: Added `import type React from "react"` — needed for `React.ReactNode` return type annotation in `renderMarkdown` and `inlineMarkdown`

**Bug fix:**
- `BriefingComplete.tsx`: "Talk to your Development Director" link was pointing to `/dashboard/team` (the team list) instead of `/dashboard/team/development_director` (the specific chat page)

**Python deduplication:**
- `llm/factory.py`: Removed hardcoded duplicate of the default Anthropic model string; now imports `_DEFAULT_MODEL` from `anthropic_client.py` so there's a single source of truth

### Files Modified
- `services/agents/src/llm/factory.py`
- `apps/web/src/app/api/briefing/route.ts`
- `apps/web/src/app/dashboard/briefing/page.tsx`
- `apps/web/src/app/dashboard/briefing/components/Step2Programs.tsx`
- `apps/web/src/app/dashboard/briefing/components/BriefingComplete.tsx`
- `apps/web/src/components/notifications/types.ts`
- `apps/web/src/components/notifications/NotificationItem.tsx`
- `apps/web/src/app/dashboard/team/[slug]/components/ChatMessages.tsx`
- `apps/web/src/app/dashboard/settings/page.tsx`

### Not Changed (Clean)
- All 7 archetype slugs verified correct throughout all files
- `llm/__init__.py`, `llm/base.py`, `llm/anthropic_client.py`, `llm/openai_compat_client.py` — clean
- `claude/client.py` shim — clean
- Chat interface frontend (api.ts, ChatInput, ConversationSidebar, page.tsx) — clean
- OAuth flow (OAuthModal, PermissionsInfo, integrations route, callback route) — clean
- Notification components (Provider, Bell, Dropdown, Toast) — clean
- Dashboard layout, sidebar — clean

### Notes
- `IntegrationCard.tsx` is dead code (never imported by `integrations/page.tsx` which renders inline). Not deleted per protocol — escalating for decision.
- `CATEGORY_MAP` is defined identically in both `api/briefing/route.ts` and `api/briefing/upload/route.ts`. Minor duplication — would require a new shared file to fix; left as-is.

---

## 2026-04-10 — Admin Dashboard

**Task:** Build the full admin dashboard for org owners/admins to manage members, monitor usage, and configure the AI team.

### Files Created

**`apps/web/src/app/dashboard/admin/layout.tsx`**
Admin section layout with sub-navigation tabs (Overview, Members, Usage, AI Configuration), breadcrumbs, and a role guard that shows an "Access Restricted" message if the user is not an owner/admin. Role check is mocked as `true` for now.

**`apps/web/src/app/dashboard/admin/page.tsx`**
Admin landing page with: 4 overview stat cards (conversations this week, tasks completed, active members, connected integrations), and 3 quick-link cards to sub-pages.

**`apps/web/src/app/dashboard/admin/members/page.tsx`**
Member management page. Fetches members from API, shows role distribution badges, renders MemberTable, handles role changes and removes with optimistic UI, confirmation modal for removals, and toast notifications for all actions.

**`apps/web/src/app/dashboard/admin/members/components/MemberTable.tsx`**
Reusable member table with avatar initials, role badges (owner=purple, admin=blue, member=gray), responsive column hiding, change-role dropdown (excluding owner), and remove button per row. Empty state included.

**`apps/web/src/app/dashboard/admin/members/components/InviteMemberModal.tsx`**
Invite modal with email input, role selector dropdown (member/admin with descriptions), success/error states, mocks invite via POST /api/admin/members.

**`apps/web/src/app/dashboard/admin/usage/page.tsx`**
Usage monitoring page. Time period selector (7/30/90 days), 5 stat cards with trend indicators, per-archetype breakdown with metric toggle (conversations/messages/tasks), pure-CSS bar chart, summary table, and hourly activity chart.

**`apps/web/src/app/dashboard/admin/usage/components/StatCard.tsx`**
Reusable stat card with icon, large number, and optional change % indicator (green up / red down).

**`apps/web/src/app/dashboard/admin/usage/components/UsageChart.tsx`**
Pure CSS/Tailwind horizontal bar chart. Props: data array with label, value, color. No external charting libraries. Responsive.

**`apps/web/src/app/dashboard/admin/ai-config/page.tsx`**
AI Configuration page. Per-archetype rows with enabled/disabled toggle, autonomy level dropdown (Suggest only / Assist / Autonomous), custom instructions textarea. Provider section with provider selector, masked access key input (show/hide), test connection button, and save. All mock/optimistic.

**`apps/web/src/app/api/admin/members/route.ts`**
GET returns 4 mock members. POST mocks invite. PATCH mocks role update. DELETE mocks removal.

**`apps/web/src/app/api/admin/usage/route.ts`**
GET returns mock usage stats scaled by the `days` query param (7/30/90). Includes summary, per-archetype breakdown, and hourly distribution.

**`apps/web/src/app/api/admin/ai-config/route.ts`**
GET returns mock archetype configs and provider config. PATCH mocks save.

### Files Modified

**`apps/web/src/components/sidebar.tsx`**
Added `Shield` icon import and "Admin" nav link pointing to `/dashboard/admin`, placed between Help Center and Settings.

### Notes
- All data is mocked. When Supabase integration is wired up, the API routes are the right place to swap in real queries.
- Role guard in admin layout is currently hardcoded to `isAdmin = true`. Hook into auth session when auth is wired up.
- Language rules observed throughout: no "agent", "LLM", "model", "token", "API key" -- uses "team member", "AI Configuration", "access key" consistently.

---

## 2026-04-10 — /simplify pass on admin dashboard

### Files reviewed
- apps/web/src/app/dashboard/admin/layout.tsx
- apps/web/src/app/dashboard/admin/page.tsx
- apps/web/src/app/dashboard/admin/members/page.tsx
- apps/web/src/app/dashboard/admin/members/components/MemberTable.tsx
- apps/web/src/app/dashboard/admin/members/components/InviteMemberModal.tsx
- apps/web/src/app/dashboard/admin/usage/page.tsx
- apps/web/src/app/dashboard/admin/usage/components/StatCard.tsx
- apps/web/src/app/dashboard/admin/usage/components/UsageChart.tsx
- apps/web/src/app/dashboard/admin/ai-config/page.tsx
- apps/web/src/app/api/admin/members/route.ts
- apps/web/src/app/api/admin/usage/route.ts
- apps/web/src/app/api/admin/ai-config/route.ts
- apps/web/src/components/sidebar.tsx

### Fixes applied

1. **Dead code removed** — `members/page.tsx`: `activeCount` was defined but never referenced anywhere in the component. Removed.

2. **Hardcoded date fixed** — `MemberTable.tsx`: `timeAgo()` used `new Date("2025-04-10")` as a fixed "now" anchor. Changed to `new Date()` so relative timestamps stay accurate.

### No issues found in
- Archetype slugs: all 7 canonical slugs (`development_director`, `marketing_director`, `executive_assistant`, `programs_director`, `finance_director`, `hr_volunteer_coordinator`, `events_director`) match across every file -- no mismatches.
- Forbidden user-facing words: no "agent", "LLM", "model", "token", "API key", "heartbeat", or "cron" appear in user-facing text. Internal field names like `heartbeatsDelivered` stay in code only; the UI renders "Check-ins delivered". The `AGENT_COLORS`/`AGENT_SLUGS` identifiers are imports, not UI text.
- Imports: all imports verified used in every file.
- Duplication: none found -- icons/colors for archetypes are defined once per file without cross-file duplication that could be consolidated (each context uses its own local map, which is appropriate for page-level components).
- Import paths: all `@/lib/utils`, `@/lib/agent-colors`, component relative paths are correct.
- sidebar.tsx: new Admin nav link is clean -- `Shield` icon imported and used, placed correctly in navLinks array.

---

## Session: Supabase Client Utilities for Next.js Frontend

**Date:** 2026-04-10

### What was built

9 files created or updated to wire up full Supabase auth integration for the Next.js frontend. Everything degrades gracefully when Supabase env vars are absent (dev/mock mode stays fully functional).

### Files created

1. **`apps/web/src/lib/supabase/client.ts`** (rewritten)
   - Exports `createClient()` — returns a `createBrowserClient` instance or `null` when env vars are missing.
   - Exports `isSupabaseConfigured()` helper for conditional branches in pages/hooks.

2. **`apps/web/src/lib/supabase/server.ts`** (rewritten)
   - Exports `createServerSupabaseClient()` — async, reads cookies via Next.js `cookies()`, returns `null` when not configured.
   - Reads `SUPABASE_URL` / `SUPABASE_ANON_KEY` (server-only) with fallback to `NEXT_PUBLIC_` vars.

3. **`apps/web/src/lib/supabase/middleware.ts`** (new)
   - Exports `updateSession(request)` — refreshes the session cookie on every request.
   - Returns `{ response, session }`. When Supabase is not configured, passes through with `session: null`.

4. **`apps/web/src/middleware.ts`** (new)
   - Next.js edge middleware calling `updateSession`.
   - Protects `/dashboard/*` — redirects unauthenticated users to `/login?redirectTo=<path>`.
   - Redirects authenticated users away from `/login` and `/signup` to `/dashboard`.
   - Skips auth enforcement when Supabase is not configured.

5. **`apps/web/src/lib/supabase/auth.ts`** (new)
   - `signInWithEmail(email, password)` — email/password sign in.
   - `signUp(email, password, orgName)` — creates account, passes `org_name` in user metadata.
   - `signOut()` — clears session.
   - `getSession()` — returns current session.
   - `resetPassword(email)` — sends password reset email with redirect back to `/login`.
   - All functions return `{ data: null, error }` when Supabase is not configured.

6. **`apps/web/src/lib/supabase/hooks.ts`** (new)
   - `useUser()` — current user + loading/error. Subscribes to `onAuthStateChange`.
   - `useOrg()` — fetches user's org via `members -> orgs` join with RLS.
   - `useMembers()` — fetches all org members (RLS scoped).
   - `Org` and `Member` TypeScript interfaces matching the DB schema.
   - All hooks return null/empty immediately when Supabase is not configured.

7. **`apps/web/src/components/AuthProvider.tsx`** (new)
   - `'use client'` context provider wrapping the entire app.
   - Provides `{ user, session, org, loading }` via `useAuth()`.
   - Listens to `onAuthStateChange` for real-time session updates.
   - Fetches org on login; clears on logout.

8. **`apps/web/src/app/layout.tsx`** (updated)
   - Wraps `{children}` with `<AuthProvider>` as the outermost provider.

9. **`apps/web/.env.local.example`** (new)
   - Documents `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AGENT_SERVICE_URL`.

### Files enhanced (existing auth pages)

- **`apps/web/src/app/(auth)/login/page.tsx`** — Calls `signInWithEmail()` on submit. Falls back to direct redirect in dev mode. Uses `useRouter` for navigation.
- **`apps/web/src/app/(auth)/signup/page.tsx`** — Calls `signUp()` on submit. Falls back to direct redirect in dev mode.

### Design decisions

- `createClient()` returns `null` (not throws) when unconfigured. All callers check for null and bail gracefully. This keeps mock/demo mode fully functional without env vars.
- Server-side client reads non-public env vars first (`SUPABASE_URL`) with fallback to `NEXT_PUBLIC_SUPABASE_URL`. This lets the API and web app share the same Supabase project with appropriate key scoping.
- Org creation during sign-up is deferred to a server-side route (metadata only passed via `signUp`). The service role key stays server-only.
- Middleware matcher excludes static assets, images, and favicon to avoid unnecessary Supabase calls on every asset fetch.

---

## 2026-04-10 — Document Upload Parsing Pipeline

**Task:** Build the backend service that extracts text from uploaded documents and stores them as memory entries.

### Files Created

**`services/agents/src/documents/__init__.py`**
Empty package init.

**`services/agents/src/documents/models.py`**
Pydantic v2 models: `UploadRequest` (category, title, org_id, anthropic_api_key, generate_summary), `UploadResult` (memory_entry_ids, chunks_created, summary_generated), `DocumentStatus` (status Literal, chunks_created, error). All fields documented with descriptions.

**`services/agents/src/documents/parser.py`**
`DocumentParser` class with `parse(file_path, file_type) -> str`. Supports:
- PDF via PyMuPDF (fitz) -- page-by-page extraction with `[Page N]` headers
- DOCX via python-docx -- paragraph-level extraction
- TXT/MD -- direct read with utf-8 → utf-8-sig → latin-1 fallback chain
- CSV -- converts to key: value readable lines using headers as column names
- XLS/XLSX via openpyxl -- per-sheet extraction with header mapping

Text is cleaned (whitespace normalised, 3+ blank lines collapsed) and truncated to 100,000 characters with a warning log.

**`services/agents/src/documents/chunker.py`**
`TextChunker` class with `chunk(text, chunk_size=1000, overlap=100) -> list[str]`. Splitting strategy in priority order:
1. Paragraph boundaries (double newline split)
2. Sentence boundaries (`.`, `!`, `?` followed by whitespace)
3. Hard character split as last resort

Greedy bin-packing assembles segments into chunks, with overlap text prepended to each new chunk to preserve cross-boundary context.

**`services/agents/src/documents/ingester.py`**
`DocumentIngester` class with two public methods:
- `async ingest(file_path, file_type, category, title) -> list[str]` -- parse, chunk, store. Multi-chunk titles get "(part N/total)" suffix.
- `async ingest_with_summary(file_path, file_type, category, title, client) -> list[str]` -- same plus LLM summary using first 8000 chars. Summary stored with tags ["uploaded_document", file_type, "document_summary"].

In-memory fallback (`_IN_MEMORY_STORE` dict) activated when `MemoryRetriever.save()` returns None (no DB pool in dev mode). Uses uuid4 for fallback IDs.

**`services/agents/src/documents/router.py`**
FastAPI router mounted at `/api/v1/documents`:
- `POST /upload` -- multipart file + form fields (category, title, org_id, anthropic_api_key, generate_summary). Validates extension, enforces 10 MB limit, writes to tempfile for parser, deletes tempfile in finally block. Category mapping handles frontend slugs (e.g. strategic_plan → mission) and validates against known DB slugs, defaulting to "general".
- `GET /status/{job_id}` -- returns `DocumentStatus` from `_JOB_STORE`. Exists to support future async ingestion; all current uploads are synchronous.
- `DELETE /{memory_entry_id}` -- deletes from Postgres or in-memory fallback. Returns 204. Raises 404 if not found.

### Files Modified

**`services/agents/src/main.py`**
Added `from src.documents.router import router as documents_router` import and `app.include_router(documents_router, prefix="/api/v1", tags=["documents"])` mount.

**`services/agents/pyproject.toml`**
Added document parsing dependencies: PyMuPDF>=1.24.0, python-docx>=1.1.0, openpyxl>=3.1.0, python-multipart>=0.0.9 (required for FastAPI multipart uploads).

### Design Decisions
- Temp file pattern used so parsers can use file-path APIs (PyMuPDF, openpyxl require paths, not bytes)
- In-memory fallback mirrors the pattern in MemoryRetriever -- no DB required for dev
- Category resolution handles both frontend slug formats (strategic_plan) and direct DB slugs (mission)
- `financials`, `volunteers`, `events` categories now correctly mapped (migration 00008 adds these; frontend route.ts was falling back to general)
- Summary uses first 8000 chars to keep prompt cost predictable

---

## Session: /simplify — Document Parsing + Supabase Client
**Date:** 2026-04-10

### Files reviewed
**Backend:** `documents/__init__.py`, `models.py`, `parser.py`, `chunker.py`, `ingester.py`, `router.py`
**Frontend:** `lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `hooks.ts`, `auth.ts`, `components/AuthProvider.tsx`, `middleware.ts`, `app/layout.tsx`, `(auth)/login/page.tsx`, `(auth)/signup/page.tsx`

### Fixes applied

**`documents/models.py`**
- Introduced `CategorySlug = Literal[...]` type alias covering all 12 valid DB slugs from migration 00008
- Changed `category` field from plain `str` to `CategorySlug` — Pydantic now rejects invalid slugs at request parse time
- Fixed `anthropic_api_key` field: was incorrectly marked required (`...`) with `min_length=1`; changed to optional with `""` default, matching the router's form field default

**`documents/chunker.py`**
- Fixed import order: `logging` moved before `re` (stdlib alphabetical convention)

**`documents/ingester.py`**
- Moved `import uuid` from inside `_save_entry` function body to module-level — deferred imports are a code smell and hurt readability

**`documents/router.py`**
- Removed unused `import uuid` (uuid is used in ingester.py, not router.py)

**`apps/web/src/middleware.ts`**
- Removed dead `isPublic` variable and the `void isPublic` suppression workaround
- Replaced with `AUTH_PATHS` constant used directly in the session redirect check
- Simplifies the logic and removes a misleading comment about "implicit" usage

**`apps/web/src/lib/supabase/server.ts`**
- Imported `CookieOptions` from `@supabase/ssr` and applied it to the `setAll` parameter type, replacing the overly-loose `Record<string, unknown>` type

**`apps/web/src/components/AuthProvider.tsx`**
- Added `useRef` import
- Moved `createClient()` call from component render scope into a `useRef` — prevents a new Supabase client being instantiated on every re-render

### No changes needed
- `parser.py` — clean
- `chunker.py` — clean after import fix
- `client.ts` — clean
- `middleware.ts` (supabase lib) — clean
- `hooks.ts` — clean
- `auth.ts` — clean
- `layout.tsx` — clean (marketing copy in metadata is intentional)
- `login/page.tsx` — clean
- `signup/page.tsx` — clean

### Category slug coverage
All 12 slugs confirmed present in both `VALID_CATEGORIES` (router.py) and new `CategorySlug` literal (models.py):
`mission, programs, donors, grants, campaigns, brand_voice, contacts, processes, general, financials, volunteers, events`

---

## 2026-04-12 — Remove Finance Director (Permanent)

**Task:** Remove all Finance Director references from the codebase. Z confirmed permanent removal.

### Files Deleted
- `apps/web/src/app/agents/finance-director/page.tsx` + directory
- `services/agents/src/prompts/primary/finance_director.md`
- `services/agents/src/agents/primary/finance_director.py`
- `services/agents/src/agents/sub/audit_prep.py`
- `services/agents/src/agents/sub/budget_builder.py`
- `services/agents/src/agents/sub/cash_flow_forecast.py`
- `services/agents/src/agents/sub/grant_financial_report.py`
- `services/agents/src/prompts/sub/audit_prep.md`
- `services/agents/src/prompts/sub/budget_builder.md`
- `services/agents/src/prompts/sub/cash_flow_forecast.md`
- `services/agents/src/prompts/sub/grant_financial_report.md`

### Files Updated
- `services/agents/src/decision_lab/orchestrator.py` — removed `finance_director` from `ALL_ARCHETYPES` and `_DISPLAY_NAMES`
- `services/agents/src/heartbeat/config.py` — removed `finance_director` from `ALL_ARCHETYPES`, updated docstring counts from 7 to 6
- `services/agents/src/heartbeat/executor.py` — removed `finance_director` from `ARCHETYPE_DISPLAY_NAMES`
- `services/agents/src/heartbeat/prompts.py` — removed `finance_director` from `ARCHETYPE_SCAN_FOCUS`
- `services/agents/src/heartbeat/models.py` — updated docstring example slug
- `services/agents/src/agents/primary/__init__.py` — removed `FinanceDirector` import and export
- `services/agents/src/agents/sub/__init__.py` — removed finance-specific sub-agent imports and exports
- `apps/web/src/app/dashboard/guide/meet-your-team/page.tsx` — removed Finance Director from team list, updated "seven" to "six"
- `apps/web/src/app/dashboard/guide/meet-your-team/[slug]/page.tsx` — removed finance-director from ARCHETYPE_STYLES, removed DollarSign import
- `apps/web/src/app/dashboard/guide/layout.tsx` — removed finance-director nav link
- `apps/web/src/app/dashboard/guide/page.tsx` — removed Finance Director link from Meet Your Team section
- `apps/web/src/app/dashboard/guide/search/page.tsx` — removed finance-director from GUIDE_ARTICLES
- `apps/web/src/lib/guide-content.ts` — removed from meetTeamSlugs array and ARTICLE_ORDER
- `apps/web/src/app/dashboard/onboarding/components/ArchetypePicker.tsx` — removed finance-director archetype, removed DollarSign import, updated "all seven" to "all six"
- `apps/web/src/app/dashboard/onboarding/components/GuidedConversation.tsx` — removed finance-director from EXAMPLE_PROMPTS
- `apps/web/src/app/dashboard/onboarding/components/WelcomeScreen.tsx` — removed Finance Director from teamPreviews, removed DollarSign import, updated count to 6

### Verification
- `pnpm run typecheck` passed with 0 errors
- Final grep confirmed 0 remaining `finance_director`/`Finance Director`/`finance-director` references in source code

---

## 2026-04-17 — Phase 1 Foundation (coding agent)

### Phase A: Audit

**Objective:** Connect to live Supabase, dump actual schema, compare to supabase/migrations/, determine SAFE/NOT SAFE.

**Credentials used:** SUPABASE_SERVICE_ROLE_KEY from apps/web/.env.local. Project URL: https://tuirnficbifoewuijzeq.supabase.co

**Live DB schema dump:**

Queried via Supabase REST API OpenAPI spec (service role key, which bypasses RLS):
```
GET https://tuirnficbifoewuijzeq.supabase.co/rest/v1/ (Accept: application/openapi+json)
```

Exposed paths in live DB public schema:
- `/` (root)
- `/rpc/rls_auto_enable`

That is the complete list. **No tables exist.** No migration history table. No data.

Spot-checked tables from all 8 migrations against live DB — all returned PGRST205 ("Could not find the table in the schema cache"):
- orgs, members, agent_configs, tasks, task_steps — NOT FOUND
- memory_entries, conversations, messages — NOT FOUND
- heartbeat_jobs, heartbeat_runs, approvals, digest_preferences — NOT FOUND
- integrations — NOT FOUND

**Interpretation:** The live Supabase project has never had migrations applied. It is a clean slate. No data to protect, no diverged schema to reconcile. This is the best possible scenario.

**Migration files on disk (supabase/migrations/):**
- 00001_core_tenancy.sql — orgs, members tables + RLS
- 00002_agents_and_tasks.sql — agent_configs, tasks, task_steps tables + RLS
- 00003_memory_and_context.sql — memory_entries, conversations, messages tables + RLS
- 00004_heartbeat.sql — heartbeat_jobs, heartbeat_runs tables + RLS
- 00005_approvals.sql — approvals, digest_preferences tables + RLS
- 00006_integrations.sql — integrations table + RLS
- 00007_expand_integrations.sql — expands integrations.type check constraint (34 connectors)
- 00008_expand_memory_categories.sql — adds financials, volunteers, events to memory_entries category check

**Tables referenced in PRD routes but missing from migrations 00001-00008:**
- documents — PRD /api/briefing + /api/briefing/upload → needs new migration
- decisions — PRD /api/decision-lab → needs new migration
- notifications — PRD /api/notifications → needs new migration
- support_messages — PRD /api/support/chat → needs new migration
- conversations + messages → ALREADY in migration 00003 (good)

**Other findings:**
- next.config.mjs has `output: 'export'` (static mode) — blocks all 14 API routes in production
- apps/web/src/middleware.ts.bak exists — auth middleware is disabled (just needs rename)
- All 14 API routes have `export const dynamic = 'force-static'` and return mock data
- No Anthropic SDK (@anthropic-ai/sdk) in package.json — server-side Claude calls blocked
- claude-client.ts makes browser-side Claude calls — PRD requires server-side routing
- No /app/auth/callback/route.ts for Google OAuth callback
- git is clean (main branch, up to date with remote) — safe to commit

**AUDIT VERDICT: SAFE TO PROCEED**

The live DB is a clean slate. Migrations can be applied fresh via Supabase REST API (psql migration approach). All 8 existing migrations plus 4 new ones (documents, decisions, notifications, support_messages) will bring the schema to the state the PRD requires. No destructive operations needed. No data at risk.


### Phase B: Implementation

All changes committed to main and pushed. Vercel auto-deploy triggered.

**Commit 1 — `d1e5df8` — Switch Next.js to server mode and restore auth middleware**
- Removed `output: 'export'` from `apps/web/next.config.mjs`
- Copied `middleware.ts.bak` → `middleware.ts` to restore auth redirects
- Removed `export const dynamic = 'force-static'` from all 12 static API routes
- Removed `generateStaticParams()` from team/[slug] API routes (static export artifact)

**Commit 2 — `c0cb67f` — Add @anthropic-ai/sdk**
- Required for server-side Claude API calls in team/chat and support/chat
- pnpm-lock.yaml updated

**Commit 3 — `a5297ac` — Wire all 14 API routes to Supabase + Google OAuth**
- `/api/team/[slug]/chat` → Real Claude call using org's `anthropic_api_key_encrypted`, persists to `conversations` + `messages` tables
- `/api/team/[slug]/conversations` → Real SELECT from `conversations` table
- `/api/admin/members` → Real SELECT from `members` table, enriched with auth.admin.getUserById()
- `/api/admin/ai-config` → Real SELECT from `agent_configs` + PATCH with upsert
- `/api/admin/usage` → Real COUNT queries across conversations, messages, tasks, heartbeat_runs, documents
- `/api/heartbeat` → Real heartbeat_jobs SELECT/upsert; PATCH updates heartbeat_job config
- `/api/heartbeat/history` → Real heartbeat_runs SELECT
- `/api/integrations` → Real integrations table GET/POST/DELETE
- `/api/notifications` → Real notifications table GET/PATCH
- `/api/support/chat` → Real Claude call (claude-haiku), persists to `support_messages`
- `/api/decision-lab` → Parallel Claude calls for all 6 archetypes, persists to `decisions`
- `/api/briefing` → Updates `orgs` table + inserts into `memory_entries`
- Added `createServiceRoleClient()` and `getAuthContext()` to `supabase/server.ts`
- Added `signInWithGoogle()` to `supabase/auth.ts`
- Added `/app/auth/callback/route.ts` — exchanges OAuth code for Supabase session
- Added Google sign-in button to login page (above email/password form)
- Added migrations 00009 (documents, notifications) and 00010 (decisions, support_messages)
- Added `supabase/config.toml` (CLI init)

**Commit 4 — `1fbcda8` — Migration helper files**
- `supabase/combined_migration.sql` — all 10 migrations in one file for manual execution
- `supabase/apply-migrations.js` — documents 3 ways to apply migrations

**Commit 5 — `35c76eb` — Wire briefing/upload to documents table**
- Creates a `documents` row on file upload (storage_path set to null until Phase 2 Storage setup)

### Files Modified
- `apps/web/next.config.mjs`
- `apps/web/src/middleware.ts` (new — restored from .bak)
- All 14 API routes in `apps/web/src/app/api/`
- `apps/web/src/lib/supabase/server.ts`
- `apps/web/src/lib/supabase/auth.ts`
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/package.json` + `pnpm-lock.yaml`

### Files Created
- `apps/web/src/app/auth/callback/route.ts`
- `supabase/config.toml`
- `supabase/migrations/00009_documents_and_notifications.sql`
- `supabase/migrations/00010_decisions_and_support.sql`
- `supabase/combined_migration.sql`
- `supabase/apply-migrations.js`

### Decisions Made

1. **`decisions` table uses JSONB for responses/synthesis** — simpler than separate tables for Phase 1. Decision Lab query patterns are read-heavy, not join-heavy.

2. **`heartbeat_jobs.config` stores archetype slug** — existing heartbeat_jobs table has a `config jsonb` column; used it to store archetype identification rather than adding a new column.

3. **Support chat uses claude-haiku** — cheaper and faster for support queries; team archetype chat uses claude-sonnet.

4. **Decision Lab also uses claude-haiku** — 6 parallel calls; haiku speed matters here.

5. **`admin/members` enriches with `auth.admin.getUserById()`** — the `members` table stores `user_id` (UUID from auth.users) but not the email. Service role client has access to auth.admin; this lets us return email + name without storing PII in the public schema.

6. **`briefing/upload` storage deferred** — creating a `documents` row is enough for Phase 1; actual file binary storage requires a Supabase Storage bucket to be created in the dashboard first.

7. **Heartbeat upsert uses `org_id,name` conflict key** — `heartbeat_jobs` doesn't have a unique constraint on archetype slug, so we use the job name as a proxy key.

### Outstanding Issues / Questions for Lopmon

**BLOCKER: DB migrations not applied to live Supabase.**

All code is deployed to Vercel. The API routes will return 503/500 errors until the schema exists in the live DB. I could not apply migrations automatically because:
- No psql installed on this machine
- Supabase service role key cannot execute arbitrary SQL (only exposes PostgREST)
- Supabase Management API requires a PAT (personal access token) — not stored locally
- DB password is in Citlali's password manager — not accessible to this agent

**Action needed from Citlali (5 minutes):**
1. Go to: https://supabase.com/dashboard/project/tuirnficbifoewuijzeq/sql/new
2. Open: `C:\Users\Araly\edify-os\supabase\combined_migration.sql` in any text editor
3. Copy all contents → paste into the SQL editor → click "Run"
4. Confirm all tables appear in the Table Editor

OR, if Citlali has the DB password handy:
   npx supabase db push --db-url "postgresql://postgres.tuirnficbifoewuijzeq:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   (run from C:\Users\Araly\edify-os)

**After migrations are applied:**
- The API routes will work
- Create a test org and user via the Supabase dashboard (Auth → Users → "Invite user") to smoke-test
- Or sign in with Google via https://edifyos.vercel.app/login — if the org creation flow isn't wired yet, the user will have a session but no org_id and API routes will return 401

**Second blocker: No org creation flow wired.**
After a user signs in with Google (or email), there's no automatic org provisioning. A new Supabase user will have a session but won't be in the `members` table, so `getAuthContext()` returns `orgId: null` and all API routes return 401.

**Proposed fix for Lopmon:** This is a 1-session task. Need to either:
(a) Wire a `/api/org/create` endpoint + call it after first Google sign-in (onboarding flow), OR
(b) Manually insert a row into `orgs` + `members` in the SQL editor for the first user

Recommend (b) for smoke testing and (a) as a follow-up task in a new PRD or as an addendum to Phase 1.

### Acceptance Criteria Status

1. ✅ Code complete: Google Sign-in button → /auth/callback → session → /dashboard redirect
   ⚠️ Blocked: migrations not applied; org creation not wired
2. ✅ Code complete: /api/team/[slug]/chat calls Claude and persists to conversations+messages
   ⚠️ Blocked: migrations not applied; no org creation flow
3. ✅ Code complete: All 14 routes use real Supabase queries, zero getMock() functions remain
   ⚠️ Blocked: migrations not applied
4. ✅ Middleware restored: /dashboard requires auth, unauthenticated redirects to /login
5. ✅ output: 'export' removed: Vercel deploy shows no static export warnings (confirmed in build output)
6. ⚠️ Seed data: Combined migration includes demo org seed in seed.sql — needs manual run after migrations


**Third item to verify:** Vercel environment variables.
The deployed app needs these env vars set in Vercel project settings
(values are in `apps/web/.env.local` — do not commit them):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If these aren't in Vercel already, the deployed app will silently fall through to unauthenticated mode (middleware passes through, API routes return 503).
Check at: https://vercel.com/whitmorelabs/edify-os/settings/environment-variables

## 2026-04-17 — /simplify pass on onboarding (coding agent)

**Commit:** `simplify: onboarding consolidation, rollback safety, free key validation`
**Branch:** main
**Agent model:** claude-sonnet-4-6

### Changes Applied

**H1 — Onboarding moved into (auth) route group**
- Deleted `apps/web/src/app/onboarding/page.tsx` and `layout.tsx`
- Created `apps/web/src/app/(auth)/onboarding/page.tsx` (card contents only — no two-panel shell; (auth) layout provides it)
- Created `apps/web/src/app/(auth)/onboarding/layout.tsx` (same guard logic, no PR-narration comments)
- Confirmed (auth)/layout.tsx has no redirect-if-authenticated logic, so move was safe
- `_onboarding-old/` left untouched per hard rules

**H2 — Awaited org-rollback delete in /api/org/create**
- `serviceClient.from("orgs").delete()` is now awaited; if it fails, logs `console.error('Org rollback failed', { orgId, deleteError })` and still returns original 500

**H3 — Fixed silent auth bypass in /auth/callback when service client is null**
- Null service client now redirects to `/onboarding` (fail-safe) instead of falling through to `/dashboard`

**H4 — Sanitized Anthropic error forwarding**
- 401 → explicit user-actionable message
- Other APIError → generic "try again" message
- Non-APIError → "Unexpected error" + server-side log

**H5 — Switched key validation to free /v1/models endpoint**
- `anthropic.messages.create(...)` replaced with `anthropic.models.list()`
- Confirmed `models.list` exists in installed SDK version (typeof === "function")

**M1 — Extracted buildAnthropicKeyPayload helper**
- Added to `apps/web/src/lib/supabase/server.ts`
- Used in both `api/org/create` (validated=true) and `api/admin/ai-config` PATCH (validated=false)

**M2 — Added NOT EXISTS guard to orgs INSERT RLS policy**
- New migration: `supabase/migrations/00013_tighten_orgs_insert_policy.sql`
- Appended DROP+CREATE to `supabase/combined_migration.sql`

**M3 — Used orgId from getAuthContext in 409 branch**
- Dropped second serviceClient query; `existingOrgId` from `getAuthContext()` used directly

**M4 — Added synchronous double-submit ref guard**
- `inFlightRef = useRef(false)` added; checked and set at top of handleSubmit, cleared in finally

**M5 — Extracted ANTHROPIC_KEY_PREFIX constant**
- Added `export const ANTHROPIC_KEY_PREFIX = "sk-ant-"` to `apps/web/src/lib/anthropic.ts`
- Used in both `api/org/create/route.ts` and `(auth)/onboarding/page.tsx`

**M6 — Switched /auth/callback to use createServerSupabaseClient**
- Removed inline cookie-adapter boilerplate; helper verified to have writable setAll in Route Handler context

**M7 — Server-side org name length cap**
- Added 100-char limit check before slug generation in `/api/org/create`

**L1 — trimmedKey computed once**
- `const trimmedKey = anthropicKey.trim()` at top of handleSubmit; used throughout

**L2 — Removed PR-narration comments**
- Old onboarding/layout.tsx deleted; new (auth)/onboarding/layout.tsx has clean JSDoc only

**L3 — Slug uniqueness retry on 23505**
- After orgs INSERT, if error.code === "23505", regenerates slug and retries once; two consecutive failures return 500

### Skipped (per instructions)
- Eliminating double getAuthContext call — larger refactor, out of scope
- Deleting _onboarding-old/ — never-delete rule
- Changing VALIDATION_MODEL constant — irrelevant after H5
- Streaming, feature additions

### Build Result
`npm run build` in `apps/web/` — SUCCESS (all 75 static pages generated, no type errors)

## 2026-04-17 — /simplify pass on Phase 2b (coding agent)

### Task
Apply /simplify findings to commit `777ec0c` (Phase 2b Calendar tools). All HIGH + MEDIUM items from the findings document.

### Files Changed
- `apps/web/src/app/api/team/[slug]/chat/route.ts`
- `apps/web/src/lib/tools/registry.ts`
- `apps/web/src/lib/tools/calendar.ts`

### Fixes Applied

**H1 — Persist user message before loop**
- Inserted `serviceClient.from("messages").insert(...)` for user message immediately after conversation row is created/verified, before the tool-use loop begins.
- End of function now only persists the assistant message (+ conversation updated_at).

**H2 — Track lastAssistantText across rounds**
- Added `let lastAssistantText = ""` outside loop.
- Each round: extract `textInThisResponse`; update `lastAssistantText` if non-empty.
- Cap-hit fallback now uses `lastAssistantText || canned_message`.
- `end_turn`/`max_tokens`/`stop_sequence` all use `textInThisResponse` (same variable).

**H3 — Pre-fetch Google access token once per round**
- In `route.ts`: before `Promise.all` over tool blocks, scan for any `calendar_*` tool; if found, fetch token once, store in `Map<string, string>`.
- In `registry.ts`: `executeTool` accepts optional `preFetchedTokens?: Map<string, string>`; uses pre-fetched token if present, falls back to own fetch if not.

**M1 — Drop pretty-print + project listEvents to slim shape**
- All `JSON.stringify(result, null, 2)` → `JSON.stringify(result)` in `calendar.ts`.
- `calendar_list_events` maps events to `{id, summary, start, end, location, attendees[].email}` only; drops `htmlLink`, verbose `description`, per-attendee `responseStatus`.
- `calendar_get_event` returns full detail (full detail is the point).

**M2 — Required-field guards in executeCalendarTool**
- `eventId` guarded in `get`, `update`, `delete`: returns `is_error` if missing or not a string.
- `summary`, `start`, `end` guarded in `createEvent`.

**M3 — Per-block try/catch in Promise.all**
- Each block in the `Promise.all` now has its own try/catch; thrown errors become `is_error: true` tool_result instead of rejecting the whole Promise.all.

**M4 — Explicit stop_reason handling**
- Added `refusal` → `"I can't help with that request."` branch.
- `end_turn | max_tokens | stop_sequence` → extract text and break.
- Unknown stop_reason → `console.warn` + break with current text.

**M5 — Relocate CALENDAR_TOOLS_ADDENDUM to calendar.ts**
- Moved constant from `route.ts` to `calendar.ts`, exported.
- `route.ts` imports it from `@/lib/tools/calendar`.

**M6 — Named constant MAX_RESPONSE_TOKENS = 4096**
- Added alongside `TOOL_USE_LOOP_MAX`; used in `anthropic.messages.create`.

### Skipped (per instructions)
- Prefix-dispatch refactor in executeTool (Phase 2c)
- for-loop → while-loop conversion (cosmetic)
- Streaming
- Model change
- Shared parseGoogleApiError helper

### Build Result
`npx turbo run build --filter=@edify/web` — SUCCESS (79 static pages, no type errors).
Note: `@edify/slack` has pre-existing `@slack/types` import error unrelated to these changes.

### Edify OS — /simplify pass on Phase 2b Calendar Tools (coding agent, 2026-04-17)

**What was done:** Applied all HIGH + MEDIUM /simplify findings to commit `777ec0c` (Phase 2b Calendar tools). One clean commit (`85e5b38`) pushed to main.

**Fixes applied:**
- H1: Persist user message to DB immediately after conversation row is created/verified, before the tool-use loop begins. On Anthropic 5xx mid-loop, user's message is preserved; assistant message is not saved (correct — no response was produced). End of function now only inserts assistant message.
- H2: `let lastAssistantText = ""` tracks any real text seen across rounds. Cap-hit fallback uses `lastAssistantText || canned_message`. `end_turn`/`max_tokens`/`stop_sequence` all use `textInThisResponse` extracted at the top of each round (not re-extracted).
- H3: Before `Promise.all` over tool blocks, scan for any `calendar_*` tool. If found, call `getValidGoogleAccessToken` once, store in `Map<string, string>`. Pass map into each `executeTool` call. `registry.ts` `executeTool` accepts optional `preFetchedTokens?: Map<string, string>` — uses pre-fetched token if present, falls back to its own fetch if not.
- M1: All `JSON.stringify(result, null, 2)` → `JSON.stringify(result)` in `calendar.ts`. `calendar_list_events` maps events to `{id, summary, start, end, location, attendees[email only]}` — drops `htmlLink`, verbose `description`, per-attendee `responseStatus`. `calendar_get_event` returns full detail.
- M2: Required-field guards: `eventId` in get/update/delete, `summary`/`start`/`end` in createEvent. Bad input returns `{ content, is_error: true }` immediately.
- M3: Per-block try/catch inside the `Promise.all` — a thrown error becomes `is_error: true` result instead of rejecting the whole round and returning 502 to the user.
- M4: Explicit stop_reason handling: `refusal` → `"I can't help with that request."`, `end_turn|max_tokens|stop_sequence` → extract text and break, unknown → `console.warn` + break.
- M5: `CALENDAR_TOOLS_ADDENDUM` moved from `route.ts` to `calendar.ts` (exported). `route.ts` imports it from `@/lib/tools/calendar`.
- M6: `const MAX_RESPONSE_TOKENS = 4096` added alongside `TOOL_USE_LOOP_MAX`. Used in `anthropic.messages.create`.

**Build:** `npx turbo run build --filter=@edify/web` passed cleanly (79 pages, no TS errors). Note: `@edify/slack` has a pre-existing `@slack/types` missing dependency error unrelated to these changes.

**Commit:** `85e5b38` (`simplify: tool-loop persistence + token dedup + result projection`) pushed to origin/main.

---

## Demo-Mode Gate Agent — 2026-04-19

**Identity:** Demo-Mode Gate Agent (Sonnet)
**PRD:** PRD-demo-mode-gate.md
**Commit:** `2ce4b5b` (`fix: gate demo-mode bypass behind NEXT_PUBLIC_DEMO_MODE env var`)
**Pushed to:** origin/main

### Files changed

- `apps/web/src/middleware.ts` — Added `demoModeEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true"` gate. `isDemoMode` now short-circuits to `false` when the flag is unset, making the entire bypass block (cookie-set branch and pass-through branch) inert.
- `apps/web/src/app/(auth)/login/page.tsx` — Wrapped the "or" divider + "Skip to Demo Dashboard" Link in `{process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (<>...</>)}`. The "Don't have an account?" prompt is always rendered.
- `apps/web/src/app/(auth)/signup/page.tsx` — Same gate applied. Milo's 1-line change (commit `c5388de`) was `href="/dashboard"` → `href="/dashboard?demo=true"` on the signup page's own "Skip to Demo Dashboard" link — clearly demo-related, so it received the same treatment.

### Manual reasoning checks

1. **Without env var, `/dashboard?demo=true` → `/login`:** `demoModeEnabled` is `false` at build time, so `isDemoMode` is always `false`. The `if (isDemoMode && isProtected)` block is never entered. The next guard (`if (isProtected && !session)`) fires and redirects to `/login`. ✅
2. **Without env var, login page has no demo button:** `process.env.NEXT_PUBLIC_DEMO_MODE === "true"` inlines to `false` at build time; the JSX block is compiled away. ✅
3. **With `NEXT_PUBLIC_DEMO_MODE=true`, `/dashboard?demo=true` works as Milo intended:** `demoModeEnabled` is `true`, cookie check or query param check succeeds, cookie is set (24h), request passes through. ✅
4. **With `NEXT_PUBLIC_DEMO_MODE=true`, login page renders the button:** condition inlines to `true`, block renders. ✅
5. **Stale `edify_demo=true` cookie doesn't bypass auth when flag is unset:** `demoModeEnabled` is `false` → `isDemoMode` short-circuits to `false` regardless of cookie value. Cookie is never read as a bypass signal. ✅

### Signup page finding

Milo's 1-line change in `c5388de` changed `href="/dashboard"` to `href="/dashboard?demo=true"` on an existing "Skip to Demo Dashboard" link in `signup/page.tsx`. This is identical in intent to the login page's link, so it was gated the same way. No ambiguity — gated and confirmed.

### /simplify pass

One what-comment trimmed from `middleware.ts` (first line of the 3-line block was redundant given the variable name `demoModeEnabled`). No other issues found: no duplicated logic warranting extraction (2 call sites, build-time inlined), no quality or efficiency issues.

### Build result

`npm run build` from `apps/web/` — SUCCESS. 79 static pages, no type errors, middleware compiled.

### Open questions for Lopmon / Citlali

- Vercel preview envs inherit production env vars by default. If Z or Milo wants demo-mode on a preview deploy but off on production, they'll need to set `NEXT_PUBLIC_DEMO_MODE=true` with **Preview** scope only in the Vercel project env UI. Worth flagging in the Telegram summary.

---

## 2026-04-19 — Dashboard Polish Agent

**Identity:** Dashboard Polish Agent (Sonnet)
**PRD:** PRD-dashboard-polish.md
**Commit:** `bb623cc` (`feat: real dashboard stats + delete stale banner + fix user label`)
**Pushed to:** origin/main

### Files Deleted
- `apps/web/src/components/NoApiKeyBanner.tsx` — stale localStorage-based banner; key is stored server-side in `orgs.anthropic_api_key_encrypted`

### Files NOT Deleted (by design)
- `apps/web/src/lib/api-key.ts` — retained; imported by `apps/web/src/app/dashboard/team/[slug]/api.ts`, `apps/web/src/app/dashboard/decision-lab/api.ts`, and `apps/web/src/app/dashboard/admin/ai-config/page.tsx`. Deleting it would break those files. Logged per PRD protocol.

### Files Changed
- `apps/web/src/app/dashboard/layout.tsx` — removed `<NoApiKeyBanner />` import and mount. (The Chat Reliability agent also removed `ChatPanelProvider` and `ChatPanel` in parallel; both sets of deletions are now live.)
- `apps/web/src/app/dashboard/page.tsx` — replaced hardcoded `stats` and `activities` arrays with live `useEffect` fetch from `/api/dashboard/summary`. Added `StatsSkeleton` and `ActivitySkeleton` loading states. Empty-state activity feed copy added. `Avg Confidence` stat card dropped (not tracked). No fake trend arrows. `quickActions` descriptions no longer contain hardcoded counts.
- `apps/web/src/components/sidebar.tsx` — imported `useAuth` from `@/components/AuthProvider`; derived `displayName` from `user_metadata.full_name > name > email local-part` with capitalization fallback; avatar initial updated to match.
- `apps/web/src/app/api/dashboard/summary/route.ts` — NEW. GET route returning `{ stats: { tasksCompleted, pendingApprovals, activeAgents }, recentActivity[] }`.

### New Route Shape: GET /api/dashboard/summary
```ts
{
  stats: {
    tasksCompleted: number;       // COUNT tasks WHERE status = 'completed'
    pendingApprovals: number;     // COUNT approvals WHERE status = 'pending'
    activeAgents: number;         // COUNT distinct archetypes in conversations last 7d
  };
  recentActivity: Array<{
    id: string;
    agent: AgentRoleSlug;
    action: string;               // first 80 chars of assistant message content
    time: string;                 // ISO timestamp (formatted client-side)
    status: "completed" | "awaiting_approval";
  }>;
}
```

### Messages Table Schema (relevant columns)
- `id uuid` — primary key
- `conversation_id uuid` — FK to conversations(id)
- `role text` — 'user' | 'assistant' | 'system'
- `content text` — message body
- `metadata jsonb` — optional
- `task_id uuid` — optional FK to tasks(id)
- `created_at timestamptz`
- No direct `org_id` column — org is reached via conversations → org_id
- The summary route joins: `messages → conversations!inner(org_id, agent_config_id, agent_configs(role_slug))`

### "Brief Your Team" Setup Badge — Decision: KEPT
The badge is a real feature, not stale mock. In `sidebar.tsx`, it reads `localStorage.getItem('edify_briefing_completed')` on mount (defaulting to `true` to avoid flash). The badge and link only render when `briefingComplete === false`. The `BriefingComplete.tsx` component in `/dashboard/briefing/` sets this key to `'true'` when the org briefing wizard is finished. This is a legitimate "incomplete setup" indicator that surfaces until the org has been briefed. No change made.

### Parallel Agent Coordination
The Chat Reliability Agent ran concurrently and modified `dashboard/layout.tsx` (removed `ChatPanelProvider`/`ChatPanel`), `sidebar.tsx` (converted archetype buttons to Links), and introduced a declaration-order bug in `TeamChatClient.tsx`.

The bug: the other agent added `handleSend` to the dependency array of a `useEffect` that fires before `handleSend` is declared via `useCallback`. TypeScript reported: `Block-scoped variable 'handleSend' used before its declaration`. Fixed by reordering: moved the `handleSend` `useCallback` block above the `useEffect` that depends on it. Logged here as it was outside my original scope but was blocking the build.

Both agents' changes merged cleanly into a single commit. No conflicts.

### Build Result
- `npx tsc --noEmit` — 0 errors
- `npm run build` — compiles and type-checks successfully; fails at manifest collection step with pre-existing `ENOENT: build-manifest.json` environment issue (noted in previous session logs, reproducible on clean main, not caused by this PR)

### Open Questions for Lopmon
- `lib/api-key.ts` is still used by the chat route client (`team/[slug]/api.ts`) and decision-lab (`api.ts`) to pass the key from localStorage to the server. This pattern is inconsistent with the BYOK model (key is also stored server-side). These files are getting the key from BOTH localStorage and the server. Whether to unify that is a future scope question — not touching it here.
- The `messages` table has no direct `org_id` — the join to conversations is required for all message queries. This is fine for the summary query (single join) but worth noting if the activity feed needs to scale.

---

## 2026-04-20 — Chat Reliability Agent

**Identity:** Chat Reliability Agent (Sonnet)
**PRD:** PRD-chat-reliability.md
**Date:** 2026-04-20 (EDT evening)
**Commit SHA:** bb623cc (Dashboard Polish Agent committed our shared changes; see coordination note below)

### Task summary

Three defects fixed per PRD:
1. Delete side-panel chat stub (`chat-provider.tsx`, `chat-panel.tsx`) — returns hardcoded simulated response
2. Fix full-page chat input focus/disabled bug — textarea greys out after any click
3. Surface real errors instead of opaque "I'm having trouble connecting" catch

### Files deleted

- `apps/web/src/components/chat-provider.tsx` — Side-panel chat provider with hardcoded setTimeout stub response
- `apps/web/src/components/chat-panel.tsx` — Side-panel UI component
- `apps/web/src/components/chat-message.tsx` — Orphaned component (only used by chat-panel; imported ChatMessage type from chat-provider)

### Files changed (my scope)

- `apps/web/src/app/dashboard/layout.tsx` — Removed `<ChatPanelProvider>` wrapper and `<ChatPanel />` mount. Left `<NoApiKeyBanner />` for Dashboard Polish Agent (but they also removed it in bb623cc).
- `apps/web/src/app/dashboard/page.tsx` — Removed `useChatPanel` import and `openChat("executive_assistant")` call; changed "Ask a Question" button to `<Link href="/dashboard/team/executive_assistant">`. All quickActions now use `href`.
- `apps/web/src/components/sidebar.tsx` — Removed `useChatPanel` import and `{ openChat, activeAgent, isOpen }` destructure; changed "YOUR AI TEAM" section from `<button onClick={() => openChat(slug)}>` to `<Link href="/dashboard/team/${slug}">`. Active state now uses `pathname.startsWith()` instead of `isOpen && activeAgent === slug`.
- `apps/web/src/app/dashboard/inbox/page.tsx` — Removed `useChatPanel` import; replaced `openChat(archetype)` with `router.push("/dashboard/team/${archetype}")` using `useRouter`.
- `apps/web/src/app/dashboard/team/[slug]/TeamChatClient.tsx` — Two changes:
  1. Error surfacing: replaced opaque catch with `err instanceof Error ? err.message : String(err)`, friendly formatting for "No API key", "network error", and generic API errors (uses server's own error string from claude-client.ts which already parses error.message from Anthropic API).
  2. Stale closure fix: removed `// eslint-disable-next-line react-hooks/exhaustive-deps` suppression and added `handleSend` + `isTyping` to pendingPrompt useEffect deps.

### Root cause of the focus bug

**Primary cause:** `ChatPanelProvider` wrapped `dashboard/layout.tsx` in a `Suspense` boundary (via `ChatPanelProviderInner` which called `useSearchParams()`). Any URL state change within the dashboard — including route params when navigating between pages — could cause React to re-suspend the subtree. This created intermediate states where the `ChatInput` inside `TeamChatClient` could be unmounted mid-send or have its `isTyping` state orphaned. When `isTyping=true` and the component re-suspended and remounted without the `finally { setIsTyping(false) }` completing (because the component was unmounted), the new mount had `isTyping=false` initially but the old async callback could still run `setMessages` on the stale mounted state. **Fix: removing `ChatPanelProvider` entirely eliminates the Suspense boundary.**

**Secondary cause (hardened):** The `pendingPrompt` useEffect had a stale closure on `handleSend` (suppressed with eslint-disable). If `handleSend` was stale and captured `activeConversation=null` while the real conversation had been created, the re-run could trigger an unexpected double-send or leave `isTyping=true` if the stale closure threw before `finally`. **Fix: added `handleSend` and `isTyping` to deps array** (Dashboard Polish Agent also moved `handleSend` declaration before the useEffect to satisfy JavaScript hoisting — `const` inside useCallback is not hoisted, so it was a real declared-before-use bug).

### Parallel agent coordination

The Dashboard Polish Agent ran concurrently and committed its work as `bb623cc` which included all of this agent's file changes. When this agent ran `git pull origin main`, the fast-forward brought in `bb623cc`, which already had:
- chat-provider.tsx deleted
- chat-panel.tsx deleted  
- chat-message.tsx deleted
- layout.tsx updated (ChatPanelProvider removed)
- sidebar.tsx updated (useAuth dynamic name + my Link routing changes)
- dashboard/page.tsx updated (live stats + my quickActions Link fix)
- TeamChatClient.tsx updated (error surfacing + stale closure fix + hoisting fix)
- inbox/page.tsx updated

This agent verified all changes were correct and complete in the working tree, confirmed `npm run build` passes (zero type errors, 80 static pages), then wrote this SESSION-LOG entry.

### Build result

`npm run build` from `apps/web/` — SUCCESS. Zero TypeScript errors. 80 static pages rendered cleanly. `/dashboard/team/[slug]` generates 6 static paths (all archetype slugs).

### Verification checklist

- [x] `components/chat-provider.tsx` deleted — confirmed
- [x] `components/chat-panel.tsx` deleted — confirmed
- [x] `components/chat-message.tsx` deleted (orphan cleanup) — confirmed
- [x] `<ChatPanelProvider>` and `<ChatPanel />` removed from `dashboard/layout.tsx` — confirmed
- [x] "Ask a Question" navigates to `/dashboard/team/executive_assistant` — confirmed via Link in page.tsx
- [x] Sidebar "YOUR AI TEAM" uses `<Link href="/dashboard/team/${slug}">` — confirmed
- [x] Inbox "Discuss" button uses `router.push("/dashboard/team/${archetype}")` — confirmed
- [x] Error catch in TeamChatClient surfaces real error message — confirmed
- [x] Stale closure on pendingPrompt useEffect fixed — confirmed (deps include handleSend, isTyping)
- [x] No remaining references to `openChat`, `useChatPanel`, `ChatPanelProvider`, `ChatPanel` in codebase (support/ excluded) — confirmed via grep
- [x] `npm run build` zero errors — confirmed

### Open questions for Lopmon

1. The `middleware.ts` has a minor unstaged comment-only diff (1 line reformatted). It did not affect this task. Consider whether to stage it separately or leave it.
2. The Dashboard Polish Agent's `bb623cc` commit message says "Fix TeamChatClient.tsx handleSend declared-before-use order bug (introduced by chat-reliability agent)". This was a real issue: my original edit placed the pendingPrompt useEffect BEFORE the handleSend useCallback declaration, and `const` is not hoisted. Dashboard Polish Agent caught this and fixed the order. The final file has handleSend declared before its use in the useEffect.
3. No `ChatInput.tsx` changes were needed beyond the parent fix — the component's own `disabled={isDisabled}` logic is correct; the bug was entirely in the parent `ChatPanelProvider` Suspense wrapper.

---

## Phase 2d Simplify Agent — 2026-04-19

**Commit:** `be55cdc`
**Task:** /simplify pass on commit `3305b02` (Drive tools + date injection)

### Simplifications applied

**Quality — what-not-why comments removed (google-drive.ts):**
- Deleted `// We need the mimeType to decide which endpoint to call` — the next line calls for `mimeType`, obvious
- Deleted `// Export endpoint for Google Workspace documents` and `// Direct media download for plain text files` — the ternary condition reads clearly without them
- Deleted `// Build multipart body manually` — `const boundary = ...` is self-evident

**Efficiency — URL ternary in `downloadFileContent` (google-drive.ts):**
- Collapsed the two-branch `if/else` for `contentUrl` (5 lines with comments) into a single ternary (3 lines). Same logic, less noise.

**Reuse — `resolveGoogleToken` helper extracted (registry.ts):**
- The three calendar/gmail/drive dispatch blocks each had an identical ~14-line pattern: check preFetched map → fetch from DB → return error if missing → return token. Extracted to a typed `resolveGoogleToken(integrationKey, preFetchedTokens, serviceClient, orgId)` helper (~10 lines). Each dispatch block now uses 3 lines instead of 14. Net: -42 lines in the dispatcher, +16 for the helper = -26 lines total.
- Used `GoogleIntegrationType` (imported from `@/lib/google`) to keep the call-site type-safe.

### Deliberately left alone

- **`authHeaders()` / `handleResponse()` duplication across google-drive.ts / google-gmail.ts / google-calendar.ts** — These exist in pre-3305b02 code; calendar's `handleResponse` has a 204 No Content short-circuit the others lack. Extracting a shared `lib/google-http.ts` was out of scope for this commit's diff.
- **`downloadFileContent` inline error handler** — The success path returns `.text()` not `.json()`, so `handleResponse` (which calls `.json()` on success) cannot be reused here. Kept as-is; it's the correct approach.
- **Token pre-fetch `Promise.all` in route.ts** — Already correctly parallelized by the Phase 2d agent. No change needed.
- **`TODO` comment about hardcoded `America/New_York` timezone** — Legitimate open work item, not a stale TODO. Left intact.
- **Tool-definition input validation checks in drive.ts** — Redundant vs. schema `required` fields, but consistent with the pattern in all other tool executors. Not introduced by this commit's logic; pattern predates it.

### Build result

`npm run build` — zero type errors, zero warnings. 80 static pages generated. ✓

