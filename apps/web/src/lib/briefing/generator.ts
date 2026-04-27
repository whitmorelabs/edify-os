/**
 * Briefing generator -- orchestrates all 6 agents in parallel
 * to produce a unified morning intelligence briefing.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ARCHETYPE_SLUGS, ARCHETYPE_LABELS, type ArchetypeSlug } from "@/lib/archetypes";
import { getBriefingPrompt, type AgentBriefingResponse } from "./prompts";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface BriefingPriority {
  agent: ArchetypeSlug;
  agentLabel: string;
  text: string;
  link: string;
}

export interface BriefingWeekItem {
  agent: ArchetypeSlug;
  agentLabel: string;
  items: string[];
}

export interface BriefingInputItem {
  agent: ArchetypeSlug;
  agentLabel: string;
  title: string;
  type: string;
  context: string;
  link: string;
}

export interface Briefing {
  date: string;
  priorities: BriefingPriority[];
  thisWeek: BriefingWeekItem[];
  needsInput: BriefingInputItem[];
  errors: string[];
}

/* ------------------------------------------------------------------ */
/* Urgency ranking                                                     */
/* ------------------------------------------------------------------ */

const URGENT_KEYWORDS = [
  "today", "deadline", "overdue", "due today", "urgent", "asap", "immediately",
  "end of day", "eod", "this morning", "this afternoon",
];
const SOON_KEYWORDS = [
  "this week", "tomorrow", "friday", "by end of week", "next few days",
];

function urgencyScore(text: string): number {
  const lower = text.toLowerCase();
  for (const kw of URGENT_KEYWORDS) {
    if (lower.includes(kw)) return 3;
  }
  for (const kw of SOON_KEYWORDS) {
    if (lower.includes(kw)) return 2;
  }
  return 1;
}

/* ------------------------------------------------------------------ */
/* Agent link helper                                                   */
/* ------------------------------------------------------------------ */

function agentChatLink(slug: ArchetypeSlug): string {
  return `/dashboard/team/${slug}`;
}

/* ------------------------------------------------------------------ */
/* Parse agent response                                                */
/* ------------------------------------------------------------------ */

function parseAgentResponse(raw: string): AgentBriefingResponse | null {
  try {
    // Try direct JSON parse first
    const parsed = JSON.parse(raw);
    return validateResponse(parsed);
  } catch {
    // Try to extract JSON from markdown code blocks or surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return validateResponse(parsed);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function validateResponse(obj: unknown): AgentBriefingResponse | null {
  if (!obj || typeof obj !== "object") return null;
  const data = obj as Record<string, unknown>;

  return {
    priority: typeof data.priority === "string" ? data.priority : null,
    thisWeek: Array.isArray(data.thisWeek)
      ? data.thisWeek.filter((x): x is string => typeof x === "string")
      : [],
    needsInput: Array.isArray(data.needsInput)
      ? data.needsInput
          .filter(
            (x): x is { title: string; type: "approve" | "review" | "decide"; context: string } =>
              typeof x === "object" &&
              x !== null &&
              typeof (x as Record<string, unknown>).title === "string"
          )
          .map((x) => ({
            title: x.title,
            type: ["approve", "review", "decide"].includes(x.type) ? x.type : "review",
            context: typeof x.context === "string" ? x.context : "",
          }))
      : [],
  };
}

/* ------------------------------------------------------------------ */
/* Single agent call                                                   */
/* ------------------------------------------------------------------ */

async function callAgent(
  client: Anthropic,
  slug: ArchetypeSlug,
  orgName: string,
  orgContext: string
): Promise<{ slug: ArchetypeSlug; response: AgentBriefingResponse | null; error?: string }> {
  const prompt = getBriefingPrompt(slug, orgName, orgContext);
  try {
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";
    const parsed = parseAgentResponse(text);

    if (!parsed) {
      return { slug, response: null, error: `${ARCHETYPE_LABELS[slug]}: malformed response` };
    }

    return { slug, response: parsed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[briefing] Agent ${slug} failed:`, msg);
    return { slug, response: null, error: `${ARCHETYPE_LABELS[slug]}: ${msg}` };
  }
}

/* ------------------------------------------------------------------ */
/* Main generator                                                      */
/* ------------------------------------------------------------------ */

export async function generateBriefing(
  client: Anthropic,
  orgName: string,
  orgContext: string
): Promise<{ briefing: Briefing; rawResponses: Record<string, unknown> }> {
  const today = new Date().toISOString().split("T")[0];

  // Call all 6 agents in parallel
  const results = await Promise.all(
    ARCHETYPE_SLUGS.map((slug) => callAgent(client, slug, orgName, orgContext))
  );

  const rawResponses: Record<string, unknown> = {};
  const priorities: BriefingPriority[] = [];
  const thisWeek: BriefingWeekItem[] = [];
  const needsInput: BriefingInputItem[] = [];
  const errors: string[] = [];

  for (const result of results) {
    const { slug, response, error } = result;
    const label = ARCHETYPE_LABELS[slug];
    const link = agentChatLink(slug);

    rawResponses[slug] = response ?? { error };

    if (error) {
      errors.push(error);
    }

    if (!response) continue;

    // Collect priority
    if (response.priority) {
      priorities.push({ agent: slug, agentLabel: label, text: response.priority, link });
    }

    // Collect this week items
    if (response.thisWeek.length > 0) {
      thisWeek.push({ agent: slug, agentLabel: label, items: response.thisWeek });
    }

    // Collect needs input items
    for (const item of response.needsInput) {
      needsInput.push({
        agent: slug,
        agentLabel: label,
        title: item.title,
        type: item.type,
        context: item.context,
        link,
      });
    }
  }

  // Rank priorities by urgency
  priorities.sort((a, b) => urgencyScore(b.text) - urgencyScore(a.text));

  const briefing: Briefing = {
    date: today,
    priorities,
    thisWeek,
    needsInput,
    errors,
  };

  return { briefing, rawResponses };
}
