/**
 * Typed REST wrappers for the California Grants Portal (CKAN datastore).
 * Free, public, no auth required.
 *
 * Single dataset: "California Grants Portal - Updated Daily" on data.ca.gov.
 * CKAN provides three relevant actions:
 *   - datastore_search       (q + filters; what we use here)
 *   - datastore_search_sql   (raw SQL; not exposed to the model — too foot-gunny)
 *   - package_show           (dataset metadata)
 *
 * The portal refreshes nightly at 8:45pm Pacific. As of 2026-04 the dataset
 * holds ~1,900 rows across active/closed/forecasted statuses for all CA state
 * agencies. Resource id is hard-coded — if it ever changes (rare for this
 * dataset), update CA_GRANTS_RESOURCE_ID.
 *
 * Reference: https://data.ca.gov/dataset/california-grants-portal
 */

import { handleJsonResponse } from "@/lib/http";

const CA_DATA_BASE = "https://data.ca.gov/api/3/action";
/** Stable resource id for "California Grants Portal - Updated Daily". */
const CA_GRANTS_RESOURCE_ID = "111c8c88-21f6-453c-ae2c-b4785a0624f5";

export const CA_GRANT_STATUSES = ["active", "closed", "forecasted"] as const;
export type CaGrantStatus = (typeof CA_GRANT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Slim grant projection — only the fields the model needs to surface. */
export type CaGrant = {
  /** CKAN row id — stable across daily refreshes. */
  rowId: number;
  /** Portal grant id (e.g. "25-50202") — may be null on some forecasted rows. */
  grantId: string | null;
  status: CaGrantStatus | string;
  agencyDept: string | null;
  title: string;
  type: string | null;
  categories: string | null;
  purpose: string | null;
  /** Truncated to 500 chars to keep model context tight. */
  description: string | null;
  applicantType: string | null;
  geography: string | null;
  fundingSource: string | null;
  estAvailFunds: string | null;
  estAwards: string | null;
  estAmounts: string | null;
  openDate: string | null;
  applicationDeadline: string | null;
  expAwardDate: string | null;
  grantUrl: string | null;
  agencyUrl: string | null;
  lastUpdated: string | null;
};

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class CaGrantsPortalError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CaGrantsPortalError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function caGrantsHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "User-Agent": "Edify-OS (https://edify.tools) — CA grant prospect research",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    extractMessage: (body) => {
      if (typeof body === "string") return body;
      const b = body as Record<string, unknown> | null;
      // CKAN returns { success: false, error: { message, __type } }
      const err = b?.error as Record<string, unknown> | undefined;
      if (err && typeof err.message === "string") return err.message;
      if (typeof b?.message === "string") return b.message;
      return undefined;
    },
    makeError: (status, msg) => new CaGrantsPortalError(status, msg),
  });
}

function toStringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectGrant(rec: Record<string, any>): CaGrant {
  const rawDescription =
    typeof rec.Description === "string" ? rec.Description : null;
  return {
    rowId: typeof rec._id === "number" ? rec._id : 0,
    grantId: toStringOrNull(rec.GrantID),
    status: toStringOrNull(rec.Status) ?? "unknown",
    agencyDept: toStringOrNull(rec.AgencyDept),
    title: typeof rec.Title === "string" ? rec.Title : "",
    type: toStringOrNull(rec.Type),
    categories: toStringOrNull(rec.Categories),
    purpose: toStringOrNull(rec.Purpose),
    description: rawDescription ? rawDescription.slice(0, 500) : null,
    applicantType: toStringOrNull(rec.ApplicantType),
    geography: toStringOrNull(rec.Geography),
    fundingSource: toStringOrNull(rec.FundingSource),
    estAvailFunds: toStringOrNull(rec.EstAvailFunds),
    estAwards: toStringOrNull(rec.EstAwards),
    estAmounts: toStringOrNull(rec.EstAmounts),
    openDate: toStringOrNull(rec.OpenDate),
    applicationDeadline: toStringOrNull(rec.ApplicationDeadline),
    expAwardDate: toStringOrNull(rec.ExpAwardDate),
    grantUrl: toStringOrNull(rec.GrantURL),
    agencyUrl: toStringOrNull(rec.AgencyURL),
    lastUpdated: toStringOrNull(rec.LastUpdated),
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export type SearchCaGrantsParams = {
  /** Free-text query — matches across all text columns. Optional. */
  query?: string;
  /** Status filter. Defaults to "active" so the model surfaces open grants by default. */
  status?: CaGrantStatus;
  /** Substring filter for AgencyDept (e.g. "Health Care Services"). */
  agencyDept?: string;
  /** Cap returned hits (1–10). Default 10. */
  limit?: number;
};

/**
 * Search the California Grants Portal datastore.
 *
 * CKAN's datastore_search supports free-text via `q=` and exact-match column
 * filters via `filters={"col":"val"}`. We expose a deliberately narrow surface:
 * status and agencyDept are common; everything else flows through the keyword.
 *
 * Returns up to `limit` slim grant rows plus the total match count so the
 * model can tell the user "found 47 matches, showing top 10".
 */
export async function searchCaGrants(
  params: SearchCaGrantsParams = {},
): Promise<{ grants: CaGrant[]; total: number }> {
  const { query, status = "active", agencyDept, limit = 10 } = params;
  const cappedLimit = Math.max(1, Math.min(limit, 10));

  const url = new URL(`${CA_DATA_BASE}/datastore_search`);
  url.searchParams.set("resource_id", CA_GRANTS_RESOURCE_ID);
  url.searchParams.set("limit", String(cappedLimit));
  if (query && query.trim()) {
    url.searchParams.set("q", query.trim());
  }

  // CKAN filters use a JSON object. Combine status + agencyDept here.
  const filters: Record<string, string> = {};
  if (status) filters.Status = status;
  if (agencyDept) filters.AgencyDept = agencyDept;
  if (Object.keys(filters).length > 0) {
    url.searchParams.set("filters", JSON.stringify(filters));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: caGrantsHeaders(),
  });

  const payload = await handleResponse<Record<string, unknown>>(response);

  if (payload.success !== true) {
    throw new CaGrantsPortalError(
      500,
      "CA Grants Portal returned success=false (no error message).",
    );
  }

  const result = (payload.result as Record<string, unknown>) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: Record<string, any>[] = Array.isArray(result.records)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result.records as Record<string, any>[])
    : [];
  const total = typeof result.total === "number" ? result.total : records.length;

  return {
    grants: records.map(projectGrant),
    total,
  };
}

export type GetCaGrantParams = {
  /** CKAN row id from a prior searchCaGrants result. Required. */
  rowId: number;
};

/**
 * Fetch a single CA grant by row id. Pulls the full record (no description
 * truncation) so the user can see purpose/eligibility/contact in detail.
 *
 * Implemented via datastore_search with a row-id filter — CKAN doesn't expose
 * a /record/{id} endpoint.
 */
export async function getCaGrant(
  params: GetCaGrantParams,
): Promise<{ grant: CaGrant | null }> {
  const { rowId } = params;
  if (!Number.isFinite(rowId) || rowId <= 0) {
    throw new CaGrantsPortalError(400, "rowId must be a positive integer.");
  }

  const url = new URL(`${CA_DATA_BASE}/datastore_search`);
  url.searchParams.set("resource_id", CA_GRANTS_RESOURCE_ID);
  url.searchParams.set("limit", "1");
  url.searchParams.set("filters", JSON.stringify({ _id: rowId }));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: caGrantsHeaders(),
  });

  const payload = await handleResponse<Record<string, unknown>>(response);
  const result = (payload.result as Record<string, unknown>) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: Record<string, any>[] = Array.isArray(result.records)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result.records as Record<string, any>[])
    : [];

  if (records.length === 0) return { grant: null };

  // For single-grant fetch we return full description (no 500-char cap).
  const projected = projectGrant(records[0]);
  if (
    typeof records[0].Description === "string" &&
    records[0].Description.length > 500
  ) {
    projected.description = records[0].Description;
  }
  return { grant: projected };
}
