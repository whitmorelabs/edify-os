/**
 * Anthropic tool definition and executor for Canva design export.
 * One tool: canva_export_design. Marketing Director only.
 *
 * How it works:
 *   1. Kida calls this after canva_generate_design with the returned design_id.
 *   2. Tool resolves the org's Canva OAuth token.
 *   3. Calls POST /v1/exports to start an async export job.
 *   4. Polls GET /v1/exports/{jobId} until status is "success" or "failed".
 *   5. Returns the first page's export URL (valid 24 hours per Canva's docs).
 *
 * The export URL is a time-limited direct link to the PNG.
 * Kida presents it to the user as an inline image / download link.
 * The existing FileChip UI does NOT pick this up (no Anthropic Files API upload here)
 * — the user gets a direct Canva CDN link to open or right-click-save.
 *
 * Polling strategy:
 *   Up to 10 attempts, 1.5s apart = 15s max. Canva exports typically complete
 *   in 2-5s. If still in_progress after 10 attempts, return a partial result
 *   so Kida can tell the user to try again or open directly in Canva.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CANVA_API_BASE,
  CanvaApiError,
  handleCanvaResponse,
  getValidCanvaAccessToken,
} from "@/lib/mcp/canva-oauth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 10;

// ---------------------------------------------------------------------------
// System-prompt addendum (merged into CANVA_GENERATE_TOOLS_ADDENDUM in practice;
// exported here in case registry wants it separately)
// ---------------------------------------------------------------------------

export const CANVA_EXPORT_TOOLS_ADDENDUM = `\nAfter creating a Canva design with \`canva_generate_design\`, call \`canva_export_design\` to produce a downloadable PNG. Pass the design_id from the generate step. The exported image URL is valid for 24 hours — tell the user to download it before it expires.`;

// ---------------------------------------------------------------------------
// Export job response shapes
// ---------------------------------------------------------------------------

type ExportJobStatus = "in_progress" | "success" | "failed";

interface ExportJobResult {
  job: {
    id: string;
    status: ExportJobStatus;
    urls?: Array<{ page_number?: number; url: string }>;
    failure_reason?: string;
  };
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const canvaExportTools: Anthropic.Tool[] = [
  {
    name: "canva_export_design",
    description:
      "Export a Canva design to a downloadable PNG (or PDF). Call this after canva_generate_design to produce the actual raster image. Pass the design_id returned by canva_generate_design. The tool polls until the export is ready (typically 2-5 seconds) and returns a direct download URL valid for 24 hours.",
    input_schema: {
      type: "object" as const,
      properties: {
        design_id: {
          type: "string",
          description:
            "The Canva design ID from a prior canva_generate_design call (e.g., 'DABc123XYZ').",
        },
        format: {
          type: "string",
          enum: ["png", "pdf", "jpg"],
          description:
            "Export format. Defaults to 'png' for social media graphics. Use 'pdf' for print/document exports.",
        },
      },
      required: ["design_id"],
    },
  },
];

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export async function executeCanvaExportTool({
  name,
  input,
  orgId,
  serviceClient,
}: {
  name: string;
  input: Record<string, unknown>;
  orgId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
}): Promise<{ content: string; is_error?: boolean }> {
  if (name !== "canva_export_design") {
    return { content: `Unknown canva export tool: ${name}`, is_error: true };
  }

  const designId = input.design_id as string | undefined;
  const format = (input.format as string | undefined) ?? "png";

  if (!designId?.trim()) {
    return { content: "design_id is required.", is_error: true };
  }

  const validFormats = ["png", "pdf", "jpg"];
  if (!validFormats.includes(format)) {
    return { content: `format must be one of: ${validFormats.join(", ")}`, is_error: true };
  }

  // --- Resolve Canva token ---
  const tokenResult = await getValidCanvaAccessToken(serviceClient, orgId);

  if ("notConnected" in tokenResult) {
    return {
      content: JSON.stringify({
        error: "canva_not_connected",
        message:
          "Canva is not connected. Please visit Settings → Integrations to connect your Canva account.",
        settings_url: "/dashboard/settings/integrations",
      }),
      is_error: true,
    };
  }

  if ("error" in tokenResult) {
    return {
      content: `Canva connection error: ${tokenResult.error}`,
      is_error: true,
    };
  }

  const { accessToken } = tokenResult;
  const authHeader = `Bearer ${accessToken}`;

  // --- Step 1: Create export job ---
  let jobId: string;
  try {
    const createRes = await fetch(`${CANVA_API_BASE}/exports`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        design_id: designId.trim(),
        file_type: format,
      }),
    });

    const createData = await handleCanvaResponse<ExportJobResult>(createRes);
    jobId = createData.job.id;
    if (!jobId) {
      return { content: "Canva export API returned no job ID.", is_error: true };
    }

    // Fast-path: if already successful on the first call (rare but possible)
    if (createData.job.status === "success" && createData.job.urls?.length) {
      return buildSuccessResult(designId, format, createData.job.urls);
    }

    if (createData.job.status === "failed") {
      return {
        content: `Canva export failed immediately: ${createData.job.failure_reason ?? "unknown reason"}`,
        is_error: true,
      };
    }
  } catch (err) {
    if (err instanceof CanvaApiError) {
      return {
        content: `Canva export error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error("[canva-export] Create job threw:", err);
    return { content: "Unexpected error starting Canva export job.", is_error: true };
  }

  // --- Step 2: Poll for completion ---
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    let pollData: ExportJobResult;
    try {
      const pollRes = await fetch(`${CANVA_API_BASE}/exports/${encodeURIComponent(jobId)}`, {
        headers: { Authorization: authHeader },
      });
      pollData = await handleCanvaResponse<ExportJobResult>(pollRes);
    } catch (err) {
      if (err instanceof CanvaApiError) {
        return {
          content: `Canva export poll error (${err.status}): ${err.message}`,
          is_error: true,
        };
      }
      console.error("[canva-export] Poll threw:", err);
      return { content: "Unexpected error polling Canva export status.", is_error: true };
    }

    const job = pollData.job;

    if (job.status === "success") {
      if (!job.urls?.length) {
        return { content: "Canva export succeeded but returned no URLs.", is_error: true };
      }
      return buildSuccessResult(designId, format, job.urls);
    }

    if (job.status === "failed") {
      return {
        content: `Canva export job failed: ${job.failure_reason ?? "unknown reason"}`,
        is_error: true,
      };
    }

    // still in_progress — continue polling
  }

  // Timeout after POLL_MAX_ATTEMPTS
  return {
    content: JSON.stringify({
      ok: false,
      design_id: designId,
      job_id: jobId,
      message:
        `Export is still processing after ${POLL_MAX_ATTEMPTS} attempts. ` +
        `The export typically completes within 15 seconds. You can ask the user to open their Canva design directly at: https://www.canva.com/design/${encodeURIComponent(designId)}/edit`,
    }),
    is_error: true,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSuccessResult(
  designId: string,
  format: string,
  urls: Array<{ page_number?: number; url: string }>
): { content: string } {
  // Return first page URL (index 0). Multi-page exports get all URLs.
  const firstUrl = urls[0].url;
  return {
    content: JSON.stringify({
      ok: true,
      design_id: designId,
      format,
      export_url: firstUrl,
      all_page_urls: urls.map((u) => ({ page: u.page_number ?? 1, url: u.url })),
      message:
        `Export ready. Here is the download URL (valid for 24 hours): ${firstUrl} — ` +
        `Tell the user to right-click → Save As, or open the link to download their ${format.toUpperCase()}.`,
    }),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
