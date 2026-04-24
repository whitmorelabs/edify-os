# Design-System Ingest Audit — 2026-04-23

**Auditor:** Logo Lockup + Sidebar Chrome Agent (Sonnet, spawned by Lopmon)
**Scope:** Compare all 16 preview HTMLs in
`C:\Users\Araly\life\projects\edify-os\design-system-export\extracted\preview\`
against the shipped `apps/web/` codebase.

**Action:** Document drops only. Do NOT fix in this PR — follow-up scope is Citlali's call.

---

## Summary

The tokens, motion library, fonts, and the named component primitives were all successfully
ingested during PR #2. The main gap was the brand assets (resolved in this PR). Several
smaller design-intent details were dropped during propagation — documented below.

---

## Per-Preview Findings

### 01-brand-purple.html — Brand purple
**Status:** CLEAN  
Token values `#9F4EF3` (primary), `#B06DF5` (hover), `#8A3AE0` (press), `#D8B8F9` (tint)
are all in `globals.css` as `--brand-purple`, `--brand-purple-hover`, `--brand-purple-press`,
`--brand-tint`. All match preview exactly.

---

### 02-surfaces.html — Surfaces
**Status:** CLEAN  
Six-step near-black ramp (`--bg-0` through `--bg-5`) and the two plum variants
(`--bg-plum-1`, `--bg-plum-2`) are all in tokens. Values match preview.

---

### 03-semantic.html — Semantic colors
**Status:** CLEAN  
`--success`, `--warn`, `--error`, `--info` plus their `-tint` and `-line` variants are all
in `globals.css`. Values match preview.

---

### 04-directors.html — Director accents
**Status:** MINOR DROP  
Preview shows six director accent tiles with icon + label. The token values are in CSS
(`--dir-exec`, `--dir-events`, etc.). However:
- The shipped `ARCHETYPE_CONFIG` / `AGENT_COLORS` sometimes uses Tailwind color classes
  (e.g. `bg-purple-500`, `text-sky-400`) rather than the design-token CSS vars.
- Inconsistency: some directors use the official design-system accent, others use fallback
  Tailwind colors that are close but not exact (e.g. Events Director uses `#F472B6` in
  design but Tailwind's `pink-400` in the sidebar dot).
- **Recommendation:** Normalize all director accent references to the `--dir-*` CSS vars.

---

### 05-type.html — Type scale
**Status:** MINOR DROP  
The preview specifies:
- Display 600-weight (not 700) for the 48px size
- Eyebrow caps: `11px / 600 / +0.14em tracking`
- JetBrains Mono for numeric data

Shipped state:
- `globals.css` has `.eyebrow` utility class, but several pages use ad-hoc `font-semibold
  uppercase tracking-[0.14em]` instead of the `eyebrow` class, meaning custom overrides
  could drift from the spec.
- The `heading-1` class in `@layer components` still uses legacy `text-gray-900` (light
  colors) — not updated to use `--fg-1`.
- **Recommendation:** Audit all pages for direct `font-semibold uppercase tracking-*`
  patterns and replace with the `.eyebrow` utility. Fix `heading-1` in the legacy block.

---

### 06-spacing.html — Spacing & radii
**Status:** CLEAN  
Design specifies 4px grid and 14px as the default card radius. The shipped `Card` primitive
uses `rounded-[14px]` correctly. No drops found.

---

### 07-elevation.html — Elevation
**Status:** CLEAN  
`--elev-1` through `--elev-4` and `--glow-purple-sm/md/lg` are all in `globals.css` and
match the preview. The `Card` primitive uses `var(--elev-1)` correctly.

---

### 08-buttons.html — Buttons
**Status:** MINOR DROP  
Preview shows three button variants:
1. Primary — brand purple, near-black text, glow shadow ✅ (ships correctly)
2. Secondary — transparent, white text, `1px rgba(255,255,255,0.16)` border ✅
3. Ghost / "View all" — transparent, `--brand-tint` color, chevron icon ✅

**Drop:** The preview shows suggestion chips as `rounded-999px` pills with `sparkle` icon
prefix. The shipped `SuggestionChip` primitive uses `rounded-full` correctly, but the
sparkle icon is a custom SVG path in the preview — the shipped component uses `Sparkles`
from lucide-react which is a different visual.
- **Recommendation:** Low priority. The lucide Sparkles icon is acceptable for a v1 ship.

---

### 09-statcard.html — Stat card
**Status:** MINOR DROP  
The `StatCard` primitive is implemented and working. However:
- Preview shows a purple **radial glow decoration** in the top-right corner of the primary
  card (`radial-gradient(circle, rgba(159,78,243,0.16), transparent 60%)`) — this is not
  rendered in the shipped `StatCard`.
- Preview's amber/warn card has an amber radial glow corner (not purple) — also not shipped.
- **Recommendation:** Add an optional `showGlow` prop or automatically render the corner
  glow when `tone` is set.

---

### 10-chat.html — Chat bubbles
**Status:** MINOR DROP  
The `ChatBubble` primitive is implemented correctly with director-colored left border. One drop:
- Preview's typing indicator has a purple box-glow ring:
  `box-shadow: ..., 0 0 0 1px rgba(159,78,243,0.2), 0 0 16px rgba(159,78,243,0.2)`
- The shipped `TypingIndicator` component does not have this glow ring.
- **Recommendation:** Add the purple glow ring to the `TypingIndicator` container.

---

### 11-composer.html — Composer / input
**Status:** MINOR DROP  
Preview shows the focused composer input with a **purple hairline ring**
(`box-shadow: 0 0 0 1px rgba(159,78,243,0.32)`) when active. The shipped chat input
in `apps/web/src/app/dashboard/team/[slug]/page.tsx` uses a standard `focus:ring` but
not the purple hairline outer glow from the design.
- **Recommendation:** Apply `box-shadow: 0 0 0 1px var(--line-purple)` on composer
  focus state.

---

### 12-approval.html — Approval card
**Status:** MINOR DROP  
The `ApprovalCard` primitive is implemented well. One gap:
- Preview preview pane uses `background:#0A0A0F` (deepest surface `--bg-0`) for the
  content preview block inside the card. The shipped `ApprovalCard` uses `var(--bg-1)`.
  This is a very subtle difference but technically a drop.
- **Recommendation:** Change `var(--bg-1)` to `var(--bg-0)` for the content preview block.

---

### 13-activity.html — Activity row
**Status:** CLEAN  
The `ActivityRow` primitive matches the preview well. Director mark, mono timestamp, verb
format, and stagger entrance are all correct.

---

### 14-files.html — File arrival
**Status:** NOT IMPLEMENTED  
The preview shows a **file attachment card** with:
- Newly-arrived state: purple glow ring + `0 0 32px rgba(159,78,243,0.24)` outer glow
- Resting state: plain hairline
- File type badge (PDF, DOCX, image thumbnail)

There is **no file attachment card component** in the shipped codebase. Files can be
sent/received in chat, but there is no `FileCard` or equivalent primitive.
- **Recommendation:** Implement a `FileCard` primitive for use in chat and task views.
  This is a new component — scope and assign separately.

---

### 15-quickactions.html — Quick action tiles
**Status:** MINOR DROP  
The `QuickActionTile` primitive is implemented. One drop:
- Preview shows a **badge dot** on the tile icon (the amber count dot on the "View approvals"
  tile, position `absolute top:-4px right:-4px`). The shipped `QuickActionTile` has no
  `badge` prop and cannot render a count dot.
- **Recommendation:** Add an optional `badge?: number` prop to `QuickActionTile` that renders
  an amber count dot when > 0.

---

### 16-logo.html — Logo
**Status:** RESOLVED IN THIS PR  
Preview shows the three-bar mark + "edify" wordmark lockup and mark-only usage for favicon.
This was the primary gap identified by Z and Citlali — resolved by this PR:
- Brand assets copied to `apps/web/public/brand/`
- `edify-mark.svg` copied to `apps/web/src/app/icon.svg` (favicon)
- `<LogoLockup>` component created at `apps/web/src/components/brand/logo-lockup.tsx`
- Navbar, footer, sidebar all updated to use `<LogoLockup />`

---

## Priority Summary

| Priority | Finding | Preview | Effort |
|----------|---------|---------|--------|
| P0 | Logo/favicon missing | 16 | RESOLVED this PR |
| P1 | FileCard component not implemented | 14 | New component — medium |
| P2 | Director accent colors not normalized to `--dir-*` tokens | 04 | Low — refactor |
| P2 | `heading-1` CSS class uses light-mode color | 05 | Low — one-line fix |
| P2 | `StatCard` missing corner radial glow decoration | 09 | Low — additive |
| P3 | `TypingIndicator` missing purple glow ring | 10 | Low — one-line |
| P3 | Composer input missing purple focus ring | 11 | Low — one-line |
| P3 | `ApprovalCard` preview uses `--bg-1` not `--bg-0` | 12 | Trivial |
| P3 | `QuickActionTile` has no count-badge prop | 15 | Low — additive |
| P4 | Sparkles icon in `SuggestionChip` vs custom SVG in preview | 08 | Cosmetic — skip |

---

## Notes for Follow-up Agent

- The `.eyebrow` utility class in `globals.css` is not exported from anywhere — it's a plain
  CSS class. Pages that manually re-implement eyebrow styles should migrate to this class
  for maintainability.
- The `heading-1` / `heading-2` / `heading-3` classes in `@layer components` use
  `text-gray-900` — these are light-mode classes left over from before the dark-mode design
  system ingest. They should be updated to `text-[var(--fg-1)]`.
- Token `brand-500` is referenced in Tailwind utilities (e.g. `bg-brand-500`) in several
  places, but the Tailwind config has not been read — verify that `brand-500` resolves to
  `#9F4EF3` in the Tailwind config or add it if missing.
