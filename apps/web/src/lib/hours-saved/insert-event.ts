/**
 * Fire-and-forget helper for inserting activity_events rows.
 * Uses the service-role client; does NOT block the caller.
 *
 * Usage:
 *   void insertActivityEvent(serviceClient, { orgId, eventKey, archetypeSlug });
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface InsertActivityEventParams {
  orgId: string;
  eventKey: string;
  archetypeSlug?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertActivityEvent(
  serviceClient: SupabaseClient<any>,
  params: InsertActivityEventParams,
): Promise<void> {
  const { orgId, eventKey, archetypeSlug, userId, metadata } = params;
  const { error } = await serviceClient.from("activity_events").insert({
    org_id: orgId,
    user_id: userId ?? null,
    event_key: eventKey,
    archetype_slug: archetypeSlug ?? null,
    metadata: metadata ?? {},
  });
  if (error) {
    console.error("[insertActivityEvent] insert failed", { eventKey, error });
  }
}
