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
