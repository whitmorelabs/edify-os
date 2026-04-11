// -------------------------------------------------------------------
// Decision Lab — client-side API wrapper
// All calls go through Next.js API routes, which proxy to the backend.
// If the backend is unavailable, the route returns mock data.
// -------------------------------------------------------------------

export type Stance = 'Support' | 'Caution' | 'Oppose';
export type Confidence = 'Low' | 'Medium' | 'High';

export interface ArchetypeResponse {
  role_slug: string;
  display_name: string;
  icon: string;
  stance: Stance;
  response_text: string;
  confidence: Confidence;
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

export interface ScenarioSummary {
  id: string;
  scenario_text: string;
  created_at: string;
}

// -------------------------------------------------------------------
// Run a scenario through the full team
// -------------------------------------------------------------------
export async function runScenario(
  scenarioText: string,
  selectedArchetypes?: string[],
): Promise<ScenarioResult> {
  const res = await fetch('/api/decision-lab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario_text: scenarioText,
      selected_archetypes: selectedArchetypes,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Decision Lab error ${res.status}: ${text}`);
  }

  return res.json() as Promise<ScenarioResult>;
}

// -------------------------------------------------------------------
// Get list of past scenarios
// -------------------------------------------------------------------
export async function getHistory(): Promise<ScenarioSummary[]> {
  const res = await fetch('/api/decision-lab', { method: 'GET' });
  if (!res.ok) return [];
  return res.json() as Promise<ScenarioSummary[]>;
}

// -------------------------------------------------------------------
// Load a specific scenario's full results
// -------------------------------------------------------------------
export async function getScenario(id: string): Promise<ScenarioResult> {
  const res = await fetch(`/api/decision-lab/${id}`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Could not load scenario ${id}`);
  }
  return res.json() as Promise<ScenarioResult>;
}

// -------------------------------------------------------------------
// Ask a follow-up to a specific team member
// -------------------------------------------------------------------
export async function askFollowUp(
  scenarioId: string,
  archetype: string,
  question: string,
): Promise<ArchetypeResponse> {
  const res = await fetch(`/api/decision-lab/${scenarioId}/follow-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archetype_slug: archetype, question }),
  });

  if (!res.ok) {
    // Graceful fallback: return a mock follow-up response
    return {
      role_slug: archetype,
      display_name: archetype.replace(/_/g, ' '),
      icon: 'MessageCircle',
      stance: 'Caution',
      response_text:
        "That's a great follow-up question. Based on the original scenario context, I'd want more information before giving a definitive answer. Can you share any additional details about the timeline or budget constraints?",
      confidence: 'Medium',
    };
  }

  return res.json() as Promise<ArchetypeResponse>;
}
