/**
 * Typed REST wrapper for the Unsplash API (search/photos + download tracking).
 * Uses direct fetch — no SDK (same no-external-SDK principle as grants-gov.ts).
 *
 * Auth: Client-ID header with the UNSPLASH_ACCESS_KEY env var. Demo tier allows
 * 50 requests/hour per application. Register at https://unsplash.com/developers
 * to obtain a key.
 *
 * ToS notes this wrapper enforces:
 *  - Attribution is required whenever a photo is surfaced. The tool layer and
 *    system-prompt addendum coach Claude to always include photographer name
 *    and profile link when it recommends an Unsplash photo.
 *  - The "trigger a download" pingback MUST be called when a photo is actually
 *    used (e.g. downloaded, embedded in a generated doc). See trackDownload().
 *    https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
 */

import { handleJsonResponse } from "@/lib/http";

const UNSPLASH_API_BASE = "https://api.unsplash.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UnsplashPhoto = {
  id: string;
  description: string | null;
  /** Regular-size display URL (~1080px wide) — the one to surface to the user. */
  url: string;
  /**
   * The Unsplash `links.download_location` URL. Callers MUST POST/GET this
   * (via trackDownload) when the photo is actually used, per Unsplash ToS.
   */
  downloadUrl: string;
  attribution: {
    name: string;
    /** Photographer profile page on Unsplash (with utm params per guidelines). */
    profileUrl: string;
    /** Canonical page for this photo on Unsplash. */
    unsplashUrl: string;
  };
  width: number;
  height: number;
};

export type SearchPhotosOptions = {
  /** Restrict aspect ratio. */
  orientation?: "landscape" | "portrait" | "squarish";
  /** Results per page. Capped at 10 by the tool layer to keep Claude context tight. */
  perPage?: number;
};

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class UnsplashError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "UnsplashError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getAccessKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new UnsplashError(
      500,
      "UNSPLASH_ACCESS_KEY is not configured. Register at https://unsplash.com/developers, create an app, and set the Access Key in Vercel env vars."
    );
  }
  return key;
}

function unsplashHeaders(): Record<string, string> {
  return {
    Authorization: `Client-ID ${getAccessKey()}`,
    "Accept-Version": "v1",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    // Unsplash error shape: { errors: ["message", ...] } or { error: "message" }.
    extractMessage: (body) => {
      if (typeof body === "string") return body;
      const b = body as Record<string, unknown> | null;
      if (Array.isArray(b?.errors) && b.errors.length > 0) {
        return b.errors.filter((e) => typeof e === "string").join("; ");
      }
      if (typeof b?.error === "string") return b.error;
      return undefined;
    },
    makeError: (status, msg) => new UnsplashError(status, msg),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function projectPhoto(raw: Record<string, any>): UnsplashPhoto {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const urls: Record<string, any> = raw.urls ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const links: Record<string, any> = raw.links ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: Record<string, any> = raw.user ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userLinks: Record<string, any> = user.links ?? {};

  // Per Unsplash API guidelines, attribution links should carry UTM params
  // identifying the referrer app. These match the format Unsplash publishes
  // in its guidelines page.
  const utm = "?utm_source=edify_os&utm_medium=referral";
  const profileUrl =
    typeof userLinks.html === "string" ? `${userLinks.html}${utm}` : "";
  const unsplashUrl =
    typeof links.html === "string" ? `${links.html}${utm}` : "";

  return {
    id: String(raw.id ?? ""),
    description:
      (typeof raw.description === "string" && raw.description) ||
      (typeof raw.alt_description === "string" && raw.alt_description) ||
      null,
    url: typeof urls.regular === "string" ? urls.regular : urls.small ?? "",
    downloadUrl:
      typeof links.download_location === "string" ? links.download_location : "",
    attribution: {
      name: typeof user.name === "string" ? user.name : "Unknown photographer",
      profileUrl,
      unsplashUrl,
    },
    width: typeof raw.width === "number" ? raw.width : 0,
    height: typeof raw.height === "number" ? raw.height : 0,
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Search Unsplash for free high-quality stock photos.
 * Returns a projected list of photos — description, display URL, download
 * pingback URL, and photographer attribution.
 */
export async function searchPhotos(
  query: string,
  options: SearchPhotosOptions = {}
): Promise<UnsplashPhoto[]> {
  if (!query || !query.trim()) {
    throw new UnsplashError(400, "query is required and must be non-empty.");
  }

  const { orientation, perPage = 10 } = options;
  const cappedPerPage = Math.max(1, Math.min(perPage, 10));

  const params = new URLSearchParams({
    query: query.trim(),
    per_page: String(cappedPerPage),
  });
  if (orientation) params.set("orientation", orientation);

  const response = await fetch(
    `${UNSPLASH_API_BASE}/search/photos?${params.toString()}`,
    {
      method: "GET",
      headers: unsplashHeaders(),
    }
  );

  const body = await handleResponse<Record<string, unknown>>(response);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Record<string, any>[] = Array.isArray(body.results)
    ? (body.results as Record<string, unknown>[])
    : [];

  return results.map(projectPhoto);
}

/**
 * Trigger Unsplash's download-pingback endpoint when a photo is actually used.
 * REQUIRED by Unsplash ToS. The `downloadLocation` parameter comes from a
 * photo's `downloadUrl` field (the API's `links.download_location`).
 *
 * This does NOT download the image itself — it only increments the photographer's
 * download counter so they get credit. Safe to call fire-and-forget.
 */
export async function trackDownload(downloadLocation: string): Promise<void> {
  if (!downloadLocation || !downloadLocation.startsWith(UNSPLASH_API_BASE)) {
    // Defensive: refuse to call arbitrary URLs. Unsplash download-location URLs
    // always live on api.unsplash.com.
    throw new UnsplashError(
      400,
      "downloadLocation must be a valid Unsplash api.unsplash.com URL."
    );
  }

  const response = await fetch(downloadLocation, {
    method: "GET",
    headers: unsplashHeaders(),
  });

  if (!response.ok) {
    throw new UnsplashError(
      response.status,
      `Failed to track download: ${response.statusText}`
    );
  }
  // Response body is { url: "..." } — we don't need the redirect URL,
  // calling the endpoint is what counts toward the photographer's stats.
}
