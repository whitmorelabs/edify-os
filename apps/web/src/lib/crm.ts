/**
 * Typed Supabase wrappers for the donor CRM tables.
 * All functions take a serviceClient + orgId and ALWAYS filter by org_id
 * (defense-in-depth even though the service client bypasses RLS).
 *
 * Currency notes:
 * - Stored as integer cents (amount_cents BIGINT) to avoid floating-point money bugs.
 * - Tool layer accepts dollars from Claude, converts to cents before calling these functions.
 * - These functions receive/return cents; presentation layer converts to dollars for output.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class CrmError extends Error {
  constructor(
    public readonly action: string,
    public readonly cause?: unknown
  ) {
    super(
      `CRM ${action} failed: ${cause instanceof Error ? cause.message : String(cause)}`
    );
    this.name = "CrmError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Donor = {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  donor_type: "individual" | "foundation" | "corporation" | "government" | "other";
  notes: string | null;
  tags: string[];
  first_gift_at: string | null;
  last_gift_at: string | null;
  lifetime_giving_cents: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Donation = {
  id: string;
  org_id: string;
  donor_id: string;
  amount_cents: number;
  given_at: string;
  campaign: string | null;
  designation: string | null;
  payment_method: string | null;
  receipt_sent: boolean;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type Interaction = {
  id: string;
  org_id: string;
  donor_id: string;
  interaction_type: "email" | "phone" | "meeting" | "event" | "letter" | "other";
  occurred_at: string;
  summary: string;
  follow_up_needed: boolean;
  follow_up_at: string | null;
  created_at: string;
  created_by: string | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hard cap on listDonors — defense in depth even if the tool dispatcher is bypassed. */
const MAX_DONORS_LIMIT = 100;

// ---------------------------------------------------------------------------
// CRM functions
// ---------------------------------------------------------------------------

/**
 * List donors for an org with optional filtering and sorting.
 */
export async function listDonors({
  serviceClient,
  orgId,
  limit = 25,
  search,
  tags,
  sortBy = "lifetime_giving_cents",
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  orgId: string;
  limit?: number;
  search?: string;
  tags?: string[];
  sortBy?: "lifetime_giving_cents" | "last_gift_at" | "name" | "created_at";
}): Promise<{ donors: Donor[] }> {
  const safeLimit = Math.max(1, Math.min(limit, MAX_DONORS_LIMIT));
  const ascending = sortBy === "name";
  let query = serviceClient
    .from("donors")
    .select("*")
    .eq("org_id", orgId)
    .order(sortBy, { ascending })
    .limit(safeLimit);

  if (search) {
    // ilike search on name and email
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (tags?.length) {
    // Filter donors who have ALL of the specified tags (array containment)
    query = query.contains("tags", tags);
  }

  const { data, error } = await query;

  if (error) {
    throw new CrmError("listDonors", error);
  }

  return { donors: (data as Donor[]) ?? [] };
}

/**
 * Get a single donor with their recent donations and interactions.
 * Runs 3 queries in parallel — they're independent.
 */
export async function getDonor({
  serviceClient,
  orgId,
  donorId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  orgId: string;
  donorId: string;
}): Promise<{ donor: Donor; recentDonations: Donation[]; recentInteractions: Interaction[] }> {
  const [donorResult, donationsResult, interactionsResult] = await Promise.all([
    serviceClient
      .from("donors")
      .select("*")
      .eq("id", donorId)
      .eq("org_id", orgId)
      .single(),
    serviceClient
      .from("donations")
      .select("*")
      .eq("donor_id", donorId)
      .eq("org_id", orgId)
      .order("given_at", { ascending: false })
      .limit(10),
    serviceClient
      .from("donor_interactions")
      .select("*")
      .eq("donor_id", donorId)
      .eq("org_id", orgId)
      .order("occurred_at", { ascending: false })
      .limit(10),
  ]);

  if (donorResult.error) {
    throw new CrmError("getDonor", donorResult.error);
  }

  return {
    donor: donorResult.data as Donor,
    recentDonations: (donationsResult.data as Donation[]) ?? [],
    recentInteractions: (interactionsResult.data as Interaction[]) ?? [],
  };
}

/**
 * Create a new donor. Returns the inserted row.
 */
export async function createDonor({
  serviceClient,
  orgId,
  memberId,
  name,
  donorType,
  email,
  phone,
  address,
  notes,
  tags,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  orgId: string;
  memberId: string | null;
  name: string;
  donorType: Donor["donor_type"];
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}): Promise<{ donor: Donor }> {
  const { data, error } = await serviceClient
    .from("donors")
    .insert({
      org_id: orgId,
      name,
      donor_type: donorType,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      notes: notes ?? null,
      tags: tags ?? [],
      created_by: memberId,
    })
    .select("*")
    .single();

  if (error) {
    throw new CrmError("createDonor", error);
  }

  return { donor: data as Donor };
}

/**
 * Log a donation. The trigger handles updating donor aggregate fields —
 * do NOT manually update lifetime_giving_cents here.
 */
export async function logDonation({
  serviceClient,
  orgId,
  memberId,
  donorId,
  amountCents,
  givenAt,
  campaign,
  designation,
  paymentMethod,
  notes,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  orgId: string;
  memberId: string | null;
  donorId: string;
  amountCents: number;
  givenAt: string;
  campaign?: string;
  designation?: string;
  paymentMethod?: string;
  notes?: string;
}): Promise<{ donation: Donation }> {
  const { data, error } = await serviceClient
    .from("donations")
    .insert({
      org_id: orgId,
      donor_id: donorId,
      amount_cents: amountCents,
      given_at: givenAt,
      campaign: campaign ?? null,
      designation: designation ?? null,
      payment_method: paymentMethod ?? null,
      notes: notes ?? null,
      created_by: memberId,
    })
    .select("*")
    .single();

  if (error) {
    throw new CrmError("logDonation", error);
  }

  return { donation: data as Donation };
}

/**
 * Log a touchpoint interaction with a donor.
 */
export async function logInteraction({
  serviceClient,
  orgId,
  memberId,
  donorId,
  interactionType,
  occurredAt,
  summary,
  followUpNeeded = false,
  followUpAt,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  orgId: string;
  memberId: string | null;
  donorId: string;
  interactionType: Interaction["interaction_type"];
  occurredAt: string;
  summary: string;
  followUpNeeded?: boolean;
  followUpAt?: string;
}): Promise<{ interaction: Interaction }> {
  const { data, error } = await serviceClient
    .from("donor_interactions")
    .insert({
      org_id: orgId,
      donor_id: donorId,
      interaction_type: interactionType,
      occurred_at: occurredAt,
      summary,
      follow_up_needed: followUpNeeded,
      follow_up_at: followUpAt ?? null,
      created_by: memberId,
    })
    .select("*")
    .single();

  if (error) {
    throw new CrmError("logInteraction", error);
  }

  return { interaction: data as Interaction };
}
