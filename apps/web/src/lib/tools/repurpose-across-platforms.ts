/**
 * Anthropic tool definition and executor for cross-platform content repurposing.
 * One tool: repurpose_across_platforms. Marketing Director only.
 *
 * How it works:
 *   1. Kida calls this with a base post + source platform + target platform list.
 *   2. For each target platform this tool does a sub-Claude call (Haiku) that
 *      rewrites the base post according to the Platform Format Matrix constraints
 *      baked into Agent 1's work in archetype-prompts.ts.
 *   3. TikTok is gated behind the ENABLE_TIKTOK feature flag.
 *   4. Returns a structured array: { platform, content, hashtags, char_count }.
 *
 * Sub-Claude rewrite — why not regex/heuristics:
 *   Platform adaptation is creative work: trimming LinkedIn prose to IG caption
 *   style, stripping em dashes for TikTok captions, reframing CTAs per audience,
 *   and surfacing the right hashtag density. Claude Haiku does this in < 1s;
 *   regex would be brittle and produce low-quality rewrites.
 *
 * Cost: ~200-400 tokens input / ~300 output per platform rewrite.
 *       3 platforms = ~2100 tokens total = well within Haiku's cost profile.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { ENABLE_TIKTOK } from "@/lib/config";

// ---------------------------------------------------------------------------
// Platform constraints (mirrors the Platform Format Matrix in archetype-prompts.ts)
// ---------------------------------------------------------------------------

const PLATFORM_CONSTRAINTS: Record<
  string,
  { max_chars: number; hashtag_guidance: string; tone_notes: string; preview_cutoff?: number }
> = {
  instagram: {
    max_chars: 2200,
    hashtag_guidance: "5–10 hashtags ideal (30 max). Mix niche and broad.",
    tone_notes: "Visual-first, punchy opener (first 125 chars shown before 'more'). Use emojis sparingly.",
    preview_cutoff: 125,
  },
  facebook: {
    max_chars: 63206,
    hashtag_guidance: "0–2 hashtags max. Hashtags optional on Facebook.",
    tone_notes: "Conversational, community-oriented. Aim for under 80 words for best engagement.",
  },
  linkedin: {
    max_chars: 3000,
    hashtag_guidance: "3–5 professional hashtags.",
    tone_notes: "Professional tone. 1300 chars before 'see more' cutoff — put the hook first.",
    preview_cutoff: 1300,
  },
  twitter: {
    max_chars: 280,
    hashtag_guidance: "1–2 hashtags max. Character budget is tight.",
    tone_notes: "Punchy and direct. Every word earns its place. Conversational.",
  },
  youtube: {
    max_chars: 700,
    hashtag_guidance: "2–3 hashtags.",
    tone_notes: "Community post style. Should tease video content or announce milestones.",
  },
  tiktok: {
    max_chars: 2200,
    hashtag_guidance: "3–5 hashtags ideal. Niche > generic.",
    tone_notes: "Youth-oriented, authentic, trend-aware. Casual language. Short sentences.",
  },
};

const ALL_PLATFORMS = Object.keys(PLATFORM_CONSTRAINTS);

// ---------------------------------------------------------------------------
// System-prompt addendum
// ---------------------------------------------------------------------------

export const REPURPOSE_TOOLS_ADDENDUM = `\nYou have access to \`repurpose_across_platforms\` to adapt a single base post for multiple social platforms at once. Use it when the user asks to 'repurpose', 'adapt', or 'cross-post' content. Each platform version respects character limits, tone, and hashtag rules from the Platform Format Matrix.`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const repurposeTools: Anthropic.Tool[] = [
  {
    name: "repurpose_across_platforms",
    description:
      "Adapt a base social media post for multiple target platforms at once, respecting each platform's character limits, tone, and hashtag norms. Returns a separate optimized version for each target platform. TikTok is only included when the org's TikTok feature flag is enabled.",
    input_schema: {
      type: "object" as const,
      properties: {
        base_post: {
          type: "string",
          description: "The original post content to adapt. Usually a LinkedIn post or a drafted piece of copy.",
        },
        source_platform: {
          type: "string",
          enum: ["linkedin", "instagram", "facebook", "twitter", "youtube"],
          description: "The platform the base post was written for (used to correctly calibrate tone shifts).",
        },
        target_platforms: {
          type: "array",
          items: {
            type: "string",
            enum: ["instagram", "facebook", "linkedin", "twitter", "youtube", "tiktok"],
          },
          description:
            "Platforms to adapt the post for. TikTok will be silently dropped if the feature flag is off. At least one platform required.",
        },
        org_voice_notes: {
          type: "string",
          description:
            "Optional: any brand voice or tone notes (e.g., 'We are warm but professional, avoid slang, always include a donation CTA'). Used to calibrate the rewrites.",
        },
      },
      required: ["base_post", "source_platform", "target_platforms"],
    },
  },
];

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export interface RepurposeResult {
  platform: string;
  content: string;
  hashtags: string[];
  char_count: number;
}

export async function executeRepurposeTool({
  name,
  input,
  anthropic,
}: {
  name: string;
  input: Record<string, unknown>;
  anthropic: Anthropic;
}): Promise<{ content: string; is_error?: boolean }> {
  if (name !== "repurpose_across_platforms") {
    return { content: `Unknown repurpose tool: ${name}`, is_error: true };
  }

  const basePost = input.base_post as string | undefined;
  const sourcePlatform = input.source_platform as string | undefined;
  const rawTargets = input.target_platforms as string[] | undefined;
  const orgVoice = input.org_voice_notes as string | undefined;

  if (!basePost?.trim()) {
    return { content: "base_post is required and must be a non-empty string.", is_error: true };
  }
  if (!sourcePlatform) {
    return { content: "source_platform is required.", is_error: true };
  }
  if (!Array.isArray(rawTargets) || rawTargets.length === 0) {
    return { content: "target_platforms must be a non-empty array.", is_error: true };
  }

  // Gate TikTok behind feature flag
  const targetPlatforms = rawTargets.filter((p) => {
    if (p === "tiktok" && !ENABLE_TIKTOK) return false;
    return ALL_PLATFORMS.includes(p);
  });

  if (targetPlatforms.length === 0) {
    return {
      content:
        "No valid target platforms after filtering. " +
        (rawTargets.includes("tiktok") && !ENABLE_TIKTOK
          ? "TikTok is not enabled for this organization."
          : "Check that target_platforms are valid platform names."),
      is_error: true,
    };
  }

  // Sub-Claude rewrites in parallel (Haiku, cheap + fast)
  const rewrites = await Promise.all(
    targetPlatforms.map((platform) =>
      rewriteForPlatform({ basePost, sourcePlatform, platform, orgVoice, anthropic })
    )
  );

  // Collect results — if a platform rewrite failed, include an error note rather than crashing
  const results: RepurposeResult[] = rewrites.map((r, i) => ({
    platform: targetPlatforms[i],
    content: r.content,
    hashtags: r.hashtags,
    char_count: r.content.length,
  }));

  return {
    content: JSON.stringify({
      ok: true,
      source_platform: sourcePlatform,
      platforms_included: targetPlatforms,
      tiktok_note: rawTargets.includes("tiktok") && !ENABLE_TIKTOK
        ? "TikTok was requested but is not enabled. Contact your account admin to enable TikTok."
        : undefined,
      results,
    }),
  };
}

// ---------------------------------------------------------------------------
// Sub-Claude rewrite helper
// ---------------------------------------------------------------------------

async function rewriteForPlatform({
  basePost,
  sourcePlatform,
  platform,
  orgVoice,
  anthropic,
}: {
  basePost: string;
  sourcePlatform: string;
  platform: string;
  orgVoice?: string;
  anthropic: Anthropic;
}): Promise<{ content: string; hashtags: string[] }> {
  const constraints = PLATFORM_CONSTRAINTS[platform];
  const voiceContext = orgVoice ? `\nOrg voice/tone guidance: ${orgVoice}` : "";
  const previewNote = constraints.preview_cutoff
    ? ` (first ${constraints.preview_cutoff} chars show before 'see more')`
    : "";

  const systemPrompt = `You are a nonprofit social media copywriter. Adapt the provided post for ${platform.toUpperCase()}.

Platform constraints:
- Max characters: ${constraints.max_chars}${previewNote}
- Hashtags: ${constraints.hashtag_guidance}
- Tone: ${constraints.tone_notes}${voiceContext}

Rules:
1. Preserve the core message and key facts from the original.
2. Respect the character limit — do NOT exceed ${constraints.max_chars} characters.
3. Do NOT use em dashes (—). Use commas, periods, or line breaks instead.
4. Return ONLY a JSON object with this exact shape (no markdown, no extra text):
   { "content": "the adapted post body WITHOUT hashtags", "hashtags": ["tag1", "tag2"] }
5. Hashtags in the array should NOT include the # symbol — just the tag text.
6. The content field should NOT include hashtags — they go in the hashtags array only.`;

  const userMessage = `Original post (written for ${sourcePlatform}):\n\n${basePost}\n\nAdapt for ${platform.toUpperCase()}. Return JSON only.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      temperature: 0.4,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Parse the JSON response
    const parsed = JSON.parse(rawText) as { content?: string; hashtags?: string[] };
    const content = typeof parsed.content === "string" ? parsed.content.trim() : basePost;
    const hashtags = Array.isArray(parsed.hashtags)
      ? parsed.hashtags.filter((h): h is string => typeof h === "string")
      : [];

    return { content, hashtags };
  } catch (err) {
    // Non-fatal: return a best-effort truncated version of the original
    console.error(`[repurpose] Sub-Claude rewrite failed for ${platform}:`, err);
    const truncated = basePost.slice(0, constraints.max_chars);
    return {
      content: `[Rewrite error — truncated original] ${truncated}`,
      hashtags: [],
    };
  }
}
