/**
 * Anthropic tool definitions and executor for the donor CRM.
 * Five tools: crm_list_donors, crm_get_donor, crm_create_donor, crm_log_donation, crm_log_interaction.
 *
 * Dollar→cents conversion: Claude sends amounts in dollars ("5000" = $5,000).
 * This dispatcher multiplies by 100 and rounds to integer cents before writing.
 * Output to Claude formats cents back as dollars for readability.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listDonors,
  getDonor,
  createDonor,
  logDonation,
  logInteraction,
} from "@/lib/crm";
import type { Donor } from "@/lib/crm";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have CRM tools active.
// ---------------------------------------------------------------------------

export const CRM_TOOLS_ADDENDUM = `\nYou have access to the organization's donor CRM. All monetary amounts in tool inputs should be in DOLLARS (e.g. 5000 for $5,000) — the system handles the conversion. Donations require a donor_id from crm_list_donors or crm_create_donor first. Never make up donor data or donor IDs. Use crm_list_donors to find existing donors before creating a new one.`;

// ---------------------------------------------------------------------------
// Helper: convert cents → dollars for Claude-readable output
// ---------------------------------------------------------------------------

function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/** Project donor to slim shape for list output */
function slimDonor(d: Donor) {
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    donor_type: d.donor_type,
    lifetime_giving_dollars: centsToDollars(d.lifetime_giving_cents),
    last_gift_at: d.last_gift_at,
    tags: d.tags,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const crmTools: Anthropic.Tool[] = [
  {
    name: "crm_list_donors",
    description:
      "List donors in the organization's CRM. Use when the user asks about donors, top givers, who has given, or wants to find a specific person before logging a gift. Returns up to 25 donors with name, email, lifetime giving, last gift date, and tags. Supports optional search (by name or email), tag filter, and sort order.",
    input_schema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search by donor name or email (partial match). Optional.",
        },
        tags: {
          type: "array",
          description:
            "Filter to donors who have ALL of the specified tags (e.g. ['major_donor', 'board']). Optional.",
          items: { type: "string" },
        },
        sortBy: {
          type: "string",
          description:
            "Sort by: 'lifetime_giving_cents' (highest givers first, default), 'last_gift_at' (most recently active), 'name' (alphabetical), 'created_at' (newest added).",
          enum: ["lifetime_giving_cents", "last_gift_at", "name", "created_at"],
        },
        limit: {
          type: "number",
          description: "Number of results to return (1–25). Defaults to 25.",
        },
      },
      required: [],
    },
  },
  {
    name: "crm_get_donor",
    description:
      "Get full details of one donor, including their recent donations (last 10) and recent interactions (last 10). Use after crm_list_donors when the user asks about a specific person — use the donor ID from the list result. Do not guess donor IDs.",
    input_schema: {
      type: "object" as const,
      properties: {
        donor_id: {
          type: "string",
          description: "The donor UUID from a prior crm_list_donors or crm_create_donor result.",
        },
      },
      required: ["donor_id"],
    },
  },
  {
    name: "crm_create_donor",
    description:
      "Add a new donor to the CRM. Use when the user explicitly asks to add or create a donor. Check crm_list_donors first to avoid creating duplicates. Required: name and donor_type. Optional: email, phone, address, notes, tags.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Donor's full name or organization name.",
        },
        donor_type: {
          type: "string",
          description:
            "Type of donor: 'individual', 'foundation', 'corporation', 'government', or 'other'.",
          enum: ["individual", "foundation", "corporation", "government", "other"],
        },
        email: {
          type: "string",
          description: "Donor's email address (optional).",
        },
        phone: {
          type: "string",
          description: "Donor's phone number (optional).",
        },
        address: {
          type: "string",
          description: "Donor's mailing address (optional).",
        },
        notes: {
          type: "string",
          description: "Internal notes about this donor (optional).",
        },
        tags: {
          type: "array",
          description:
            "Tags for categorization (e.g. ['major_donor', 'board_member', 'annual_fund']). Optional.",
          items: { type: "string" },
        },
      },
      required: ["name", "donor_type"],
    },
  },
  {
    name: "crm_log_donation",
    description:
      "Record a donation or gift from a donor. Requires a donor_id — use crm_list_donors or crm_create_donor first. Amount should be in DOLLARS (e.g. 5000 for $5,000). The given_at date should be an ISO date string (YYYY-MM-DD).",
    input_schema: {
      type: "object" as const,
      properties: {
        donor_id: {
          type: "string",
          description: "The donor UUID. Must come from crm_list_donors or crm_create_donor.",
        },
        amount: {
          type: "number",
          description: "Gift amount in DOLLARS (e.g. 5000 for $5,000). Must be greater than 0.",
        },
        given_at: {
          type: "string",
          description: "Date of the gift in ISO format (YYYY-MM-DD, e.g. '2026-04-01').",
        },
        campaign: {
          type: "string",
          description: "Campaign or appeal name this gift is attributed to (optional).",
        },
        designation: {
          type: "string",
          description: "Fund or program designation for this gift (optional).",
        },
        payment_method: {
          type: "string",
          description: "How the payment was made: 'check', 'credit_card', 'wire', 'cash', etc. (optional).",
        },
        notes: {
          type: "string",
          description: "Internal notes about this donation (optional).",
        },
      },
      required: ["donor_id", "amount", "given_at"],
    },
  },
  {
    name: "crm_log_interaction",
    description:
      "Record a touchpoint or interaction with a donor — a call, email, meeting, event, or letter. Requires a donor_id. Use to track stewardship, cultivation, and follow-up history.",
    input_schema: {
      type: "object" as const,
      properties: {
        donor_id: {
          type: "string",
          description: "The donor UUID. Must come from crm_list_donors or crm_create_donor.",
        },
        interaction_type: {
          type: "string",
          description: "Type of interaction: 'email', 'phone', 'meeting', 'event', 'letter', or 'other'.",
          enum: ["email", "phone", "meeting", "event", "letter", "other"],
        },
        occurred_at: {
          type: "string",
          description: "When the interaction occurred, in ISO 8601 format (e.g. '2026-04-17T14:00:00Z').",
        },
        summary: {
          type: "string",
          description: "Brief summary of what happened or was discussed.",
        },
        follow_up_needed: {
          type: "boolean",
          description: "Whether a follow-up action is needed. Defaults to false.",
        },
        follow_up_at: {
          type: "string",
          description:
            "Date for follow-up in ISO date format (YYYY-MM-DD). Only provide if follow_up_needed is true.",
        },
      },
      required: ["donor_id", "interaction_type", "occurred_at", "summary"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeCrmTool({
  name,
  input,
  orgId,
  memberId,
  serviceClient,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  orgId: string;
  memberId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "crm_list_donors": {
        const limit =
          typeof input.limit === "number" ? Math.min(input.limit, 25) : 25;

        const result = await listDonors({
          serviceClient,
          orgId,
          limit,
          search: input.search as string | undefined,
          tags: input.tags as string[] | undefined,
          sortBy: input.sortBy as
            | "lifetime_giving_cents"
            | "last_gift_at"
            | "name"
            | "created_at"
            | undefined,
        });

        // Project to slim shape for Claude readability
        const slim = {
          count: result.donors.length,
          donors: result.donors.map(slimDonor),
        };

        return { content: JSON.stringify(slim) };
      }

      case "crm_get_donor": {
        if (!input.donor_id || typeof input.donor_id !== "string") {
          return {
            content: "donor_id is required and must be a string.",
            is_error: true,
          };
        }

        const result = await getDonor({
          serviceClient,
          orgId,
          donorId: input.donor_id,
        });

        // Convert cents to dollars in the output
        const output = {
          donor: {
            ...result.donor,
            lifetime_giving_dollars: centsToDollars(result.donor.lifetime_giving_cents),
          },
          recentDonations: result.recentDonations.map((d) => ({
            ...d,
            amount_dollars: centsToDollars(d.amount_cents),
          })),
          recentInteractions: result.recentInteractions,
        };

        return { content: JSON.stringify(output) };
      }

      case "crm_create_donor": {
        if (!input.name || typeof input.name !== "string") {
          return {
            content: "name is required and must be a string.",
            is_error: true,
          };
        }
        if (!input.donor_type || typeof input.donor_type !== "string") {
          return {
            content: "donor_type is required and must be one of: individual, foundation, corporation, government, other.",
            is_error: true,
          };
        }

        const result = await createDonor({
          serviceClient,
          orgId,
          memberId,
          name: input.name,
          donorType: input.donor_type as Donor["donor_type"],
          email: input.email as string | undefined,
          phone: input.phone as string | undefined,
          address: input.address as string | undefined,
          notes: input.notes as string | undefined,
          tags: input.tags as string[] | undefined,
        });

        return {
          content: JSON.stringify({
            success: true,
            donor: slimDonor(result.donor),
          }),
        };
      }

      case "crm_log_donation": {
        if (!input.donor_id || typeof input.donor_id !== "string") {
          return {
            content: "donor_id is required and must be a string.",
            is_error: true,
          };
        }
        if (typeof input.amount !== "number" || input.amount <= 0) {
          return {
            content: "amount is required and must be a positive number (in dollars).",
            is_error: true,
          };
        }
        if (!input.given_at || typeof input.given_at !== "string") {
          return {
            content: "given_at is required and must be an ISO date string (YYYY-MM-DD).",
            is_error: true,
          };
        }

        // Dollar → cents conversion: multiply by 100, round to integer cents
        const amountCents = Math.round((input.amount as number) * 100);

        const result = await logDonation({
          serviceClient,
          orgId,
          memberId,
          donorId: input.donor_id,
          amountCents,
          givenAt: input.given_at,
          campaign: input.campaign as string | undefined,
          designation: input.designation as string | undefined,
          paymentMethod: input.payment_method as string | undefined,
          notes: input.notes as string | undefined,
        });

        return {
          content: JSON.stringify({
            success: true,
            donation: {
              ...result.donation,
              amount_dollars: centsToDollars(result.donation.amount_cents),
            },
          }),
        };
      }

      case "crm_log_interaction": {
        if (!input.donor_id || typeof input.donor_id !== "string") {
          return {
            content: "donor_id is required and must be a string.",
            is_error: true,
          };
        }
        if (!input.interaction_type || typeof input.interaction_type !== "string") {
          return {
            content: "interaction_type is required and must be one of: email, phone, meeting, event, letter, other.",
            is_error: true,
          };
        }
        if (!input.occurred_at || typeof input.occurred_at !== "string") {
          return {
            content: "occurred_at is required and must be an ISO 8601 datetime string.",
            is_error: true,
          };
        }
        if (!input.summary || typeof input.summary !== "string") {
          return {
            content: "summary is required and must be a string.",
            is_error: true,
          };
        }

        const result = await logInteraction({
          serviceClient,
          orgId,
          memberId,
          donorId: input.donor_id,
          interactionType: input.interaction_type as Donor["donor_type"] extends string
            ? "email" | "phone" | "meeting" | "event" | "letter" | "other"
            : never,
          occurredAt: input.occurred_at,
          summary: input.summary,
          followUpNeeded: (input.follow_up_needed as boolean | undefined) ?? false,
          followUpAt: input.follow_up_at as string | undefined,
        });

        return {
          content: JSON.stringify({
            success: true,
            interaction: result.interaction,
          }),
        };
      }

      default:
        return {
          content: `Unknown CRM tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    console.error(`[crm-tool] Unexpected error in ${name}:`, err);
    const message = err instanceof Error ? err.message : "Unexpected error in CRM operation.";
    return {
      content: message,
      is_error: true,
    };
  }
}
