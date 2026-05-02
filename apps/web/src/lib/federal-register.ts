/**
 * Typed REST wrappers for the Federal Register API v1.
 * Free, public, no auth, no API key.
 *
 * Why this matters for Dev Director:
 *   Federal agencies post Notice of Funding Opportunity (NOFO) documents
 *   in the Federal Register, often DAYS-WEEKS BEFORE the same opportunity
 *   surfaces in Grants.gov's structured catalog. So Federal Register is
 *   the *primary* signal for "an opportunity is about to open"; Grants.gov
 *   is the application portal once it does. Chaining the two:
 *     1. Federal Register for upcoming NOFOs (this tool)
 *     2. Grants.gov for the official open opportunity (existing tool)
 *
 * Endpoint: https://www.federalregister.gov/api/v1/documents.json
 *
 * Important parameter names (verified live 2026-05-02):
 *   - conditions[term]                — full-text query
 *   - conditions[type][]              — document type, e.g. "NOTICE" / "RULE" / "PRORULE"
 *   - conditions[publication_date][gte] — ISO date YYYY-MM-DD lower bound
 *   - conditions[publication_date][lte] — ISO date YYYY-MM-DD upper bound
 *   - conditions[agencies][]          — agency slug (e.g. "education-department")
 *   - fields[]                        — projection (return only these fields)
 *   - per_page                        — page size (capped server-side ~100)
 *
 * Pitfall: the API rejects `conditions[document_type]=Notice` as
 * "is not a valid field" — the correct field is `conditions[type][]=NOTICE`
 * with the value upper-cased.
 *
 * Reference: https://www.federalregister.gov/developers/documentation/api/v1
 */

import { handleJsonResponse } from "@/lib/http";

const FR_API_BASE = "https://www.federalregister.gov/api/v1";

/** Document types accepted by `conditions[type][]`. NOTICE covers nearly all
 *  NOFO postings; the others are included for completeness. */
export const FEDERAL_REGISTER_DOCUMENT_TYPES = [
  "NOTICE",
  "RULE",
  "PRORULE",
  "PRESDOCU",
] as const;
export type FederalRegisterDocType =
  (typeof FEDERAL_REGISTER_DOCUMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One agency entry from the API's nested `agencies` array. */
export type FederalRegisterAgency = {
  /** Agency slug (e.g. "education-department"). Pass back as `conditions[agencies][]` to filter. */
  slug: string | null;
  /** Display name (e.g. "Education Department"). */
  name: string | null;
};

/** Slim projection of one Federal Register document. */
export type FederalRegisterDocument = {
  /** Document number (e.g. "2025-01275") — stable identifier within the FR. */
  documentNumber: string;
  title: string;
  /** Document type as returned (mixed case, e.g. "Notice"). */
  type: string | null;
  /** ISO YYYY-MM-DD. */
  publicationDate: string | null;
  /** Short summary published with the document. May be empty for some types. */
  abstract: string | null;
  /** Canonical Federal Register HTML page (for citation). */
  htmlUrl: string | null;
  /** govinfo.gov PDF for the print-format reference. */
  pdfUrl: string | null;
  /** Agencies attached to this document. */
  agencies: FederalRegisterAgency[];
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class FederalRegisterError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "FederalRegisterError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function frHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "User-Agent":
      "Edify-OS (https://edify.tools) - federal grants/NOFO research",
  };
}

async function frHandle<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    extractMessage: (body) => {
      if (typeof body === "string") return body;
      const b = body as Record<string, unknown> | null;
      // FR error shape: { errors: { field: "msg", ... } }
      const errors = b?.errors as Record<string, unknown> | undefined;
      if (errors) {
        const parts: string[] = [];
        for (const [k, v] of Object.entries(errors)) {
          if (typeof v === "string") parts.push(`${k}: ${v}`);
        }
        if (parts.length > 0) return parts.join("; ");
      }
      if (typeof b?.message === "string") return b.message;
      return undefined;
    },
    makeError: (status, msg) => new FederalRegisterError(status, msg),
  });
}

function toStringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectAgencies(raw: unknown): FederalRegisterAgency[] {
  if (!Array.isArray(raw)) return [];
  return raw
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: Record<string, any>) => ({
      slug: toStringOrNull(a?.slug),
      name: toStringOrNull(a?.name) ?? toStringOrNull(a?.raw_name),
    }))
    .filter((a) => a.slug || a.name);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectDocument(rec: Record<string, any>): FederalRegisterDocument {
  return {
    documentNumber: typeof rec.document_number === "string" ? rec.document_number : "",
    title: typeof rec.title === "string" ? rec.title : "",
    type: toStringOrNull(rec.type),
    publicationDate: toStringOrNull(rec.publication_date),
    abstract: toStringOrNull(rec.abstract),
    htmlUrl: toStringOrNull(rec.html_url),
    pdfUrl: toStringOrNull(rec.pdf_url),
    agencies: projectAgencies(rec.agencies),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type SearchFederalRegisterParams = {
  /** Free-text query (FR full-text). Optional. */
  query?: string;
  /** Document type filter — defaults to NOTICE (covers ~all NOFO postings). */
  documentType?: FederalRegisterDocType;
  /** ISO YYYY-MM-DD lower bound on publication date. */
  publishedFrom?: string;
  /** ISO YYYY-MM-DD upper bound on publication date. */
  publishedTo?: string;
  /** Optional agency slug (e.g. "education-department"). */
  agencySlug?: string;
  /** Cap returned hits (1-20). Default 10. */
  limit?: number;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Search Federal Register documents. Defaults bias toward grant-related
 * NOFOs: `documentType=NOTICE`. Caller can override.
 *
 * Returns up to `limit` slim records plus the total match count so the
 * model can tell the user how many hits were truncated.
 */
export async function searchFederalRegister(
  params: SearchFederalRegisterParams = {},
): Promise<{ documents: FederalRegisterDocument[]; total: number }> {
  const {
    query,
    documentType = "NOTICE",
    publishedFrom,
    publishedTo,
    agencySlug,
    limit = 10,
  } = params;
  const cappedLimit = Math.max(1, Math.min(limit, 20));

  if (publishedFrom && !ISO_DATE_RE.test(publishedFrom)) {
    throw new FederalRegisterError(
      400,
      "publishedFrom must be ISO date YYYY-MM-DD.",
    );
  }
  if (publishedTo && !ISO_DATE_RE.test(publishedTo)) {
    throw new FederalRegisterError(
      400,
      "publishedTo must be ISO date YYYY-MM-DD.",
    );
  }

  const url = new URL(`${FR_API_BASE}/documents.json`);
  url.searchParams.set("per_page", String(cappedLimit));
  if (query && query.trim()) {
    url.searchParams.set("conditions[term]", query.trim());
  }
  url.searchParams.append("conditions[type][]", documentType);
  if (publishedFrom) {
    url.searchParams.set("conditions[publication_date][gte]", publishedFrom);
  }
  if (publishedTo) {
    url.searchParams.set("conditions[publication_date][lte]", publishedTo);
  }
  if (agencySlug) {
    url.searchParams.append("conditions[agencies][]", agencySlug);
  }
  // Restrict to the fields we actually project — keeps response payloads
  // small (FR's full document JSON is ~5 KB per row otherwise).
  for (const f of [
    "title",
    "type",
    "document_number",
    "publication_date",
    "abstract",
    "html_url",
    "pdf_url",
    "agencies",
  ]) {
    url.searchParams.append("fields[]", f);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: frHeaders(),
  });

  const payload = await frHandle<Record<string, unknown>>(response);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Record<string, any>[] = Array.isArray(payload.results)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload.results as Record<string, any>[])
    : [];
  const total =
    typeof payload.count === "number" ? payload.count : results.length;

  return {
    documents: results.map(projectDocument),
    total,
  };
}
