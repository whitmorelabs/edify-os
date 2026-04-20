// -------------------------------------------------------------------
// Decision Lab -- client-side API wrapper
// runScenario POSTs to the server-side /api/decision-lab route which
// uses the org's encrypted API key.  localStorage history helpers are
// client-only and do not touch Claude.
// -------------------------------------------------------------------

export type Stance = "Support" | "Caution" | "Oppose";
export type Confidence = "Low" | "Medium" | "High";

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

const DECISION_LAB_STORAGE_KEY = "edify_decision_lab_history";

// -------------------------------------------------------------------
// localStorage history
// -------------------------------------------------------------------
function saveToHistory(summary: ScenarioSummary): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(DECISION_LAB_STORAGE_KEY);
    const history: ScenarioSummary[] = raw ? JSON.parse(raw) : [];
    history.unshift(summary);
    // Keep last 20
    localStorage.setItem(
      DECISION_LAB_STORAGE_KEY,
      JSON.stringify(history.slice(0, 20))
    );
  } catch {
    // ignore
  }
}

function loadHistory(): ScenarioSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DECISION_LAB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScenarioResult(result: ScenarioResult): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `edify_decision_lab_result_${result.id}`,
      JSON.stringify(result)
    );
  } catch {
    // ignore
  }
}

function loadScenarioResult(id: string): ScenarioResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`edify_decision_lab_result_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// Run a scenario through the full team (server-side, org encrypted key)
// -------------------------------------------------------------------
export async function runScenario(
  scenarioText: string,
  selectedArchetypes?: string[]
): Promise<ScenarioResult> {
  const res = await fetch("/api/decision-lab", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenario_text: scenarioText,
      selected_archetypes: selectedArchetypes,
    }),
  });

  if (!res.ok) {
    let serverMsg = "Server error";
    try {
      const data = await res.json();
      if (data?.error) serverMsg = data.error;
    } catch { /* ignore parse */ }
    throw new Error(`${res.status}: ${serverMsg}`);
  }

  const result = await res.json() as ScenarioResult;

  // Persist to localStorage for offline history browsing
  saveScenarioResult(result);
  saveToHistory({
    id: result.id,
    scenario_text: result.scenario_text,
    created_at: result.created_at,
  });

  return result;
}

// -------------------------------------------------------------------
// Get list of past scenarios
// -------------------------------------------------------------------
export async function getHistory(): Promise<ScenarioSummary[]> {
  return loadHistory();
}

// -------------------------------------------------------------------
// Load a specific scenario's full results (from localStorage)
// -------------------------------------------------------------------
export async function getScenario(id: string): Promise<ScenarioResult> {
  const result = loadScenarioResult(id);
  if (!result) {
    throw new Error(`Could not load scenario ${id}`);
  }
  return result;
}

// -------------------------------------------------------------------
// Ask a follow-up to a specific team member
// NOTE: No server route exists for follow-ups yet — this remains a
// client-side call using getApiKey until a /api/decision-lab/follow-up
// route is built.  Tracked for a future PRD.
// -------------------------------------------------------------------
export async function askFollowUp(
  scenarioId: string,
  archetype: string,
  question: string
): Promise<ArchetypeResponse> {
  const { getApiKey } = await import("@/lib/api-key");
  const { getOrgContext } = await import("@/lib/org-context");
  const { getSystemPrompt } = await import("@/lib/archetype-prompts");
  const { callClaude } = await import("@/lib/claude-client");

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No API key set. Please add your Claude API key in AI Configuration.");
  }

  const orgContext = getOrgContext();
  const systemPrompt = getSystemPrompt(archetype, orgContext);

  // Load the original scenario for context
  const scenario = loadScenarioResult(scenarioId);
  const originalResponse = scenario?.responses.find(
    (r) => r.role_slug === archetype
  );

  const contextMessage = scenario
    ? `The original scenario was: "${scenario.scenario_text}"\n\nYour initial response was: "${originalResponse?.response_text ?? ""}"\n\nFollow-up question: ${question}`
    : question;

  const response = await callClaude(
    apiKey,
    systemPrompt,
    [{ role: "user", content: contextMessage }],
    { maxTokens: 2048, temperature: 0.25 }
  );

  // Inline parse (no longer importing the deleted helper)
  const lowerText = response.content.toLowerCase();
  let stance: Stance = "Caution";
  if (
    lowerText.includes("i support") ||
    lowerText.includes("support this") ||
    lowerText.includes("recommend moving forward") ||
    lowerText.match(/stance:?\s*support/)
  ) {
    stance = "Support";
  } else if (
    lowerText.includes("i oppose") ||
    lowerText.includes("oppose this") ||
    lowerText.includes("recommend against") ||
    lowerText.match(/stance:?\s*oppose/)
  ) {
    stance = "Oppose";
  }

  let confidence: Confidence = "Medium";
  if (lowerText.match(/confidence:?\s*high/) || lowerText.includes("high confidence")) {
    confidence = "High";
  } else if (lowerText.match(/confidence:?\s*low/) || lowerText.includes("low confidence")) {
    confidence = "Low";
  }

  // Reconstruct display_name / icon from slug
  const ARCHETYPE_META: Record<string, { display_name: string; icon: string }> = {
    development_director: { display_name: "Development Director", icon: "Landmark" },
    marketing_director:   { display_name: "Marketing Director",   icon: "Megaphone" },
    executive_assistant:  { display_name: "Executive Assistant",  icon: "CalendarCheck" },
    programs_director:    { display_name: "Programs Director",    icon: "BookOpen" },
    hr_volunteer_coordinator: { display_name: "HR & Volunteer Coordinator", icon: "UserCheck" },
    events_director:      { display_name: "Events Director",      icon: "CalendarDays" },
  };
  const meta = ARCHETYPE_META[archetype] ?? {
    display_name: archetype.replace(/_/g, " "),
    icon: "MessageCircle",
  };

  return {
    role_slug: archetype,
    display_name: meta.display_name,
    icon: meta.icon,
    stance,
    response_text: response.content,
    confidence,
  };
}
