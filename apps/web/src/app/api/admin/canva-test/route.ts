/**
 * TEMPORARY DIAGNOSTIC ENDPOINT — added in PR #24 (lopmon/canva-diagnostic-2026-04-26)
 *
 * GET /api/admin/canva-test
 *
 * Runs canva_generate_design once with a hardcoded simple input and returns the
 * raw executor result as JSON. This bypasses Kida entirely — no model invocation,
 * just a direct server-side call to the Canva API via the existing tool wrapper.
 *
 * Purpose: surface the actual Canva API error on prod without Vercel function-log
 * access. Citlali visits this URL while logged in and sees exactly what Canva returns.
 *
 * REMOVAL: Delete this file once Canva is reliably working. It is a one-off debug
 * tool, not a permanent feature. No routes or UI depend on it.
 *
 * Auth: session-cookie protected via getAuthContext(). Any authenticated user in
 * a valid org can hit it — no additional admin-role gating needed since only
 * Citlali and test orgs will be hitting this in practice.
 */

import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { getValidCanvaAccessToken } from "@/lib/mcp/canva-oauth";
import { executeCanvaGenerateTool } from "@/lib/tools/canva-generate-design";

export async function GET() {
  // --- Auth gate ---
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }

  try {
    // --- Stage 1: Resolve the org's Canva token ---
    const tokenResult = await getValidCanvaAccessToken(serviceClient, orgId);

    if ("notConnected" in tokenResult) {
      return NextResponse.json({ stage: "token", connected: false });
    }

    if ("error" in tokenResult) {
      return NextResponse.json({ stage: "token", error: tokenResult.error });
    }

    // Token is valid — proceed to the actual API call.

    // --- Stage 2: Run canva_generate_design with a hardcoded simple input ---
    const result = await executeCanvaGenerateTool({
      name: "canva_generate_design",
      input: {
        design_type: "instagram_post",
        title: "Diagnostic test from Edify",
        brand_color: "#9F4EF3",
      },
      orgId,
      serviceClient,
    });

    // --- Stage 3: Return the full executor result verbatim ---
    // result.content is either a JSON string (success) or an error message.
    // Parse the content if it looks like JSON so it's readable in the browser,
    // but fall back to the raw string if parsing fails.
    let parsedContent: unknown = result.content;
    try {
      parsedContent = JSON.parse(result.content);
    } catch {
      // Not JSON — keep as string. Error messages are often plain text.
    }

    return NextResponse.json({
      stage: "execute",
      is_error: result.is_error ?? false,
      content: parsedContent,
      content_raw: result.content,
    });
  } catch (err) {
    // Unhandled throw — still return 200 so the body is visible (not swallowed as HTTP error).
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({ stage: "unhandled", error: message, stack });
  }
}
