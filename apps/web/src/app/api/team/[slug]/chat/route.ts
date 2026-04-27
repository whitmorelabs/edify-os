import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import type { ArchetypeNamesMap } from "@/app/api/members/archetype-names/route";
import { runArchetypeTurn } from "@/lib/chat/run-archetype-turn";

// Tell Next.js this route streams — disable static buffering.
export const dynamic = "force-dynamic";

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
    // Look up the agent_config_id for this archetype so the conversation is
    // properly attributed. Null is acceptable if no config row exists yet.
    const { data: agentConfigForConv } = await serviceClient
      .from("agent_configs")
      .select("id")
      .eq("org_id", orgId)
      .eq("role_slug", slug)
      .maybeSingle();

    // Create a new conversation
    const { data: newConv, error: convError } = await serviceClient
      .from("conversations")
      .insert({
        org_id: orgId,
        member_id: memberId,
        title: message.slice(0, 80), // Use first 80 chars of message as title
        agent_config_id: agentConfigForConv?.id ?? null,
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

  // Stream the response in real-time — text deltas from Claude are pushed to
  // the browser as SSE events the moment they arrive. DB persistence and
  // side-effects (notifications, tasks, memory) happen after completion.
  const msgId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send preliminary meta event so the frontend knows the conversationId
        // and can render the message shell immediately.
        const meta = JSON.stringify({
          type: "meta",
          id: msgId,
          conversationId: activeConversationId,
          timestamp,
        });
        controller.enqueue(encoder.encode(`data: ${meta}\n\n`));

        // Run the archetype turn with real-time streaming — each text delta
        // from Claude is forwarded to the browser as an SSE "delta" event.
        const result = await runArchetypeTurn({
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
          onTextDelta: (text) => {
            const delta = JSON.stringify({ type: "delta", text });
            controller.enqueue(encoder.encode(`data: ${delta}\n\n`));
          },
        });

        const { text, generatedFiles, tokenUsage } = result;

        // Send done event with files (if any)
        const done = JSON.stringify({
          type: "done",
          ...(generatedFiles.length > 0 ? { files: generatedFiles } : {}),
        });
        controller.enqueue(encoder.encode(`data: ${done}\n\n`));
        controller.close();

        // --- Post-stream side-effects (fire-and-forget) ---

        // Persist assistant message + update conversation timestamp
        await Promise.all([
          serviceClient.from("messages").insert({
            conversation_id: activeConversationId,
            role: "assistant",
            content: text,
            ...(tokenUsage
              ? {
                  metadata: {
                    token_usage: {
                      input_tokens: tokenUsage.inputTokens,
                      output_tokens: tokenUsage.outputTokens,
                      cache_read_tokens: tokenUsage.cacheReadTokens,
                      cache_creation_tokens: tokenUsage.cacheCreationTokens,
                    },
                  },
                }
              : {}),
          }),
          serviceClient
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", activeConversationId),
        ]);

        // Notification
        const archetypeName = customArchetypeName ?? slug.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        serviceClient.from("notifications").insert({
          org_id: orgId,
          type: "message",
          title: `${archetypeName} responded`,
          body: text.substring(0, 150) + (text.length > 150 ? "..." : ""),
          archetype: slug,
          link: `/dashboard/team/${slug}`,
        }).then(({ error }) => {
          if (error) console.error("[team/chat] notification insert failed:", error);
        });

        // Task artifact
        void recordChatArtifact({
          serviceClient,
          orgId,
          slug: slug as ArchetypeSlug,
          userMessage: message,
          assistantText: text,
          hasGeneratedFiles: generatedFiles.length > 0,
          memberId: memberId ?? null,
        });

        // Auto-save org knowledge
        void autoSaveMemory({
          serviceClient,
          orgId,
          memberId: memberId ?? null,
          userMessage: message,
        });
      } catch (err) {
        console.error("[team/chat] Streaming error:", err);
        const errMsg = err instanceof Error ? err.message : "Claude API error";
        try {
          const errEvent = JSON.stringify({ type: "error", error: errMsg });
          controller.enqueue(encoder.encode(`data: ${errEvent}\n\n`));
        } catch { /* controller may already be closed */ }
        try { controller.close(); } catch { /* ignore */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
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

async function recordChatArtifact({
  serviceClient,
  orgId,
  slug,
  userMessage,
  assistantText,
  hasGeneratedFiles,
  memberId,
}: {
  serviceClient: NonNullable<ServiceClient>;
  orgId: string;
  slug: ArchetypeSlug;
  userMessage: string;
  assistantText: string;
  hasGeneratedFiles: boolean;
  memberId: string | null;
}) {
  try {
    // Skip trivially short replies — "Sure!" / "OK" don't belong on the Tasks page.
    const trimmed = assistantText.trim();
    if (!hasGeneratedFiles && trimmed.length < 80) return;

    const kind = classifyArtifact(userMessage, assistantText, hasGeneratedFiles);

    // Only persist actual deliverables to the Tasks page — not conversational replies,
    // explanations, or status updates. chat_reply means Claude answered a question;
    // that's not a task artifact the user needs to track.
    if (kind === "chat_reply") return;

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

  // Email drafts — strong intent signals in both the request and the response.
  const emailRequestSignal = /\b(draft|write|compose|send)\b.*\b(email|message|reply|letter)\b/.test(msg)
    || /\b(email|reply to|respond to)\b/.test(msg);
  const emailResponseSignal = /^subject:/i.test(assistantText) || /\nsubject:/i.test(text)
    || /\bdear\b.*\n/i.test(text) || /\bsincerely\b|\bbest regards\b|\bwarm regards\b/i.test(text);
  if (emailRequestSignal && emailResponseSignal) return "email_draft";
  if (emailResponseSignal) return "email_draft"; // Response looks like email even if request was vague

  // Social media posts — request must explicitly ask for a post/caption/tweet.
  const socialRequest = /\b(write|create|draft|compose)\b.*\b(post|tweet|caption|instagram|linkedin|facebook|social)\b/.test(msg)
    || /\b(social media|content calendar|post series)\b/.test(msg);
  if (socialRequest) return "social_post";

  // Grant documents — LOI, proposal, or calendar event creation.
  const grantRequest = /\b(draft|write|prepare)\b.*\b(loi|letter of intent|proposal|application|grant)\b/.test(msg)
    || /\b(grant proposal|loi|letter of intent)\b/.test(msg);
  if (grantRequest) return "grant_note";

  // Calendar events created — response mentions event created/scheduled with a date.
  const calendarCreated = /\b(event|meeting|appointment)\b.*\b(created|scheduled|added|set)\b/i.test(text)
    || /\b(i('ve| have) (created|scheduled|added))\b/i.test(text);
  if (calendarCreated && /\b(calendar)\b/i.test(msg + text)) return "calendar_event";

  // Document creation requests (non-file).
  const docRequest = /\b(write|create|draft|build|make)\b.*\b(report|document|policy|handbook|checklist|template|plan|budget|timeline|agenda|newsletter|blog|press release|announcement)\b/.test(msg);
  if (docRequest) return "document";

  return "chat_reply";
}

// ---------------------------------------------------------------------------
// Helper: auto-detect and save org knowledge shared in user messages.
//
// Fire-and-forget: doesn't block the response. If this fails, it's non-fatal.
// We only save a memory entry when the message clearly introduces NEW org info
// (contacts, programs, processes, donors, grants). Generic chat messages are ignored.
// ---------------------------------------------------------------------------

type MemoryCategory =
  | "contacts"
  | "programs"
  | "processes"
  | "donors"
  | "grants"
  | "general";

interface MemoryCandidate {
  category: MemoryCategory;
  title: string;
}

function detectMemoryCandidate(userMessage: string): MemoryCandidate | null {
  const msg = userMessage.trim();
  if (msg.length < 30) return null; // Too short to be meaningful org info

  const lower = msg.toLowerCase();

  // Contact / person introduction
  if (
    /\b(our|the)\s+(executive director|ceo|director|coordinator|manager|board|chair|president|staff|team member|volunteer coordinator|volunteer)\b/i.test(msg) ||
    /\b(introduce|meet|fyi|for your info)\b.*\b(name is|called|known as)\b/i.test(lower) ||
    /\bmy name is\b|\bour contact\b|\bour main contact\b/i.test(lower)
  ) {
    const title = `Contact: ${msg.slice(0, 60).replace(/\n.*/s, "")}`;
    return { category: "contacts", title };
  }

  // Program introduction
  if (
    /\b(we (run|have|offer|provide|launched|started)|our (program|initiative|project|service|workshop|class))\b/i.test(msg) ||
    /\b(program|initiative)\s+called\b/i.test(lower)
  ) {
    const title = `Program: ${msg.slice(0, 60).replace(/\n.*/s, "")}`;
    return { category: "programs", title };
  }

  // Process / workflow introduction
  if (
    /\b(our process is|how we (do|handle|manage|run)|our workflow|our procedure|our protocol)\b/i.test(lower) ||
    /\b(we always|we typically|we usually|our standard)\b.*\b(do|send|use|follow|require)\b/i.test(lower)
  ) {
    const title = `Process: ${msg.slice(0, 60).replace(/\n.*/s, "")}`;
    return { category: "processes", title };
  }

  // Donor introduction
  if (
    /\b(our (donor|supporter|funder|sponsor|major donor|lead donor))\b/i.test(lower) ||
    /\b(donated|pledged|committed|gave us)\b.*\b(\$|dollars|grant|gift)\b/i.test(lower)
  ) {
    const title = `Donor: ${msg.slice(0, 60).replace(/\n.*/s, "")}`;
    return { category: "donors", title };
  }

  // Grant information
  if (
    /\b(we (received|won|applied for|submitted|are applying|got)\b.*\b(grant|award|funding))\b/i.test(lower) ||
    /\b(grant (from|by|through)|foundation grant|federal grant|community foundation)\b/i.test(lower)
  ) {
    const title = `Grant: ${msg.slice(0, 60).replace(/\n.*/s, "")}`;
    return { category: "grants", title };
  }

  return null;
}

async function autoSaveMemory({
  serviceClient,
  orgId,
  memberId,
  userMessage,
}: {
  serviceClient: NonNullable<ServiceClient>;
  orgId: string;
  memberId: string | null;
  userMessage: string;
}): Promise<void> {
  try {
    const candidate = detectMemoryCandidate(userMessage);
    if (!candidate) return;

    // Check for near-duplicates: skip if a similar title already exists
    const { data: existing } = await serviceClient
      .from("memory_entries")
      .select("id")
      .eq("org_id", orgId)
      .eq("category", candidate.category)
      .ilike("title", `${candidate.title.slice(0, 30)}%`)
      .maybeSingle();

    if (existing) return; // Already saved — don't duplicate

    await serviceClient.from("memory_entries").insert({
      org_id: orgId,
      category: candidate.category,
      title: candidate.title.slice(0, 120),
      content: userMessage.slice(0, 2000),
      source: "chat",
      created_by: memberId ?? undefined,
      auto_generated: true,
    });
  } catch (err) {
    console.error("[team/chat] autoSaveMemory failed:", err);
  }
}
