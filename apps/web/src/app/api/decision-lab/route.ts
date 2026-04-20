import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthContext } from '@/lib/supabase/server';
import { ARCHETYPE_PROMPTS } from '@/lib/archetype-prompts';
import { ARCHETYPE_LABELS } from '@/lib/archetypes';
import { getAnthropicClientForOrg } from '@/lib/anthropic';

export interface ArchetypeResponse {
  role_slug: string;
  display_name: string;
  icon: string;
  stance: 'Support' | 'Caution' | 'Oppose';
  response_text: string;
  confidence: 'Low' | 'Medium' | 'High';
}

export interface SynthesisResult {
  consensus: string[];
  disagreements: string[];
  top_risks: string[];
  recommended_action: string;
}

export interface ScenarioResult {
  id: string;
  scenario_text: string;
  created_at: string;
  responses: ArchetypeResponse[];
  synthesis: SynthesisResult;
}

// Icons are UI-only strings (not Lucide components) — safe to keep here
const ARCHETYPE_META: Record<string, { icon: string }> = {
  executive_assistant:      { icon: 'Star' },
  development_director:     { icon: 'Landmark' },
  marketing_director:       { icon: 'Megaphone' },
  programs_director:        { icon: 'Heart' },
  hr_volunteer_coordinator: { icon: 'Users' },
  events_director:          { icon: 'Calendar' },
};

const DECISION_LAB_SUFFIX = `

## Decision Lab Response Format
You are participating in a multi-perspective decision review. Respond with:
1. Your STANCE: one word — Support, Caution, or Oppose
2. Your CONFIDENCE: one word — Low, Medium, or High
3. Your RESPONSE: 2-4 sentences from your domain perspective

Format exactly as:
STANCE: [Support|Caution|Oppose]
CONFIDENCE: [Low|Medium|High]
RESPONSE: [your analysis]`;

function parseDecisionResponse(text: string): { stance: string; confidence: string; response_text: string } {
  const lines = text.split('\n').map((l) => l.trim());
  let stance = 'Caution';
  let confidence = 'Medium';
  let responseText = text;

  for (const line of lines) {
    if (line.startsWith('STANCE:')) stance = line.replace('STANCE:', '').trim();
    if (line.startsWith('CONFIDENCE:')) confidence = line.replace('CONFIDENCE:', '').trim();
    if (line.startsWith('RESPONSE:')) responseText = line.replace('RESPONSE:', '').trim();
  }

  // Validate
  if (!['Support', 'Caution', 'Oppose'].includes(stance)) stance = 'Caution';
  if (!['Low', 'Medium', 'High'].includes(confidence)) confidence = 'Medium';

  return {
    stance,
    confidence,
    response_text: responseText,
  };
}

export async function POST(req: NextRequest) {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { scenario_text, selected_archetypes } = await req.json() as {
      scenario_text: string;
      selected_archetypes?: string[];
    };

    if (!scenario_text || typeof scenario_text !== 'string' || scenario_text.trim().length === 0) {
      return NextResponse.json({ error: 'scenario_text is required' }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Get org's Claude API key
    const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId);
    if ('error' in anthropicResult) return anthropicResult.error;
    const { client: anthropic, orgName } = anthropicResult;

    // Determine which archetypes to query
    const allSlugs = Object.keys(ARCHETYPE_META);
    const slugsToQuery = selected_archetypes?.length
      ? allSlugs.filter((s) => selected_archetypes.includes(s))
      : allSlugs;

    // Fan out Claude calls in parallel
    const callResults = await Promise.allSettled(
      slugsToQuery.map(async (slug) => {
        const basePrompt = ARCHETYPE_PROMPTS[slug] || '';
        const systemPrompt = basePrompt.replace(/\{org_name\}/g, orgName) + DECISION_LAB_SUFFIX;

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001', // Use Haiku for speed in parallel calls
          max_tokens: 512,
          temperature: 0.25,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Scenario for decision review:\n\n${scenario_text}` }],
        });

        const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
        const parsed = parseDecisionResponse(text);
        const meta = ARCHETYPE_META[slug];

        return {
          role_slug: slug,
          display_name: ARCHETYPE_LABELS[slug as keyof typeof ARCHETYPE_LABELS] ?? slug,
          icon: meta?.icon ?? 'Star',
          stance: parsed.stance as 'Support' | 'Caution' | 'Oppose',
          confidence: parsed.confidence as 'Low' | 'Medium' | 'High',
          response_text: parsed.response_text,
        };
      })
    );

    const responses: ArchetypeResponse[] = callResults
      .map((result, idx) => {
        if (result.status === 'fulfilled') return result.value;
        const slug = slugsToQuery[idx];
        const meta = ARCHETYPE_META[slug];
        return {
          role_slug: slug,
          display_name: ARCHETYPE_LABELS[slug as keyof typeof ARCHETYPE_LABELS] ?? slug,
          icon: meta?.icon ?? 'Star',
          stance: 'Caution' as const,
          confidence: 'Low' as const,
          response_text: 'Could not retrieve response from this team member.',
        };
      });

    // Build synthesis from responses
    const supporters = responses.filter((r) => r.stance === 'Support').map((r) => r.display_name);
    const opponents = responses.filter((r) => r.stance === 'Oppose').map((r) => r.display_name);
    const cautious = responses.filter((r) => r.stance === 'Caution').map((r) => r.display_name);

    const synthesis: SynthesisResult = {
      consensus: supporters.length > 0
        ? [`${supporters.join(', ')} support moving forward`]
        : ['No clear consensus among team members'],
      disagreements: opponents.length > 0 && supporters.length > 0
        ? [`${opponents.join(', ')} oppose; ${supporters.join(', ')} support`]
        : [],
      top_risks: cautious.length > 0
        ? [`${cautious.join(', ')} recommend further review before proceeding`]
        : [],
      recommended_action: supporters.length > opponents.length
        ? 'Majority support — review cautionary notes and address concerns before proceeding.'
        : 'Mixed or majority opposition — gather more information before making this decision.',
    };

    const result: ScenarioResult = {
      id: crypto.randomUUID(),
      scenario_text: scenario_text.trim(),
      created_at: new Date().toISOString(),
      responses,
      synthesis,
    };

    // Persist the decision to the database
    await serviceClient.from('decisions').insert({
      org_id: orgId,
      created_by: memberId,
      scenario_text: scenario_text.trim(),
      selected_archetypes: slugsToQuery,
      responses: responses,
      synthesis: synthesis,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[decision-lab] POST error', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: decisions, error } = await serviceClient
    .from('decisions')
    .select('id, scenario_text, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[decision-lab GET] DB error:', error);
    return NextResponse.json({ error: 'Failed to fetch decision history' }, { status: 500 });
  }

  return NextResponse.json(decisions ?? []);
}
