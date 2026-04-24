import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

/**
 * POST /api/admin/usage/backfill
 * One-time backfill: estimate token_usage for historical messages that lack it.
 * ~4 chars per output token, input estimated at 1.5x output.
 */
export async function POST() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Fetch assistant messages without token_usage for this org
  const { data: messages, error } = await serviceClient
    .from("messages")
    .select("id, content, metadata, conversations!inner(org_id)")
    .eq("role", "assistant")
    .eq("conversations.org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  let updated = 0;
  let skipped = 0;

  for (const msg of messages ?? []) {
    const meta = (msg.metadata ?? {}) as Record<string, unknown>;
    const existing = meta.token_usage as Record<string, number> | undefined;
    // Skip messages with real API-captured usage (input > 5000 indicates real data)
    if (existing && (existing.input_tokens ?? 0) > 5000) {
      skipped++;
      continue;
    }

    const content = (msg.content ?? "") as string;
    const outputTokens = Math.ceil(content.length / 4);
    // Each API call sends: system prompt (~2K) + tool definitions (~2K) +
    // conversation history (grows ~500 tokens per exchange) + user message.
    // Average ~9K input tokens per call based on real Anthropic billing data.
    const inputTokens = Math.max(Math.ceil(outputTokens * 1.5), 9000);

    const updatedMeta = {
      ...meta,
      token_usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_read_input_tokens: 0,
      },
    };

    const { error: updateErr } = await serviceClient
      .from("messages")
      .update({ metadata: updatedMeta })
      .eq("id", msg.id);

    if (!updateErr) updated++;
  }

  return NextResponse.json({
    backfilled: updated,
    skipped,
    total: (messages ?? []).length,
  });
}
