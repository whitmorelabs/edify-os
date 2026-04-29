/**
 * Anthropic tool definition and executor for Canva design generation.
 * One tool: canva_generate_design. Marketing Director only.
 *
 * How it works:
 *   1. Kida calls this tool with design type + brand/text info.
 *   2. Tool resolves the org's Canva OAuth token via Agent 2's helper.
 *   3. Calls Canva Connect REST API POST /v1/designs to create a blank design
 *      of the requested type, seeded with the provided title/CTA text.
 *   4. Returns the design_id + Canva editor URL + thumbnail (if available).
 *      The user can then open the editor URL to see their design, or Kida
 *      can follow up with canva_export_design to produce a raster PNG.
 *
 * Why POST /v1/designs (not autofill):
 *   Autofill requires a brand_template_id from the user's Canva account.
 *   Most Edify nonprofits won't have brand templates yet, so we create a
 *   blank design with a preset dimension. Users can then open it in Canva
 *   to layer their content. This is the pragmatic path until orgs build up
 *   a Canva template library.
 *
 * No Canva connection → graceful error message with settings link.
 * Token expired → auto-refreshed via Agent 2's getValidCanvaAccessToken helper.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CANVA_API_BASE,
  CanvaApiError,
  handleCanvaResponse,
  getValidCanvaAccessToken,
} from "@/lib/mcp/canva-oauth";

export { CanvaApiError };

// ---------------------------------------------------------------------------
// Design type → Canva API design_type spec
// ---------------------------------------------------------------------------

/**
 * Discriminated union matching Canva Connect API's design_type field.
 *
 * Canva only accepts 4 preset names: doc, email, presentation, whiteboard.
 * All social / custom formats must use { type: "custom", width, height }.
 */
type CanvaDesignTypeSpec =
  | { type: "preset"; name: "doc" | "email" | "presentation" | "whiteboard" }
  | { type: "custom"; width: number; height: number };

/**
 * Maps user-facing design_type slugs to the correct Canva API design_type spec.
 * Social formats use standard platform pixel dimensions (custom type).
 * Document/presentation types use Canva's named presets.
 */
const DESIGN_TYPE_SPEC: Record<string, CanvaDesignTypeSpec> = {
  // Social — preset names not supported; use custom pixel dimensions
  instagram_post:    { type: "custom", width: 1080, height: 1080 },
  instagram_story:   { type: "custom", width: 1080, height: 1920 },
  linkedin_post:     { type: "custom", width: 1200, height: 627 },
  facebook_post:     { type: "custom", width: 1200, height: 630 },
  facebook_cover:    { type: "custom", width: 820,  height: 312 },
  story:             { type: "custom", width: 1080, height: 1920 },
  youtube_thumbnail: { type: "custom", width: 1280, height: 720 },

  // Documents — Canva preset names are supported
  presentation: { type: "preset", name: "presentation" },
  document:     { type: "preset", name: "doc" },
  flyer:        { type: "custom", width: 2550, height: 3300 },
};

// ---------------------------------------------------------------------------
// System-prompt addendum
// ---------------------------------------------------------------------------

export const CANVA_GENERATE_TOOLS_ADDENDUM = `
## Canva design generation

You have access to \`canva_generate_design\` to create real Canva graphics. Use it when the user asks for a social media graphic, flyer, banner, or any branded visual. The tool returns a Canva editor URL + thumbnail preview. After creating a design, call \`canva_export_design\` to produce a downloadable PNG.

Guidelines:
- Ask for brand colors (as hex codes) and key text (title, CTA) before calling the tool.
- Pick the design_type that matches the target platform (instagram_post, linkedin_post, etc.).
- If the user has no Canva connected, the tool will return a friendly message — relay it.
- After generating: present the editor URL so they can customize in Canva, then offer to export.`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const canvaGenerateTools: Anthropic.Tool[] = [
  {
    name: "canva_generate_design",
    description:
      "Create a new Canva design for a social media post, story, flyer, or other graphic. Returns a Canva editor URL + design ID. After creating, use canva_export_design to produce a downloadable PNG. Requires Canva to be connected in Settings → Integrations. If not connected, returns a clear error message you should relay to the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        design_type: {
          type: "string",
          enum: [
            "instagram_post",
            "instagram_story",
            "linkedin_post",
            "facebook_post",
            "facebook_cover",
            "story",
            "youtube_thumbnail",
            "presentation",
            "flyer",
            "document",
          ],
          description:
            "The type of design to create. Maps to Canva's design_type API field — social formats (instagram_post, linkedin_post, etc.) are created at standard pixel dimensions for that platform; document/presentation use Canva's named templates.",
        },
        title: {
          type: "string",
          description:
            "Headline text for the design (e.g., event name, campaign headline). Used as the Canva file title.",
        },
        body_text: {
          type: "string",
          description:
            "Optional body copy or CTA text to describe the design's content. Helps you (and the user) know what copy to add once in the Canva editor.",
        },
        brand_color: {
          type: "string",
          description:
            "Primary brand color as a hex code (e.g., '#9F4EF3'). Used to describe the visual brief. The user applies colors in the Canva editor.",
        },
        brand_font: {
          type: "string",
          description: "Optional brand font name (e.g., 'Montserrat', 'Lato'). Informational — applied by the user in the editor.",
        },
      },
      required: ["design_type", "title"],
    },
  },
];

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export async function executeCanvaGenerateTool({
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
  if (name !== "canva_generate_design") {
    return { content: `Unknown canva generate tool: ${name}`, is_error: true };
  }

  // --- Input validation ---
  const designType = input.design_type as string | undefined;
  const title = input.title as string | undefined;
  const bodyText = input.body_text as string | undefined;
  const brandColor = input.brand_color as string | undefined;
  const brandFont = input.brand_font as string | undefined;

  if (!designType) {
    return { content: "design_type is required.", is_error: true };
  }
  if (!title?.trim()) {
    return { content: "title is required.", is_error: true };
  }

  // --- Resolve Canva token ---
  const tokenResult = await getValidCanvaAccessToken(serviceClient, orgId);

  if ("notConnected" in tokenResult) {
    return {
      content: JSON.stringify({
        error: "canva_not_connected",
        message:
          "Canva is not connected for this organization. Please visit Settings → Integrations and connect your Canva account before generating designs. Once connected, try this request again.",
        settings_url: "/dashboard/integrations",
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

  // --- Resolve design type spec ---
  // Canva Connect API uses a discriminated union for design_type:
  //   { type: "preset", name: "doc"|"email"|"presentation"|"whiteboard" }
  //   { type: "custom", width: <px>, height: <px> }
  // Social formats (instagram_post, linkedin_post, etc.) must use "custom" —
  // they are NOT valid preset names and Canva returns 400 if you try.
  const designTypeSpec = DESIGN_TYPE_SPEC[designType];
  if (!designTypeSpec) {
    return {
      content: `Unknown design_type: ${designType}. Supported: ${Object.keys(DESIGN_TYPE_SPEC).join(", ")}.`,
      is_error: true,
    };
  }

  // --- Call Canva Connect: POST /v1/designs ---
  const requestBody: Record<string, unknown> = {
    design_type: designTypeSpec,
    title: title.trim(),
  };

  let designData: {
    design: {
      id: string;
      title?: string;
      thumbnail?: { url?: string };
      urls?: { edit?: string; view_url?: string };
    };
  };

  try {
    const response = await fetch(`${CANVA_API_BASE}/designs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    designData = await handleCanvaResponse<typeof designData>(response);
  } catch (err) {
    if (err instanceof CanvaApiError) {
      console.error("[canva-generate] Canva API error:", {
        status: err.status,
        message: err.message,
        body: err.rawBody,
      });
      const detail = err.rawBody ? ` — Canva said: ${err.rawBody}` : "";
      return {
        content: `Canva API error (${err.status}): ${err.message}${detail}`,
        is_error: true,
      };
    }
    console.error("[canva-generate] Unexpected error:", err);
    return {
      content: "Unexpected error calling Canva API. Please try again.",
      is_error: true,
    };
  }

  const design = designData.design;
  if (!design?.id) {
    return {
      content: "Canva API returned an unexpected response (no design ID).",
      is_error: true,
    };
  }

  // Build a structured result for Kida to present to the user.
  const result = {
    ok: true,
    design_id: design.id,
    title: design.title ?? title,
    design_type: designType,
    edit_url: design.urls?.edit ?? `https://www.canva.com/design/${design.id}/edit`,
    view_url: design.urls?.view_url,
    thumbnail_url: design.thumbnail?.url,
    // Visual brief summary — Kida uses this to tell the user what to do in the editor.
    brief: {
      headline: title.trim(),
      body: bodyText ?? null,
      brand_color: brandColor ?? null,
      font: brandFont ?? null,
    },
    message:
      `Canva design created. Open the editor to apply the headline, brand color${brandColor ? ` (${brandColor})` : ""}, and any images. ` +
      `Then call canva_export_design with design_id "${design.id}" to export a PNG for download.`,
  };

  return { content: JSON.stringify(result) };
}
