/**
 * Grant matching engine — the Dev Director's headline differentiation.
 *
 * Pulls candidate grants from multiple free sources in parallel, applies
 * deterministic hard filters (deadline / amount / category), then asks
 * Claude Sonnet to rank the survivors against the org profile and emit a
 * structured top-N with explainable citations.
 *
 * Architecture (Option A — meta-tool, see PRD):
 *   1. Aggregate from grants_gov + ca_grants + federal_register in parallel.
 *      foundation_grants_paid_by_ein is opt-in (caller passes a foundation
 *      EIN list) because it is the slowest source (3-10s each).
 *   2. Apply rule-based hard filters BEFORE the LLM judge so we don't waste
 *      tokens on candidates that obviously don't fit.
 *   3. Call Sonnet with a CACHED org-profile preamble (cache_control:
 *      ephemeral) and the survivor list. Ask for ranked top N with citations.
 *   4. Validate every returned citation_url against the candidate pool — if
 *      the model invented something, drop it. Citations cannot be fabricated.
 *
 * Why this is a separate file from tools/grant-matcher.ts:
 *   The matching is a real algorithm (filter + LLM rank + citation
 *   validation). The tools/* files are thin Anthropic tool-definition
 *   wrappers. Keeping the algorithm here means the heartbeat path or any
 *   other server-side caller can use it without going through the model.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { searchGrants } from "@/lib/grants-gov";
import { searchCaGrants } from "@/lib/ca-grants-portal";
import { searchFederalRegister } from "@/lib/federal-register";
import { getFoundationGrants } from "@/lib/foundation-grants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Org profile fed to the matcher. orgName + mission are the load-bearing
 * fields; everything else is optional but improves match quality.
 *
 * The caller (the tool wrapper) is responsible for assembling this from the
 * org row (`orgs.name`, `orgs.mission`) plus any per-call refinements the
 * model passes through (focus_area, geography_override, etc.).
 */
export interface MatcherOrgProfile {
  orgName: string;
  mission: string;
  /** Free-text geography (e.g. "Detroit, MI" or "California statewide"). */
  geography?: string;
  /**
   * NTEE-style cause label used to bias keyword search and judging
   * (e.g. "Youth Development", "Community Health"). Free text — the
   * judge reads it verbatim.
   */
  focusArea?: string;
  /** Annual budget hint (e.g. "$400K/year"). Affects amount-band filtering. */
  annualBudget?: string;
  /** Free-text beneficiary description ("at-risk youth ages 12-18"). */
  beneficiaries?: string;
  /** Bullet list of currently-running programs the user wants to fund. */
  currentPrograms?: string[];
  /**
   * EINs of specific foundations to pull recipient-graph data for. Optional —
   * it's the slowest source. Only set when the user asks "are X foundations
   * in our space?" or the agent has already shortlisted prospects.
   */
  foundationEins?: string[];
  /**
   * Taxonomy of the federal eligibility category. Used to filter out grants
   * that don't accept this org type. Free text — typical values:
   * "nonprofits", "small_businesses", "state_governments". Defaults to
   * "nonprofits".
   */
  eligibility?: string;
}

/**
 * Tunables that can override the org-profile defaults on a per-call basis.
 * The model uses these to course-correct ("expand the geography",
 * "smaller grants only", etc.).
 */
export interface MatcherOptions {
  /** Soft-filter: only return opportunities with deadline within N days.
   *  Defaults to 365 (one full grant cycle). */
  deadlineWithinDays?: number;
  /** Hard-filter ceiling on award amount — drops grants where the floor
   *  is above this. Useful for "small grants only" requests. */
  maxAmount?: number;
  /** Hard-filter floor on award amount — drops grants where the ceiling
   *  is below this. Useful for "$50K+ grants only". */
  minAmount?: number;
  /** Cap on top-N returned to the user. Defaults to 12 (PRD-mandated). */
  topN?: number;
  /**
   * Cap on candidates fed to the Sonnet judge. PRD: at most ~50.
   * Defaults to 50. Increasing this beyond ~75 starts wasting tokens
   * without improving rank quality.
   */
  maxCandidates?: number;
}

/** One source-agnostic candidate row produced by the aggregator. */
interface RawCandidate {
  /** Unique within the matcher run. Used to validate LLM citations. */
  id: string;
  source:
    | "grants.gov"
    | "ca_grants"
    | "federal_register"
    | "foundation_grant_history";
  title: string;
  /** Free-text amount/range (e.g. "$50,000 - $250,000"). */
  amount: string;
  /** Numeric ceiling for hard-filter math; null when unknown. */
  amountCeiling: number | null;
  /** Numeric floor for hard-filter math; null when unknown. */
  amountFloor: number | null;
  /** ISO date string. Null when unknown (foundation-history rows). */
  deadline: string | null;
  /** Real URL on the source — must trace back to the original record. */
  citationUrl: string;
  /**
   * One-paragraph context the judge reads to score the candidate. Compact
   * (no tool-result envelopes, no markdown, no nulls).
   */
  blurb: string;
  /** Eligibility / applicant-type free text from the source if available. */
  eligibility: string | null;
}

/**
 * Final output row — what gets returned to the chat. Strict, machine-parseable
 * (PRD section "Output schema").
 */
export interface GrantMatch {
  title: string;
  source: RawCandidate["source"];
  amount: string;
  /** ISO date or null. */
  deadline: string | null;
  /** 0-100, agent's own ranking. */
  match_score: number;
  /** 1-2 sentences referencing the org's specifics. */
  why_match: string;
  citation_url: string;
}

/** Aggregate matcher response. */
export interface MatcherResult {
  /** Final ranked list (length <= topN, possibly empty). */
  matches: GrantMatch[];
  /** Total pre-filter candidate count across all sources. */
  candidatesFound: number;
  /** Survivor count after hard filters (= count fed to Sonnet judge). */
  candidatesJudged: number;
  /** Sources that ran (in parallel) — useful for the model's reply text. */
  sourcesUsed: RawCandidate["source"][];
  /** Sources that returned an error. The matcher does not throw — it surfaces
   *  partial results and lists the broken sources here. */
  sourceErrors: { source: string; message: string }[];
  /** Total wall-clock latency in ms (for SLA reporting). */
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TOP_N = 12;
const DEFAULT_MAX_CANDIDATES = 50;
const DEFAULT_DEADLINE_WITHIN_DAYS = 365;
/** Max blurb length per candidate fed to the judge — keeps the prompt small. */
const BLURB_MAX_CHARS = 400;
/** Sonnet model used for the judging step. Same model class as the chat
 *  default — the cached org-profile preamble means cost stays under a dollar
 *  per matching even for the 50-candidate ceiling. */
const JUDGE_MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// Aggregator — fans out to all sources in parallel, projects to RawCandidate
// ---------------------------------------------------------------------------

interface AggregateResult {
  candidates: RawCandidate[];
  errors: { source: string; message: string }[];
  sourcesUsed: RawCandidate["source"][];
}

/** Parallel source fan-out. Catches per-source errors so a single broken
 *  upstream doesn't kill the whole match. */
async function aggregateCandidates(
  org: MatcherOrgProfile,
  opts: MatcherOptions,
): Promise<AggregateResult> {
  const errors: { source: string; message: string }[] = [];
  const sourcesUsed: RawCandidate["source"][] = [];
  const allCandidates: RawCandidate[] = [];

  // Pick the keyword we feed each search. Focus area beats mission for
  // discriminative power; mission is too long.
  const keyword = (org.focusArea || org.mission || "").trim();

  // Detect CA-relevance from the geography string. We don't run CA Grants
  // Portal for orgs with no California signal — saves a round trip and
  // prevents irrelevant in-state-only opportunities from cluttering the pool.
  const geo = (org.geography || "").toLowerCase();
  const isCaRelevant =
    geo.includes("california") || geo.includes(" ca") || geo.endsWith(",ca") || geo === "ca";

  // Federal Register window: last 90 days, since NOFOs typically lead the
  // Grants.gov posting by 2-6 weeks. Going further back surfaces stale
  // notices.
  const today = new Date();
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
  const isoDate = (d: Date) => d.toISOString().slice(0, 10);

  // Parallel fan-out. Per-source promise rejections are caught individually
  // so partial failure doesn't kill the whole match.
  const tasks: Array<Promise<RawCandidate[]>> = [];

  // 1. Grants.gov — federal opportunity catalog (always run).
  tasks.push(
    (async () => {
      sourcesUsed.push("grants.gov");
      try {
        // Grants.gov eligibility codes are *numeric strings* ("12" =
        // 501(c)(3) nonprofits). The model usually passes a free-text label
        // like "nonprofits" — we map that to the right code. When the user
        // passes an exact code (matches /^\d{2}$/), pass through verbatim.
        const eligibilities = mapEligibilityCodes(org.eligibility);
        const result = await searchGrants({
          keyword: keyword || undefined,
          oppStatuses: ["forecasted", "posted"],
          eligibilities,
          deadlineWithinDays: opts.deadlineWithinDays,
          rows: 30,
        });
        return result.grants.map(
          (g): RawCandidate => ({
            id: `grants_gov:${g.opportunityId}`,
            source: "grants.gov",
            title: g.title,
            amount: formatAmountRange(g.awardFloor, g.awardCeiling),
            amountCeiling: g.awardCeiling,
            amountFloor: g.awardFloor,
            deadline: g.closeDate || null,
            citationUrl: `https://www.grants.gov/search-results-detail/${g.opportunityId}`,
            blurb: clipBlurb(
              `${g.title} — ${g.agency}${
                g.opportunityCategoryExplanation
                  ? `. Category: ${g.opportunityCategoryExplanation}`
                  : ""
              }. Status: ${g.status}.`,
            ),
            eligibility:
              (g.eligibilityCategories || []).join(", ") || null,
          }),
        );
      } catch (err) {
        errors.push({
          source: "grants.gov",
          message: err instanceof Error ? err.message : String(err),
        });
        return [];
      }
    })(),
  );

  // 2. CA Grants Portal — only if geography signals California.
  if (isCaRelevant) {
    tasks.push(
      (async () => {
        sourcesUsed.push("ca_grants");
        try {
          const result = await searchCaGrants({
            query: keyword || undefined,
            status: "active",
            limit: 10,
          });
          return result.grants.map((g): RawCandidate => {
            const { floor, ceiling } = parseLooseAmounts(g.estAmounts);
            return {
              id: `ca_grants:${g.rowId}`,
              source: "ca_grants",
              title: g.title,
              amount: g.estAmounts || "Range not stated",
              amountCeiling: ceiling,
              amountFloor: floor,
              deadline: g.applicationDeadline,
              citationUrl: g.grantUrl
                || `https://www.grants.ca.gov/grants/${g.grantId ?? g.rowId}`,
              blurb: clipBlurb(
                [g.title, g.agencyDept, g.purpose, g.description]
                  .filter(Boolean)
                  .join(" — "),
              ),
              eligibility: g.applicantType,
            };
          });
        } catch (err) {
          errors.push({
            source: "ca_grants",
            message: err instanceof Error ? err.message : String(err),
          });
          return [];
        }
      })(),
    );
  }

  // 3. Federal Register — primary signal, often pre-Grants.gov.
  tasks.push(
    (async () => {
      sourcesUsed.push("federal_register");
      try {
        const result = await searchFederalRegister({
          query: keyword || undefined,
          documentType: "NOTICE",
          publishedFrom: isoDate(ninetyDaysAgo),
          publishedTo: isoDate(today),
          limit: 15,
        });
        // Federal Register doesn't expose deadline or amount — those live in
        // the NOFO PDF. We surface the doc as a *signal*, not an opportunity.
        // Hard filters can't bind on null/null; the judge decides relevance.
        return result.documents.map(
          (d): RawCandidate => ({
            id: `federal_register:${d.documentNumber}`,
            source: "federal_register",
            title: d.title,
            amount: "See NOFO",
            amountCeiling: null,
            amountFloor: null,
            deadline: null,
            citationUrl: d.htmlUrl
              || `https://www.federalregister.gov/d/${d.documentNumber}`,
            blurb: clipBlurb(
              [d.title, (d.agencies[0]?.name ?? null), d.abstract]
                .filter(Boolean)
                .join(" — "),
            ),
            eligibility: null,
          }),
        );
      } catch (err) {
        errors.push({
          source: "federal_register",
          message: err instanceof Error ? err.message : String(err),
        });
        return [];
      }
    })(),
  );

  // 4. Foundation grant history — opt-in only (slow).
  if (org.foundationEins && org.foundationEins.length > 0) {
    // Cap parallel calls so a list of 20 EINs doesn't melt the API.
    const einsToFetch = org.foundationEins.slice(0, 5);
    for (const ein of einsToFetch) {
      tasks.push(
        (async () => {
          sourcesUsed.push("foundation_grant_history");
          try {
            const result = await getFoundationGrants({ ein, limit: 10 });
            // Project into "this funder gave $X to peer Y" rows. Each row is
            // a *historical* signal for the org, not a current opportunity.
            return result.grants.map(
              (g, i): RawCandidate => ({
                id: `foundation_grant_history:${ein}:${i}`,
                source: "foundation_grant_history",
                title: `${result.foundationName ?? ein} → ${g.recipientName}`,
                amount: g.amount > 0 ? formatUsd(g.amount) : "Amount not reported",
                amountCeiling: g.amount > 0 ? g.amount : null,
                amountFloor: g.amount > 0 ? g.amount : null,
                // Historical filings — surface taxYear as deadline-like
                // anchor so the judge has temporal context. The hard-filter
                // skip-when-deadline-is-null path catches these correctly.
                deadline: null,
                citationUrl: result.propublicaFilingUrl,
                blurb: clipBlurb(
                  `${result.foundationName ?? ein} (tax year ${result.taxYear}) gave ${
                    g.amount > 0 ? formatUsd(g.amount) : "an unspecified amount"
                  } to ${g.recipientName}${
                    g.recipientCity || g.recipientState
                      ? ` in ${[g.recipientCity, g.recipientState].filter(Boolean).join(", ")}`
                      : ""
                  }${g.purpose ? `. Purpose: ${g.purpose}` : ""}.`,
                ),
                eligibility: null,
              }),
            );
          } catch (err) {
            errors.push({
              source: `foundation_grant_history(${ein})`,
              message: err instanceof Error ? err.message : String(err),
            });
            return [];
          }
        })(),
      );
    }
  }

  const settled = await Promise.all(tasks);
  for (const arr of settled) allCandidates.push(...arr);

  return { candidates: allCandidates, errors, sourcesUsed };
}

// ---------------------------------------------------------------------------
// Hard filters — cheap rule-based passes BEFORE the LLM judge.
// ---------------------------------------------------------------------------

/**
 * Apply hard filters in this order:
 *   1. Drop deadline-past rows (today > deadline).
 *   2. Drop ceiling < minAmount or floor > maxAmount (when provided).
 *   3. De-dup by title (CSV grants sometimes re-list under different IDs).
 *   4. Cap to maxCandidates by a stable ordering: deadline asc nulls last,
 *      then amount-ceiling desc.
 */
function applyHardFilters(
  raw: RawCandidate[],
  opts: MatcherOptions,
): RawCandidate[] {
  const todayMs = Date.now();
  const cutoffMs =
    opts.deadlineWithinDays != null
      ? todayMs + opts.deadlineWithinDays * 24 * 60 * 60 * 1000
      : Number.POSITIVE_INFINITY;

  const survivors = raw.filter((c) => {
    // Deadline filter — only enforced when the row has a known deadline.
    if (c.deadline) {
      const dMs = Date.parse(c.deadline);
      if (Number.isFinite(dMs)) {
        if (dMs < todayMs) return false; // past deadline
        if (dMs > cutoffMs) return false; // too far out
      }
    }
    // Amount filter — only enforced when the row reports an amount.
    if (
      opts.minAmount != null &&
      c.amountCeiling != null &&
      c.amountCeiling < opts.minAmount
    ) {
      return false;
    }
    if (
      opts.maxAmount != null &&
      c.amountFloor != null &&
      c.amountFloor > opts.maxAmount
    ) {
      return false;
    }
    return true;
  });

  // De-dup by title (same NOFO sometimes shows up in both Grants.gov and
  // Federal Register). Keep the row with the most-specific source first
  // (grants.gov > federal_register).
  const sourcePriority: Record<RawCandidate["source"], number> = {
    "grants.gov": 0,
    ca_grants: 1,
    federal_register: 2,
    foundation_grant_history: 3,
  };
  const byTitle = new Map<string, RawCandidate>();
  for (const c of survivors) {
    const key = normalizeTitle(c.title);
    const existing = byTitle.get(key);
    if (!existing || sourcePriority[c.source] < sourcePriority[existing.source]) {
      byTitle.set(key, c);
    }
  }
  const deduped = Array.from(byTitle.values());

  // Stable sort: rows with deadlines come first (sooner = first), then
  // foundation history (no deadline) ordered by ceiling desc.
  deduped.sort((a, b) => {
    const aMs = a.deadline ? Date.parse(a.deadline) : Number.POSITIVE_INFINITY;
    const bMs = b.deadline ? Date.parse(b.deadline) : Number.POSITIVE_INFINITY;
    if (aMs !== bMs) return aMs - bMs;
    return (b.amountCeiling ?? 0) - (a.amountCeiling ?? 0);
  });

  const cap = opts.maxCandidates ?? DEFAULT_MAX_CANDIDATES;
  return deduped.slice(0, cap);
}

// ---------------------------------------------------------------------------
// Sonnet judge — ranks survivors against the org profile, returns top N.
// Uses prompt caching on the org-profile preamble so the cost stays sub-dollar
// across repeated matchings for the same org.
// ---------------------------------------------------------------------------

/** Build the cached system preamble. Stable across all matchings for this
 *  org until the profile changes. cache_control: ephemeral marks the
 *  prefix-cache breakpoint per Anthropic's prompt-cache contract. */
function buildJudgePreamble(org: MatcherOrgProfile): Anthropic.TextBlockParam[] {
  const sections: string[] = [
    "You are an expert grants strategist evaluating funding opportunities for a specific nonprofit organization.",
    "",
    "## Organization profile",
    `Name: ${org.orgName}`,
    `Mission: ${org.mission}`,
  ];
  if (org.geography) sections.push(`Service area / geography: ${org.geography}`);
  if (org.focusArea) sections.push(`Focus area: ${org.focusArea}`);
  if (org.annualBudget) sections.push(`Annual budget: ${org.annualBudget}`);
  if (org.beneficiaries) sections.push(`Beneficiaries: ${org.beneficiaries}`);
  if (org.currentPrograms && org.currentPrograms.length > 0) {
    sections.push("Current programs:");
    for (const p of org.currentPrograms) sections.push(`- ${p}`);
  }
  if (org.eligibility) sections.push(`Eligibility category: ${org.eligibility}`);

  sections.push(
    "",
    "## Your task",
    "Score each candidate grant against this org. For each survivor, return:",
    "  - match_score (0-100): how well the grant fits the org's mission, geography, and capacity",
    "  - why_match (1-2 sentences): cite the specific org attribute the grant aligns with",
    "",
    "## Hard rules — do not violate",
    "1. Do NOT invent grants. Score only the candidates the user provides.",
    "2. Do NOT invent citation URLs. Use the citation_url passed in for each candidate.",
    "3. Do NOT change the title, source, amount, or deadline — copy them verbatim from the input.",
    "4. If a candidate is a poor fit, give it a low score (under 40) but still include it.",
    "5. Output VALID JSON ONLY — no markdown fences, no commentary. The shape is:",
    "   {\"matches\":[{\"id\":\"<candidate id>\",\"match_score\":<0-100>,\"why_match\":\"<1-2 sentences>\"}, ...]}",
    "6. Order matches by match_score descending. Length <= the cap the user passes.",
    "7. why_match must reference at least one specific attribute from the org profile (mission keyword, geography, beneficiary group, etc.). Generic praise (e.g. 'great alignment') is forbidden.",
  );

  // Single text block, marked as a cache breakpoint. Anthropic caches all
  // tokens up to and including this block — every subsequent matching for
  // the same org and same preamble text re-uses the cache.
  return [
    {
      type: "text",
      text: sections.join("\n"),
      cache_control: { type: "ephemeral" },
    },
  ];
}

/** Per-call user message — survivor list as compact JSON. */
function buildJudgeUserMessage(survivors: RawCandidate[], topN: number): string {
  const compactList = survivors.map((c) => ({
    id: c.id,
    title: c.title,
    source: c.source,
    amount: c.amount,
    deadline: c.deadline,
    eligibility: c.eligibility,
    blurb: c.blurb,
  }));
  return [
    `Rank the following ${survivors.length} grant candidates and return up to ${topN}.`,
    "Remember: JSON only, the shape specified in the system preamble, citation URLs are not yours to invent.",
    "",
    "Candidates:",
    JSON.stringify(compactList, null, 2),
  ].join("\n");
}

interface JudgeRanking {
  id: string;
  match_score: number;
  why_match: string;
}

/** Parse the model's JSON output. Tolerates a few common wraps (```json) but
 *  prefers a clean object. Returns [] on any unparseable response. */
function parseJudgeOutput(text: string): JudgeRanking[] {
  const stripped = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  // Try to find the outermost JSON object even if the model wrapped extra text.
  let jsonText = stripped;
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace > 0 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(jsonText) as { matches?: unknown };
    const arr = Array.isArray(parsed.matches) ? parsed.matches : [];
    const out: JudgeRanking[] = [];
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id : null;
      const score =
        typeof r.match_score === "number" ? r.match_score : null;
      const why = typeof r.why_match === "string" ? r.why_match : null;
      if (id && score !== null && why) {
        out.push({
          id,
          match_score: Math.max(0, Math.min(100, Math.round(score))),
          why_match: why,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Validate + project the judge's rankings back to the candidate pool.
 * Drops any ranking whose id doesn't exist (anti-fabrication discipline).
 * Returns ranked GrantMatch rows projected from the real candidate fields —
 * the model never gets to overwrite title / source / amount / deadline /
 * citation_url.
 */
function projectRankingsToMatches(
  rankings: JudgeRanking[],
  candidates: RawCandidate[],
  topN: number,
): GrantMatch[] {
  const candidateById = new Map(candidates.map((c) => [c.id, c]));

  // Build the full list first, THEN sort by score desc, THEN slice.
  // Slicing inside the loop would discard high-scoring items if the model
  // returned rankings out of order.
  const all: GrantMatch[] = [];
  for (const r of rankings) {
    const c = candidateById.get(r.id);
    if (!c) continue; // anti-fabrication: model invented an id, drop it
    all.push({
      title: c.title,
      source: c.source,
      amount: c.amount,
      deadline: c.deadline,
      match_score: r.match_score,
      why_match: r.why_match,
      citation_url: c.citationUrl,
    });
  }
  all.sort((a, b) => b.match_score - a.match_score);
  return all.slice(0, topN);
}

// ---------------------------------------------------------------------------
// Public entrypoint
// ---------------------------------------------------------------------------

/**
 * Run the full match pipeline:
 *   aggregate → hard-filter → judge → validate citations → return top N.
 *
 * Returns partial results gracefully when sources error out — the call never
 * throws unless the Anthropic judge call fails (which the tool wrapper turns
 * into is_error: true).
 */
export async function findGrantsForOrg(
  org: MatcherOrgProfile,
  opts: MatcherOptions,
  anthropic: Anthropic,
): Promise<MatcherResult> {
  const startMs = Date.now();
  const topN = opts.topN ?? DEFAULT_TOP_N;

  // 1. Aggregate candidates from all sources in parallel.
  const aggregateOpts: MatcherOptions = {
    ...opts,
    deadlineWithinDays:
      opts.deadlineWithinDays ?? DEFAULT_DEADLINE_WITHIN_DAYS,
  };
  const { candidates, errors, sourcesUsed } = await aggregateCandidates(
    org,
    aggregateOpts,
  );

  // 2. Hard filters before LLM judge.
  const survivors = applyHardFilters(candidates, aggregateOpts);

  // Empty pool — return early with a clear empty result. Per PRD: never
  // fabricate. An empty result is the correct answer here.
  if (survivors.length === 0) {
    return {
      matches: [],
      candidatesFound: candidates.length,
      candidatesJudged: 0,
      sourcesUsed: Array.from(new Set(sourcesUsed)),
      sourceErrors: errors,
      latencyMs: Date.now() - startMs,
    };
  }

  // 3. Sonnet judge with cached org-profile preamble.
  const systemBlocks = buildJudgePreamble(org);
  const userMessage = buildJudgeUserMessage(survivors, topN);

  const response = await anthropic.messages.create({
    model: JUDGE_MODEL,
    // 4096 is plenty: ranking 50 items with score + 1-sentence why averages
    // ~15-20 input tokens per row in output, so 50 * 25 + slack = ~1500.
    max_tokens: 4096,
    temperature: 0.2,
    system: systemBlocks,
    messages: [{ role: "user", content: userMessage }],
  });

  const judgeText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const rankings = parseJudgeOutput(judgeText);

  // 4. Validate citations + project to GrantMatch[]. Fabrications are dropped.
  const matches = projectRankingsToMatches(rankings, survivors, topN);

  return {
    matches,
    candidatesFound: candidates.length,
    candidatesJudged: survivors.length,
    sourcesUsed: Array.from(new Set(sourcesUsed)),
    sourceErrors: errors,
    latencyMs: Date.now() - startMs,
  };
}

// ---------------------------------------------------------------------------
// Local utilities — small, kept here so the module is self-contained.
// ---------------------------------------------------------------------------

function clipBlurb(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= BLURB_MAX_CHARS ? t : t.slice(0, BLURB_MAX_CHARS - 3) + "...";
}

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "Amount not reported";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function formatAmountRange(floor: number | null, ceiling: number | null): string {
  if (floor != null && ceiling != null) {
    return `${formatUsd(floor)} - ${formatUsd(ceiling)}`;
  }
  if (ceiling != null) return `up to ${formatUsd(ceiling)}`;
  if (floor != null) return `from ${formatUsd(floor)}`;
  return "Range not stated";
}

/** Loose dollar-amount parser for the CA Grants Portal's free-text amounts.
 *  One pass, returns { floor, ceiling } from all dollar figures found. */
const LOOSE_AMOUNT_RE =
  /\$\s*([\d,]+(?:\.\d+)?)\s*(million|m\b|thousand|k\b|billion|b\b)?/gi;

function parseLooseAmounts(
  text: string | null,
): { floor: number | null; ceiling: number | null } {
  if (!text) return { floor: null, ceiling: null };
  const nums: number[] = [];
  for (const m of text.matchAll(LOOSE_AMOUNT_RE)) {
    const num = Number.parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(num)) continue;
    const suffix = (m[2] || "").toLowerCase();
    if (suffix.startsWith("m")) nums.push(num * 1_000_000);
    else if (suffix.startsWith("b")) nums.push(num * 1_000_000_000);
    else if (suffix.startsWith("t") || suffix.startsWith("k"))
      nums.push(num * 1_000);
    else nums.push(num);
  }
  if (nums.length === 0) return { floor: null, ceiling: null };
  return { floor: Math.min(...nums), ceiling: Math.max(...nums) };
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Map a free-text eligibility label or numeric Grants.gov code to the
 * corresponding code(s). Grants.gov uses zero-padded 2-digit codes:
 *   "12" = 501(c)(3) nonprofits other than higher ed
 *   "13" = nonprofits without 501(c)(3) status
 *   "23" = small businesses
 *   "00" = state governments
 *   ... see the full list at grants.gov.
 *
 * Returning undefined leaves the filter off — broader recall, which is
 * what we want when the caller didn't provide a meaningful hint.
 */
function mapEligibilityCodes(input: string | undefined): string[] | undefined {
  if (!input) {
    // Default: don't filter. The matcher's LLM judge can drop
    // ineligible grants based on the eligibility blurb the project
    // surfaces. Hard-filtering here loses too much recall.
    return undefined;
  }
  const trimmed = input.trim();
  if (/^\d{2}$/.test(trimmed)) return [trimmed]; // already a code

  const lower = trimmed.toLowerCase();
  if (lower.includes("nonprofit") || lower.includes("non-profit") || lower.includes("501")) {
    // Match both 501(c)(3) and non-501c3 nonprofit categories.
    return ["12", "13"];
  }
  if (lower.includes("small business")) return ["23"];
  if (lower.includes("state government")) return ["00"];
  if (lower.includes("county")) return ["01"];
  if (lower.includes("city") || lower.includes("township")) return ["02"];
  if (lower.includes("tribal")) return ["07", "11"];
  return undefined;
}
