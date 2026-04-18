/**
 * Typed REST wrappers for the Grants.gov v2 API.
 * Uses direct fetch — no SDK (same no-external-SDK principle as google-calendar.ts).
 * No user-identifying info is sent in these calls — pure search queries only.
 *
 * Set API_DATA_GOV_KEY in env vars for higher rate limits (optional).
 * Without a key the public endpoints work at ~1k req/hour per IP.
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
      return undefined;
    },
    makeError: (status, msg) => new GrantsGovError(status, msg),
  });
}

/** Format a Date as MM/DD/YYYY for Grants.gov closeDate filters. */
function formatGrantsGovDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/** Project a raw API hit to our Grant type. The API returns camelCase fields. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectGrant(hit: Record<string, any>): Grant {
  return {
    opportunityId: String(hit.opportunityId ?? hit.id ?? ""),
    opportunityNumber: hit.opportunityNumber ?? "",
    title: hit.opportunityTitle ?? hit.title ?? "",
    agency: hit.agencyName ?? hit.agency ?? "",
    status: hit.opportunityStatus ?? hit.status ?? "",
    postedDate: hit.postDate ?? hit.postedDate ?? "",
    closeDate: hit.closeDate ?? null,
    awardCeiling: hit.awardCeiling != null ? Number(hit.awardCeiling) : null,
    awardFloor: hit.awardFloor != null ? Number(hit.awardFloor) : null,
    fundingInstrumentTypes: hit.fundingInstrumentTypes ?? [],
    eligibilityCategories: hit.eligibilityCategories ?? [],
    opportunityCategoryExplanation: hit.opportunityCategoryExplanation ?? null,
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
    sortBy = "closeDate:asc",
  } = params;

  // Cap rows at 50 to keep Claude context manageable
  const cappedRows = Math.min(rows, 50);

  // Build the request body for the Grants.gov search2 endpoint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    rows: cappedRows,
    sortBy,
    oppStatuses,
  };

  if (keyword) body.keyword = keyword;
  if (eligibilities?.length) body.eligibilities = eligibilities;
  if (fundingCategories?.length) body.fundingCategories = fundingCategories;
  if (agencies?.length) body.agencies = agencies;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await handleResponse<Record<string, any>>(response);

  // The API returns results under `oppHits` or `hits` depending on endpoint version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hits: Record<string, any>[] = data.oppHits ?? data.hits ?? [];
  const total: number = data.hitCount ?? data.total ?? hits.length;

  return {
    grants: hits.map(projectGrant),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await handleResponse<Record<string, any>>(response);

  // fetchOpportunity wraps result in `opportunity` or returns it directly
  const opp = data.opportunity ?? data;

  const grant: GrantDetail = {
    ...projectGrant(opp),
    description: opp.description ?? opp.synopsisDescription ?? null,
    additionalInformation: opp.additionalInformation ?? null,
    synopsisDescription: opp.synopsisDescription ?? null,
  };

  return { grant };
}
