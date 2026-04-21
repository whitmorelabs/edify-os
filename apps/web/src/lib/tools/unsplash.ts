/**
 * Anthropic tool definition and executor for Unsplash stock-photo search.
 * Single tool: search_stock_photo.
 * No auth context needed — uses a server-side application Access Key.
 *
 * ToS compliance:
 *  - The system-prompt addendum coaches Claude to always surface photographer
 *    attribution to the user whenever it recommends a photo.
 *  - The executor fires the Unsplash "download" pingback for each returned
 *    photo so the photographer gets credit when their work surfaces to a user,
 *    per https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download.
 *    (Unsplash guidelines explicitly state the pingback should fire when a user
 *    selects a photo — for an LLM surface this is when Claude serves search
 *    results to the user, since the user is about to choose one.)
 */

import type Anthropic from "@anthropic-ai/sdk";
import { searchPhotos, trackDownload, UnsplashError } from "@/lib/unsplash";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have the Unsplash tool active.
// ---------------------------------------------------------------------------

export const UNSPLASH_TOOLS_ADDENDUM = `\nYou have access to search_stock_photo (Unsplash). Use it when the user needs real photos for social posts, event flyers, hero images, newsletters, announcement graphics, or any design-adjacent deliverable. CRITICAL ATTRIBUTION RULE: whenever you recommend, embed, or reference an Unsplash photo, you MUST include photographer credit in this exact format: "Photo by [Name](profileUrl) on [Unsplash](unsplashUrl)". This is required by Unsplash's terms of service — never surface a photo without attribution. If you list multiple photo options, include attribution for each one. Do not invent photo URLs — only use URLs returned by the tool.`;

// ---------------------------------------------------------------------------
// Tool definition (model-facing)
// ---------------------------------------------------------------------------

export const unsplashTools: Anthropic.Tool[] = [
  {
    name: "search_stock_photo",
    description:
      "Search Unsplash for free high-quality stock photos. Use for hero images, social post backgrounds, event flyers, newsletters, and announcement graphics. Always surface the photographer attribution in your response to the user per Unsplash ToS — include photographer name and profile link for every photo you recommend.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Search term — describe the visual subject (e.g. 'volunteers planting trees', 'children reading', 'community event celebration').",
        },
        orientation: {
          type: "string",
          description:
            "Restrict aspect ratio. Pick 'landscape' for hero banners and Facebook posts, 'portrait' for Pinterest or Instagram stories, 'squarish' for Instagram feed posts. Omit for any.",
          enum: ["landscape", "portrait", "squarish"],
        },
        perPage: {
          type: "number",
          description:
            "Number of photo results to return (1–10). Defaults to 5. Keep small to conserve context — the user rarely needs more than a few options.",
        },
      },
      required: ["query"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeUnsplashTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "search_stock_photo": {
        if (!input.query || typeof input.query !== "string") {
          return {
            content: "query is required and must be a string.",
            is_error: true,
          };
        }

        const orientationRaw = input.orientation;
        const orientation =
          orientationRaw === "landscape" ||
          orientationRaw === "portrait" ||
          orientationRaw === "squarish"
            ? orientationRaw
            : undefined;

        const perPage =
          typeof input.perPage === "number"
            ? Math.max(1, Math.min(input.perPage, 10))
            : 5;

        const photos = await searchPhotos(input.query, {
          orientation,
          perPage,
        });

        // Fire Unsplash download-pingback for each returned photo per ToS.
        // Unsplash guidelines: the pingback should fire when a user is about
        // to use a photo. For an LLM surface, returning search results to the
        // user is effectively the selection moment — we fire for every result
        // we surface. Fire-and-forget: errors are logged but don't fail the
        // tool call (attribution is the mandatory piece, pingback is best-effort).
        await Promise.all(
          photos
            .filter((p) => p.downloadUrl)
            .map((p) =>
              trackDownload(p.downloadUrl).catch((err) => {
                console.warn(
                  "[unsplash-tool] trackDownload failed (non-fatal)",
                  { photoId: p.id, error: err instanceof Error ? err.message : err }
                );
              })
            )
        );

        // Slim projection — only what Claude needs to surface to the user.
        const slim = {
          returned: photos.length,
          photos: photos.map((p) => ({
            id: p.id,
            description: p.description,
            url: p.url,
            downloadUrl: p.downloadUrl,
            attribution: {
              name: p.attribution.name,
              profileUrl: p.attribution.profileUrl,
              unsplashUrl: p.attribution.unsplashUrl,
            },
          })),
          attributionReminder:
            "When recommending any of these photos, include 'Photo by [Name](profileUrl) on [Unsplash](unsplashUrl)' for each — required by Unsplash ToS.",
        };

        return { content: JSON.stringify(slim) };
      }

      default:
        return {
          content: `Unknown unsplash tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof UnsplashError) {
      return {
        content: `Unsplash error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[unsplash-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling Unsplash API.",
      is_error: true,
    };
  }
}
