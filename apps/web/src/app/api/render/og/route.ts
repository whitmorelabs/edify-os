/**
 * HTML-to-PNG rendering endpoint, backed by @vercel/og (satori + resvg).
 *
 * Marketing Director uses this after the Frontend Design skill produces an
 * HTML/JSX composition to turn it into a social-ready raster PNG (Instagram,
 * LinkedIn, etc.). Claude can't generate raster images natively; this
 * closes that gap without pulling in any image-gen API.
 *
 * URL: POST /api/render/og
 * Body:
 *   {
 *     html: string,                  // HTML string to render (required)
 *     preset?: SocialPreset,         // Common social dimensions (defaults to 'og')
 *     width?: number,                // Custom width in px (overrides preset)
 *     height?: number,               // Custom height in px (overrides preset)
 *     filename?: string,             // Filename for the resulting PNG (optional)
 *     upload?: boolean,              // If true, persist to Supabase Storage and
 *                                    //   return { renderId, downloadUrl, name }.
 *                                    //   Otherwise stream the PNG bytes directly.
 *   }
 *
 * Auth: session cookie (same pattern as /api/renders/[renderId]).
 * Render lives server-side in the Node runtime (satori-html + @vercel/og's
 * node build work on Vercel's standard Node functions).
 */
import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import {
  renderHtmlToPng,
  resolveRenderDimensions,
  sanitizePngFilename,
} from "@/lib/render/og";
import { persistRenderedPng } from "@/lib/tools/render";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { html, preset, width, height, filename, upload } = (body ?? {}) as {
    html?: unknown;
    preset?: unknown;
    width?: unknown;
    height?: unknown;
    filename?: unknown;
    upload?: unknown;
  };

  if (typeof html !== "string" || !html.trim()) {
    return NextResponse.json({ error: "html is required and must be a string" }, { status: 400 });
  }

  const dimensions = resolveRenderDimensions({ preset, width, height });
  if (!dimensions.ok) {
    return NextResponse.json({ error: dimensions.error }, { status: 400 });
  }
  const { width: finalWidth, height: finalHeight } = dimensions;

  const safeFilename = sanitizePngFilename(typeof filename === "string" ? filename : undefined);

  let pngBuffer: Buffer;
  try {
    pngBuffer = await renderHtmlToPng({
      html,
      width: finalWidth,
      height: finalHeight,
    });
  } catch (err) {
    console.error("[render/og] render failed", err);
    const msg = err instanceof Error ? err.message : "render failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (upload === true) {
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    try {
      const { renderId, downloadUrl } = await persistRenderedPng({
        serviceClient,
        orgId,
        pngBuffer,
        filename: safeFilename,
      });
      return NextResponse.json({
        renderId,
        name: safeFilename,
        downloadUrl,
        width: finalWidth,
        height: finalHeight,
        bytes: pngBuffer.byteLength,
      });
    } catch (err) {
      console.error("[render/og] Supabase Storage upload failed", err);
      const msg = err instanceof Error ? err.message : "upload failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // Direct PNG stream
  return new NextResponse(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${safeFilename}"`,
      "Content-Length": String(pngBuffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
