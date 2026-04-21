/**
 * HTML-to-PNG rendering endpoint, backed by @vercel/og (satori + resvg).
 *
 * Marketing Director uses this after the Frontend Design skill produces an
 * HTML/JSX composition to turn it into a social-ready raster PNG (Instagram,
 * LinkedIn, Twitter/X). Claude can't generate raster images natively; this
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
import { renderHtmlToPng, SOCIAL_PRESETS, type SocialPreset } from "@/lib/render/og";

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

  const presetKey: SocialPreset | undefined =
    typeof preset === "string" && preset in SOCIAL_PRESETS ? (preset as SocialPreset) : undefined;
  const customWidth = typeof width === "number" ? Math.round(width) : undefined;
  const customHeight = typeof height === "number" ? Math.round(height) : undefined;

  let finalWidth: number;
  let finalHeight: number;
  if (customWidth && customHeight) {
    finalWidth = customWidth;
    finalHeight = customHeight;
  } else if (presetKey) {
    ({ width: finalWidth, height: finalHeight } = SOCIAL_PRESETS[presetKey]);
  } else {
    ({ width: finalWidth, height: finalHeight } = SOCIAL_PRESETS.og);
  }

  // Clamp to sane bounds — satori can OOM on 4K+ renders in a Node lambda.
  if (finalWidth < 64 || finalHeight < 64 || finalWidth > 2400 || finalHeight > 2400) {
    return NextResponse.json(
      { error: "width/height must be between 64 and 2400 px" },
      { status: 400 }
    );
  }

  const safeFilename =
    typeof filename === "string" && filename.trim()
      ? sanitizeFilename(filename)
      : `design-${Date.now()}.png`;

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

function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/[\\/:*?"<>|]/g, "_");
  if (!trimmed) return `design-${Date.now()}.png`;
  return trimmed.toLowerCase().endsWith(".png") ? trimmed : `${trimmed}.png`;
}
