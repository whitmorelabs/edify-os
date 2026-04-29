/**
 * Anthropic tool definition + executor for social posting.
 * One tool: `social_post`. Marketing Director only.
 *
 * How it works:
 *   1. Claude (Marketing Director) composes a post with the user.
 *   2. User confirms the draft.
 *   3. Claude calls `social_post` — this helper resolves the image file (if
 *      attached), calls Composio, and returns a structured result.
 *   4. If the user hasn't OAuth'd that platform yet, we return a clear
 *      "go to /dashboard/integrations to connect" error so Claude coaches the
 *      user rather than silently failing.
 *
 * Anthropic's Files API is used to resolve `image_file_id` → raw bytes when a
 * prior `render_design_to_image` tool call produced a PNG. We re-host the image
 * through the existing /api/files/{id} proxy so Composio/the social platform
 * can fetch it via HTTPS without an auth header.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ComposioError,
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABELS,
  TOOLKIT_SLUG,
  postToSocial,
  type SocialPlatform,
} from "@/lib/composio";
import { getAppOrigin } from "@/lib/google";

// ---------------------------------------------------------------------------
// System-prompt addendum (when social tools are active)
// ---------------------------------------------------------------------------

export const SOCIAL_TOOLS_ADDENDUM = `\nYou have access to publish posts on connected social accounts via social_post (Instagram, Facebook, LinkedIn, TikTok, Threads, YouTube). HARD RULES:\n1. Always confirm the exact caption, image, and platform with the user before calling social_post. Read the composed post back to them. Never post speculatively.\n2. If the user says "draft", "preview", "dry run", "just show me", or anything that doesn't explicitly authorize publishing — DO NOT call social_post. Show the composition in chat only.\n3. Social posts are public and hard to un-send. Treat social_post like Gmail's send_email tool: explicit go-ahead required every single time.\n4. When posting an image, pass the image_file_id from the most recent render_design_to_image call (or a Drive image file ID). Without image_file_id the post is text-only.\n5. If social_post returns a connection error, explain that the user needs to connect that platform in Settings → Integrations before you can post for them. Don't retry automatically.\n6. v1 scope limitation: scheduling may be silently ignored by some platforms. If the user asks to schedule and the call returns no scheduled_at, warn them and offer to post now instead.\n7. YouTube caveat: for platform='youtube', 'content' is the video title + description and 'image_file_id' must reference a video file (not an image). If the user only has a still image or text, tell them YouTube requires a video and suggest another platform.`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const socialTools: Anthropic.Tool[] = [
  {
    name: "social_post",
    description:
      "Publish (or schedule) a post to a connected social media account — Instagram, Facebook, LinkedIn, TikTok, Threads, or YouTube. CRITICAL: only call this after the user explicitly confirms the caption, image, and platform. If the user says 'draft' or 'preview', do NOT call this tool — show the composition inline instead. Social posts are public and hard to un-send. If the user hasn't connected that platform yet, this returns a structured connection error you should relay to the user (tell them to visit Settings → Integrations). YouTube caveat: for platform='youtube', `content` is the video title + description (first line treated as title) and `image_file_id` should be the video file id, not an image.",
    input_schema: {
      type: "object" as const,
      properties: {
        platform: {
          type: "string",
          enum: [...SOCIAL_PLATFORMS],
          description:
            "Which social platform to post to. The org must have connected this platform via Settings → Integrations before this call will succeed.",
        },
        content: {
          type: "string",
          description:
            "The post caption / body text. Platform character limits apply (LinkedIn ~3000, IG caption ~2200, etc.) — use the user's exact confirmed text, do not paraphrase.",
        },
        image_file_id: {
          type: "string",
          description:
            "Optional. Anthropic Files API file ID for an attached image — usually from a prior render_design_to_image call. The image will be re-hosted via our /api/files proxy and pulled into the post by Composio. Omit for text-only posts.",
        },
        schedule_at: {
          type: "string",
          description:
            "Optional ISO 8601 timestamp (with timezone offset) to schedule the post instead of publishing immediately. May be silently ignored on platforms where Composio's action doesn't support scheduling — check the tool result's scheduled_at field to confirm.",
        },
      },
      required: ["platform", "content"],
    },
  },
];

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export interface ExecuteSocialToolResult {
  content: string;
  is_error?: boolean;
}

export async function executeSocialTool({
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
}): Promise<ExecuteSocialToolResult> {
  if (name !== "social_post") {
    return { content: `Unknown social tool: ${name}`, is_error: true };
  }

  const platform = input.platform as SocialPlatform | undefined;
  const content = input.content as string | undefined;
  const imageFileId = input.image_file_id as string | undefined;
  const scheduleAt = input.schedule_at as string | undefined;

  if (!platform || !SOCIAL_PLATFORMS.includes(platform)) {
    return {
      content: `platform must be one of: ${SOCIAL_PLATFORMS.join(", ")}`,
      is_error: true,
    };
  }
  if (typeof content !== "string" || !content.trim()) {
    return { content: "content is required and must be a non-empty string.", is_error: true };
  }

  // Fast-path connection check against our DB: if we have no row, short-circuit
  // with a helpful error instead of round-tripping to Composio. Composio is
  // still the source of truth — this is just an optimization.
  const toolkit = TOOLKIT_SLUG[platform];
  const { data: connectionRow, error: dbErr } = await serviceClient
    .from("composio_connections")
    .select("id, status")
    .eq("org_id", orgId)
    .eq("toolkit", toolkit)
    .eq("status", "active")
    .maybeSingle();
  if (dbErr) {
    console.error("[social-tool] DB error checking connection:", dbErr);
    // Don't block — Composio can still answer, we just skip the fast path.
  }
  if (!connectionRow) {
    return {
      content: JSON.stringify({
        error: "not_connected",
        platform,
        platform_label: SOCIAL_PLATFORM_LABELS[platform],
        message: `${SOCIAL_PLATFORM_LABELS[platform]} is not connected for this organization yet. Ask the user to visit Settings → Integrations and connect ${SOCIAL_PLATFORM_LABELS[platform]} before you try posting again.`,
        settings_url: `${getAppOrigin()}/dashboard/integrations`,
      }),
      is_error: true,
    };
  }

  // Resolve image if provided. We re-host via our own proxy so Composio (and
  // downstream the platform) can hit a public HTTPS URL — we don't need to
  // download bytes server-side here. The /api/files/[fileId] route is already
  // accessible without auth cookies for files in the org's scope.
  //
  // NOTE: v1 limitation — if the deploy is running on localhost, the social
  // platform obviously can't reach our proxy. That's expected (no live tests
  // during dev). Production = getAppOrigin() returns the Vercel URL.
  let imageUrl: string | undefined;
  if (imageFileId) {
    imageUrl = `${getAppOrigin()}/api/files/${encodeURIComponent(imageFileId)}`;
  }

  try {
    const result = await postToSocial({
      orgId,
      platform,
      content,
      imageUrl,
      scheduledAt: scheduleAt,
    });

    return {
      content: JSON.stringify({
        platform,
        status: result.scheduledAt ? "scheduled" : "published",
        post_url: result.postUrl,
        scheduled_at: result.scheduledAt,
      }),
    };
  } catch (err) {
    if (err instanceof ComposioError) {
      return {
        content: `Composio error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error("[social-tool] Unexpected error:", err);
    return {
      content: `Unexpected error posting to ${SOCIAL_PLATFORM_LABELS[platform]}.`,
      is_error: true,
    };
  }
}
