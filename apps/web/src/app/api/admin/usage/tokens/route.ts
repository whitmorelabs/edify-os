import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export interface TokenUsageSummary {
  period: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreationTokens: number;
  /** Total tokens across all categories */
  grandTotal: number;
  /** Estimated cost in USD at standard Anthropic pricing for claude-sonnet-4-6 */
  estimatedCostUsd: number;
  /** Per-conversation breakdown (top 20 by token count) */
  topConversations: {
    conversationId: string;
    title: string | null;
    inputTokens: number;
    outputTokens: number;
    total: number;
  }[];
}

/**
 * GET /api/admin/usage/tokens?days=7
 *
 * Aggregates Anthropic token usage from the messages.metadata column.
 * Token counts are stored when the chat route calls runArchetypeTurn.
 */
export async function GET(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7", 10);
  const validDays = [7, 30, 90].includes(days) ? days : 7;
  const since = new Date(Date.now() - validDays * 24 * 60 * 60 * 1000).toISOString();

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Fetch assistant messages with token_usage metadata within the window.
  // We join through conversations to enforce org scoping.
  const { data: messages, error } = await serviceClient
    .from("messages")
    .select(
      "metadata, conversation_id, conversations!inner(org_id, title)"
    )
    .eq("role", "assistant")
    .eq("conversations.org_id", orgId)
    .gte("created_at", since)
    .not("metadata", "is", null);

  if (error) {
    console.error("[usage/tokens] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch token data" }, { status: 500 });
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheCreationTokens = 0;

  // Per-conversation accumulator
  const convMap = new Map<
    string,
    { title: string | null; inputTokens: number; outputTokens: number }
  >();

  for (const msg of messages ?? []) {
    const meta = msg.metadata as Record<string, unknown> | null;
    const usage = meta?.token_usage as Record<string, number> | undefined;
    if (!usage) continue;

    const inp = usage.input_tokens ?? 0;
    const out = usage.output_tokens ?? 0;
    const cacheRead = usage.cache_read_tokens ?? 0;
    const cacheCreate = usage.cache_creation_tokens ?? 0;

    totalInputTokens += inp;
    totalOutputTokens += out;
    totalCacheReadTokens += cacheRead;
    totalCacheCreationTokens += cacheCreate;

    const convId = msg.conversation_id as string;
    const convTitle =
      (msg.conversations as { title?: string | null } | null)?.title ?? null;

    const existing = convMap.get(convId) ?? { title: convTitle, inputTokens: 0, outputTokens: 0 };
    existing.inputTokens += inp;
    existing.outputTokens += out;
    convMap.set(convId, existing);
  }

  // Estimated cost: claude-sonnet-4-6 pricing (as of 2025)
  // $3 / MTok input, $15 / MTok output, cache read $0.30/MTok, cache write $3.75/MTok
  const estimatedCostUsd =
    (totalInputTokens / 1_000_000) * 3 +
    (totalOutputTokens / 1_000_000) * 15 +
    (totalCacheReadTokens / 1_000_000) * 0.3 +
    (totalCacheCreationTokens / 1_000_000) * 3.75;

  const topConversations = [...convMap.entries()]
    .map(([conversationId, data]) => ({
      conversationId,
      title: data.title,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      total: data.inputTokens + data.outputTokens,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  const summary: TokenUsageSummary = {
    period: `Last ${validDays} days`,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheCreationTokens,
    grandTotal: totalInputTokens + totalOutputTokens,
    estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
    topConversations,
  };

  return NextResponse.json(summary);
}
