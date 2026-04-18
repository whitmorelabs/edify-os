import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_PROMPTS } from "@/lib/archetype-prompts";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import { ARCHETYPE_TOOLS, executeTool, buildSystemAddendums } from "@/lib/tools/registry";
import { getValidGoogleAccessToken } from "@/lib/google";

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

  // Build system prompt for this archetype
  const basePrompt = ARCHETYPE_PROMPTS[slug] || "";
  const systemPrompt = basePrompt.replace(/\{org_name\}/g, orgName);

  // Add org context if available
  const orgContext = mission
    ? `\n\n## Organization Context\nOrg name: ${orgName}\nMission: ${mission}`
    : `\n\n## Organization Context\nOrg name: ${orgName}`;

  // Look up tools for this archetype
  const tools = ARCHETYPE_TOOLS[slug as ArchetypeSlug] ?? [];

  // Build addendum chain based on which tool families this archetype has (single pass).
  const fullSystemPrompt = systemPrompt + orgContext + buildSystemAddendums(tools);

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

  try {
    for (let round = 0; round < TOOL_USE_LOOP_MAX; round++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: MAX_RESPONSE_TOKENS,
        temperature: 0.3,
        system: fullSystemPrompt,
        messages: loopMessages,
        ...(tools.length > 0 ? { tools } : {}),
      });

      // H2: Capture any text in this response before deciding what to do with it.
      const textInThisResponse = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n\n");
      if (textInThisResponse) lastAssistantText = textInThisResponse;

      if (response.stop_reason === "tool_use") {
        // Append the assistant turn (may contain text + tool_use blocks)
        loopMessages.push({ role: "assistant", content: response.content });

        // Execute all tool_use blocks in this turn in parallel
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        // H3: Pre-fetch the Google access token once per round if any calendar
        // tool is being called — avoids N DB selects for N parallel tool calls.
        const needsCalendarToken = toolUseBlocks.some((b) =>
          b.name.startsWith("calendar_")
        );
        const preFetchedTokens = new Map<string, string>();
        if (needsCalendarToken) {
          const tokenResult = await getValidGoogleAccessToken(
            serviceClient,
            orgId,
            "google_calendar"
          );
          if (!("error" in tokenResult)) {
            preFetchedTokens.set("google_calendar", tokenResult.accessToken);
          }
          // If token fetch fails, executeTool will handle it per-block and return is_error.
        }

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

      // Any other stop_reason — log and break with whatever text we have.
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
  });
}
