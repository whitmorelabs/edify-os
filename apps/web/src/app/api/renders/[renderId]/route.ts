/**
 * Server-side proxy for rendered design PNGs (render_design_to_image output).
 *
 * Renders live in Supabase Storage at `<orgId>/<renderId>.png`. We can't
 * keep them in Anthropic's Files API: per the public Files API docs, files
 * uploaded with an API key are flagged downloadable=false (only skill /
 * code-execution outputs are downloadable), which 400'd the original
 * /api/files/[fileId] proxy with "is not downloadable".
 *
 * Auth: session cookie. Tenant isolation enforced by reading from the
 * authenticated org's path inside the bucket — a user can never request
 * a render owned by a different org because we always look under their
 * own orgId prefix.
 *
 * URL: GET /api/renders/:renderId
 */

import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { RENDERED_FILES_BUCKET } from "@/lib/tools/render";

// Same lightweight UUID shape check the rest of the app uses for path params.
const RENDER_ID_RE = /^[0-9a-f-]{8,64}$/i;

export async function GET(
  _request: Request,
  { params }: { params: { renderId: string } }
) {
  const { renderId } = params;

  if (!renderId?.trim() || !RENDER_ID_RE.test(renderId)) {
    return NextResponse.json({ error: "Invalid renderId" }, { status: 400 });
  }

  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Path scheme set by render.ts upload: <orgId>/<renderId>.png. Looking up
  // strictly under the authenticated org_id makes cross-tenant access
  // structurally impossible.
  const objectPath = `${orgId}/${renderId}.png`;

  try {
    const { data: blob, error } = await serviceClient.storage
      .from(RENDERED_FILES_BUCKET)
      .download(objectPath);

    if (error || !blob) {
      const status = (error as { statusCode?: string } | undefined)?.statusCode;
      const httpStatus = status === "404" || status === "400" ? 404 : 502;
      console.error("[renders-proxy] download failed", {
        renderId,
        orgId,
        statusCode: status,
        message: error?.message,
      });
      return NextResponse.json(
        { error: error?.message ?? "Render not found" },
        { status: httpStatus }
      );
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        // inline so the FileChip's <img> preview can render it; the chip's
        // "Download" link sets its own filename via the download="" attr.
        "Content-Disposition": `inline; filename="${renderId}.png"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const e = err as { message?: unknown; name?: unknown; stack?: unknown };
    console.error("[renders-proxy] unexpected error", {
      renderId,
      orgId,
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
    });
    const msg = err instanceof Error ? err.message : "Render download failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
