/**
 * Server-side proxy for Anthropic Files API downloads.
 *
 * Skill-generated files are stored at Anthropic's infrastructure and require
 * the org's API key to download. This route fetches the file server-side
 * (using the org's key stored in Supabase) and streams it back to the browser.
 *
 * URL: GET /api/files/:fileId?orgId=<uuid>
 *
 * The orgId query param is used to look up the org's API key.
 * (We can't use auth cookies reliably in a GET/download context from
 * a download chip, so we pass orgId explicitly.)
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { getAnthropicClientForOrg } from "@/lib/anthropic";

export async function GET(
  _request: Request,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;

  if (!fileId?.trim()) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  // Authenticate the request via session cookie
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Get the org's Anthropic client
  const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId);
  if ("error" in anthropicResult) return anthropicResult.error;
  const { client: anthropic } = anthropicResult;

  try {
    // Retrieve file metadata (to get filename + MIME type)
    let filename = fileId;
    let contentType = "application/octet-stream";

    try {
      const metadata = await (anthropic as Anthropic).beta.files.retrieveMetadata(fileId, {
        headers: { "anthropic-beta": "files-api-2025-04-14" },
      } as Parameters<typeof anthropic.beta.files.retrieveMetadata>[1]);
      if (metadata.filename) {
        filename = metadata.filename;
        // Infer content type from extension
        const ext = filename.split(".").pop()?.toLowerCase();
        const MIME: Record<string, string> = {
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          pdf: "application/pdf",
        };
        if (ext && MIME[ext]) contentType = MIME[ext];
      }
    } catch {
      // Non-fatal — fall back to generic filename / octet-stream
    }

    // Download the file content
    const response = await (anthropic as Anthropic).beta.files.download(fileId, {
      headers: { "anthropic-beta": "files-api-2025-04-14" },
    } as Parameters<typeof anthropic.beta.files.download>[1]);

    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        // Prevent caching of potentially sensitive documents
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[files/proxy] Download failed", { fileId, error: err });
    const msg = err instanceof Error ? err.message : "File download failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
