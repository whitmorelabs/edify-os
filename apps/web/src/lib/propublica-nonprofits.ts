/**
 * Typed REST wrappers for the ProPublica Nonprofit Explorer v2 API.
 * Free, public, no auth required — pure search queries only, no user-identifying info sent.
 *
 * Two endpoints exposed:
 *  - GET /search.json    — full-text + filter search (NTEE major group, state).
 *  - GET /organizations/:ein.json — org detail incl. recent 990 filings summary.
 *
 * API quirks this wrapper handles:
 *  - Invalid EINs return HTTP 200 with `organization.id === 0` and
 *    `name === "Unknown Organization"`. Detect and treat as not-found.
 *  - Filter params use bracket syntax: state[id], ntee[id]. We URL-encode them.
 *  - NTEE filter takes a numeric major-group id (1–10), NOT the alpha NTEE
 *    code (e.g. "B80"). Mapping is documented in NTEE_MAJOR_GROUPS below.
 *  - PDF download links inside filing rows are separately rate-limited; we
 *    surface them but never fetch them server-side.
 *  - JSON endpoints have no published rate limit but ProPublica asks for
 *    respectful use — bake in a User-Agent identifying Edify.
 *
 * Reference: https://projects.propublica.org/nonprofits/api
 */

import { handleJsonResponse, toFiniteNumber } from "@/lib/http";

const PROPUBLICA_BASE = "https://projects.propublica.org/nonprofits/api/v2";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * NTEE major-group IDs accepted by the search endpoint (`ntee[id]=N`).
 * Documented at https://projects.propublica.org/nonprofits/api.
 */
export const NTEE_MAJOR_GROUPS: Record<number, string> = {
  1: "Arts, Culture & Humanities",
  2: "Education",
  3: "Environment and Animals",
  4: "Health",
  5: "Human Services",
  6: "International, Foreign Affairs",
  7: "Public, Societal Benefit",
  8: "Religion Related",
  9: "Mutual/Membership Benefit",
  10: "Unknown, Unclassified",
};

/**
 * Form-type integers used in `filings_with_data[].formtype`.
 * 0 = 990, 1 = 990-EZ, 2 = 990-PF (private foundation).
 */
const FORM_TYPE_LABELS: Record<number, string> = {
  0: "990",
  1: "990-EZ",
  2: "990-PF",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Slim search hit projection — only fields useful for prospect listings. */
export type NonprofitSearchHit = {
  ein: string; // strein form, e.g. "13-1684331"
  name: string;
  city: string | null;
  state: string | null;
  nteeCode: string | null;
  subsectionCode: number | null; // 3 = 501(c)(3), etc.
};

/** Filing summary projected from filings_with_data / filings_without_data. */
export type NonprofitFiling = {
  taxYear: number;
  taxPeriodEnd: string | null; // YYYYMM string from API; we expose YYYY-MM
  formType: string; // "990" | "990-EZ" | "990-PF" | "unknown"
  hasFinancialData: boolean;
  pdfUrl: string | null;
  totalRevenue: number | null;
  totalFunctionalExpenses: number | null;
  totalAssetsEnd: number | null;
  /** Foundations only (990-PF formtype 2): grants paid total ("contrpdpbks"). */
  contributionsPaid: number | null;
  /** Officer comp ("compofficers") — useful for due diligence narratives. */
  officerCompensation: number | null;
};

/** Org detail projection — header fields plus filings summary. */
export type NonprofitDetail = {
  ein: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  nteeCode: string | null;
  subsectionCode: number | null;
  /**
   * Foundation flag from pf_filing_requirement_code (1 = files 990-PF).
   * Best heuristic for "is this a private foundation?".
   */
  isPrivateFoundation: boolean;
  /** Most recent total assets we have a number for. */
  latestAssetAmount: number | null;
  /** Most recent income we have a number for. */
  latestIncomeAmount: number | null;
  filings: NonprofitFiling[];
  rulingDate: string | null;
};

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ProPublicaNonprofitError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ProPublicaNonprofitError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function propublicaHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    // Identify ourselves so ProPublica can contact us if traffic is anomalous.
    "User-Agent": "Edify-OS (https://edify.tools) — nonprofit prospect research",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    extractMessage: (body) => {
      if (typeof body === "string") return body;
      const b = body as Record<string, unknown> | null;
      if (typeof b?.error === "string") return b.error;
      if (typeof b?.message === "string") return b.message;
      return undefined;
    },
    makeError: (status, msg) => new ProPublicaNonprofitError(status, msg),
  });
}

/** Format the API's tax_period (YYYYMM int) as YYYY-MM, or null if missing. */
function formatTaxPeriod(taxPrd: number | null | undefined): string | null {
  if (typeof taxPrd !== "number" || taxPrd <= 0) return null;
  const s = String(taxPrd);
  if (s.length !== 6) return null;
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectFilingWithData(f: Record<string, any>): NonprofitFiling {
  const formtype = typeof f.formtype === "number" ? f.formtype : -1;
  return {
    taxYear: typeof f.tax_yr === "number" ? f.tax_yr : (f.tax_prd_yr ?? 0),
    taxPeriodEnd: formatTaxPeriod(f.tax_prd),
    formType: FORM_TYPE_LABELS[formtype] ?? "unknown",
    hasFinancialData: true,
    pdfUrl: typeof f.pdf_url === "string" ? f.pdf_url : null,
    totalRevenue: toFiniteNumber(f.totrevenue),
    totalFunctionalExpenses: toFiniteNumber(f.totfuncexpns),
    totalAssetsEnd: toFiniteNumber(f.totassetsend),
    // 990-PF only — total contributions paid out ("contrpdpbks"). On 990s
    // this field is absent; that's fine, returns null and Claude can read it.
    contributionsPaid: toFiniteNumber(f.contrpdpbks),
    officerCompensation: toFiniteNumber(f.compofficers),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectFilingWithoutData(f: Record<string, any>): NonprofitFiling {
  const formtype = typeof f.formtype === "number" ? f.formtype : -1;
  return {
    taxYear: typeof f.tax_prd_yr === "number" ? f.tax_prd_yr : 0,
    taxPeriodEnd: formatTaxPeriod(f.tax_prd),
    formType: FORM_TYPE_LABELS[formtype] ?? "unknown",
    hasFinancialData: false,
    pdfUrl: typeof f.pdf_url === "string" ? f.pdf_url : null,
    totalRevenue: null,
    totalFunctionalExpenses: null,
    totalAssetsEnd: null,
    contributionsPaid: null,
    officerCompensation: null,
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export type SearchNonprofitsParams = {
  /** Free-text query — name or partial name. Required by upstream API. */
  query: string;
  /** Two-letter USPS state code (e.g. "NY", "CA"). "ZZ" for international. */
  state?: string;
  /** NTEE major-group ID (1–10). See NTEE_MAJOR_GROUPS for mapping. */
  nteeMajorGroup?: number;
  /** Cap returned hits (the API page size is fixed at 25; we slice locally). */
  limit?: number;
};

/**
 * Search nonprofits by free-text query, optionally narrowed by state and
 * NTEE major group. Returns up to `limit` (default 25) projected hits.
 */
export async function searchNonprofits(
  params: SearchNonprofitsParams,
): Promise<{ orgs: NonprofitSearchHit[]; total: number }> {
  const { query, state, nteeMajorGroup, limit = 25 } = params;

  if (!query || !query.trim()) {
    throw new ProPublicaNonprofitError(
      400,
      "query is required for nonprofit search.",
    );
  }

  const url = new URL(`${PROPUBLICA_BASE}/search.json`);
  url.searchParams.set("q", query.trim());
  if (state) url.searchParams.set("state[id]", state.toUpperCase());
  if (typeof nteeMajorGroup === "number") {
    url.searchParams.set("ntee[id]", String(nteeMajorGroup));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: propublicaHeaders(),
  });

  const body = await handleResponse<Record<string, unknown>>(response);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawOrgs: Record<string, any>[] = Array.isArray(body.organizations)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (body.organizations as Record<string, any>[])
    : [];

  const total =
    typeof body.total_results === "number" ? body.total_results : rawOrgs.length;

  const orgs: NonprofitSearchHit[] = rawOrgs.slice(0, Math.max(1, limit)).map(
    (o) => ({
      ein: typeof o.strein === "string" ? o.strein : String(o.ein ?? ""),
      name: typeof o.name === "string" ? o.name : "",
      city: typeof o.city === "string" ? o.city : null,
      state: typeof o.state === "string" ? o.state : null,
      nteeCode: typeof o.ntee_code === "string" ? o.ntee_code : null,
      subsectionCode:
        typeof o.subseccd === "number" ? o.subseccd : null,
    }),
  );

  return { orgs, total };
}

export type GetNonprofitParams = {
  /**
   * EIN — accepted in either "13-1684331" or "131684331" form. We strip
   * non-digits before hitting the upstream API.
   */
  ein: string;
  /** Cap returned filings (default 5 — most recent first). */
  filingsLimit?: number;
};

/**
 * Fetch full org detail by EIN, with the most recent filings projected.
 *
 * Filings are sorted by tax year descending and concatenated:
 *   1. filings_with_data first (financial detail available)
 *   2. filings_without_data after (PDFs only, older years).
 */
export async function getNonprofit(
  params: GetNonprofitParams,
): Promise<{ org: NonprofitDetail }> {
  const { ein, filingsLimit = 5 } = params;
  const cleanEin = ein.replace(/\D/g, "");
  if (!cleanEin) {
    throw new ProPublicaNonprofitError(400, "ein is required.");
  }

  const response = await fetch(
    `${PROPUBLICA_BASE}/organizations/${cleanEin}.json`,
    {
      method: "GET",
      headers: propublicaHeaders(),
    },
  );

  const body = await handleResponse<Record<string, unknown>>(response);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawOrg: Record<string, any> = (body.organization ?? {}) as Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;

  // ProPublica returns id=0 / name="Unknown Organization" for invalid EINs.
  // Treat that as 404 so callers don't accidentally show "Unknown Organization".
  if (
    rawOrg.id === 0 ||
    rawOrg.id === undefined ||
    rawOrg.name === "Unknown Organization"
  ) {
    throw new ProPublicaNonprofitError(
      404,
      `No nonprofit found for EIN ${ein}.`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filingsWith: Record<string, any>[] = Array.isArray(
    body.filings_with_data,
  )
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (body.filings_with_data as Record<string, any>[])
    : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filingsWithout: Record<string, any>[] = Array.isArray(
    body.filings_without_data,
  )
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (body.filings_without_data as Record<string, any>[])
    : [];

  const filings: NonprofitFiling[] = [
    ...filingsWith.map(projectFilingWithData),
    ...filingsWithout.map(projectFilingWithoutData),
  ]
    .sort((a, b) => b.taxYear - a.taxYear)
    .slice(0, Math.max(1, filingsLimit));

  const org: NonprofitDetail = {
    ein:
      typeof rawOrg.ein === "number"
        ? formatEin(rawOrg.ein)
        : String(rawOrg.ein ?? cleanEin),
    name: typeof rawOrg.name === "string" ? rawOrg.name : "",
    address: typeof rawOrg.address === "string" ? rawOrg.address : null,
    city: typeof rawOrg.city === "string" ? rawOrg.city : null,
    state: typeof rawOrg.state === "string" ? rawOrg.state : null,
    zipcode: typeof rawOrg.zipcode === "string" ? rawOrg.zipcode : null,
    nteeCode: typeof rawOrg.ntee_code === "string" ? rawOrg.ntee_code : null,
    subsectionCode:
      typeof rawOrg.subsection_code === "number"
        ? rawOrg.subsection_code
        : null,
    isPrivateFoundation: rawOrg.pf_filing_requirement_code === 1,
    latestAssetAmount: toFiniteNumber(rawOrg.asset_amount),
    latestIncomeAmount: toFiniteNumber(rawOrg.income_amount),
    rulingDate: typeof rawOrg.ruling_date === "string" ? rawOrg.ruling_date : null,
    filings,
  };

  return { org };
}

/** Format a numeric EIN into the standard "XX-XXXXXXX" string. */
function formatEin(ein: number): string {
  const s = String(ein).padStart(9, "0");
  return `${s.slice(0, 2)}-${s.slice(2)}`;
}
