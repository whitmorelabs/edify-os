# Session Log — flyer-wow-2026-04-29

## 2026-04-28 — Flyer Skill Wow-Factor Overhaul

**Agent:** Sonnet coding agent (spawned by Lopmon)
**Branch:** `lopmon/flyer-wow-2026-04-29`
**PRD source:** Lopmon spawn prompt

### Task
Ship a 5-element wow-factor overhaul of `apps/web/plugins/design/flyer/` — hero imagery, custom bullet icons, date-as-design-element, texture + depth, geometric accent stack — all in one integrated pass.

### Files Changed

| File | Change |
|---|---|
| `apps/web/plugins/design/flyer/render.py` | Full rewrite — 317 → 491 lines. All 5 wow elements integrated. |
| `apps/web/plugins/design/flyer/SKILL.md` | Documented `hero_image_url`, `bullet_icons`, icon keyword table, hero photo workflow, updated visual upgrade notes. |
| `apps/web/plugins/design/flyer/icons/` | NEW — 20 procedural PNG icons (64×64 RGBA) generated via Pillow shape primitives. |
| `apps/web/plugins/design/flyer/icons/README.md` | Icon attribution and regeneration instructions. |
| `apps/web/plugins/design/flyer/assets/noise.png` | NEW — 512×512 paper-grain noise texture at 4-6% opacity. |

### Design Decisions

**Hero imagery layout:** Chose a split-panel approach — text lives in the left 58% of the hero band, photo fills the right ~42% with a soft gradient-blend transition at the seam. Brand-color tint at 45% opacity keeps photo from competing with headline text. Alternative considered: full-bleed photo behind all text — rejected because it risks headline legibility on low-contrast photos. Side panel gives predictable results across any photo.

**Icon generation:** Used procedural Pillow shape primitives rather than sourcing external icon PNGs. This gives brand-consistent geometry at any scale, avoids attribution complexity, and keeps the bundle small. All 20 icons are RGBA with transparent background and recolored to `accent_dark` at render time.

**Date callout composition:** Date block floats right of the logistics info box (split layout), creating visual tension between the two info elements. Big day number (200pt YoungSerif) is the second focal point after the headline. Sun-ray starburst (16 rays) behind the number adds energy without clutter. Weekday label above month uses tight letter-spacing for editorial feel.

**Texture:** Noise applied to body region only (not over the orange hero band, which would clash). Generated a sparse grain (30% pixel density) at low alpha (4-18 per pixel) then GaussianBlur-softened — subtle enough to read as "printed on paper" rather than "noisy image."

**Geometric accent choices:** Arc (lower-left body), vertical accent line (right column margin), halftone dots (upper-right corner fadeout), ribbon under headline (hero band), sun rays behind date. Arc and dots add breadth without weight. Vertical line gives the layout a structural spine on the right edge. All at low opacity — composition reads as designed-by-human, not shape-dumped.

### Smoke Test Results
- With `hero_image_url` (Unsplash career fair photo): 2550×3300 PNG — PASS
- Without `hero_image_url` (fallback): 2550×3300 PNG — PASS
- Visual inspection: headline readable, hero photo composited with tint, date "22" prominent, icons visible beside bullets, arc accent in body, vertical line visible, footer correct

### Upload Status
- `ANTHROPIC_API_KEY` not found in worktree (`.env.local` lives in main checkout, not copied to worktree — expected behavior)
- Upload SKIPPED — Citlali needs to run upload script manually from main checkout after merge
- Command: `cd C:\Users\Araly\edify-os && export ANTHROPIC_API_KEY=$(grep -E '^ANTHROPIC_API_KEY=' apps/web/.env.local | cut -d= -f2- | tr -d '"' | tr -d "'") && pnpm dlx tsx scripts/upload-plugin-skills.ts`

### Typecheck / Lint
- Ran `pnpm --filter web typecheck` and `pnpm --filter web lint` — see PR notes for status

---

## 2026-04-29 — Flyer Skill 4-Bug Field-Test Cleanup

**Agent:** Sonnet coding agent (spawned by Lopmon)
**Branch:** `lopmon/flyer-fix-2026-04-29`
**Source:** Citlali field-tested PR #51 wow-factor output and reported 4 bugs

### Bug 1 — Hero photo never appears (unsplash gated off)
**Root cause:** `resolveArchetypeTools` in `registry.ts` filtered out `unsplashTools` for Marketing Director when Canva is connected, preventing `search_stock_photo` from being available.
**Fix:** Removed `&& !UNSPLASH_TOOL_NAMES.has(t.name)` from the Canva-connected filter. Canva gate now only strips render_design tools; unsplash stays available. Updated JSDoc to explain the rationale (Canva creates blank canvases, not photo search).

### Bug 2 — Duplicate date callouts
**Root cause:** `render.py` rendered BOTH the new date-hero block (big "22" + starburst) AND the old left tinted info-box with `date.upper()` + venue. They competed visually.
**Fix:** Removed the old left info-box entirely. Venue is now rendered as a plain text line below the date hero block (left-aligned to MARGIN). Only one date treatment renders.

### Bug 3 — Vertical accent line / arc crosses body text
**Root cause:** Two issues: (a) vertical accent at `W * 0.91` was at the exact right edge of the text column; (b) the arc accent (radius 55% W, sweeping 340°→60°) passed through the body text at approximately x=1350, y=1200-1800. Citlali saw the arc cutting through "Meet" and "toward".
**Fix:** (a) Moved vertical accent to `W * 0.955` (solidly in right margin). (b) Reduced arc radius to 22% W, moved center to canvas bottom-left corner (cx=0, cy=H), tightened sweep to 270°→360° so arc stays in the bottom ~10% of canvas only.

### Bug 4 — "Lunch" icon doesn't read as fork & knife
**Root cause:** Original procedural icon produced two thin rectangles — ambiguous at 64×64 (looked like two forks or musical notes).
**Fix:** Regenerated `icons/lunch.png` with explicit fork (3 prongs + handle) and knife (blade with pointed tip + bevel) geometry using Pillow shape primitives. Icon now unambiguously reads as fork & knife.

### Simplify Pass
- Removed dead `font_logistics_label` variable (only used in the removed old info-box)
- Fixed stale docstring angle range "(300°→360°)" → "(270°→360°)"

### Files Changed
| File | Change |
|---|---|
| `apps/web/src/lib/tools/registry.ts` | Remove unsplash filter from Canva-connected branch; update JSDoc |
| `apps/web/plugins/design/flyer/render.py` | Remove duplicate date info-box; fix arc + vertical accent positions; remove dead font variable |
| `apps/web/plugins/design/flyer/icons/lunch.png` | Replaced with clear fork+knife silhouette |

### Smoke Test
Ran full render with Citlali's exact prompt (with Unsplash hero photo URL). All 4 checkpoints passed:
- Hero photo visible (orange-tinted career fair photo in right panel of hero band)
- Single date callout (THURSDAY / MAY / 22 / 10:00 AM - 2:00 PM, no duplicate box)
- Body text clean — no arc or line crossing letters
- Lunch icon reads as fork & knife

### Typecheck
- `pnpm --filter web typecheck` — PASS (no errors)
- No lint script exists in web package

### Upload Status
- `.env.local` not in worktree — upload skipped. Lopmon to run from main checkout post-merge.

---

## 2026-04-30 — Remove hero_image_url (sandbox has no network)

**Agent:** Sonnet coding agent (spawned by Lopmon)
**Branch:** `lopmon/flyer-no-photo-2026-04-30`
**PRD source:** Lopmon spawn prompt

### Why
PR #51 added `hero_image_url` which downloads a photo via `urllib.request.urlopen()` and composites it into the hero band. The Anthropic Skills API sandbox has no internet access — the download always fails. Kida (Marketing Director) reported "No external network in the sandbox" and gave up rather than producing a flyer.

This PR removes the hero photo feature entirely so the skill works again. All other wow-factor elements (date hero, custom icons, paper texture, geometric accents, custom typography) are sandbox-safe and remain untouched.

A future PR will add photo support using the Anthropic Files API.

### Files Changed

| File | Change |
|---|---|
| `apps/web/plugins/design/flyer/render.py` | Removed `hero_image_url` param, `_fetch_image`, `_smart_crop`, `_apply_hero_photo` functions; removed `io` and `urllib.request` imports; hero_text_w simplified to always use no-photo layout. |
| `apps/web/plugins/design/flyer/SKILL.md` | Removed "Recommended workflow: hero photo" section, `hero_image_url` input entry, photo-panel layout description, `hero_image_url` from both example invocations. Added removal note to Visual upgrade notes. Fixed stale "logistics info box" reference (removed in PR #52) → "venue line". |

### Smoke Test
Ran `render()` with Citlali's full Open Doors Career Day prompt (no hero_image_url). Output: 2550×3300 PNG. Visual check:
- Hero band renders cleanly with diagonal edge + headline — no broken photo panel
- Date callout: single THURSDAY / MAY / 22 / 10:00 AM - 2:00 PM block (no duplicate)
- Body text clean — no accent line crossings
- Lunch icon reads as fork & knife
- All four bullets visible

### Typecheck
- Ran from main checkout (node_modules not in worktree): `pnpm --filter web typecheck` — PASS

### Upload Status
- `.env.local` not in worktree — SKIPPED
- Lopmon to run upload from main checkout after merge: `export ANTHROPIC_API_KEY=$(grep -E '^ANTHROPIC_API_KEY=' apps/web/.env.local | cut -d= -f2- | tr -d '"' | tr -d "'") && pnpm dlx tsx scripts/upload-plugin-skills.ts`
