# SESSION-LOG — Asana MCP Connector Agent

**Identity:** Asana MCP Connector Agent (Sonnet)
**Branch:** `worktree-agent-a151ee5c45e1b5d9c`
**Worktree:** `C:\Users\Araly\edify-os\.claude\worktrees\agent-a151ee5c45e1b5d9c`
**Date:** 2026-04-30
**Spawned by:** Lopmon (post PR #61 / MCP-0 Sprint 1)

---

## What Was Done

Validated the MCP-0 factory's "config-only new connector" promise by wiring
Asana through the catalog with **zero changes to factory code or generic
routes**. The only code change was a single `ServerCatalogEntry` added to
`apps/web/src/lib/mcp/server-catalog.ts`.

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/lib/mcp/server-catalog.ts` | +73 lines: `ASANA_ENTRY` config + header doc update |

No other source files touched. No package additions. No migrations. No UI changes.

## Asana Catalog Entry

- **id:** `asana`
- **URL:** `https://mcp.asana.com/v2/mcp` (V2 — V1 SSE endpoint shuts down 2026-05-11)
- **OAuth quirks:**
  - Form-body client credentials (NOT Basic) — `clientAuth: "post"`
  - PKCE S256 enabled (defense-in-depth; not strictly required for confidential clients)
  - Long-lived refresh tokens (no rotation per use)
  - Scopes intentionally omitted — Asana MCP docs explicitly require dropping the `scope` param
  - `resource=https://mcp.asana.com/v2` query param required on authorize, fits existing `authorizeExtraParams` mechanism
  - Token response carries `data.{gid,name,email}`, surfaced via `metadataFromTokenResponse`
- **Archetypes:** `events_director`, `programs_director`, `executive_assistant` (per archetype roadmap memory + multi-archetype-per-server pattern from PRD §1)
- **Env vars required to activate:** `ASANA_OAUTH_CLIENT_ID`, `ASANA_OAUTH_CLIENT_SECRET` (optional: `ASANA_OAUTH_REDIRECT_URI`)

## Factory Validation

**Promise:** Adding a new OAuth connector should be a config edit, not a factory/route refactor.

**Result:** Confirmed. The generic routes (`/api/oauth/[server]/{connect,callback,disconnect}`) resolve via `getServerEntry(serverId)` and route Asana through the existing factory paths without any per-server code:

- `connect/route.ts` handles `usePkce`, `authorizeExtraParams`, scopeless authorize URL
- `callback/route.ts` handles `clientAuth: "post"`, PKCE verifier, `metadataFromTokenResponse`
- `disconnect/route.ts` handles `revokeUrl` best-effort revocation
- `oauth-factory.ts` `getValidAccessToken` + `refreshAccessToken` + `exchangeCodeForTokens` parameterize cleanly

## Effort Spent

**~45 minutes total** (vs PRD estimate of 4-8h post-MCP-0 / 12-20h pre-MCP-0):

- ~10 min: pull main, read factory + catalog + routes
- ~15 min: WebFetch Asana developer docs (OAuth + MCP integration guide); discovered V2 URL migration date
- ~10 min: write Asana catalog entry + doc-block
- ~5 min: pnpm install + typecheck
- ~5 min: simplify review + minor comment trim

The factory's promise checks out. Most of the 45 min was *research* (verifying V2 URL, scope-omission rule, refresh-token rotation behavior), not *coding*. Net coding time was under 15 minutes.

## Factory Friction Discovered

1. **Hours-saved estimates not actually generic.** `apps/web/src/lib/hours-saved/estimates.ts` keys on Edify-side `tool:<name>` events from `lib/tools/*.ts`. MCP server tool calls are dispatched server-side by Anthropic and don't flow through `insertActivityEvent` in `run-archetype-turn.ts`. Notion (the proof connector) didn't add hours-saved entries either, so I didn't add Asana entries either, they'd be dead config until MCP tool tracking is wired (a Sprint 2+ item). This is the one piece of the factory that isn't actually generic; flagging for Lopmon's review.

2. **`refreshTokenRotates` is purely documentary.** The factory always persists `refresh_token` when one is returned, regardless of this flag. Canva, Notion, and Asana all flow through identical persistence logic. Not broken, just slightly misleading. Could be removed in a future cleanup, or repurposed if a server ever differs.

3. **No connector friction otherwise.** The catalog shape (`OAuthConfig`) covered every Asana quirk without extension.

## Workflow Verification

- `pnpm install` clean (workspace deps installed)
- `pnpm --filter web typecheck` clean (zero errors)
- `/simplify` minimal cleanup (one comment trim); no reuse/quality/efficiency issues found

## What's Needed To Activate

1. Vercel env vars: `ASANA_OAUTH_CLIENT_ID`, `ASANA_OAUTH_CLIENT_SECRET`
2. Asana developer console: register an OAuth app of type "MCP App" with redirect URI matching `${getAppOrigin()}/api/oauth/asana/callback`
3. Until env vars are set, the connector is silently inert, same dormant-until-secrets pattern as Notion.

## Commits

| SHA | Message |
|-----|---------|
| (pending) | feat: wire Asana MCP connector via factory (post-MCP-0) |
