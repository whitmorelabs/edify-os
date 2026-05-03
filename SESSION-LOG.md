# SESSION-LOG — Grants.gov Amount Enrichment Agent

**Identity:** Grants Amount Enrichment Agent (Sonnet)
**Branch:** `lopmon/grants-amount-enrichment`
**Worktree:** `C:/Users/Araly/edify-os-grants-amounts`
**Date:** 2026-05-03
**Task:** Chain `grants_get_details` (Grants.gov fetchOpportunity) for amount
enrichment of `find_grants_for_org` ranked Grants.gov hits. Follow-up to PR #68
where Grants.gov matches surfaced as `amount: "Range not stated"`.

---

## Commits

| SHA | Message |
|-----|---------|
| (pending) | feat(find_grants_for_org): chain grants_get_details for Grants.gov amount enrichment |

## What Changed

### `apps/web/src/lib/grant-matcher.ts` (MODIFIED)

- Added `fetchGrantDetails` to the existing `@/lib/grants-gov` import.
- New `extractGrantsGovOpportunityId(citationUrl)` helper — pulls the numeric
  opportunityId out of the canonical citation URL
  (`/search-results-detail/<id>`). Returns null on shape mismatch.
- New `enrichGrantsGovAmounts(matches)` async helper:
  - Filters ranked matches to `source === "grants.gov"` only.
  - `Promise.all` over the filtered matches — parallel, per-call try/catch.
  - On success, replaces `match.amount` with `formatAmountRange(floor, ceiling)`
    using the existing helper (so output formatting stays consistent).
  - On failure, logs `console.warn` with opportunityId + error, leaves the
    original `"Range not stated"` string in place (no whole-tool failure).
  - Skips overwrite when the detail fetch also returns nulls (keeps the
    "Range not stated" stable rather than making a noisy round-trip for
    no improvement).
- Wired into `findGrantsForOrg` as step 5, immediately after
  `projectRankingsToMatches`. Other sources (USAspending, Federal Register,
  CA Grants, foundation history) are untouched.

## Live Verification

Synthetic profile: Detroit Youth Mentors, $400K/year, mission "one-on-one
mentoring, college/career prep, after-school enrichment for at-risk youth
ages 12-18 across Detroit metro area" (matches PR #68 verification profile).

Wall-clock: **18.8s** (well under the 30s budget).

Top 11 ranked matches included **8 Grants.gov hits, all 8 enriched** with real
dollar amounts. Examples surfaced:

- OJJDP FY25 Expanding Youth Access to Community-Based Treatment — $0 - $600,000
- Educational Opportunity Centers Program (EOC) — $238,000 - $3,000,000
- BJA FY25 Second Chance Act — $0 - $900,000
- 2026 Alumni Engagement Innovation Fund (AEIF 2026) — $10,000 - $35,000

`sourceErrors: 0`, no per-match enrichment failures observed in this run.

## Decisions / Notes

- **Why mutate matches in-place** (instead of returning a new array): preserves
  rank ordering without a second pass. The `GrantMatch` objects are constructed
  in `projectRankingsToMatches` and not held by anyone else at that point, so
  mutation is safe.
- **Why skip when detail returns nulls**: the search response itself can return
  legitimate `(null, null)` floor/ceiling — overwriting `"Range not stated"`
  with the same string is wasteful. The conditional in `enrichGrantsGovAmounts`
  keeps the no-op branch a true no-op.
- **Latency budget**: worst case 12 parallel HTTP calls to Grants.gov
  fetchOpportunity. Each call ~500ms-1s in practice; total enrichment overhead
  observed ~2-3s on the live test (18.8s total wall-clock vs. ~16s typical
  before — the rest is the Sonnet judge call dominating).
- **/simplify pass**: dropped an unused `idx` from a `.map((m, idx) => …)` that
  was only being filtered. Otherwise reused existing `formatAmountRange` and
  `fetchGrantDetails` — no new utilities.
- **Typecheck**: `pnpm --filter web typecheck` CLEAN (0 errors).

## Files Changed

- `apps/web/src/lib/grant-matcher.ts` — +75 / -1 lines (one new import, one
  new helper, one new wired-in call site).

## Follow-ups

None required for this PR. Possible future enhancements:

1. Cache fetchOpportunity responses by opportunityId for the duration of a
   request — same opportunityId rarely shows twice in one match run, but if
   the chat does multiple matching passes in a row this would amortize.
2. Consider a similar enrichment for CA Grants if the CA Grants Portal
   detail endpoint exposes more reliable amount fields than the search
   endpoint.

---
