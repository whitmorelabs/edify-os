import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import type { ArchetypeNamesMap } from "@/app/api/members/archetype-names/route";
import { runArchetypeTurn } from "@/lib/chat/run-archetype-turn";

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

  // Get org's Claude API key — also fetch mission and timezone for system prompt context
  const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId, ["mission", "timezone"]);
  if ("error" in anthropicResult) return anthropicResult.error;
  const { client: anthropic, orgName, org } = anthropicResult;
  const mission = org.mission as string | null;
  const orgTimezone = (org.timezone as string | null) ?? "America/New_York";

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

  // H1: Persist user message immediately — before entering the tool-use loop.
  // This ensures that if Claude's API errors mid-loop, the user's message is
  // not lost from the conversation. The assistant message is saved after the loop.
  await serviceClient.from("messages").insert({
    conversation_id: activeConversationId,
    role: "user",
    content: message,
  });

  // Run the archetype turn via the shared helper (handles system prompt, temporal
  // block, skills/beta path, Google token prefetch, parallel tool execution, 8-round loop).
  let text: string;
  let generatedFiles: Array<{ name: string; mimeType: string; downloadUrl: string }>;

  try {
    ({ text, generatedFiles } = await runArchetypeTurn({
      serviceClient,
      orgId,
      memberId: memberId ?? null,
      archetype: slug as ArchetypeSlug,
      userMessage: message,
      client: anthropic,
      orgName,
      mission,
      timezone: orgTimezone,
      history,
      customArchetypeName,
    }));
  } catch (err) {
    console.error("[team/chat] Claude API error:", err);
    const msg = err instanceof Error ? err.message : "Claude API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Persist ONLY the final assistant text (user message was already saved above).
  await Promise.all([
    serviceClient.from("messages").insert({
      conversation_id: activeConversationId,
      role: "assistant",
      content: text,
    }),
    serviceClient
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", activeConversationId),
  ]);

  // Route completed artifact to the Tasks page (not the Inbox).
  // Per Z's 2026-04-21 review + Citlali's Option B choice:
  //   Inbox = items that need a user decision (approvals).
  //   Tasks = completed agent work (drafts, replies, artifacts).
  // Non-trivial responses get a tasks row with status='completed' + kind. The
  // agent-task worker in apps/api is the write-path for approvals (when a
  // response genuinely needs sign-off); it is the only producer of inbox items.
  void recordChatArtifact({
    serviceClient,
    orgId,
    slug: slug as ArchetypeSlug,
    userMessage: message,
    assistantText: text,
    hasGeneratedFiles: generatedFiles.length > 0,
    memberId: memberId ?? null,
  });

  return NextResponse.json({
    id: crypto.randomUUID(),
    role: "assistant",
    content: text,
    timestamp: new Date().toISOString(),
    conversationId: activeConversationId,
    ...(generatedFiles.length > 0 ? { files: generatedFiles } : {}),
  });
}

// ---------------------------------------------------------------------------
// Helper: classify a chat response and log it to the `tasks` table so the
// Tasks page can show archetype-badged cards of completed artifacts.
//
// Fire-and-forget: we do not block the HTTP response on this insert, and any
// failure here is non-fatal (we just log). The source of truth for the chat
// reply is still the `messages` table — tasks rows are an index/summary.
// ---------------------------------------------------------------------------
type ServiceClient = ReturnType<typeof createServiceRoleClient>;

async function recordChatArtifact(params: {
  serviceClient: NonNullable<ServiceClient>;
  orgId: string;
  slug: ArchetypeSlug;
  userMessage: string;
  assistantText: string;
  hasGeneratedFiles: boolean;
  memberId: string | null;
}) {
  const {
    serviceClient,
    orgId,
    slug,
    userMessage,
    assistantText,
    hasGeneratedFiles,
    memberId,
  } = params;

  try {
    // Skip trivially short replies — "Sure!" / "OK" don't belong on the Tasks page.
    const trimmed = assistantText.trim();
    if (!hasGeneratedFiles && trimmed.length < 80) return;

    const kind = classifyArtifact(userMessage, assistantText, hasGeneratedFiles);

    // Title = first non-empty line (strip markdown headers), max 80 chars.
    const firstLine =
      trimmed
        .split("\n")
        .map((l) => l.replace(/^#+\s*/, "").trim())
        .find((l) => l.length > 0) ?? "Chat reply";
    const title = firstLine.slice(0, 80);
    const preview = trimmed.slice(0, 400) + (trimmed.length > 400 ? "…" : "");

    // Resolve agent_config_id if one exists for this archetype (nullable).
    const { data: agentConfig } = await serviceClient
      .from("agent_configs")
      .select("id")
      .eq("org_id", orgId)
      .eq("role_slug", slug)
      .maybeSingle();

    await serviceClient.from("tasks").insert({
      org_id: orgId,
      agent_config_id: agentConfig?.id ?? null,
      agent_role: slug,
      source: "user_request",
      title,
      description: userMessage.slice(0, 500),
      status: "completed",
      kind,
      preview,
      requested_by: memberId,
      completed_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal — artifact logging is a convenience, not critical path.
    console.error("[team/chat] recordChatArtifact failed:", err);
  }
}

function classifyArtifact(
  userMessage: string,
  assistantText: string,
  hasGeneratedFiles: boolean,
): string {
  if (hasGeneratedFiles) return "document";
  const msg = userMessage.toLowerCase();
  const text = assistantText.toLowerCase();
  if (/\b(email|draft.*email|reply to|send.*email)\b/.test(msg)) return "email_draft";
  if (/\b(social|tweet|post|instagram|linkedin|facebook)\b/.test(msg)) return "social_post";
  if (/\b(grant|proposal|application)\b/.test(msg)) return "grant_note";
  if (/^subject:/i.test(assistantText) || /\nsubject:/i.test(text)) return "email_draft";
  return "chat_reply";
}
