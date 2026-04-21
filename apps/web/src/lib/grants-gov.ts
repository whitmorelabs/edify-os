/**
 * Typed REST wrappers for the Grants.gov v1 API (search2 + fetchOpportunity).
 * Uses direct fetch — no SDK (same no-external-SDK principle as google-calendar.ts).
 * No user-identifying info is sent in these calls — pure search queries only.
 *
 * Set API_DATA_GOV_KEY in env vars for higher rate limits (optional).
 * Without a key the public endpoints work at ~1k req/hour per IP.
 *
 * API quirks this wrapper handles:
 *  - Array filters (oppStatuses, eligibilities, fundingCategories, agencies) must be
 *    pipe-separated strings, not JSON arrays. The API silently ignores arrays.
 *  - Responses are wrapped in an envelope: { errorcode, msg, token, data, accessKey }.
 *    HTTP 200 with errorcode !== 0 means the call failed.
 *  - Search-hit fields (id, number, oppStatus, openDate, agencyCode, docType, cfdaList)
 *    differ from fetchOpportunity detail fields (opportunityNumber, opportunityTitle,
 *    synopsis.{awardCeiling,awardFloor,applicantTypes,fundingInstruments,synopsisDesc}).
 */

import { handleJsonResponse } from "@/lib/http";

const GRANTS_GOV_BASE = "https://api.grants.gov/v1/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Grant = {
  opportunityId: string;
  opportunityNumber: string;
  title: string;
  agency: string;
  status: string;
  postedDate: string;
  closeDate: string | null;
  awardCeiling: number | null;
  awardFloor: number | null;
  fundingInstrumentTypes: string[];
  eligibilityCategories: string[];
  opportunityCategoryExplanation: string | null;
};

export type GrantDetail = Grant & {
  description: string | null;
  additionalInformation: string | null;
  synopsisDescription: string | null;
};

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class GrantsGovError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "GrantsGovError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function grantsGovHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = process.env.API_DATA_GOV_KEY;
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    // Grants.gov returns errors in various shapes: errorMessage, message, or a bare string.
    extractMessage: (body) => {
      if (typeof body === "string") return body;
      const b = body as Record<string, unknown> | null;
      if (typeof b?.errorMessage === "string") return b.errorMessage;
      if (typeof b?.message === "string") return b.message;
      if (typeof b?.msg === "string") return b.msg;
      return undefined;
    },
    makeError: (status, msg) => new GrantsGovError(status, msg),
  });
}

/**
 * Unwrap the standard Grants.gov v1 envelope { errorcode, msg, token, data, accessKey }.
 * HTTP 200 with errorcode !== 0 means a business error — throw GrantsGovError.
 */
function unwrapEnvelope<T>(envelope: Record<string, unknown>): T {
  const errorcode =
    typeof envelope.errorcode === "number" ? envelope.errorcode : null;
  if (errorcode !== 0) {
    const msg =
      typeof envelope.msg === "string" ? envelope.msg : "Grants.gov API error";
    // Use 200 since HTTP succeeded — the failure was at the business layer.
    throw new GrantsGovError(200, msg);
  }
  return (envelope.data ?? {}) as T;
}

/** Format a Date as MM/DD/YYYY for Grants.gov closeDate filters. */
function formatGrantsGovDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Project a raw search2 hit to our Grant type.
 * Search hits have: id, number, title, agency, agencyCode, oppStatus, openDate,
 * closeDate, docType, cfdaList. They do NOT contain award amounts or eligibility
 * categories — those only appear in fetchOpportunity detail responses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectSearchHit(hit: Record<string, any>): Grant {
  return {
    opportunityId: String(hit.id ?? ""),
    opportunityNumber: hit.number ?? "",
    title: hit.title ?? "",
    agency: hit.agency ?? "",
    status: hit.oppStatus ?? "",
    postedDate: hit.openDate ?? "",
    closeDate: hit.closeDate ? hit.closeDate : null,
    awardCeiling: null,
    awardFloor: null,
    fundingInstrumentTypes: [],
    eligibilityCategories: [],
    opportunityCategoryExplanation: null,
  };
}

/**
 * Project a fetchOpportunity detail payload to our Grant type.
 * Detail shape: { id, opportunityNumber, opportunityTitle, owningAgencyCode,
 * opportunityCategory: {category, description}, synopsis: {...}, cfdas: [...], ... }.
 * The synopsis sub-object holds award amounts, applicantTypes, fundingInstruments, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectDetailBase(detail: Record<string, any>): Grant {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synopsis: Record<string, any> = detail.synopsis ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const category: Record<string, any> = detail.opportunityCategory ?? {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applicantTypes: any[] = Array.isArray(synopsis.applicantTypes)
    ? synopsis.applicantTypes
    : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fundingInstruments: any[] = Array.isArray(synopsis.fundingInstruments)
    ? synopsis.fundingInstruments
    : [];

  const awardCeiling =
    synopsis.awardCeiling != null && synopsis.awardCeiling !== ""
      ? Number(synopsis.awardCeiling)
      : null;
  const awardFloor =
    synopsis.awardFloor != null && synopsis.awardFloor !== ""
      ? Number(synopsis.awardFloor)
      : null;

  return {
    opportunityId: String(detail.id ?? ""),
    opportunityNumber: detail.opportunityNumber ?? "",
    title: detail.opportunityTitle ?? "",
    agency: synopsis.agencyName ?? "",
    status: detail.ost ? String(detail.ost).toLowerCase() : "",
    postedDate: synopsis.postingDate ?? "",
    closeDate: synopsis.responseDate ?? null,
    awardCeiling: Number.isFinite(awardCeiling as number)
      ? (awardCeiling as number)
      : null,
    awardFloor: Number.isFinite(awardFloor as number)
      ? (awardFloor as number)
      : null,
    fundingInstrumentTypes: fundingInstruments
      .map((f) => (typeof f?.description === "string" ? f.description : null))
      .filter((v): v is string => Boolean(v)),
    eligibilityCategories: applicantTypes
      .map((a) => (typeof a?.description === "string" ? a.description : null))
      .filter((v): v is string => Boolean(v)),
    opportunityCategoryExplanation:
      typeof category.description === "string" ? category.description : null,
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export type SearchGrantsParams = {
  keyword?: string;
  oppStatuses?: Array<"forecasted" | "posted" | "closed" | "archived">;
  eligibilities?: string[];
  fundingCategories?: string[];
  agencies?: string[];
  /** Convenience param — filters close date to within N days from today. */
  deadlineWithinDays?: number;
  rows?: number;
  sortBy?: string;
};

/**
 * Search federal grant opportunities on Grants.gov.
 * Defaults: oppStatuses=["forecasted","posted"], rows=20, sortBy="closeDate:asc".
 */
export async function searchGrants(
  params: SearchGrantsParams = {}
): Promise<{ grants: Grant[]; total: number }> {
  const {
    keyword,
    oppStatuses = ["forecasted", "posted"],
    eligibilities,
    fundingCategories,
    agencies,
    deadlineWithinDays,
    rows = 20,
    sortBy = "closeDate|asc",
  } = params;

  // Cap rows at 50 to keep Claude context manageable
  const cappedRows = Math.min(rows, 50);

  // Build the request body for the Grants.gov search2 endpoint.
  // Array filters MUST be pipe-separated strings — the API silently ignores JSON arrays.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    rows: cappedRows,
    sortBy,
    oppStatuses: oppStatuses.join("|"),
  };

  if (keyword) body.keyword = keyword;
  if (eligibilities?.length) body.eligibilities = eligibilities.join("|");
  if (fundingCategories?.length)
    body.fundingCategories = fundingCategories.join("|");
  if (agencies?.length) body.agencies = agencies.join("|");

  // deadlineWithinDays → closeDate filter
  if (deadlineWithinDays != null && deadlineWithinDays > 0) {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + deadlineWithinDays);
    body.closeDate = {
      startDate: formatGrantsGovDate(today),
      endDate: formatGrantsGovDate(endDate),
    };
  }

  const response = await fetch(`${GRANTS_GOV_BASE}/search2`, {
    method: "POST",
    headers: grantsGovHeaders(),
    body: JSON.stringify(body),
  });

  const envelope =
    await handleResponse<Record<string, unknown>>(response);
  const data = unwrapEnvelope<Record<string, unknown>>(envelope);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hits: Record<string, any>[] = Array.isArray(
    (data as Record<string, unknown>).oppHits
  )
    ? ((data as Record<string, unknown>).oppHits as Record<string, unknown>[])
    : [];
  const total: number =
    typeof (data as Record<string, unknown>).hitCount === "number"
      ? ((data as Record<string, unknown>).hitCount as number)
      : hits.length;

  return {
    grants: hits.map(projectSearchHit),
    total,
  };
}

/**
 * Fetch full details of a specific grant opportunity by opportunityId.
 */
export async function fetchGrantDetails({
  opportunityId,
}: {
  opportunityId: string;
}): Promise<{ grant: GrantDetail }> {
  const body = { opportunityId };

  const response = await fetch(`${GRANTS_GOV_BASE}/fetchOpportunity`, {
    method: "POST",
    headers: grantsGovHeaders(),
    body: JSON.stringify(body),
  });

  const envelope =
    await handleResponse<Record<string, unknown>>(response);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detail = unwrapEnvelope<Record<string, any>>(envelope);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synopsis: Record<string, any> = detail.synopsis ?? {};

  const grant: GrantDetail = {
    ...projectDetailBase(detail),
    description:
      typeof synopsis.synopsisDesc === "string" ? synopsis.synopsisDesc : null,
    additionalInformation:
      typeof synopsis.applicantEligibilityDesc === "string"
        ? synopsis.applicantEligibilityDesc
        : null,
    synopsisDescription:
      typeof synopsis.synopsisDesc === "string" ? synopsis.synopsisDesc : null,
  };

  return { grant };
}
