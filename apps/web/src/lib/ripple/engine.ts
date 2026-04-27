/**
 * Ripple Engine — processes an org_event and generates follow-up actions
 * for each subscriber agent using Haiku.
 *
 * For each subscriber, we ask Haiku (in the voice of that agent role) what
 * the most important response action is. The result is saved as a
 * ripple_action row.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_TYPES, type EventType } from "@/lib/ripple/event-types";
import { ARCHETYPE_LABELS } from "@/lib/archetypes";

interface OrgEvent {
  id: string;
  org_id: string;
  event_type: string;
  source_agent: string;
  payload: { title: string; details: string };
}

interface RippleAction {
  event_id: string;
  org_id: string;
  target_agent: string;
  action_type: string;
  title: string;
  content: string;
  status: string;
}

/**
 * Process a single org_event: generate ripple actions for all subscribers
 * and save them to the database.
 */
export async function processRippleEvent({
  event,
  serviceClient,
  anthropicClient,
}: {
  event: OrgEvent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  anthropicClient: Anthropic;
}): Promise<RippleAction[]> {
  const eventConfig = EVENT_TYPES[event.event_type as EventType];
  if (!eventConfig) {
    console.error(`[ripple-engine] Unknown event type: ${event.event_type}`);
    return [];
  }

  // Filter out the source agent from subscribers — they already handled it
  const subscribers = eventConfig.subscribers.filter(
    (slug) => slug !== event.source_agent,
  );

  if (subscribers.length === 0) {
    // Mark processed even if no subscribers
    await serviceClient
      .from("org_events")
      .update({ processed: true })
      .eq("id", event.id);
    return [];
  }

  // Generate actions for all subscribers in parallel
  const actionPromises = subscribers.map(async (agentSlug) => {
    const agentLabel =
      ARCHETYPE_LABELS[agentSlug as keyof typeof ARCHETYPE_LABELS] ??
      agentSlug;

    const prompt = `You are the ${agentLabel} for a nonprofit organization. The following organizational event just happened:

Event type: ${eventConfig.label}
Title: ${event.payload.title}
Details: ${event.payload.details}

What is the single most important action you should take in response to this event? Be specific and actionable, not generic.

Respond with ONLY a JSON object (no markdown, no explanation outside JSON):
{ "action_type": "draft" | "schedule" | "flag" | "create", "title": "brief action title (under 15 words)", "content": "specific description of what you would do (2-3 sentences max)" }`;

    try {
      const response = await anthropicClient.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();

      // Parse the JSON response — handle potential markdown wrapping
      const jsonStr = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(jsonStr) as {
        action_type: string;
        title: string;
        content: string;
      };

      const validTypes = ["draft", "schedule", "flag", "create"];
      const actionType = validTypes.includes(parsed.action_type)
        ? parsed.action_type
        : "flag";

      return {
        event_id: event.id,
        org_id: event.org_id,
        target_agent: agentSlug,
        action_type: actionType,
        title: parsed.title || `Action for ${agentLabel}`,
        content: parsed.content || "",
        status: "pending",
      };
    } catch (err) {
      console.error(
        `[ripple-engine] Failed to generate action for ${agentSlug}:`,
        err,
      );
      // Return a fallback action so the subscriber isn't silently skipped
      return {
        event_id: event.id,
        org_id: event.org_id,
        target_agent: agentSlug,
        action_type: "flag",
        title: `Review: ${event.payload.title}`,
        content: `The event "${event.payload.title}" may require your attention. Details: ${event.payload.details}`,
        status: "pending",
      };
    }
  });

  const actions = await Promise.all(actionPromises);

  // Bulk insert all actions
  if (actions.length > 0) {
    const { error: insertError } = await serviceClient
      .from("ripple_actions")
      .insert(actions);

    if (insertError) {
      console.error(
        "[ripple-engine] Failed to insert ripple_actions:",
        insertError,
      );
    }
  }

  // Mark the event as processed
  await serviceClient
    .from("org_events")
    .update({ processed: true })
    .eq("id", event.id);

  return actions;
}
