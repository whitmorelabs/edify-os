/**
 * Cron-run idempotency guard.
 *
 * Wraps the `claim_cron_run` SQL helper added in migration 00033 so cron
 * route handlers can short-circuit duplicate same-day runs without
 * burning LLM tokens.
 *
 * Background: a frozen legacy Vercel project (whitmorelabs/edify-os) shares
 * the active project's Supabase backend, so each scheduled cron in
 * apps/web/vercel.json fires twice. The first call wins; the duplicate
 * receives `false` from `claimCronRun` and bails before doing any work.
 *
 * The same guard also de-duplicates accidental manual re-triggers on top
 * of a cron run on the same UTC day.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Stable identifiers for the cron-style endpoints we dedup.
 *
 * For heartbeats we suffix the archetype slug (e.g.
 * `heartbeat_trigger:fundraising_director`) so legitimate per-archetype
 * runs on the same day are not blocked by each other — only true
 * duplicates of the same (archetype, org, day) tuple are skipped.
 */
export type CronKind = `heartbeat_trigger:${string}` | "briefing_generate";

/**
 * Attempt to claim today's cron run for (kind, orgId).
 *
 * Returns true if the caller should proceed with the work.
 * Returns false if another caller already claimed it today (skip the work).
 *
 * On any unexpected RPC error we log and return true — failing open
 * preserves the prior behavior (run the job) instead of silently dropping
 * a real cron fire because of a transient DB hiccup.
 */
export async function claimCronRun(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>,
  kind: CronKind,
  orgId: string
): Promise<boolean> {
  const { data, error } = await serviceClient.rpc("claim_cron_run", {
    p_kind: kind,
    p_org_id: orgId,
  });

  if (error) {
    console.error("[cron-idempotency] claim_cron_run RPC failed:", error);
    // Fail open: better to run twice than silently drop a real cron fire.
    return true;
  }

  return data === true;
}
