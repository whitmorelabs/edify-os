/**
 * Typed REST wrapper for Candid's Demographics API.
 * Endpoint: https://api.candid.org/demographics/v1/{ein}
 * Auth: Subscription-Key header (Azure API Management).
 *
 * Coverage: ~55,000 US nonprofits that have voluntarily submitted demographic
 * data to their Candid profile. Categories include race & ethnicity, gender
 * identity, sexual orientation, and disability status — broken down across
 * board, senior staff, and staff cohorts. Updates roughly quarterly.
 *
 * Candid markets the Demographics API as "freely available to all" (per their
 * 2024 press release and developer-portal blog) but the developer portal still
 * requires registering for a subscription key. Set CANDID_DEMOGRAPHICS_API_KEY
 * in env to enable the candid_demographics_* tools.
 *
 * Rate-limit caveat: Candid's standard subscription tiers (per the developer
 * portal "rate limits and thresholds" page) cap Trial keys at 10 calls/min and
 * 500 total calls. The Demographics free key may use the higher Production
 * tier — verify in the developer portal during provisioning.
 *
 * Reference:
 *   https://developer.candid.org/reference/demographics_v1
 *   https://candid.org/about/press-room/releases/candid-s-free-demographics-api...
 */

import { handleJsonResponse, toFiniteNumber } from "@/lib/http";

const CANDID_DEMOGRAPHICS_BASE = "https://api.candid.org/demographics/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One demographic subcategory row (e.g. "Asian/Asian American"). */
export type CandidDemographicSubcategory = {
  subcategoryId: number | null;
  subcategory: string;
  /** Headcount of board members reporting this subcategory. */
  boardMembers: number | null;
  /** Headcount of all-staff reporting this subcategory. */
  staff: number | null;
  /** Headcount of senior staff reporting this subcategory. */
  seniorStaff: number | null;
  /**
   * Whether the org's CEO/leader self-identifies in this subcategory. May be
   * null if the org didn't report it.
   */
  reportedByCeo: boolean | null;
  /** Same for the Co-CEO/co-leader. */
  reportedByCoCeo: boolean | null;
};

/** One demographic category (e.g. "Race & Ethnicity") with its subcategories. */
export type CandidDemographicCategory = {
  categoryId: number | null;
  category: string;
  subcategories: CandidDemographicSubcategory[];
};

/** Aggregate headcounts at each staffing level. */
export type CandidStaffLevelTotals = {
  totalBoardMembers: number | null;
  totalStaff: number | null;
  totalSeniorStaff: number | null;
};

/** Org summary header info. */
export type CandidDemographicsSummary = {
  organizationName: string | null;
  ein: string | null;
  city: string | null;
  state: string | null;
  /** Org-level demographics submission status (e.g. "RECEIVED", "NONE"). */
  demographicsStatus: string | null;
  /**
   * Nonprofit-tier demographics submission status — sometimes differs from
   * the org-level status when the data only covers the foundation/funder side.
   */
  demographicsStatusNonprofit: string | null;
  dateLastModified: string | null;
};

/** Full projected response. */
export type CandidDemographicsProfile = {
  summary: CandidDemographicsSummary;
  staffLevelTotals: CandidStaffLevelTotals;
  categories: CandidDemographicCategory[];
};

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class CandidDemographicsError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CandidDemographicsError";
  }
}

/** Marker error: env var not provisioned. Surfaced as a benign tool message. */
export class CandidDemographicsNotConfiguredError extends CandidDemographicsError {
  constructor() {
    super(
      503,
      "Candid Demographics API key not configured. Set CANDID_DEMOGRAPHICS_API_KEY in env to enable candid_demographics_* tools.",
    );
    this.name = "CandidDemographicsNotConfiguredError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.CANDID_DEMOGRAPHICS_API_KEY?.trim();
  if (!key) {
    throw new CandidDemographicsNotConfiguredError();
  }
  return key;
}

function candidHeaders(apiKey: string): Record<string, string> {
  return {
    Accept: "application/json",
    // Azure API Management uses Subscription-Key (NOT Authorization).
    "Subscription-Key": apiKey,
    "User-Agent":
      "Edify-OS (https://edify.tools) — nonprofit DEI research",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    extractMessage: (body) => {
      if (typeof body === "string") return body;
      const b = body as Record<string, unknown> | null;
      if (typeof b?.message === "string") return b.message;
      // Candid wraps errors in { errors: [...] } sometimes.
      const errors = b?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0] as Record<string, unknown> | string;
        if (typeof first === "string") return first;
        if (typeof first?.message === "string") return first.message;
      }
      return undefined;
    },
    makeError: (status, msg) => new CandidDemographicsError(status, msg),
  });
}

function toBooleanOrNull(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

function toStringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectSubcategory(s: Record<string, any>): CandidDemographicSubcategory {
  return {
    subcategoryId: toFiniteNumber(s.subcategory_id),
    subcategory: typeof s.subcategory === "string" ? s.subcategory : "",
    boardMembers: toFiniteNumber(s.board_members),
    staff: toFiniteNumber(s.staff),
    seniorStaff: toFiniteNumber(s.senior_staff),
    reportedByCeo: toBooleanOrNull(s.reported_by_ceo),
    reportedByCoCeo: toBooleanOrNull(s.reported_by_coceo),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectCategory(c: Record<string, any>): CandidDemographicCategory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: Record<string, any>[] = Array.isArray(c.subcategories)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c.subcategories as Record<string, any>[])
    : [];
  return {
    categoryId: toFiniteNumber(c.category_id),
    category: typeof c.category === "string" ? c.category : "",
    subcategories: subs.map(projectSubcategory),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type GetDemographicsParams = {
  /** EIN — accepted in either "13-1684331" or "131684331" form. */
  ein: string;
};

/**
 * Fetch demographic data for a single org by EIN.
 *
 * Returns null if Candid has no record for the EIN OR the org has not
 * submitted demographic data (404 or empty response).
 */
export async function getDemographics(
  params: GetDemographicsParams,
): Promise<{ profile: CandidDemographicsProfile | null }> {
  const { ein } = params;
  const cleanEin = ein.replace(/\D/g, "");
  if (!cleanEin) {
    throw new CandidDemographicsError(400, "ein is required.");
  }

  const apiKey = getApiKey();

  const response = await fetch(
    `${CANDID_DEMOGRAPHICS_BASE}/${encodeURIComponent(cleanEin)}`,
    {
      method: "GET",
      headers: candidHeaders(apiKey),
    },
  );

  // 404 = no demographics on file for this EIN — treat as not-found, not an error.
  if (response.status === 404) {
    return { profile: null };
  }

  const payload = await handleResponse<Record<string, unknown>>(response);

  // Candid returns 200 with code !== 200 on data-level failures sometimes.
  if (typeof payload.code === "number" && payload.code !== 200) {
    const msg =
      typeof payload.message === "string"
        ? payload.message
        : `Candid Demographics returned code ${payload.code}.`;
    throw new CandidDemographicsError(payload.code, msg);
  }

  const data = (payload.data as Record<string, unknown>) ?? {};
  const summary = (data.summary as Record<string, unknown>) ?? {};
  const demographics = (data.demographics as Record<string, unknown>) ?? {};
  const staffLevelTotals =
    (demographics.staff_level_totals as Record<string, unknown>) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCategories: Record<string, any>[] = Array.isArray(
    demographics.categories,
  )
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (demographics.categories as Record<string, any>[])
    : [];

  // If the org hasn't submitted any demographics, the categories array will be
  // empty / status will be "NONE". Return null so callers can distinguish
  // "found but empty" from "actual data" cleanly.
  const status = toStringOrNull(summary.demographics_status);
  if (rawCategories.length === 0 && (!status || status === "NONE")) {
    return { profile: null };
  }

  const profile: CandidDemographicsProfile = {
    summary: {
      organizationName: toStringOrNull(summary.organization_name),
      ein: toStringOrNull(summary.ein),
      city: toStringOrNull(summary.city),
      state: toStringOrNull(summary.state),
      demographicsStatus: status,
      demographicsStatusNonprofit: toStringOrNull(
        summary.demographics_status_nonprofit,
      ),
      dateLastModified: toStringOrNull(summary.date_last_modified),
    },
    staffLevelTotals: {
      totalBoardMembers: toFiniteNumber(staffLevelTotals.total_board_members),
      totalStaff: toFiniteNumber(staffLevelTotals.total_staff),
      totalSeniorStaff: toFiniteNumber(staffLevelTotals.total_senior_staff),
    },
    categories: rawCategories.map(projectCategory),
  };

  return { profile };
}
