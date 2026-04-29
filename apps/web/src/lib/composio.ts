/**
 * Typed wrapper around the `@composio/core` SDK.
 *
 * Composio brokers OAuth for 1000+ toolkits (social media, CRM, docs, etc.).
 * We pass the org's UUID as the Composio `user_id` — every call is scoped to
 * that user, and Composio holds the per-user OAuth tokens on its side. We
 * never see Instagram/Facebook/etc. access tokens directly.
 *
 * v1 scope: social posting only. Helpers here cover:
 *   - getConnectedAccounts(orgId)           → which toolkits has this org linked?
 *   - initiateConnection(orgId, toolkit)    → get a redirect URL for OAuth
 *   - postToSocial(orgId, platform, ...)    → dispatch a create-post action
 *
 * We do NOT expose a generic "execute any Composio tool" helper — Marketing
 * Director only needs social posting for v1. If other archetypes need broader
 * Composio access later, add narrow helpers here rather than passing raw slugs
 * out of this module.
 *
 * Env var: COMPOSIO_API_KEY (required). The helper functions all throw
 * `ComposioError` with a clear "not configured" message when it's missing, so
 * the tool executor can surface a useful error to the user instead of 500ing.
 */

import { Composio } from "@composio/core";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ComposioError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ComposioError";
  }
}

// ---------------------------------------------------------------------------
// Types + constants
// ---------------------------------------------------------------------------

/** Social platforms we expose through the `social_post` tool.
 *  The string values are the Composio toolkit slugs — keep lowercase/snake_case. */
export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "threads",
  "youtube",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Human-readable labels used in UI + error messages. */
export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  threads: "Threads",
  youtube: "YouTube",
};

/**
 * Map of (platform → Composio toolkit slug). Composio uses lowercase slugs.
 * Centralized so we have one place to update if Composio renames anything.
 */
export const TOOLKIT_SLUG: Record<SocialPlatform, string> = {
  instagram: "instagram",
  facebook: "facebook",
  linkedin: "linkedin",
  tiktok: "tiktok",
  threads: "threads",
  youtube: "youtube",
};

/**
 * Primary "create a post" action slug per platform. Composio follows the
 * `<TOOLKIT>_<VERB_NOUN>` convention. These are reasonable v1 defaults; if a
 * specific action is missing at runtime, Composio returns `successful:false`
 * with an `error` string that we surface to the user.
 *
 * Milo / Lopmon can swap these to more specific slugs later (e.g.
 * INSTAGRAM_CREATE_CAROUSEL_POST) without touching the tool schema.
 */
export const POST_ACTION_SLUG: Record<SocialPlatform, string> = {
  instagram: "INSTAGRAM_CREATE_POST",
  facebook: "FACEBOOK_CREATE_POST",
  linkedin: "LINKEDIN_CREATE_POST",
  tiktok: "TIKTOK_POST_VIDEO",
  threads: "THREADS_CREATE_POST",
  // YouTube expects a video upload rather than a text post — the `content` the
  // agent passes becomes title + description, and `image_file_id` should be a
  // video file. See the tool description caveat in social.ts. Swap to a more
  // specific slug (e.g. YOUTUBE_UPLOAD_SHORT) later without touching schema.
  youtube: "YOUTUBE_UPLOAD_VIDEO",
};

// ---------------------------------------------------------------------------
// Client bootstrap
// ---------------------------------------------------------------------------

/**
 * Single Composio client reused across requests. Creating `new Composio()` on
 * every call hits a token-usage telemetry path unnecessarily; memoizing is
 * safe because the SDK is stateless apart from the API key.
 */
let _client: Composio | null = null;

function getClient(): Composio {
  if (_client) return _client;
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new ComposioError(
      503,
      "Composio is not configured — COMPOSIO_API_KEY env var is missing. Ask an admin to set it in Vercel."
    );
  }
  _client = new Composio({ apiKey });
  return _client;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * List connected toolkits for this org (from Composio's side).
 *
 * We pass the org's UUID as Composio `user_id`. Returns a map of
 * `toolkitSlug → connectionId` for connections Composio currently reports as
 * active. Useful for the Settings page to render connection state without
 * hitting our own DB (Composio is the source of truth).
 */
export async function getConnectedAccounts(orgId: string): Promise<
  Array<{ toolkitSlug: string; connectionId: string; status: string }>
> {
  const client = getClient();
  try {
    const result = await client.connectedAccounts.list({ userIds: [orgId] });
    // The ConnectedAccountListResponse shape is { items, nextCursor, totalPages? }
    // Guard defensively — the SDK types are generated from zod but the runtime
    // shape has historically drifted across minor versions.
    const items = (result as unknown as { items?: Array<Record<string, unknown>> })
      .items ?? [];

    return items
      .map((item) => ({
        toolkitSlug:
          (item.toolkit as { slug?: string } | undefined)?.slug ??
          (item.toolkitSlug as string | undefined) ??
          "",
        connectionId: (item.id as string | undefined) ?? "",
        status: (item.status as string | undefined) ?? "unknown",
      }))
      .filter((x) => x.toolkitSlug && x.connectionId);
  } catch (err) {
    if (err instanceof ComposioError) throw err;
    throw new ComposioError(
      502,
      `Failed to list Composio connections: ${err instanceof Error ? err.message : "unknown error"}`,
      err
    );
  }
}

/**
 * Lazy lookup + process-lifetime cache of (toolkit slug → Composio auth config id),
 * so we don't hardcode per-workspace auth config IDs that would differ across
 * Citlali's / Z's / CI's Composio accounts.
 */
const _authConfigIdCache = new Map<string, string>();

async function resolveAuthConfigId(toolkit: string): Promise<string> {
  const cached = _authConfigIdCache.get(toolkit);
  if (cached) return cached;

  const client = getClient();
  const result = await client.authConfigs.list({
    toolkit,
    isComposioManaged: true,
  });
  const items = result.items ?? [];
  // Prefer ENABLED; fall back to any entry so the dashboard surfaces why.
  const enabled = items.find((item) => item.status === "ENABLED");
  const chosen = enabled ?? items[0];
  if (!chosen?.id) {
    throw new ComposioError(
      502,
      `No Composio-managed auth config found for toolkit '${toolkit}'. An admin must enable it in the Composio dashboard before users can connect.`
    );
  }

  _authConfigIdCache.set(toolkit, chosen.id);
  return chosen.id;
}

/**
 * Initiate an OAuth connection for the org on a specific toolkit.
 * Returns the Composio connection ID + the redirect URL to send the user to.
 *
 * `callbackUrl` is our own /api/integrations/composio/callback route — Composio
 * will redirect the browser there after the OAuth flow completes on the
 * platform's side. The cookie stashed at the /connect endpoint carries orgId,
 * platform, and connectionId so the callback can validate and upsert the row.
 */
export async function initiateConnection(
  orgId: string,
  toolkit: string,
  callbackUrl: string
): Promise<{ connectionId: string; redirectUrl: string }> {
  const client = getClient();
  try {
    // `connectedAccounts.initiate` (vs `toolkits.authorize`) lets us pass a
    // per-request `callbackUrl`, so the browser lands back on our callback
    // route instead of Composio's default success page.
    const authConfigId = await resolveAuthConfigId(toolkit);

    const connection = await client.connectedAccounts.initiate(
      orgId,
      authConfigId,
      { callbackUrl }
    );

    // ConnectionRequest = { id, status, redirectUrl, waitForConnection() }
    const connectionId = connection.id;
    const redirectUrl = connection.redirectUrl ?? null;
    if (!connectionId || !redirectUrl) {
      throw new ComposioError(
        502,
        `Composio returned an incomplete connection request for toolkit '${toolkit}' (missing ${
          !connectionId ? "id" : "redirectUrl"
        }).`
      );
    }

    return { connectionId, redirectUrl };
  } catch (err) {
    if (err instanceof ComposioError) throw err;
    throw new ComposioError(
      502,
      `Failed to initiate Composio connection for toolkit '${toolkit}': ${
        err instanceof Error ? err.message : "unknown error"
      }`,
      err
    );
  }
}

/**
 * Mark a pending connection as complete by polling Composio.
 * Called from the OAuth callback handler — waits briefly for Composio to
 * finish processing and returns the final connected-account record.
 * Throws ComposioError if the wait times out.
 */
export async function completeConnection(
  connectionId: string,
  timeoutMs = 5000
): Promise<{ connectionId: string; toolkitSlug: string; status: string }> {
  const client = getClient();
  try {
    const account = await client.connectedAccounts.waitForConnection(
      connectionId,
      timeoutMs
    );
    const a = account as unknown as {
      id?: string;
      status?: string;
      toolkit?: { slug?: string };
      toolkitSlug?: string;
    };
    return {
      connectionId: a.id ?? connectionId,
      toolkitSlug: a.toolkit?.slug ?? a.toolkitSlug ?? "",
      status: a.status ?? "unknown",
    };
  } catch (err) {
    if (err instanceof ComposioError) throw err;
    throw new ComposioError(
      502,
      `Composio connection ${connectionId} did not complete: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
      err
    );
  }
}

// ---------------------------------------------------------------------------
// Posting
// ---------------------------------------------------------------------------

export interface PostToSocialParams {
  orgId: string;
  platform: SocialPlatform;
  content: string;
  /** Optional image URL (HTTPS, publicly reachable). Composio fetches this and
   *  uploads it to the platform as part of the post. */
  imageUrl?: string;
  /** Optional ISO 8601 timestamp. If Composio's action supports scheduling it
   *  will use this; otherwise it's silently ignored (v1 flag). */
  scheduledAt?: string;
}

export interface PostToSocialResult {
  platform: SocialPlatform;
  successful: boolean;
  postUrl: string | null;
  scheduledAt: string | null;
  /** Raw payload Composio returned — logged server-side for debugging. */
  raw: Record<string, unknown>;
}

/**
 * Publish a post on a social platform via Composio.
 *
 * Translates our platform key to the Composio action slug, dispatches the
 * `tools.execute` call scoped to the org's Composio user_id, and projects
 * the response into a stable shape for the tool layer.
 *
 * This deliberately does NOT try to be smart about platform-specific required
 * fields (IG needs an image, TikTok needs video, etc.) — we pass what we have
 * and let Composio's server-side validation reject with a clear error that we
 * surface back to Claude.
 */
export async function postToSocial(
  params: PostToSocialParams
): Promise<PostToSocialResult> {
  const { orgId, platform, content, imageUrl, scheduledAt } = params;
  const actionSlug = POST_ACTION_SLUG[platform];
  if (!actionSlug) {
    throw new ComposioError(400, `Unsupported social platform: ${platform}`);
  }

  const client = getClient();

  // Most Composio create-post actions accept `text` for the body, `media_url`
  // for an attached image, and `schedule_at` for scheduling (where supported).
  // We pass a superset — Composio ignores unknown fields rather than erroring.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actionArgs: Record<string, any> = { text: content };
  if (imageUrl) {
    actionArgs.media_url = imageUrl;
    actionArgs.image_url = imageUrl;
  }
  if (scheduledAt) {
    actionArgs.schedule_at = scheduledAt;
    actionArgs.scheduled_at = scheduledAt;
  }

  let response: Awaited<ReturnType<typeof client.tools.execute>>;
  try {
    response = await client.tools.execute(actionSlug, {
      userId: orgId,
      arguments: actionArgs,
    });
  } catch (err) {
    if (err instanceof ComposioError) throw err;
    throw new ComposioError(
      502,
      `Composio tool execution failed (${actionSlug}): ${
        err instanceof Error ? err.message : "unknown error"
      }`,
      err
    );
  }

  // ToolExecuteResponse = { data, error, successful, logId? }
  if (!response.successful) {
    throw new ComposioError(
      400,
      `Composio reported the ${SOCIAL_PLATFORM_LABELS[platform]} post failed: ${response.error ?? "no error message"}`
    );
  }

  // Extract post_url / post_id / scheduled_at from the returned data — shape
  // varies per platform. Try the common field names in priority order.
  const data = (response.data ?? {}) as Record<string, unknown>;
  const postUrl =
    (data.post_url as string | undefined) ??
    (data.postUrl as string | undefined) ??
    (data.url as string | undefined) ??
    (data.link as string | undefined) ??
    null;
  const returnedScheduledAt =
    (data.scheduled_at as string | undefined) ??
    (data.scheduledAt as string | undefined) ??
    scheduledAt ??
    null;

  return {
    platform,
    successful: true,
    postUrl,
    scheduledAt: returnedScheduledAt,
    raw: data,
  };
}
