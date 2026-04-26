# Sprint 2 Agent 3 — Smoke-Test & Setup Guide

## What Was Built

Four custom tools wired to Marketing Director (Kida) that call Canva REST API
directly using the OAuth tokens Agent 2 stored, plus two content tools:

- `canva_generate_design` — creates a real Canva design via POST /v1/designs
- `canva_export_design` — async export job (polls until PNG/PDF ready)
- `repurpose_across_platforms` — sub-Claude rewrites per Platform Format Matrix
- `brand_guidelines_from_url` — extracts brand info from URL, saves to Drive + org memory

---

## Part 1: Prerequisites

### Already covered by Agent 2

These must be in place before testing Canva tools:

- `CANVA_OAUTH_CLIENT_ID` set in `.env.local` and Vercel
- `CANVA_OAUTH_CLIENT_SECRET` set in `.env.local` and Vercel
- `CANVA_OAUTH_REDIRECT_URI` set (dev: `http://localhost:3000/api/integrations/canva/callback`)
- `ENCRYPTION_KEY` set (AES-256-GCM 32-byte key, base64-encoded):
  ```sh
  openssl rand -base64 32
  ```
- Canva dev app registered at https://www.canva.dev/developers/ with these scopes:
  `design:content:read`, `design:content:write`, `asset:read`, `asset:write`, `profile:read`
- Canva account connected in Edify via `/dashboard/settings/integrations`

### Agent 3 adds no new env vars

The Canva tools use the same OAuth tokens Agent 2 stored in `mcp_connections`.
No additional environment variables are needed.

### For `repurpose_across_platforms` with TikTok

To include TikTok in repurpose results:
```
ENABLE_TIKTOK=true
```
(add to `.env.local` and Vercel). Default is false — TikTok is silently dropped.

---

## Part 2: Smoke-Test Prompts

### 2a. Canva generate + export

**Setup:** Canva connected in integrations page.

**Prompt to Kida (Marketing Director):**
> "Make me a LinkedIn post graphic for the Lights of Hope Gala — purple #9F4EF3 brand color, use 'Hope is worth celebrating' as the headline"

**Expected behavior:**
1. Kida calls `canva_generate_design` with:
   - `design_type: "linkedin_post"`
   - `title: "Hope is worth celebrating"`
   - `brand_color: "#9F4EF3"`
2. Tool returns a design_id + Canva editor URL
3. Kida presents the editor URL to the user ("Open in Canva to apply colors")
4. Kida then calls `canva_export_design` with the design_id
5. Tool polls Canva and returns a 24-hour-valid PNG download URL
6. Kida displays the export URL as a downloadable link

**Verify in server logs:**
```
[canva-generate] Created design: { design_id: "DABc...", edit_url: "https://..." }
[canva-export] Export job started: <jobId>
[canva-export] Export complete: <png url>
```

**If Canva not connected:**
- Expected: Kida says "Canva is not connected. Please visit Settings → Integrations..."
- Tool returns `canva_not_connected` error JSON — Kida should relay this, not crash.

### 2b. Canva not connected (graceful degradation)

**Prompt to Kida:**
> "Generate a Canva graphic for our Instagram post about the spring fundraiser"

**Expected (no Canva connection):**
- Kida invokes `canva_generate_design`
- Tool returns `{ error: "canva_not_connected", settings_url: "/dashboard/settings/integrations" }`
- Kida says: "I need Canva connected to generate real designs. Visit Settings → Integrations to connect it. In the meantime, I can create a rendered PNG graphic using the built-in design tool."

### 2c. Repurpose across platforms

**Setup:** No special setup needed — this tool is always available.

**Prompt to Kida:**
> "We just hit $50,000 in donations for our spring campaign. Here's our LinkedIn post: 'We are overwhelmed with gratitude — our community rallied to raise $50,000 for the spring campaign. Every gift, large or small, brings us closer to our mission of supporting youth in our community. Thank you from the bottom of our hearts.' Can you repurpose this for Instagram and Facebook?"

**Expected behavior:**
1. Kida calls `repurpose_across_platforms` with:
   - `base_post`: the LinkedIn text above
   - `source_platform: "linkedin"`
   - `target_platforms: ["instagram", "facebook"]`
2. Tool makes 2 sub-Haiku calls (parallel)
3. Returns `{ results: [{ platform: "instagram", content: "...", hashtags: [...], char_count: N }, { platform: "facebook", ... }] }`
4. Kida presents each version with platform label + hashtags

**With TikTok flag on:**
Same prompt + `"tiktok"` in target_platforms → should include a TikTok-optimized version.

**Without TikTok flag:**
If user requests TikTok, tool returns `tiktok_note` explaining it's disabled.

### 2d. Brand guidelines from URL

**Setup:** Google Drive connected in integrations page.

**Prompt to Kida:**
> "Extract brand guidelines from https://www.lightsofhope.org and save them"

_(Substitute any publicly accessible nonprofit website URL)_

**Expected behavior:**
1. Kida calls `brand_guidelines_from_url` with `url: "https://www.lightsofhope.org"`
2. Tool fetches the page HTML
3. Sub-Haiku call extracts: org name, mission, colors, fonts, logo URL, voice summary
4. Saves to org memory (brand_voice category entries)
5. If Google Drive connected: creates "Lights of Hope — Brand Guidelines.gdoc" in
   `Edify OS / Marketing Director /` folder in Drive
6. Returns confirmation with:
   - Drive file link (if Drive connected)
   - Summary of what was found (colors, fonts, voice)
   - "N brand facts saved to org memory — colors, fonts, and voice are now available to all directors"

**Verify in Supabase:**
- `memory_entries` table: rows with `category = 'brand_voice'` and titles like
  `brand-colors-lights-of-hope`, `brand-fonts-lights-of-hope`, etc.

**Verify in Google Drive:**
- Open Drive, navigate to `Edify OS / Marketing Director /`
- Should see a Google Doc named `[Org Name] — Brand Guidelines`

**If Drive not connected:**
- Tool still saves to org memory
- Returns: "Drive save skipped: Google Drive is not connected..."
- Memory save still confirmed

---

## Part 3: What Each Tool Returns to Chat

| Tool | Returns to Kida |
|------|-----------------|
| `canva_generate_design` | JSON with `design_id`, `edit_url`, `thumbnail_url`, `brief` |
| `canva_export_design` | JSON with `export_url` (24hr valid), `format`, `design_id` |
| `repurpose_across_platforms` | JSON array of `{ platform, content, hashtags, char_count }` |
| `brand_guidelines_from_url` | JSON with extracted brand data + Drive link + memory save count |

**Note:** `canva_export_design` returns a **direct CDN URL** (not an Anthropic Files API
upload). The export URL is valid for 24 hours per Canva's docs. Kida should tell the
user to download it before expiry. This is different from `render_design_to_image` which
uploads to Anthropic Files for permanent access.

---

## Part 4: Known Limitations & Deferred Items

### Canva design content
The current `canva_generate_design` tool creates a **blank Canva design** with the correct
dimensions. It does NOT yet autofill text or brand colors into the design automatically.

Why: Autofill (`POST /v1/autofills`) requires a `brand_template_id` from the user's
Canva account. Most new Edify orgs won't have Canva brand templates yet.

**Upgrade path (future sprint):** Add a `canva_list_templates` tool → let user pick
a template → `canva_autofill_template` with their text/image data. This is the
high-fidelity path once orgs have template libraries.

### PDF brand guidelines extraction
`brand_guidelines_from_url` supports HTML pages only. If the user pastes a PDF URL,
the tool returns a clear error asking them to use the website URL instead.

### Export URL lifetime
Canva export URLs are valid for 24 hours. Kida should advise users to download
immediately. Long-term storage requires the user to save the file.

---

## Part 5: Files Touched by Agent 3

**New tool files:**
- `apps/web/src/lib/tools/canva-generate-design.ts`
- `apps/web/src/lib/tools/canva-export-design.ts`
- `apps/web/src/lib/tools/repurpose-across-platforms.ts`
- `apps/web/src/lib/tools/brand-guidelines-from-url.ts`

**Modified:**
- `apps/web/src/lib/tools/registry.ts` — imports, Sets, ARCHETYPE_TOOLS, buildSystemAddendums, executeTool dispatch

**New docs:**
- `SMOKE-TEST-NEXT-STEPS-SPRINT-2-AGENT-3.md` (this file)
- `SESSION-LOG.md` (Agent 3 entry appended)
