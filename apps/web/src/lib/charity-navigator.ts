/**
 * Typed GraphQL client wrapper for Charity Navigator's free-tier API.
 * Endpoint: https://api.charitynavigator.org/graphql
 * Auth: Authorization header, value = the raw API key (no "Bearer " prefix).
 *       Per the cn-examples README ("set its value to your API key").
 *
 * Free tier exposes a single useful query: `publicSearchFaceted`.
 * There is no separate get-by-EIN query in the free tier — for "profile by EIN"
 * we just call publicSearchFaceted with term=ein and return the first match.
 *
 * Coverage: ~225,000 rated US 501(c)(3)s.
 *
 * Free-tier response fields (per the cn-examples GraphQL schema):
 *   ein, name, mission, organization_url, charity_navigator_url,
 *   encompass_score, encompass_star_rating, encompass_publication_date,
 *   cause, street, street2, city, state, zip, country, highest_level_alert
 *
 * Beacon-level breakdowns (Accountability, Finance, Impact, Culture & Community)
 * are NOT exposed as response fields in the free tier — only the rolled-up
 * encompass_score (0-100) and encompass_star_rating (0-4). Beacons can be used
 * as a filter input but not surfaced individually.
 *
 * Rate limits: not formally documented in CN's portal. We fire requests with
 * standard JSON POST and surface any X-RateLimit-* response headers in the
 * thrown error so the caller can diagnose throttling.
 *
 * Reference:
 *   https://github.com/CharityNavigator/cn-examples
 *   https://www.charitynavigator.org/products-and-services/graphql-api/
 */

import { handleJsonResponse, toFiniteNumber } from "@/lib/http";

const CHARITY_NAVIGATOR_GRAPHQL_URL = "https://api.charitynavigator.org/graphql";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Slim hit projection — what the model surfaces to the user. */
export type CharityNavigatorHit = {
  ein: string;
  name: string;
  mission: string | null;
  cause: string | null;
  organizationUrl: string | null;
  charityNavigatorUrl: string | null;
  /** 0–100 encompass score (rolled-up rating). */
  encompassScore: number | null;
  /** 0–4 stars (matches CN's public 4-star scale). */
  encompassStarRating: number | null;
  /** ISO date the rating was published. */
  encompassPublicationDate: string | null;
  /** Active alert level if CN has flagged the org (e.g. "HIGH"), else null. */
  highestLevelAlert: string | null;
  /** Address (city/state/zip/country) — useful for prospect-research narratives. */
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
};

/** Search result envelope. */
export type CharityNavigatorSearchResult = {
  total: number;
  returned: number;
  hits: CharityNavigatorHit[];
};

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class CharityNavigatorError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CharityNavigatorError";
  }
}

/** Marker error: env var not provisioned. Surfaced as a benign tool message. */
export class CharityNavigatorNotConfiguredError extends CharityNavigatorError {
  constructor() {
    super(
      503,
      "Charity Navigator API key not configured. Set CHARITY_NAVIGATOR_API_KEY in env to enable charity_navigator_* tools.",
    );
    this.name = "CharityNavigatorNotConfiguredError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.CHARITY_NAVIGATOR_API_KEY?.trim();
  if (!key) {
    throw new CharityNavigatorNotConfiguredError();
  }
  return key;
}

function charityNavigatorHeaders(apiKey: string): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    // Per cn-examples README: header name "Authorization", value = the raw key
    // (no "Bearer " prefix). Tyk gateway accepts either form but the canonical
    // example uses the raw key.
    Authorization: apiKey,
    "User-Agent":
      "Edify-OS (https://edify.tools) — nonprofit prospect research",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    extractMessage: (body) => {
      if (typeof body === "string") return body;
      const b = body as Record<string, unknown> | null;
      // Tyk gateway error shape: { error: "..." }
      if (typeof b?.error === "string") return b.error;
      // GraphQL error shape: { errors: [{ message: "..." }] }
      const errors = b?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0] as Record<string, unknown>;
        if (typeof first?.message === "string") return first.message;
      }
      if (typeof b?.message === "string") return b.message;
      return undefined;
    },
    makeError: (status, msg) => new CharityNavigatorError(status, msg),
  });
}

/**
 * GraphQL query for the publicSearchFaceted endpoint, copied verbatim from
 * Charity Navigator's cn-examples. Free-tier-supported variables only.
 */
const PUBLIC_SEARCH_FACETED_QUERY = `
query PublicSearchFaceted(
  $term: String!
  $states: [String!]!
  $sizes: [String!]!
  $causes: [String!]!
  $ratings: [String!]!
  $c3: Boolean!
  $result_size: Int!
  $from: Int!
  $beacons: [String!]!
  $advisories: [String!]!
  $orderBy: String!
) {
  publicSearchFaceted(
    term: $term
    states: $states
    sizes: $sizes
    causes: $causes
    ratings: $ratings
    c3: $c3
    result_size: $result_size
    from: $from
    beacons: $beacons
    advisories: $advisories
    order_by: $orderBy
  ) {
    size
    from
    term
    result_count
    results {
      ein
      name
      mission
      organization_url
      charity_navigator_url
      encompass_score
      encompass_star_rating
      encompass_publication_date
      cause
      street
      street2
      city
      state
      zip
      country
      highest_level_alert
    }
  }
}
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectHit(r: Record<string, any>): CharityNavigatorHit {
  return {
    ein: typeof r.ein === "string" ? r.ein : "",
    name: typeof r.name === "string" ? r.name : "",
    mission: typeof r.mission === "string" ? r.mission : null,
    cause: typeof r.cause === "string" ? r.cause : null,
    organizationUrl:
      typeof r.organization_url === "string" ? r.organization_url : null,
    charityNavigatorUrl:
      typeof r.charity_navigator_url === "string"
        ? r.charity_navigator_url
        : null,
    encompassScore: toFiniteNumber(r.encompass_score),
    encompassStarRating: toFiniteNumber(r.encompass_star_rating),
    encompassPublicationDate:
      typeof r.encompass_publication_date === "string"
        ? r.encompass_publication_date
        : null,
    highestLevelAlert:
      typeof r.highest_level_alert === "string" ? r.highest_level_alert : null,
    city: typeof r.city === "string" ? r.city : null,
    state: typeof r.state === "string" ? r.state : null,
    zip: typeof r.zip === "string" ? r.zip : null,
    country: typeof r.country === "string" ? r.country : null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type SearchCharitiesParams = {
  /**
   * Free-text query — name, EIN (with or without dashes), or keyword. Required
   * (the GraphQL schema marks it non-null).
   */
  term: string;
  /** Two-letter state codes to narrow (e.g. ["NY", "CA"]). Optional. */
  states?: string[];
  /** CN cause filters (e.g. ["Animals", "Education"]). Optional. */
  causes?: string[];
  /** Star-rating filters (string values like "FOUR_STAR"). Optional. */
  ratings?: string[];
  /** If true, restrict to 501(c)(3) orgs. Defaults to true. */
  c3?: boolean;
  /** Cap returned hits (1–25). Default 10. */
  limit?: number;
  /** Pagination offset. Default 0. */
  from?: number;
};

/**
 * Run a publicSearchFaceted query against Charity Navigator's free-tier
 * GraphQL API. All non-required variables default to empty arrays — the
 * upstream schema marks them `[String!]!` so we cannot omit them.
 */
export async function searchCharities(
  params: SearchCharitiesParams,
): Promise<CharityNavigatorSearchResult> {
  const {
    term,
    states = [],
    causes = [],
    ratings = [],
    c3 = true,
    limit = 10,
    from = 0,
  } = params;

  if (!term || !term.trim()) {
    throw new CharityNavigatorError(
      400,
      "term is required for charity search.",
    );
  }

  const apiKey = getApiKey();
  const cappedLimit = Math.max(1, Math.min(limit, 25));

  const variables = {
    term: term.trim(),
    states: states.map((s) => s.toUpperCase()),
    sizes: [] as string[],
    causes,
    ratings,
    c3,
    result_size: cappedLimit,
    from: Math.max(0, from),
    beacons: [] as string[],
    advisories: [] as string[],
    orderBy: "RELEVANCE",
  };

  const response = await fetch(CHARITY_NAVIGATOR_GRAPHQL_URL, {
    method: "POST",
    headers: charityNavigatorHeaders(apiKey),
    body: JSON.stringify({
      query: PUBLIC_SEARCH_FACETED_QUERY,
      variables,
    }),
  });

  const payload = await handleResponse<Record<string, unknown>>(response);

  // GraphQL can return 200 with an `errors` array even on schema-level failures.
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0] as Record<string, unknown>;
    const msg =
      typeof first?.message === "string"
        ? first.message
        : "GraphQL error from Charity Navigator.";
    throw new CharityNavigatorError(400, msg);
  }

  const data = (payload.data as Record<string, unknown>) ?? {};
  const search =
    (data.publicSearchFaceted as Record<string, unknown>) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawResults: Record<string, any>[] = Array.isArray(search.results)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (search.results as Record<string, any>[])
    : [];
  const total =
    typeof search.result_count === "number"
      ? search.result_count
      : rawResults.length;

  return {
    total,
    returned: rawResults.length,
    hits: rawResults.map(projectHit),
  };
}

export type GetCharityProfileParams = {
  /** EIN — accepted in either "13-1684331" or "131684331" form. */
  ein: string;
};

/**
 * Look up a single org's CN profile by EIN.
 *
 * Free tier has no dedicated get-by-EIN query, so we call publicSearchFaceted
 * with term=ein and pick the first hit whose ein matches. Returns null if no
 * match is found (CN doesn't rate every org — only ~225K rated charities).
 */
export async function getCharityProfile(
  params: GetCharityProfileParams,
): Promise<{ profile: CharityNavigatorHit | null }> {
  const { ein } = params;
  const cleanEin = ein.replace(/\D/g, "");
  if (!cleanEin) {
    throw new CharityNavigatorError(400, "ein is required.");
  }

  // CN's publicSearchFaceted accepts either dashed or undashed EINs in `term`.
  const result = await searchCharities({ term: cleanEin, limit: 5 });
  // Prefer exact EIN match over fuzzy text hits.
  const stripped = (e: string) => e.replace(/\D/g, "");
  const exact =
    result.hits.find((h) => stripped(h.ein) === cleanEin) ?? null;

  return { profile: exact };
}
