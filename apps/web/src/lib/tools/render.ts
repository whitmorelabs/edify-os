/**
 * Anthropic tool definitions and executor for HTML→PNG rendering.
 * One tool: render_design_to_image. Marketing Director only.
 *
 * Why this exists: the Frontend Design skill produces distinctive HTML/JSX
 * compositions, but nonprofits need social-ready raster images (Instagram,
 * LinkedIn, etc). Claude can't generate raster images natively. This tool
 * rasterizes the skill's HTML output into a PNG via @vercel/og (satori +
 * resvg) and uploads the PNG to Anthropic Files so the existing FileChip
 * UI and /api/files/[fileId] proxy can surface it for download.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { renderHtmlToPng, SOCIAL_PRESETS, type SocialPreset } from "@/lib/render/og";

// ---------------------------------------------------------------------------
// System-prompt addendum when render tool is active.
// ---------------------------------------------------------------------------

export const RENDER_TOOLS_ADDENDUM = `\nYou have access to an HTML-to-PNG rasterizer via render_design_to_image. Use it AFTER designing a composition with the Frontend Design guidance to produce a social-ready PNG (Instagram square, story, LinkedIn, Twitter, or custom dimensions). The input is an HTML string — inline styles and limited flex/grid layouts work best; complex CSS or external stylesheets do not. Tailwind is partially supported via the experimental \`tw\` attribute on elements. Keep the HTML self-contained (no <script>, no remote fonts unless explicitly needed). The tool returns a file ID and a download URL the user can click to save the image.`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const renderTools: Anthropic.Tool[] = [
  {
    name: "render_design_to_image",
    description:
      "Rasterize an HTML design composition into a social-ready PNG image. Use AFTER designing a visual composition (with the Frontend Design skill guidance, or on your own) to produce an actual downloadable raster image — for Instagram posts, LinkedIn banners, Twitter cards, event flyers, etc. The HTML should be self-contained: inline styles, flex/grid layouts, and the experimental Tailwind `tw` attribute are supported. No external stylesheets, scripts, or remote fonts. Pick a preset dimension that matches the target platform, or specify a custom width/height. Returns a fileId + downloadUrl the user can click to save the PNG.",
    input_schema: {
      type: "object" as const,
      properties: {
        html: {
          type: "string",
          description:
            "Self-contained HTML string describing the visual composition. Use inline styles or the `tw` attribute for Tailwind classes. The root element should fill the canvas (e.g. width: 100%; height: 100%). No <script>, <link>, or external CSS — everything must be inline.",
        },
        preset: {
          type: "string",
          enum: ["ig_square", "ig_story", "linkedin", "twitter", "og"],
          description:
            "Social dimension preset. ig_square = 1080x1080 (Instagram feed post). ig_story = 1080x1920 (Instagram / TikTok story). linkedin = 1200x628 (LinkedIn/Facebook link share). twitter = 1200x675 (Twitter/X summary large image). og = 1200x630 (generic Open Graph). Pick the one that matches where the user plans to post. If the user asks for custom dimensions, omit this and pass width/height instead.",
        },
        width: {
          type: "number",
          description:
            "Custom canvas width in pixels (64-2400). Use together with height to override the preset.",
        },
        height: {
          type: "number",
          description:
            "Custom canvas height in pixels (64-2400). Use together with width to override the preset.",
        },
        filename: {
          type: "string",
          description:
            "Optional filename for the generated PNG (e.g. 'spring-gala-ig-post.png'). Defaults to a timestamped name. The .png extension is appended if missing.",
        },
      },
      required: ["html"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export interface RenderToolGeneratedFile {
  name: string;
  mimeType: string;
  downloadUrl: string;
}

export interface ExecuteRenderToolResult {
  content: string;
  is_error?: boolean;
  /** When the render + upload succeed, this is populated so the outer turn
   *  loop can surface the PNG in the FileChip UI alongside skill-generated files. */
  generatedFile?: RenderToolGeneratedFile;
}

export async function executeRenderTool({
  name,
  input,
  anthropic,
}: {
  name: string;
  input: Record<string, unknown>;
  anthropic: Anthropic;
}): Promise<ExecuteRenderToolResult> {
  if (name !== "render_design_to_image") {
    return { content: `Unknown render tool: ${name}`, is_error: true };
  }

  const htmlInput = input.html;
  if (typeof htmlInput !== "string" || !htmlInput.trim()) {
    return { content: "html is required and must be a non-empty string.", is_error: true };
  }

  const presetKey: SocialPreset | undefined =
    typeof input.preset === "string" && (input.preset as string) in SOCIAL_PRESETS
      ? (input.preset as SocialPreset)
      : undefined;
  const customWidth = typeof input.width === "number" ? Math.round(input.width) : undefined;
  const customHeight = typeof input.height === "number" ? Math.round(input.height) : undefined;

  let width: number;
  let height: number;
  if (customWidth && customHeight) {
    width = customWidth;
    height = customHeight;
  } else if (presetKey) {
    ({ width, height } = SOCIAL_PRESETS[presetKey]);
  } else {
    ({ width, height } = SOCIAL_PRESETS.og);
  }

  if (width < 64 || height < 64 || width > 2400 || height > 2400) {
    return {
      content: "width/height must be between 64 and 2400 px (satori OOMs at larger sizes).",
      is_error: true,
    };
  }

  const filename = sanitizeFilename(
    typeof input.filename === "string" && input.filename.trim()
      ? input.filename
      : `design-${Date.now()}.png`
  );

  let pngBuffer: Buffer;
  try {
    pngBuffer = await renderHtmlToPng({ html: htmlInput, width, height });
  } catch (err) {
    console.error("[render-tool] render failed", err);
    const msg = err instanceof Error ? err.message : "render failed";
    return { content: `Render failed: ${msg}`, is_error: true };
  }

  // Upload PNG to Anthropic Files API so the existing /api/files/[fileId]
  // proxy can serve it — same storage pattern as skill-generated files.
  let fileId: string;
  try {
    const blob = new Blob([new Uint8Array(pngBuffer)], { type: "image/png" });
    const file = new File([blob], filename, { type: "image/png" });
    const uploaded = await anthropic.beta.files.upload(
      { file },
      { headers: { "anthropic-beta": "files-api-2025-04-14" } } as Parameters<
        typeof anthropic.beta.files.upload
      >[1]
    );
    fileId = uploaded.id;
  } catch (err) {
    console.error("[render-tool] Anthropic Files upload failed", err);
    const msg = err instanceof Error ? err.message : "upload failed";
    return { content: `PNG generated but upload failed: ${msg}`, is_error: true };
  }

  const downloadUrl = `/api/files/${encodeURIComponent(fileId)}`;
  const summary = {
    fileId,
    name: filename,
    downloadUrl,
    width,
    height,
    bytes: pngBuffer.byteLength,
  };

  return {
    content: JSON.stringify({
      ok: true,
      ...summary,
      message:
        "PNG rendered and attached. The user will see a downloadable file chip below your reply — no need to paste the URL.",
    }),
    generatedFile: {
      name: filename,
      mimeType: "image/png",
      downloadUrl,
    },
  };
}

function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/[\\/:*?"<>|]/g, "_");
  if (!trimmed) return `design-${Date.now()}.png`;
  return trimmed.toLowerCase().endsWith(".png") ? trimmed : `${trimmed}.png`;
}
