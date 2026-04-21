/**
 * Shared HTML-to-PNG rendering helper, backed by @vercel/og.
 *
 * The /api/render/og route and the render_design_to_image tool both call
 * renderHtmlToPng() — the tool needs a direct function call (no HTTP hop
 * back to our own server during a tool-use loop), and the route needs a
 * thin wrapper for the UI/streaming case. One renderer, two entrypoints.
 */

import { ImageResponse } from "@vercel/og";
import { html as satoriHtml } from "satori-html";

export const SOCIAL_PRESETS = {
  /** Instagram square post */
  ig_square: { width: 1080, height: 1080 },
  /** Instagram / TikTok vertical story */
  ig_story: { width: 1080, height: 1920 },
  /** LinkedIn / Facebook link share */
  linkedin: { width: 1200, height: 628 },
  /** Twitter/X summary-large-image card */
  twitter: { width: 1200, height: 675 },
  /** Generic Open Graph default (Facebook link preview) */
  og: { width: 1200, height: 630 },
} as const;

export type SocialPreset = keyof typeof SOCIAL_PRESETS;

export interface RenderHtmlToPngInput {
  /** HTML string to render. Supports common tags + inline styles.
   *  Tailwind can be used via the `tw=""` attribute (experimental in Satori). */
  html: string;
  width: number;
  height: number;
}

/**
 * Render an HTML string to a PNG buffer.
 *
 * Notes:
 *   - satori-html converts the HTML into a React-like VDOM that Satori/@vercel/og
 *     can rasterize. Not every HTML feature is supported (e.g. no scripts, limited
 *     CSS). Complex layouts may need to use flex/grid via inline `style`.
 *   - Fonts: @vercel/og bundles Noto Sans by default — good enough for v1.
 *     Custom fonts can be wired in later via the `fonts` option.
 */
export async function renderHtmlToPng({
  html,
  width,
  height,
}: RenderHtmlToPngInput): Promise<Buffer> {
  // satori-html returns a VNode structurally compatible with a React element.
  // @vercel/og accepts a ReactElement — the VNode shape satisfies that contract
  // at the structural level Satori actually reads from.
  const markup = satoriHtml(html);

  const response = new ImageResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markup as any,
    {
      width,
      height,
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ---------------------------------------------------------------------------
// Shared helpers used by both the /api/render/og route and the render tool.
// ---------------------------------------------------------------------------

export const RENDER_MIN_DIMENSION = 64;
export const RENDER_MAX_DIMENSION = 2400;

export type ResolveDimensionsResult =
  | { ok: true; width: number; height: number }
  | { ok: false; error: string };

/**
 * Resolve final canvas dimensions from raw user input.
 * Custom width+height win over preset; preset wins over the default (og).
 * Clamps to the satori-safe bounds to avoid lambda OOMs at 4K+.
 */
export function resolveRenderDimensions(input: {
  preset?: unknown;
  width?: unknown;
  height?: unknown;
}): ResolveDimensionsResult {
  const presetKey: SocialPreset | undefined =
    typeof input.preset === "string" && input.preset in SOCIAL_PRESETS
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

  if (
    width < RENDER_MIN_DIMENSION ||
    height < RENDER_MIN_DIMENSION ||
    width > RENDER_MAX_DIMENSION ||
    height > RENDER_MAX_DIMENSION
  ) {
    return {
      ok: false,
      error: `width/height must be between ${RENDER_MIN_DIMENSION} and ${RENDER_MAX_DIMENSION} px`,
    };
  }
  return { ok: true, width, height };
}

/**
 * Sanitize a user-provided filename for a generated PNG. Replaces path-unsafe
 * chars, appends `.png` when missing, and falls back to a timestamped default.
 */
export function sanitizePngFilename(name: string | undefined): string {
  const fallback = `design-${Date.now()}.png`;
  if (typeof name !== "string" || !name.trim()) return fallback;
  const trimmed = name.trim().replace(/[\\/:*?"<>|]/g, "_");
  if (!trimmed) return fallback;
  return trimmed.toLowerCase().endsWith(".png") ? trimmed : `${trimmed}.png`;
}
