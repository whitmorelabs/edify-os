/**
 * Shared helper: run a single user-turn through an archetype's tool-use loop.
 *
 * Used by both:
 *   - /api/team/[slug]/chat/route.ts  (conversation chat)
 *   - /api/heartbeat/trigger/route.ts (proactive heartbeat execution)
 *
 * The chat route manages conversation persistence, history loading, and
 * message storage around this call. The heartbeat trigger route skips all
 * of that and calls this function directly with an empty history.
 *
 * Returns the final assistant text plus any generated files.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ARCHETYPE_PROMPTS, buildCustomNameInstruction } from "@/lib/archetype-prompts";
import { ARCHETYPE_TOOLS, executeTool, buildSystemAddendums } from "@/lib/tools/registry";
import { getValidGoogleAccessToken } from "@/lib/google";
import {
  ARCHETYPE_SKILLS,
  SKILL_MIME,
  SKILLS_ADDENDUM,
  SKILLS_BETA_HEADERS,
  CODE_EXECUTION_TOOL,
  buildContainer,
  shouldAttachSkills,
} from "@/lib/skills/registry";
import type { ArchetypeSlug } from "@/lib/archetypes";

const TOOL_USE_LOOP_MAX = 8;
const MAX_RESPONSE_TOKENS = 4096;

// B. Model ID map — "sonnet" is the interactive default; "haiku" for cheap workloads.
const MODEL_IDS: Record<"sonnet" | "haiku", string> = {
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
};

export interface GeneratedFile {
  name: string;
  mimeType: string;
  downloadUrl: string;
}

export interface RunArchetypeTurnOptions {
  /** Service-role Supabase client (already created by the caller). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  /** Org UUID — used for tool execution and token lookups. */
  orgId: string;
  /** Member UUID — may be null for system-triggered heartbeats. */
  memberId: string | null;
  /** Archetype slug to run. */
  archetype: ArchetypeSlug;
  /** The user-turn message (proactive prompt or actual user message). */
  userMessage: string;
  /** Initialized Anthropic client for this org. */
  client: Anthropic;
  /** Org name to interpolate into the system prompt. */
  orgName: string;
  /** Optional org mission statement. */
  mission?: string | null;
  /**
   * IANA timezone for the org (e.g. "America/New_York").
   * Used to format the local-time label in the temporal context block.
   * Defaults to "America/New_York" for backward compatibility.
   */
  timezone?: string;
  /** Prior conversation history (empty for heartbeats). */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Custom name the member has assigned to this archetype. */
  customArchetypeName?: string | null;
  /**
   * B. Haiku routing — which model to use for this turn.
   * "sonnet" → claude-sonnet-4-6 (default, interactive chat)
   * "haiku"  → claude-haiku-4-5-20251001 (heartbeats, simple Q&A, 5× cheaper)
   */
  model?: "sonnet" | "haiku";
}

export interface RunArchetypeTurnResult {
  text: string;
  generatedFiles: GeneratedFile[];
}

/**
 * Execute one user-turn through the archetype's tool-use loop.
 * Returns { text, generatedFiles } when the loop reaches end_turn.
 * Throws on unrecoverable API errors — callers should catch.
 */
export async function runArchetypeTurn({
  serviceClient,
  orgId,
  memberId,
  archetype,
  userMessage,
  client: anthropic,
  orgName,
  mission,
  timezone = "America/New_York",
  history = [],
  customArchetypeName,
  model = "sonnet",
}: RunArchetypeTurnOptions): Promise<RunArchetypeTurnResult> {
  const modelId = MODEL_IDS[model];

  const basePrompt = ARCHETYPE_PROMPTS[archetype] ?? "";
  const systemPrompt =
    buildCustomNameInstruction(customArchetypeName) +
    basePrompt.replace(/\{org_name\}/g, orgName);

  const orgContext = mission
    ? `\n\n## Organization Context\nOrg name: ${orgName}\nMission: ${mission}`
    : `\n\n## Organization Context\nOrg name: ${orgName}`;

  // A. Prompt caching — temporal block is volatile (changes every call), so it
  // lives in the user message prefix rather than the cached system prompt.
  // The stable portion (archetype prompt + org context + tool addendums) is
  // marked cache_control: ephemeral so Anthropic caches it across requests.
  const nowUtc = new Date();
  const nowLocal = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(nowUtc);
  // Temporal prefix injected at the top of the user's message (not cached).
  const temporalPrefix = `[Context: Today is ${nowLocal} (${nowUtc.toISOString()} UTC — ${timezone}). When the user refers to "today", "tomorrow", "this week", "next month", etc., interpret relative to this date. Always use ISO 8601 format with the user's timezone offset for calendar operations.]\n\n`;

  const tools = ARCHETYPE_TOOLS[archetype] ?? [];
  const archetypeSkillIds = ARCHETYPE_SKILLS[archetype] ?? [];
  const toolAddendums = buildSystemAddendums(tools);

  // C. Skills-on-demand — only attach skills when intent suggests doc generation.
  const attachSkills = archetypeSkillIds.length > 0 && shouldAttachSkills(userMessage);
  const skillsAddendum = attachSkills ? SKILLS_ADDENDUM : "";

  // A. Cached system prompt — stable content only (no temporal block).
  // cache_control on the single text block marks everything up to (and including)
  // the tools array as a cache breakpoint per Anthropic's prefix-match semantics.
  const cachedSystemText = systemPrompt + orgContext + toolAddendums + skillsAddendum;
  const systemBlocks = [
    { type: "text" as const, text: cachedSystemText, cache_control: { type: "ephemeral" as const } },
  ];

  // Tool list for this call — include code_execution only when skills are attached.
  const allTools = attachSkills ? [...tools, CODE_EXECUTION_TOOL] : tools;

  // A. Cache the last tool definition (breakpoint on the tools prefix).
  // When tools are present we mark the last one; the API caches tools → system together.
  const cachedTools =
    allTools.length > 0
      ? [
          ...allTools.slice(0, -1),
          { ...allTools[allTools.length - 1], cache_control: { type: "ephemeral" as const } },
        ]
      : allTools;

  const containerParam = attachSkills ? buildContainer(archetypeSkillIds) : undefined;

  // Prepend temporal prefix to the user message (volatile — stays uncached).
  const userMessageWithTemporal = temporalPrefix + userMessage;

  const loopMessages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: userMessageWithTemporal },
  ];

  const generatedFiles: GeneratedFile[] = [];
  let finalAssistantText = "";
  let lastAssistantText = "";

  for (let round = 0; round < TOOL_USE_LOOP_MAX; round++) {
    // A+B+C: use cached system blocks, haiku/sonnet model, and attach skills only on demand.
    const response = attachSkills
      ? await anthropic.beta.messages.create({
          betas: [...SKILLS_BETA_HEADERS],
          model: modelId,
          max_tokens: MAX_RESPONSE_TOKENS,
          temperature: 0.3,
          system: systemBlocks,
          messages: loopMessages,
          ...(cachedTools.length > 0
            ? { tools: cachedTools as Parameters<typeof anthropic.beta.messages.create>[0]["tools"] }
            : {}),
          ...(containerParam ? { container: containerParam } : {}),
        })
      : await anthropic.messages.create({
          model: modelId,
          max_tokens: MAX_RESPONSE_TOKENS,
          temperature: 0.3,
          system: systemBlocks,
          messages: loopMessages,
          ...(cachedTools.length > 0 ? { tools: cachedTools as Parameters<typeof anthropic.messages.create>[0]["tools"] } : {}),
        });

    // Collect any skill-generated file outputs (two block-type variants from the beta API)
    if (attachSkills) {
      const FILE_RESULT_TYPES: Record<string, string> = {
        bash_code_execution_tool_result: "bash_code_execution_result",
        code_execution_tool_result: "code_execution_result",
      };
      for (const block of response.content) {
        const expectedResultType = FILE_RESULT_TYPES[block.type];
        if (!expectedResultType) continue;
        const result = (
          block as {
            type: string;
            content: { type: string; content?: Array<{ type: string; file_id?: string }> };
          }
        ).content;
        if (result?.type === expectedResultType && Array.isArray(result.content)) {
          for (const output of result.content) {
            if (output.file_id) {
              await collectFileOutput(output.file_id, anthropic, generatedFiles, SKILL_MIME);
            }
          }
        }
      }
    }

    // Capture any text produced in this round
    const textInThisResponse = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n");
    if (textInThisResponse) lastAssistantText = textInThisResponse;

    if (response.stop_reason === "tool_use") {
      loopMessages.push({
        role: "assistant",
        content: response.content as Anthropic.MessageParam["content"],
      });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        // Only server-side skill tool calls — no client result needed
        finalAssistantText = textInThisResponse;
        break;
      }

      // Pre-fetch Google tokens once per round
      const needsCalendarToken = toolUseBlocks.some((b) => b.name.startsWith("calendar_"));
      const needsGmailToken = toolUseBlocks.some((b) => b.name.startsWith("gmail_"));
      const needsDriveToken = toolUseBlocks.some((b) => b.name.startsWith("drive_"));
      const preFetchedTokens = new Map<string, string>();
      await Promise.all([
        needsCalendarToken
          ? getValidGoogleAccessToken(serviceClient, orgId, "google_calendar").then((r) => {
              if (!("error" in r)) preFetchedTokens.set("google_calendar", r.accessToken);
            })
          : Promise.resolve(),
        needsGmailToken
          ? getValidGoogleAccessToken(serviceClient, orgId, "gmail").then((r) => {
              if (!("error" in r)) preFetchedTokens.set("gmail", r.accessToken);
            })
          : Promise.resolve(),
        needsDriveToken
          ? getValidGoogleAccessToken(serviceClient, orgId, "google_drive").then((r) => {
              if (!("error" in r)) preFetchedTokens.set("google_drive", r.accessToken);
            })
          : Promise.resolve(),
      ]);

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          try {
            const result = await executeTool({
              name: block.name,
              input: block.input as Record<string, unknown>,
              orgId,
              memberId,
              serviceClient,
              preFetchedTokens,
            });
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: result.content,
              ...(result.is_error ? { is_error: true as const } : {}),
            };
          } catch (err) {
            console.error("[runArchetypeTurn] Tool execution threw", { name: block.name, error: err });
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: "Tool execution failed unexpectedly.",
              is_error: true as const,
            };
          }
        })
      );

      loopMessages.push({ role: "user", content: toolResults });
      continue;
    }

    if (response.stop_reason === "refusal") {
      finalAssistantText = "I can't help with that request.";
      break;
    }

    if (
      response.stop_reason === "end_turn" ||
      response.stop_reason === "max_tokens" ||
      response.stop_reason === "stop_sequence"
    ) {
      finalAssistantText = textInThisResponse;
      break;
    }

    // Skills/beta-specific stop reasons
    if (
      response.stop_reason === "pause_turn" ||
      response.stop_reason === "compaction" ||
      response.stop_reason === "model_context_window_exceeded"
    ) {
      console.warn("[runArchetypeTurn] Skills/beta stop_reason", { stop_reason: response.stop_reason });
      finalAssistantText = textInThisResponse;
      break;
    }

    console.warn("[runArchetypeTurn] Unexpected stop_reason", { stop_reason: response.stop_reason });
    finalAssistantText = textInThisResponse;
    break;
  }

  // Loop cap hit — prefer any partial text over a canned fallback
  if (!finalAssistantText) {
    finalAssistantText =
      lastAssistantText ||
      "I reached the tool-use limit. Try a more specific question.";
  }

  return { text: finalAssistantText, generatedFiles };
}

// ---------------------------------------------------------------------------
// Helper: collect skill-generated file metadata and build proxy download URL
// ---------------------------------------------------------------------------
async function collectFileOutput(
  fileId: string,
  anthropic: Anthropic,
  generatedFiles: GeneratedFile[],
  mimeMap: Record<string, string>
): Promise<void> {
  let filename = fileId;
  let mimeType = "application/octet-stream";

  try {
    const meta = await anthropic.beta.files.retrieveMetadata(fileId, {
      headers: { "anthropic-beta": "files-api-2025-04-14" },
    } as Parameters<typeof anthropic.beta.files.retrieveMetadata>[1]);
    if (meta.filename) {
      filename = meta.filename;
      const ext = filename.split(".").pop()?.toLowerCase() ?? "";
      if (ext && mimeMap[ext]) mimeType = mimeMap[ext];
    }
  } catch {
    // Non-fatal — use fileId as fallback name
  }

  generatedFiles.push({
    name: filename,
    mimeType,
    downloadUrl: `/api/files/${encodeURIComponent(fileId)}`,
  });
}
