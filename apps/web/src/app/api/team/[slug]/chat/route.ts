import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_PROMPTS, buildCustomNameInstruction } from "@/lib/archetype-prompts";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import { ARCHETYPE_TOOLS, executeTool, buildSystemAddendums } from "@/lib/tools/registry";
import { getValidGoogleAccessToken } from "@/lib/google";
import type { ArchetypeNamesMap } from "@/app/api/members/archetype-names/route";
import {
  ARCHETYPE_SKILLS,
  SKILL_MIME,
  SKILLS_ADDENDUM,
  SKILLS_BETA_HEADERS,
  CODE_EXECUTION_TOOL,
  buildContainer,
} from "@/lib/skills/registry";

const TOOL_USE_LOOP_MAX = 8;
const MAX_RESPONSE_TOKENS = 4096;

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Validate slug first
  if (!(ARCHETYPE_SLUGS as readonly string[]).includes(slug)) {
    return NextResponse.json({ error: "Unknown team member" }, { status: 404 });
  }

  const body = await request.json();
  const { message, conversationId } = body as {
    message: string;
    conversationId?: string;
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Get authenticated user and their org
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Get org's Claude API key — also fetch mission for system prompt context
  const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId, ["mission"]);
  if ("error" in anthropicResult) return anthropicResult.error;
  const { client: anthropic, orgName, org } = anthropicResult;
  const mission = org.mission as string | null;

  // Get or create conversation
  let activeConversationId = conversationId;

  // Get existing messages for this conversation
  let history: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (activeConversationId) {
    // Verify the conversation belongs to this org
    const { data: conv } = await serviceClient
      .from("conversations")
      .select("id, org_id")
      .eq("id", activeConversationId)
      .eq("org_id", orgId)
      .single();

    if (conv) {
      // Load message history
      const { data: msgs } = await serviceClient
        .from("messages")
        .select("role, content")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true })
        .limit(40); // Cap at 40 messages to stay within context limits

      if (msgs) {
        history = msgs.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      }
    } else {
      // Conversation ID provided but doesn't belong to org — create a new one
      activeConversationId = undefined;
    }
  }

  if (!activeConversationId) {
    // Create a new conversation
    const { data: newConv, error: convError } = await serviceClient
      .from("conversations")
      .insert({
        org_id: orgId,
        member_id: memberId,
        title: message.slice(0, 80), // Use first 80 chars of message as title
        agent_config_id: null, // Will wire to agent_configs in a follow-up
      })
      .select("id")
      .single();

    if (convError || !newConv) {
      console.error("[team/chat] Failed to create conversation:", convError);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    activeConversationId = newConv.id;
  }

  // Fetch member's custom archetype name for this slug (if any)
  let customArchetypeName: string | null = null;
  if (memberId) {
    const { data: memberRow } = await serviceClient
      .from("members")
      .select("archetype_names")
      .eq("id", memberId)
      .single();
    const namesMap = (memberRow?.archetype_names as ArchetypeNamesMap) ?? {};
    customArchetypeName = namesMap[slug] ?? null;
  }

  // Build system prompt for this archetype
  const basePrompt = ARCHETYPE_PROMPTS[slug] || "";
  const systemPrompt =
    buildCustomNameInstruction(customArchetypeName) +
    basePrompt.replace(/\{org_name\}/g, orgName);

  // Add org context if available
  const orgContext = mission
    ? `\n\n## Organization Context\nOrg name: ${orgName}\nMission: ${mission}`
    : `\n\n## Organization Context\nOrg name: ${orgName}`;

  // Look up tools and skills for this archetype
  const tools = ARCHETYPE_TOOLS[slug as ArchetypeSlug] ?? [];
  const archetypeSkillIds = ARCHETYPE_SKILLS[slug as ArchetypeSlug] ?? [];

  // Build addendum chain based on which tool families this archetype has (single pass).
  const toolAddendums = buildSystemAddendums(tools);

  // Append skills addendum when this archetype has skills enabled.
  const skillsAddendum = archetypeSkillIds.length > 0 ? SKILLS_ADDENDUM : "";

  // Inject current date/time so Claude can interpret relative time expressions correctly.
  // Without this, Claude guesses "now" from training data and gets the date wildly wrong.
  // TODO: Replace the hardcoded "America/New_York" below with orgs.timezone once
  // onboarding collects a timezone field from the user.
  const nowUtc = new Date();
  const nowLocal = nowUtc.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const temporalBlock = `Current date and time: ${nowUtc.toISOString()} (${nowLocal} America/New_York — UTC-4)\nWhen the user refers to "today", "tomorrow", "this week", "next month", etc., interpret relative to this date. Always use ISO 8601 format with the user's timezone offset for calendar operations.\n`;

  const fullSystemPrompt = temporalBlock + systemPrompt + orgContext + toolAddendums + skillsAddendum;

  // H1: Persist user message immediately — before entering the tool-use loop.
  // This ensures that if Claude's API errors mid-loop, the user's message is
  // not lost from the conversation. The assistant message is saved after the loop.
  await serviceClient.from("messages").insert({
    conversation_id: activeConversationId,
    role: "user",
    content: message,
  });

  // Build the message list for the tool-use loop
  const loopMessages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: message },
  ];

  let finalAssistantText = "";
  // H2: Track the last assistant text seen across rounds so cap-hit can prefer
  // real partial output over the canned fallback message.
  let lastAssistantText = "";

  // Skills: collect file outputs across all rounds.
  // Shape: { name, mimeType, downloadUrl }
  const generatedFiles: Array<{ name: string; mimeType: string; downloadUrl: string }> = [];

  // Build skills-enabled tools array and container param (used for every round).
  const hasSkills = archetypeSkillIds.length > 0;
  const allTools = hasSkills
    ? [...tools, CODE_EXECUTION_TOOL]
    : tools;
  const containerParam = buildContainer(archetypeSkillIds);


  try {
    for (let round = 0; round < TOOL_USE_LOOP_MAX; round++) {
      // When skills are present, use client.beta.messages.create with beta headers
      // and container.skills. Otherwise, fall back to the standard path.
      const response = hasSkills
        ? await anthropic.beta.messages.create({
            betas: [...SKILLS_BETA_HEADERS],
            model: "claude-sonnet-4-6",
            max_tokens: MAX_RESPONSE_TOKENS,
            temperature: 0.3,
            system: fullSystemPrompt,
            messages: loopMessages,
            ...(allTools.length > 0 ? { tools: allTools as Parameters<typeof anthropic.beta.messages.create>[0]["tools"] } : {}),
            ...(containerParam ? { container: containerParam } : {}),
          })
        : await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: MAX_RESPONSE_TOKENS,
            temperature: 0.3,
            system: fullSystemPrompt,
            messages: loopMessages,
            ...(tools.length > 0 ? { tools } : {}),
          });

      // Skills: extract any code_execution file outputs from this round.
      // The code_execution tool returns bash_code_execution_tool_result blocks
      // which contain bash_code_execution_result with content: [{type: "bash_code_execution_output", file_id}]
      // OR code_execution_tool_result blocks with code_execution_result.content: [{type: "code_execution_output", file_id}].
      if (hasSkills) {
        for (const block of response.content) {
          // bash_code_execution_tool_result (skills execution path)
          if (block.type === "bash_code_execution_tool_result") {
            const result = (block as { type: string; content: { type: string; content?: Array<{ type: string; file_id?: string }> } }).content;
            if (result?.type === "bash_code_execution_result" && Array.isArray(result.content)) {
              for (const output of result.content) {
                if (output.type === "bash_code_execution_output" && output.file_id) {
                  await collectFileOutput(output.file_id, anthropic, generatedFiles, SKILL_MIME);
                }
              }
            }
          }
          // code_execution_tool_result (direct code execution path)
          if (block.type === "code_execution_tool_result") {
            const result = (block as { type: string; content: { type: string; content?: Array<{ type: string; file_id?: string }> } }).content;
            if (result?.type === "code_execution_result" && Array.isArray(result.content)) {
              for (const output of result.content) {
                if (output.type === "code_execution_output" && output.file_id) {
                  await collectFileOutput(output.file_id, anthropic, generatedFiles, SKILL_MIME);
                }
              }
            }
          }
        }
      }

      // H2: Capture any text in this response before deciding what to do with it.
      const textInThisResponse = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n\n");
      if (textInThisResponse) lastAssistantText = textInThisResponse;

      if (response.stop_reason === "tool_use") {
        // Append the assistant turn (may contain text + tool_use blocks)
        loopMessages.push({ role: "assistant", content: response.content as Anthropic.MessageParam["content"] });

        // Execute all tool_use blocks in this turn in parallel.
        // Note: skills/code-execution use type "server_tool_use" (executed server-side by
        // Anthropic — we do NOT send tool_result for those). Filter for client-side tool_use only.
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        // If there are no client-side tool_use blocks (e.g. only server_tool_use from skills),
        // the model has finished processing internally. Break out and return what we have.
        if (toolUseBlocks.length === 0) {
          finalAssistantText = textInThisResponse;
          break;
        }

        // H3: Pre-fetch Google access tokens once per round to avoid N DB selects
        // for N parallel tool calls. Fetches run in parallel when both are needed.
        const needsCalendarToken = toolUseBlocks.some((b) =>
          b.name.startsWith("calendar_")
        );
        const needsGmailToken = toolUseBlocks.some((b) =>
          b.name.startsWith("gmail_")
        );
        const needsDriveToken = toolUseBlocks.some((b) =>
          b.name.startsWith("drive_")
        );
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

        // M3: Per-block try/catch so a single tool throw doesn't abort the whole round.
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block) => {
            try {
              const result = await executeTool({
                name: block.name,
                input: block.input as Record<string, unknown>,
                orgId,
                memberId: memberId ?? null,
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
              console.error("[chat] Tool execution threw", { name: block.name, error: err });
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

      // M4: Handle non-tool_use stop reasons explicitly.
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

      // Skills/beta-specific stop reasons — "pause_turn" means the model paused for
      // server-side processing (skills execution). "compaction" is an auto-compaction event.
      // "model_context_window_exceeded" means the context is too long. In all cases, break
      // with whatever text we have (the fallback logic below fills in a canned message if empty).
      if (
        response.stop_reason === "pause_turn" ||
        response.stop_reason === "compaction" ||
        response.stop_reason === "model_context_window_exceeded"
      ) {
        console.warn("[chat] Skills/beta stop_reason", { stop_reason: response.stop_reason });
        finalAssistantText = textInThisResponse;
        break;
      }

      // Any other unexpected stop_reason — log and break with whatever text we have.
      console.warn("[chat] Unexpected stop_reason", { stop_reason: response.stop_reason });
      finalAssistantText = textInThisResponse;
      break;
    }
  } catch (err) {
    console.error("[team/chat] Claude API error:", err);
    const msg = err instanceof Error ? err.message : "Claude API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // H2: Loop cap hit — prefer any real assistant text seen over the canned fallback.
  if (!finalAssistantText) {
    finalAssistantText =
      lastAssistantText ||
      "I've used too many tools — let me try a simpler approach. Could you rephrase your question?";
  }

  // Persist ONLY the final assistant text (user message was already saved above).
  await Promise.all([
    serviceClient.from("messages").insert({
      conversation_id: activeConversationId,
      role: "assistant",
      content: finalAssistantText,
    }),
    serviceClient
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", activeConversationId),
  ]);

  return NextResponse.json({
    id: crypto.randomUUID(),
    role: "assistant",
    content: finalAssistantText,
    timestamp: new Date().toISOString(),
    conversationId: activeConversationId,
    ...(generatedFiles.length > 0 ? { files: generatedFiles } : {}),
  });
}

// ---------------------------------------------------------------------------
// Helper: fetch file metadata + build proxy download URL for a skill-generated file
// ---------------------------------------------------------------------------
async function collectFileOutput(
  fileId: string,
  anthropic: Anthropic,
  generatedFiles: Array<{ name: string; mimeType: string; downloadUrl: string }>,
  mimeMap: Record<string, string>
): Promise<void> {
  try {
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
      // Proxy route: /api/files/:fileId — server fetches from Anthropic using the org key
      downloadUrl: `/api/files/${encodeURIComponent(fileId)}`,
    });
  } catch (err) {
    // Log but don't fail the request — files are bonus output
    console.warn("[chat] Could not collect file output", { fileId, error: err });
  }
}
