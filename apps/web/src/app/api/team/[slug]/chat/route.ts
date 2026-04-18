import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_PROMPTS } from "@/lib/archetype-prompts";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";
import { getAnthropicClientForOrg } from "@/lib/anthropic";

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

  const fullSystemPrompt = systemPrompt + orgContext;

  let assistantContent: string;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.3,
      system: fullSystemPrompt,
      messages: [
        ...history,
        { role: "user", content: message },
      ],
    });

    assistantContent =
      response.content[0]?.type === "text" ? response.content[0].text : "";
  } catch (err) {
    console.error("[team/chat] Claude API error:", err);
    const msg = err instanceof Error ? err.message : "Claude API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Persist messages and update conversation timestamp in parallel (independent writes)
  await Promise.all([
    serviceClient.from("messages").insert([
      {
        conversation_id: activeConversationId,
        role: "user",
        content: message,
      },
      {
        conversation_id: activeConversationId,
        role: "assistant",
        content: assistantContent,
      },
    ]),
    serviceClient
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", activeConversationId),
  ]);

  return NextResponse.json({
    id: crypto.randomUUID(),
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
    conversationId: activeConversationId,
  });
}
