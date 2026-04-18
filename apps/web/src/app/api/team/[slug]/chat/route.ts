import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_PROMPTS } from "@/lib/archetype-prompts";

const VALID_SLUGS = [
  "development_director",
  "marketing_director",
  "executive_assistant",
  "programs_director",
  "hr_volunteer_coordinator",
  "events_director",
] as const;

type ArchetypeSlug = (typeof VALID_SLUGS)[number];

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Validate slug first
  if (!VALID_SLUGS.includes(slug as ArchetypeSlug)) {
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

  // Get the org's Claude API key (stored encrypted on the orgs row)
  const { data: org, error: orgError } = await serviceClient
    .from("orgs")
    .select("name, mission, anthropic_api_key_encrypted")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }

  if (!org.anthropic_api_key_encrypted) {
    return NextResponse.json(
      { error: "No Claude API key configured for this org. Add your Anthropic API key in Settings." },
      { status: 402 }
    );
  }

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
  const orgName = org.name || "your organization";
  const basePrompt = ARCHETYPE_PROMPTS[slug] || "";
  const systemPrompt = basePrompt.replace(/\{org_name\}/g, orgName);

  // Add org context if available
  const orgContext = org.mission
    ? `\n\n## Organization Context\nOrg name: ${orgName}\nMission: ${org.mission}`
    : `\n\n## Organization Context\nOrg name: ${orgName}`;

  const fullSystemPrompt = systemPrompt + orgContext;

  // Call Claude
  const anthropic = new Anthropic({ apiKey: org.anthropic_api_key_encrypted });

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

  // Persist both messages to the conversation
  await serviceClient.from("messages").insert([
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
  ]);

  // Update conversation updated_at
  await serviceClient
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", activeConversationId);

  return NextResponse.json({
    id: crypto.randomUUID(),
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
    conversationId: activeConversationId,
  });
}
