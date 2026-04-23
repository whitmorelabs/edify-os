# SESSION-LOG — FileCard Primitive Agent

**Identity:** FileCard Primitive Agent (Sonnet)
**Branch:** `lopmon/filecard-primitive`
**Worktree:** `C:/Users/Araly/AppData/Local/Temp/edify-filecard`
**Date:** 2026-04-23
**PRD:** `PRD-filecard-primitive.md`

---

## Commits

| SHA | Message |
|-----|---------|
| `f348436` | feat(ui): add FileCard primitive with just-arrived purple glow state |
| `8445b6d` | feat(chat): wire FileCard into ChatMessages replacing bare file chips |

## What Was Built

### `apps/web/src/components/ui/file-card.tsx` (NEW)
- FileCard component with full FileCardProps API per PRD
- Three badge treatments: PDF (purple-tinted), DOCX (neutral), image (gradient + optional thumbnail)
- Resting box-shadow: `0 0 0 1px rgba(255,255,255,0.06)`
- Just-arrived box-shadow: full purple glow per spec
- Glow decay: SHIPPED — 5s CSS `filecard-glow-decay` animation in globals.css
- Download button only in just-arrived state
- Filename truncates with ellipsis

### `apps/web/src/app/globals.css` (MODIFIED)
- Added `@keyframes filecard-glow-decay`

### `apps/web/src/components/ui/index.ts` (MODIFIED)
- Exported FileCard and FileCardProps

### `apps/web/src/app/dashboard/team/[slug]/components/ChatMessages.tsx` (MODIFIED)
- Removed old FileChip
- Added mimeToType(), isJustArrived() helpers
- Non-image files now use FileCard
- InlineImage error fallback uses FileCard
- isNew logic: last assistant message + ≤30s old

## Decisions / Notes

- `GeneratedFile.size` is not in the API type. FileCard accepts `size?: number` and omits
  size from meta when absent. Follow-up: add size to GeneratedFile when API supports it.
- Glow decay ships as pure CSS animation, respects prefers-reduced-motion via globals.css rule.
- TypeScript typecheck: CLEAN (0 errors verified against main repo node_modules).

## Open Follow-ups
1. Add `size: number` to GeneratedFile type + API response
2. isNew re-shows glow on hard-refresh within 30s window — acceptable per spec
