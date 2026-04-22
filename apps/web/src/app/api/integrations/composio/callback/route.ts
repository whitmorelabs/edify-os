import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { completeConnection, TOOLKIT_SLUG, type SocialPlatform } from "@/lib/composio";
import { getAppOrigin } from "@/lib/google";

const STATE_COOKIE = "composio_oauth_state";

/**
 * GET /api/integrations/composio/callback
 *
 * Composio redirects here after the user completes OAuth on the platform's
 * side. We read our cookie-stashed connectionId + orgId + platform, poll
 * Composio briefly to confirm the account is connected, and upsert a row
 * into composio_connections.
 *
 * Query params Composio adds on redirect (connectionId, status, etc.) are
 * informational — we trust the cookie-stashed connectionId as the source of
 * truth so a malicious redirect can't bind a different user's connection.
 */
export async function GET() {
  const origin = getAppOrigin();
  const cookieStore = await cookies();

  // Helper: clear cookie and redirect to Settings → Integrations with status.
  async function finish(flash: string, reason?: string): Promise<NextResponse> {
    cookieStore.delete(STATE_COOKIE);
    const qs = new URLSearchParams({ composio: flash });
    if (reason) qs.set("reason", reason);
    return NextResponse.redirect(`${origin}/dashboard/integrations?${qs.toString()}`);
  }

  // --- Auth gate ---
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId || !memberId) {
    return finish("denied", "unauthorized");
  }

  // --- Cookie validation ---
  const raw = cookieStore.get(STATE_COOKIE)?.value;
  if (!raw) return finish("denied", "missing_state");

  let payload: {
    state: string;
    connectionId: string;
  };
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    payload = JSON.parse(decoded);
  } catch {
    return finish("denied", "corrupt_state");
  }

  let stateOrg: { orgId: string; platform: SocialPlatform; memberId: string };
  try {
    stateOrg = JSON.parse(payload.state);
  } catch {
    return finish("denied", "corrupt_state");
  }

  // Pin the connection to the authenticated user's org — if the state cookie
  // was replayed under a different session, bail.
  if (stateOrg.orgId !== orgId) {
    return finish("denied", "org_mismatch");
  }

  const { platform, memberId: stateMemberId } = stateOrg;
  if (!(platform in TOOLKIT_SLUG)) {
    return finish("denied", "invalid_toolkit");
  }

  // --- Poll Composio until the connection is confirmed ---
  let confirmed: Awaited<ReturnType<typeof completeConnection>>;
  try {
    confirmed = await completeConnection(payload.connectionId, 10_000);
  } catch (err) {
    console.error("[composio/callback] completion failed:", err);
    const reason = err instanceof Error ? err.message.slice(0, 80) : "unknown";
    return finish("denied", reason);
  }

  // Accept any non-empty status Composio returns as "active" — Composio
  // normalizes to "ACTIVE" / "INITIATED" / "FAILED"; we flatten here.
  const statusLower = (confirmed.status ?? "").toLowerCase();
  if (statusLower && statusLower !== "active" && statusLower !== "initiated") {
    return finish("denied", `status_${statusLower}`);
  }

  // --- Persist to DB ---
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return finish("denied", "db_unavailable");

  const toolkitSlug = TOOLKIT_SLUG[platform];
  const { error: upsertErr } = await serviceClient
    .from("composio_connections")
    .upsert(
      {
        org_id: orgId,
        toolkit: toolkitSlug,
        composio_connection_id: payload.connectionId,
        composio_user_id: orgId,
        connected_by: stateMemberId,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,toolkit" }
    );

  if (upsertErr) {
    console.error("[composio/callback] Failed to upsert connection:", upsertErr);
    return finish("denied", "db_error");
  }

  return finish("connected", platform);
}
