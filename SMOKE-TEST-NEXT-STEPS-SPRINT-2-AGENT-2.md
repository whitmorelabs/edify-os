# Sprint 2 Agent 2 — Smoke-Test & Setup Guide

## What Was Built

Edify-mediated OAuth for Canva — per-org access tokens stored encrypted in
`mcp_connections`, passed to the Anthropic API as archetype-scoped MCP servers
for Marketing Director (Kida). The "Connect Canva" UI lives at
`/dashboard/settings/integrations` (also linked from the main Settings page).

---

## Part 1: Citlali Setup (before the connect flow can be tested)

### Step 1 — Register a Canva developer app

1. Go to https://www.canva.dev/developers/
2. Sign in or create a Canva developer account
3. Click **Create an app** (or open an existing Edify app)
4. Under **OAuth 2.0**, add these **Redirect URIs**:
   - Dev: `http://localhost:3000/api/integrations/canva/callback`
   - Prod: `https://<edify-prod-domain>/api/integrations/canva/callback`
5. Under **Required Scopes**, enable ALL of these (they are NOT cumulative — each must be checked):
   - `design:content:read` — view design contents
   - `design:content:write` — create designs on user's behalf
   - `asset:read` — view uploaded asset metadata
   - `asset:write` — upload/update/delete assets
   - `profile:read` — read user profile (used for email display in the card)
6. Save the app. Copy the **Client ID** and **Client Secret**.

### Step 2 — Add credentials to local dev

Open `apps/web/.env.local` and fill in:

```
CANVA_OAUTH_CLIENT_ID=<your-client-id>
CANVA_OAUTH_CLIENT_SECRET=<your-client-secret>
CANVA_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/canva/callback
```

### Step 3 — Send credentials to Z via onetimesecret.com

Z (Milo) needs these in Vercel env vars for the production deployment:
- `CANVA_OAUTH_CLIENT_ID`
- `CANVA_OAUTH_CLIENT_SECRET`
- `CANVA_OAUTH_REDIRECT_URI=https://<edify-prod-domain>/api/integrations/canva/callback`

Use onetimesecret.com to share securely. Do NOT paste into Telegram or email.

### Step 4 — Add to Vercel

In the Vercel project for `edify-os` → Settings → Environment Variables, add:
- `CANVA_OAUTH_CLIENT_ID`
- `CANVA_OAUTH_CLIENT_SECRET`
- `CANVA_OAUTH_REDIRECT_URI` (production URL)

Redeploy for env vars to take effect.

### Step 5 — CANVA_MCP_URL (deferred — important note)

As of Sprint 2 (2026-04-25), Canva has NOT published a stable production MCP SSE
endpoint for third-party applications. The "Canva AI Connector" at
https://www.canva.com/help/mcp-agent-setup/ is a developer-tooling server, not a
production tool endpoint for embedding into third-party SaaS.

When Canva ships a production MCP endpoint, add:
```
CANVA_MCP_URL=<canva-mcp-sse-endpoint-url>
```

Until then: the OAuth flow, token storage, refresh logic, and Connect Canva UI are
all fully wired. The Canva entry in the MCP registry is skipped at runtime because
`CANVA_MCP_URL` is empty (graceful skip — Kida is unaffected). The moment
`CANVA_MCP_URL` is set AND an org has connected their Canva account, Kida will
automatically start receiving Canva as a live MCP tool in her tool-use loop.

---

## Part 2: Smoke-Test Steps

### 2a. Connect flow

1. Start dev server: `pnpm dev` in `apps/web`
2. Navigate to `/dashboard/settings`
3. Click **Manage Integrations** → takes you to `/dashboard/settings/integrations`
4. The **Canva** card shows "Connect Canva" button
5. Click **Connect Canva** → browser navigates to Canva's OAuth consent screen
6. Authorize the app on Canva
7. Canva redirects back to `/api/integrations/canva/callback`
8. You should land on `/dashboard/integrations?canva=connected`
   - NOTE: Callback redirects to `/dashboard/integrations` (the broad Connected Accounts page),
     which shows a toast. Then manually navigate back to `/dashboard/settings/integrations`
     to verify the card shows "Connected".
9. In Supabase → Table Editor → `mcp_connections`, confirm a row exists with:
   - `org_id` = your org UUID
   - `server_name` = 'canva'
   - `access_token` = encrypted string starting with `enc:v1:`
   - `metadata.canva_email` = your Canva account email

### 2b. Chat test (requires CANVA_MCP_URL to be set)

Once `CANVA_MCP_URL` is configured:

1. Open Marketing Director (Kida) chat
2. Prompt: *"Make me a LinkedIn graphic for the Lights of Hope Gala using our brand colors"*
3. Expected: Kida invokes the Canva MCP tool and returns a real Canva-rendered image URL
4. Server logs should show:
   ```
   [mcp/registry] canva: resolved token for org <id>
   mcp_servers: [{ type: "url", name: "canva", url: "...", authorization_token: "..." }]
   ```

Without `CANVA_MCP_URL`: Kida falls back to vercel/og card rendering (existing behavior).

### 2c. Token refresh test

1. In Supabase, manually set `expires_at` on the canva mcp_connections row to a past timestamp
2. Send a chat message to Kida
3. Check server logs for `[canva-oauth] Refreshing token for org <id>`
4. Confirm the row's `access_token` and `expires_at` are updated with fresh values

### 2d. Disconnect flow

1. On `/dashboard/settings/integrations`, click **Disconnect**
2. Confirm the card flips back to "Connect Canva"
3. Confirm the `mcp_connections` row is deleted (hard-delete) in Supabase
4. Send the same Kida prompt → should fall back to vercel/og output (no Canva MCP)
5. Server logs should show: `[mcp/registry] canva: notConnected — skipping for org <id>`

---

## Part 3: Encryption Status

Tokens ARE encrypted at rest using AES-256-GCM via `apps/web/src/lib/crypto.ts`.

The `encrypt()` call requires `ENCRYPTION_KEY` to be set in `.env.local`. If it is
not set, `encrypt()` throws and the callback route returns an error rather than storing
plaintext tokens. This is a safe-fail.

**Action required:** Check that `ENCRYPTION_KEY` is set in both `.env.local` (dev) and
Vercel environment variables (prod). The key should be a base64-encoded 32-byte value:
```sh
openssl rand -base64 32
```

The `.env.local` file currently has `ENCRYPTION_KEY=REPLACE_ME_GENERATE_VIA_OPENSSL_RAND_BASE64_32`.
This MUST be replaced before any OAuth callback can succeed.

---

## Part 4: Agent 3 (Custom Tools) is Next

Agent 3 is queued to build the custom Canva tool implementations (design generation,
asset upload wrappers) that Kida calls via the MCP server. This agent depends on
Agent 2's infrastructure being in place.

Files touched by Agent 2:
- `apps/web/.env.example` (Canva vars added)
- `apps/web/.env.local.example` (Canva vars added)
- `apps/web/.env.local` (Canva vars added as TODO — NOT committed, gitignored)
- `apps/web/src/lib/mcp/canva-oauth.ts` (NEW — token refresh/revoke/lookup helper)
- `apps/web/src/lib/mcp/registry.ts` (updated — Canva entry + per-org DB lookup)
- `apps/web/src/app/api/integrations/canva/route.ts` (NEW — GET status)
- `apps/web/src/app/api/integrations/canva/connect/route.ts` (NEW — OAuth initiation)
- `apps/web/src/app/api/integrations/canva/callback/route.ts` (NEW — OAuth callback)
- `apps/web/src/app/api/integrations/canva/disconnect/route.ts` (NEW — DELETE)
- `apps/web/src/app/dashboard/settings/integrations/page.tsx` (NEW — settings page)
- `apps/web/src/components/integrations/CanvaIntegrationCard.tsx` (NEW — UI card)
- `apps/web/src/app/dashboard/settings/page.tsx` (MODIFIED — added MCP Integrations card)
- `SMOKE-TEST-NEXT-STEPS-SPRINT-2-AGENT-2.md` (NEW — this file)
- `SESSION-LOG.md` (MODIFIED — Agent 2 entry appended)
