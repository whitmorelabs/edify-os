/**
 * Typed REST wrappers for the USAspending.gov v2 API.
 * Free, public, no auth required — pure search queries only.
 *
 * Two endpoints exposed:
 *  - POST /search/spending_by_award/  — search federal awards (grants/contracts/loans)
 *  - GET  /recipient/{recipient_id}/  — recipient profile (totals + activity)
 *
 * USAspending is the "actual awards" half of the federal triad:
 *   Grants.gov shows opportunities (what's open).
 *   USAspending shows awards (who actually got the money).
 *   ProPublica shows nonprofit health (financial filings).
 *
 * API quirks this wrapper handles:
 *  - The award-search endpoint earliest start_date is 2007-10-01 (older data
 *    requires bulk download). We default to a sensible recent window.
 *  - Recipient profile endpoint takes a hash-based recipient_id with a suffix
 *    (e.g. "abc-...-R", "-C", or "-P" for Parent). The lookup-by-name flow is:
 *    POST /recipient/duns/  (search by keyword) → returns id → GET /recipient/{id}/.
 *    We expose the keyword search as the "find" tool and the GET as the "profile" tool.
 *  - Award-type codes are taxonomy strings, not integers. Grants subset is
 *    ["02","03","04","05"] (formula/project/cooperative agreement/other).
 *
 * Reference: https://api.usaspending.gov/docs/endpoints
 */

import { handleJsonResponse } from "@/lib/http";

const USASPENDING_BASE = "https://api.usaspending.gov/api/v2";

/** Minimum start_date the search endpoint accepts (rolling earliest is 2007-10-01). */
const EARLIEST_START_DATE = "2007-10-01";

/**
 * Award-type code groups. Keep grouped so callers can pass intent (e.g.
 * "grants") instead of remembering numeric codes.
 *   02 = Block Grant, 03 = Formula Grant, 04 = Project Grant, 05 = Cooperative Agreement.
 *   06 = Direct Payment for Specified Use, 10 = Direct Payment with Unrestricted Use.
 *   07/08 = Loans. A/B/C/D = Contracts.
 */
export const AWARD_TYPE_GROUPS = {
  grants: ["02", "03", "04", "05"],
  loans: ["07", "08"],
  direct_payments: ["06", "10"],
  contracts: ["A", "B", "C", "D"],
  all_assistance: ["02", "03", "04", "05", "06", "07", "08", "09", "10", "11"],
} as const;

export type AwardTypeGroup = keyof typeof AWARD_TYPE_GROUPS;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Slim award projection — what the model actually surfaces to the user. */
export type FederalAward = {
  /** Internal numeric id (route-link friendly: /award/{id}/). */
  internalId: number;
  /** Public award number (e.g. "AA363362155A36"). */
  awardId: string;
  recipientName: string;
  awardAmount: number | null;
  awardType: string | null;
  awardingAgency: string | null;
  awardingSubAgency: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  /** Stable id used by USAspending permalinks: /award/{generatedInternalId}/ */
  generatedInternalId: string | null;
};

/** Recipient search hit — name + ids only. */
export type RecipientSearchHit = {
  recipientId: string; // hash with suffix, e.g. "abc-...-R"
  name: string;
  uei: string | null;
  duns: string | null;
  recipientLevel: string | null;
  totalAmount: number | null;
};

/** Full recipient profile projection. */
export type RecipientProfile = {
  recipientId: string;
  name: string;
  alternateNames: string[];
  uei: string | null;
  duns: string | null;
  recipientLevel: string | null;
  parentName: string | null;
  businessTypes: string[];
  city: string | null;
  state: string | null;
  zip: string | null;
  totalTransactionAmount: number | null;
  totalTransactions: number | null;
  totalFaceValueLoanAmount: number | null;
};

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class USAspendingError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "USAspendingError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function usaspendingHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "Edify-OS (https://edify.tools) — federal grant prospect research",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    extractMessage: (body) => {
      if (typeof body === "string") return body;
      const b = body as Record<string, unknown> | null;
      if (typeof b?.detail === "string") return b.detail;
      if (typeof b?.message === "string") return b.message;
      return undefined;
    },
    makeError: (status, msg) => new USAspendingError(status, msg),
  });
}

function toFiniteNumber(v: unknown): number | null {
  if (typeof v !== "number") return null;
  return Number.isFinite(v) ? v : null;
}

/** Clamp date strings to USAspending's earliest accepted value. */
function clampStartDate(date: string): string {
  return date < EARLIEST_START_DATE ? EARLIEST_START_DATE : date;
}

// ---------------------------------------------------------------------------
// Award search
// ---------------------------------------------------------------------------

export type SearchAwardsParams = {
  /** Free-text keyword (matches description, recipient, etc.). */
  keyword?: string;
  /** Recipient name substring — narrower than keyword. */
  recipientName?: string;
  /** Two-letter USPS state code where the work is performed (e.g. "NY"). */
  placeOfPerformanceState?: string;
  /** Award type group — defaults to "grants". */
  awardTypeGroup?: AwardTypeGroup;
  /**
   * ISO date strings. Default window is the last 2 fiscal years.
   * The API will reject start_date < 2007-10-01 — we clamp silently.
   */
  startDate?: string;
  endDate?: string;
  /** Cap returned hits (1–10). Default 10 to keep model context manageable. */
  limit?: number;
};

/**
 * Search federal financial-assistance awards by recipient, agency, location,
 * keyword, and time window.
 *
 * Note: USAspending's response includes a hard pagination cap at ~10K rows.
 * We always limit to 10 here to keep the model's context tight; users who
 * want a wider sweep should narrow filters or use the website.
 */
export async function searchFederalAwards(
  params: SearchAwardsParams = {},
): Promise<{ awards: FederalAward[]; hasMore: boolean }> {
  const {
    keyword,
    recipientName,
    placeOfPerformanceState,
    awardTypeGroup = "grants",
    startDate,
    endDate,
    limit = 10,
  } = params;

  const cappedLimit = Math.max(1, Math.min(limit, 10));
  const today = new Date().toISOString().slice(0, 10);
  const defaultStart = new Date();
  defaultStart.setFullYear(defaultStart.getFullYear() - 2);
  const defaultStartIso = defaultStart.toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filters: Record<string, any> = {
    award_type_codes: AWARD_TYPE_GROUPS[awardTypeGroup],
    time_period: [
      {
        start_date: clampStartDate(startDate ?? defaultStartIso),
        end_date: endDate ?? today,
      },
    ],
  };

  if (keyword) filters.keywords = [keyword];
  if (recipientName) filters.recipient_search_text = [recipientName];
  if (placeOfPerformanceState) {
    filters.place_of_performance_locations = [
      { country: "USA", state: placeOfPerformanceState.toUpperCase() },
    ];
  }

  const body = {
    filters,
    fields: [
      "Award ID",
      "Recipient Name",
      "Award Amount",
      "Award Type",
      "Awarding Agency",
      "Awarding Sub Agency",
      "Start Date",
      "End Date",
      "Description",
    ],
    limit: cappedLimit,
    page: 1,
    sort: "Award Amount",
    order: "desc",
  };

  const response = await fetch(`${USASPENDING_BASE}/search/spending_by_award/`, {
    method: "POST",
    headers: usaspendingHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await handleResponse<Record<string, unknown>>(response);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawResults: Record<string, any>[] = Array.isArray(payload.results)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload.results as Record<string, any>[])
    : [];

  const meta = (payload.page_metadata as Record<string, unknown> | undefined) ?? {};
  const hasMore = Boolean(meta.hasNext);

  const awards: FederalAward[] = rawResults.map((r) => ({
    internalId: typeof r.internal_id === "number" ? r.internal_id : 0,
    awardId: typeof r["Award ID"] === "string" ? r["Award ID"] : "",
    recipientName:
      typeof r["Recipient Name"] === "string" ? r["Recipient Name"] : "",
    awardAmount: toFiniteNumber(r["Award Amount"]),
    awardType: typeof r["Award Type"] === "string" ? r["Award Type"] : null,
    awardingAgency:
      typeof r["Awarding Agency"] === "string" ? r["Awarding Agency"] : null,
    awardingSubAgency:
      typeof r["Awarding Sub Agency"] === "string"
        ? r["Awarding Sub Agency"]
        : null,
    startDate: typeof r["Start Date"] === "string" ? r["Start Date"] : null,
    endDate: typeof r["End Date"] === "string" ? r["End Date"] : null,
    description:
      typeof r.Description === "string"
        ? r.Description.slice(0, 500) // cap description so context isn't blown by 5KB blobs
        : null,
    generatedInternalId:
      typeof r.generated_internal_id === "string"
        ? r.generated_internal_id
        : null,
  }));

  return { awards, hasMore };
}

// ---------------------------------------------------------------------------
// Recipient lookup + profile
// ---------------------------------------------------------------------------

export type FindRecipientsParams = {
  /** Free-text keyword — matches name, UEI, or DUNS. Required. */
  keyword: string;
  /** Cap returned hits (1–10). Default 5. */
  limit?: number;
  /** Filter by award type group. Default "all_assistance". */
  awardType?: "all" | "grants" | "loans" | "contracts" | "direct_payments";
};

/**
 * Search recipients by keyword (name, UEI, or DUNS). Returns the hash-based
 * recipient_id needed by getRecipientProfile.
 *
 * Backed by the legacy `/recipient/duns/` endpoint — the v2 docs flag it as
 * deprecated but it's the only working free-text recipient lookup as of 2026-04.
 */
export async function findRecipients(
  params: FindRecipientsParams,
): Promise<{ recipients: RecipientSearchHit[]; total: number }> {
  const { keyword, limit = 5, awardType = "all" } = params;
  if (!keyword || !keyword.trim()) {
    throw new USAspendingError(400, "keyword is required for recipient search.");
  }

  const cappedLimit = Math.max(1, Math.min(limit, 10));

  const body = {
    keyword: keyword.trim(),
    order: "desc",
    sort: "amount",
    page: 1,
    limit: cappedLimit,
    award_type: awardType,
  };

  const response = await fetch(`${USASPENDING_BASE}/recipient/duns/`, {
    method: "POST",
    headers: usaspendingHeaders(),
    body: JSON.stringify(body),
  });

  const payload = await handleResponse<Record<string, unknown>>(response);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawResults: Record<string, any>[] = Array.isArray(payload.results)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload.results as Record<string, any>[])
    : [];

  const meta = (payload.page_metadata as Record<string, unknown> | undefined) ?? {};
  const total = typeof meta.total === "number" ? meta.total : rawResults.length;

  const recipients: RecipientSearchHit[] = rawResults.map((r) => ({
    recipientId: typeof r.id === "string" ? r.id : "",
    name: typeof r.name === "string" ? r.name : "",
    uei: typeof r.uei === "string" ? r.uei : null,
    duns: typeof r.duns === "string" ? r.duns : null,
    recipientLevel:
      typeof r.recipient_level === "string" ? r.recipient_level : null,
    totalAmount: toFiniteNumber(r.amount),
  }));

  return { recipients, total };
}

export type GetRecipientProfileParams = {
  /**
   * Recipient hash with required suffix, e.g. "abc-1234-R". Must come from a
   * findRecipients result — never invent it.
   *   -R = Recipient (top-level), -C = Child recipient, -P = Parent.
   */
  recipientId: string;
};

/**
 * Fetch full recipient profile by id, including aggregate transaction totals
 * and business-type tags useful for due diligence narratives.
 */
export async function getRecipientProfile(
  params: GetRecipientProfileParams,
): Promise<{ recipient: RecipientProfile }> {
  const { recipientId } = params;
  if (!recipientId || !/^[a-f0-9-]+-[RCP]$/i.test(recipientId)) {
    throw new USAspendingError(
      400,
      "recipientId must be a hash with -R, -C, or -P suffix (from findRecipients).",
    );
  }

  const response = await fetch(
    `${USASPENDING_BASE}/recipient/${encodeURIComponent(recipientId)}/`,
    {
      method: "GET",
      headers: usaspendingHeaders(),
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await handleResponse<Record<string, any>>(response);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loc: Record<string, any> = r.location ?? {};

  const recipient: RecipientProfile = {
    recipientId: typeof r.recipient_id === "string" ? r.recipient_id : recipientId,
    name: typeof r.name === "string" ? r.name : "",
    alternateNames: Array.isArray(r.alternate_names)
      ? r.alternate_names.filter((n: unknown): n is string => typeof n === "string")
      : [],
    uei: typeof r.uei === "string" ? r.uei : null,
    duns: typeof r.duns === "string" ? r.duns : null,
    recipientLevel: typeof r.recipient_level === "string" ? r.recipient_level : null,
    parentName: typeof r.parent_name === "string" ? r.parent_name : null,
    businessTypes: Array.isArray(r.business_types)
      ? r.business_types.filter((b: unknown): b is string => typeof b === "string")
      : [],
    city: typeof loc.city_name === "string" ? loc.city_name : null,
    state: typeof loc.state_code === "string" ? loc.state_code : null,
    zip: typeof loc.zip === "string" ? loc.zip : null,
    totalTransactionAmount: toFiniteNumber(r.total_transaction_amount),
    totalTransactions: toFiniteNumber(r.total_transactions),
    totalFaceValueLoanAmount: toFiniteNumber(r.total_face_value_loan_amount),
  };

  return { recipient };
}
