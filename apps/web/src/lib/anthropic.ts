import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Shared prefix constant — used in both onboarding form and API route for format checks. */
export const ANTHROPIC_KEY_PREFIX = "sk-ant-";

/**
 * Fetch the org's Anthropic client for BYOK routes.
 * Returns either { client, orgName, org } or { error: NextResponse } — the caller
 * should check for 'error' in the result and return it immediately.
 *
 * Usage:
 *   const result = await getAnthropicClientForOrg(serviceClient, orgId);
 *   if ('error' in result) return result.error;
 *   const { client, orgName } = result;
 */
export async function getAnthropicClientForOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>,
  orgId: string,
  extraFields: string[] = []
): Promise<
  | { client: Anthropic; orgName: string; org: Record<string, unknown> }
  | { error: NextResponse }
> {
  const selectFields = ["name", "anthropic_api_key_encrypted", ...extraFields].join(", ");
  const { data, error: dbError } = await serviceClient
    .from("orgs")
    .select(selectFields)
    .eq("id", orgId)
    .single();

  if (dbError || !data) {
    return {
      error: NextResponse.json({ error: "Org not found" }, { status: 404 }),
    };
  }

  // Cast through unknown to avoid Supabase generic type narrowing issues
  const org = data as unknown as Record<string, unknown>;

  if (!org["anthropic_api_key_encrypted"]) {
    return {
      error: NextResponse.json(
        { error: "No Claude API key configured for this org. Add your Anthropic API key in Settings." },
        { status: 402 }
      ),
    };
  }

  const client = new Anthropic({ apiKey: org["anthropic_api_key_encrypted"] as string });
  const orgName = (org["name"] as string) || "your organization";

  return { client, orgName, org };
}
