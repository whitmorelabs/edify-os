/**
 * Backfill token_usage metadata for historical messages.
 * Estimates tokens at ~4 chars per token (rough average for English text).
 * Run once: npx tsx scripts/backfill-token-usage.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfill() {
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, content, role, metadata")
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Failed to fetch messages:", error);
    return;
  }

  let updated = 0;
  for (const msg of messages ?? []) {
    const meta = (msg.metadata ?? {}) as Record<string, unknown>;
    if (meta.token_usage) continue;

    const content = msg.content ?? "";
    const outputTokens = Math.ceil(content.length / 4);
    const inputTokens = Math.ceil(outputTokens * 1.5);

    const updatedMeta = {
      ...meta,
      token_usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_read_input_tokens: 0,
      },
    };

    const { error: updateErr } = await supabase
      .from("messages")
      .update({ metadata: updatedMeta })
      .eq("id", msg.id);

    if (updateErr) {
      console.error(`Failed to update message ${msg.id}:`, updateErr);
    } else {
      updated++;
    }
  }

  console.log(`Backfilled ${updated} messages with estimated token usage.`);
}

backfill();
