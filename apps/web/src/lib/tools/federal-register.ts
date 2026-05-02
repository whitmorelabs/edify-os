/**
 * Anthropic tool definitions and executor for Federal Register search.
 * One tool: federal_register_search_grants.
 *
 * Why this is wired alongside the existing Grants.gov tools:
 *   Grants.gov is the official application portal — it lists opportunities
 *   that are already structured/posted. Federal Register is where agencies
 *   ANNOUNCE upcoming Notice of Funding Opportunity (NOFO) postings, often
 *   days-to-weeks earlier than the same opportunity reaches Grants.gov.
 *   So this tool is the *primary* federal NOFO signal; Grants.gov becomes
 *   the follow-on for application logistics.
 *
 * No env var required — Federal Register API is fully public, no auth.
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  searchFederalRegister,
  FederalRegisterError,
  FEDERAL_REGISTER_DOCUMENT_TYPES,
} from "@/lib/federal-register";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have Federal Register tools.
// ---------------------------------------------------------------------------

export const FEDERAL_REGISTER_TOOLS_ADDENDUM = `\nYou have access to federal_register_search_grants, which queries the Federal Register's free public API for federal Notices — including Notice of Funding Opportunity (NOFO) documents that agencies publish when they are about to release a grant. This is the *primary* source for federal grant signals: NOFOs typically appear in the Federal Register days-to-weeks BEFORE the same opportunity reaches Grants.gov's structured catalog. Use it when the user asks about upcoming federal grants, grants from a specific agency, or to discover NOFOs in a topic area. CHAINING: when you find a relevant NOFO, follow up with grants_search using the same keywords / agency to check if Grants.gov has the full structured opportunity yet (with eligibility, deadline, application URL). If Grants.gov has nothing, the NOFO is the earliest signal — surface the html_url to the user so they can read the announcement directly. Filter by 'documentType' (defaults to 'NOTICE' which covers ~all NOFO postings) and date range (use 'publishedFrom' to bias toward current-year signals). Always cite the documentNumber, publicationDate, and html_url so the user can verify against the official Federal Register entry. Note: a 'Notice' is broader than just NOFOs — agencies also post comment requests and other administrative notices in this category. Read each title/abstract before claiming it's a grant opportunity.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const federalRegisterTools: Anthropic.Tool[] = [
  {
    name: "federal_register_search_grants",
    description:
      "Search the Federal Register for grant-related Notice documents — the *primary* signal for upcoming federal Notice of Funding Opportunity (NOFO) postings, often published days-to-weeks before the same opportunity reaches Grants.gov's structured catalog. Use when the user asks about upcoming federal grants, grants from a specific agency (filter by agencySlug like 'education-department', 'health-and-human-services-department'), or recent NOFOs in a topic area. Returns up to 20 documents with title, agency, publication date, abstract, document number, and html_url. Default documentType is 'NOTICE' which covers nearly all NOFO postings — override to 'RULE' / 'PRORULE' / 'PRESDOCU' only for specialized cases. Results NOT all NOFOs — the model must read each title/abstract to confirm grant relevance, since 'Notice' is the broad regulatory category.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Free-text query (matches title, abstract, full text). Useful patterns: 'youth mentoring', 'notice of funding opportunity housing', '[topic area] grant'.",
        },
        documentType: {
          type: "string",
          description:
            "Document type filter. Defaults to 'NOTICE' (covers ~all NOFOs).",
          enum: [...FEDERAL_REGISTER_DOCUMENT_TYPES],
        },
        publishedFrom: {
          type: "string",
          description:
            "Lower bound on publication date (ISO YYYY-MM-DD). Use to bias toward current-year signals — e.g. '2025-01-01' to only see 2025+ documents.",
        },
        publishedTo: {
          type: "string",
          description:
            "Upper bound on publication date (ISO YYYY-MM-DD). Optional.",
        },
        agencySlug: {
          type: "string",
          description:
            "Filter to a single agency by slug (e.g. 'education-department', 'health-and-human-services-department', 'housing-and-urban-development-department'). The agency's slug appears on each result in the agencies array.",
        },
        limit: {
          type: "number",
          description:
            "Number of results to return (1-20). Defaults to 10. Capped server-side.",
        },
      },
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeFederalRegisterTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "federal_register_search_grants": {
        const documentType =
          typeof input.documentType === "string" &&
          (FEDERAL_REGISTER_DOCUMENT_TYPES as readonly string[]).includes(
            input.documentType,
          )
            ? (input.documentType as (typeof FEDERAL_REGISTER_DOCUMENT_TYPES)[number])
            : undefined;

        const result = await searchFederalRegister({
          query: typeof input.query === "string" ? input.query : undefined,
          documentType,
          publishedFrom:
            typeof input.publishedFrom === "string"
              ? input.publishedFrom
              : undefined,
          publishedTo:
            typeof input.publishedTo === "string" ? input.publishedTo : undefined,
          agencySlug:
            typeof input.agencySlug === "string" ? input.agencySlug : undefined,
          limit:
            typeof input.limit === "number" && Number.isFinite(input.limit)
              ? input.limit
              : undefined,
        });

        return {
          content: JSON.stringify({
            total: result.total,
            returned: result.documents.length,
            documents: result.documents,
          }),
        };
      }

      default:
        return {
          content: `Unknown Federal Register tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof FederalRegisterError) {
      return {
        content: `Federal Register error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[federal-register-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling Federal Register API.",
      is_error: true,
    };
  }
}
