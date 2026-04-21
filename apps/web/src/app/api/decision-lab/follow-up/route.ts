import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthContext } from '@/lib/supabase/server';
import { ARCHETYPE_PROMPTS } from '@/lib/archetype-prompts';
import { ARCHETYPE_LABELS } from '@/lib/archetypes';
import { getAnthropicClientForOrg } from '@/lib/anthropic';

// Icons are UI-only strings — keep in sync with decision-lab/route.ts
const ARCHETYPE_META: Record<string, { icon: string }> = {
  executive_assistant:      { icon: 'Star' },
  development_director:     { icon: 'Landmark' },
  marketing_director:       { icon: 'Megaphone' },
  programs_director:        { icon: 'Heart' },
  hr_volunteer_coordinator: { icon: 'Users' },
  events_director:          { icon: 'Calendar' },
};

const FOLLOW_UP_SUFFIX = `

## Follow-Up Response Format
You are answering a follow-up question about a decision your team already reviewed.
Respond directly and analytically from your domain perspective.
- Reference the original scenario and your prior stance where relevant.
- Be concise: 2-4 sentences unless more detail is clearly warranted.
- Maintain your archetype voice and expertise.

At the top of your response, restate your stance and confidence using exactly:
STANCE: [Support|Caution|Oppose]
CONFIDENCE: [Low|Medium|High]
RESPONSE: [your analysis]`;

function parseDecisionResponse(
  text: string,
): { stance: 'Support' | 'Caution' | 'Oppose'; confidence: 'Low' | 'Medium' | 'High'; response_text: string } {
  const lines = text.split('\n').map((l) => l.trim());
  let stance: string = 'Caution';
  let confidence: string = 'Medium';
  let responseText = text;

  for (const line of lines) {
    if (line.startsWith('STANCE:')) stance = line.replace('STANCE:', '').trim();
    if (line.startsWith('CONFIDENCE:')) confidence = line.replace('CONFIDENCE:', '').trim();
    if (line.startsWith('RESPONSE:')) responseText = line.replace('RESPONSE:', '').trim();
  }

  if (!['Support', 'Caution', 'Oppose'].includes(stance)) stance = 'Caution';
  if (!['Low', 'Medium', 'High'].includes(confidence)) confidence = 'Medium';

  return {
    stance: stance as 'Support' | 'Caution' | 'Oppose',
    confidence: confidence as 'Low' | 'Medium' | 'High',
    response_text: responseText,
  };
}

export async function POST(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { scenarioId, question, archetype_slug } = await req.json() as {
      scenarioId: string;
      question: string;
      archetype_slug: string;
    };

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }
    if (!archetype_slug || typeof archetype_slug !== 'string') {
      return NextResponse.json({ error: 'archetype_slug is required' }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Get org's Anthropic client + org name for prompt injection
    const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId);
    if ('error' in anthropicResult) return anthropicResult.error;
    const { client: anthropic, orgName } = anthropicResult;

    // Build system prompt for this archetype
    const basePrompt = ARCHETYPE_PROMPTS[archetype_slug] || '';
    const systemPrompt = basePrompt.replace(/\{org_name\}/g, orgName) + FOLLOW_UP_SUFFIX;

    // Fetch original scenario context from DB (best-effort: if not found, still answer)
    let contextMessage = `Follow-up question: ${question.trim()}`;
    if (scenarioId) {
      const { data: decisionRow } = await serviceClient
        .from('decisions')
        .select('scenario_text, responses')
        .eq('org_id', orgId)
        .eq('id', scenarioId)
        .single();

      if (decisionRow) {
        const scenarioText = decisionRow.scenario_text as string;
        const responses = decisionRow.responses as Array<{ role_slug: string; response_text: string }> | null;
        const originalResponse = responses?.find((r) => r.role_slug === archetype_slug);

        contextMessage = [
          `The original scenario was: "${scenarioText}"`,
          originalResponse
            ? `Your initial response was: "${originalResponse.response_text}"`
            : null,
          `Follow-up question: ${question.trim()}`,
        ]
          .filter(Boolean)
          .join('\n\n');
      }
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.25,
      system: systemPrompt,
      messages: [{ role: 'user', content: contextMessage }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const parsed = parseDecisionResponse(text);
    const meta = ARCHETYPE_META[archetype_slug];

    const response = {
      role_slug: archetype_slug,
      display_name: ARCHETYPE_LABELS[archetype_slug as keyof typeof ARCHETYPE_LABELS] ?? archetype_slug,
      icon: meta?.icon ?? 'Star',
      stance: parsed.stance,
      confidence: parsed.confidence,
      response_text: parsed.response_text,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[decision-lab/follow-up] POST error', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
