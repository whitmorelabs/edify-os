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
 *     upload?: boolean,              // If true, upload to Anthropic Files API and
 *                                    //   return { fileId, downloadUrl, name }.
 *                                    //   Otherwise stream the PNG bytes directly.
 *   }
 *
 * Auth: session cookie (same pattern as /api/files/[fileId]).
 * Render lives server-side in the Node runtime (satori-html + @vercel/og's
 * node build work on Vercel's standard Node functions).
 */
import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import {
  renderHtmlToPng,
  resolveRenderDimensions,
  sanitizePngFilename,
} from "@/lib/render/og";

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

  // If upload=true, push to Anthropic Files so the FileChip UI / /api/files
  // proxy can serve it — same pattern as skill-generated files.
  if (upload === true) {
    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId);
    if ("error" in anthropicResult) return anthropicResult.error;
    const { client: anthropic } = anthropicResult;

    try {
      const blob = new Blob([new Uint8Array(pngBuffer)], { type: "image/png" });
      const file = new File([blob], safeFilename, { type: "image/png" });
      const uploaded = await anthropic.beta.files.upload(
        { file },
        { headers: { "anthropic-beta": "files-api-2025-04-14" } } as Parameters<
          typeof anthropic.beta.files.upload
        >[1]
      );
      return NextResponse.json({
        fileId: uploaded.id,
        name: safeFilename,
        downloadUrl: `/api/files/${encodeURIComponent(uploaded.id)}`,
        width: finalWidth,
        height: finalHeight,
        bytes: pngBuffer.byteLength,
      });
    } catch (err) {
      console.error("[render/og] upload to Anthropic Files failed", err);
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
