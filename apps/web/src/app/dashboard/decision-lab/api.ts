// -------------------------------------------------------------------
// Decision Lab -- client-side API wrapper
// All Claude calls happen directly from the browser using the user's BYOK key.
// -------------------------------------------------------------------

import { getApiKey } from "@/lib/api-key";
import { getOrgContext } from "@/lib/org-context";
import { getSystemPrompt } from "@/lib/archetype-prompts";
import { callClaude, callClaudeParallel } from "@/lib/claude-client";

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

// -------------------------------------------------------------------
// Archetype metadata for Decision Lab display
// -------------------------------------------------------------------
const ARCHETYPE_META: Record<
  string,
  { display_name: string; icon: string }
> = {
  development_director: {
    display_name: "Development Director",
    icon: "Landmark",
  },
  marketing_director: {
    display_name: "Marketing Director",
    icon: "Megaphone",
  },
  executive_assistant: {
    display_name: "Executive Assistant",
    icon: "CalendarCheck",
  },
  programs_director: {
    display_name: "Programs Director",
    icon: "BookOpen",
  },
  hr_volunteer_coordinator: {
    display_name: "HR & Volunteer Coordinator",
    icon: "UserCheck",
  },
  events_director: {
    display_name: "Events Director",
    icon: "CalendarDays",
  },
};

const ALL_SLUGS = Object.keys(ARCHETYPE_META);

const DECISION_LAB_STORAGE_KEY = "edify_decision_lab_history";

// -------------------------------------------------------------------
// Parse Claude's response to extract stance, confidence, and text
// -------------------------------------------------------------------
function parseArchetypeResponse(
  slug: string,
  rawText: string
): ArchetypeResponse {
  const meta = ARCHETYPE_META[slug] ?? {
    display_name: slug.replace(/_/g, " "),
    icon: "MessageCircle",
  };

  // Try to parse stance from the response text
  let stance: Stance = "Caution";
  const lowerText = rawText.toLowerCase();
  if (
    lowerText.includes("i support") ||
    lowerText.includes("support this") ||
    lowerText.includes("recommend moving forward") ||
    lowerText.includes("i recommend") ||
    lowerText.match(/\bsupport\b.*\bstance\b/) ||
    lowerText.match(/stance:?\s*support/)
  ) {
    stance = "Support";
  } else if (
    lowerText.includes("i oppose") ||
    lowerText.includes("oppose this") ||
    lowerText.includes("recommend against") ||
    lowerText.match(/\boppose\b.*\bstance\b/) ||
    lowerText.match(/stance:?\s*oppose/)
  ) {
    stance = "Oppose";
  }

  // Try to parse confidence
  let confidence: Confidence = "Medium";
  if (
    lowerText.match(/confidence:?\s*high/) ||
    lowerText.includes("high confidence")
  ) {
    confidence = "High";
  } else if (
    lowerText.match(/confidence:?\s*low/) ||
    lowerText.includes("low confidence")
  ) {
    confidence = "Low";
  }

  return {
    role_slug: slug,
    display_name: meta.display_name,
    icon: meta.icon,
    stance,
    response_text: rawText,
    confidence,
  };
}

// -------------------------------------------------------------------
// Build synthesis from all responses
// -------------------------------------------------------------------
function buildSynthesis(responses: ArchetypeResponse[]): SynthesisResult {
  const supporters = responses
    .filter((r) => r.stance === "Support")
    .map((r) => r.display_name);
  const cautious = responses
    .filter((r) => r.stance === "Caution")
    .map((r) => r.display_name);
  const opposers = responses
    .filter((r) => r.stance === "Oppose")
    .map((r) => r.display_name);

  const consensus: string[] = [];
  const disagreements: string[] = [];

  if (supporters.length > 0 && cautious.length === 0 && opposers.length === 0) {
    consensus.push("All team members support moving forward");
  } else if (opposers.length > 0 && supporters.length === 0) {
    consensus.push("Team consensus leans toward not proceeding at this time");
  } else if (cautious.length === responses.length) {
    consensus.push("Team consensus is to proceed with caution and gather more information");
  }

  if (supporters.length > 0) {
    consensus.push(`${supporters.join(", ")} see opportunity here`);
  }

  if (supporters.length > 0 && opposers.length > 0) {
    disagreements.push(
      `${supporters.join(", ")} support the direction; ${opposers.join(", ")} recommend against it`
    );
  }

  if (cautious.length > 0 && (supporters.length > 0 || opposers.length > 0)) {
    disagreements.push(
      `${cautious.join(", ")} are taking a wait-and-see position`
    );
  }

  const top_risks = responses
    .filter((r) => r.stance !== "Support" && r.confidence === "High")
    .slice(0, 3)
    .map((r) => `${r.display_name}: ${r.response_text.slice(0, 120)}...`);

  let recommended_action =
    "Review the team responses carefully and consider scheduling a leadership discussion before making a final call.";
  if (supporters.length > cautious.length + opposers.length) {
    recommended_action =
      "The majority of the team supports moving forward. Address the concerns raised by cautious members and define clear success metrics before proceeding.";
  } else if (opposers.length > supporters.length) {
    recommended_action =
      "The team has significant reservations. Gather additional information to address the concerns raised before committing to this direction.";
  }

  return { consensus, disagreements, top_risks, recommended_action };
}

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
// Run a scenario through the full team
// -------------------------------------------------------------------
export async function runScenario(
  scenarioText: string,
  selectedArchetypes?: string[]
): Promise<ScenarioResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "No API key set. Please add your Claude API key in AI Configuration."
    );
  }

  const orgContext = getOrgContext();
  const slugs =
    selectedArchetypes && selectedArchetypes.length > 0
      ? selectedArchetypes.filter((s) => ALL_SLUGS.includes(s))
      : ALL_SLUGS;

  const decisionLabWrapper = (roleLabel: string) =>
    `You are participating in a Decision Lab. A scenario has been presented to your leadership team. Analyze this from your perspective as ${roleLabel}. Be direct and honest. Structure your response as:

Stance: [Support / Caution / Oppose]
Confidence: [Low / Medium / High]

Then give your analysis in 3-5 sentences covering: your key considerations, what you'd want to know more about, and your recommendation.

Scenario: ${scenarioText}`;

  const calls = slugs.map((slug) => {
    const systemPrompt = getSystemPrompt(slug, orgContext);
    const userMessage = decisionLabWrapper(
      ARCHETYPE_META[slug]?.display_name ?? slug
    );
    return { slug, systemPrompt, userMessage };
  });

  const rawResults = await callClaudeParallel(apiKey, calls, {
    maxTokens: 2048,
    temperature: 0.25,
  });

  const responses: ArchetypeResponse[] = rawResults.map((r) => {
    if (r.error || !r.content) {
      const meta = ARCHETYPE_META[r.slug] ?? {
        display_name: r.slug,
        icon: "MessageCircle",
      };
      return {
        role_slug: r.slug,
        display_name: meta.display_name,
        icon: meta.icon,
        stance: "Caution" as Stance,
        response_text: r.error
          ? `Unable to get response: ${r.error}`
          : "No response received.",
        confidence: "Low" as Confidence,
      };
    }
    return parseArchetypeResponse(r.slug, r.content);
  });

  const synthesis = buildSynthesis(responses);

  const result: ScenarioResult = {
    id: crypto.randomUUID(),
    scenario_text: scenarioText,
    created_at: new Date().toISOString(),
    responses,
    synthesis,
  };

  saveScenarioResult(result);
  saveToHistory({
    id: result.id,
    scenario_text: scenarioText,
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
// Load a specific scenario's full results
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
// -------------------------------------------------------------------
export async function askFollowUp(
  scenarioId: string,
  archetype: string,
  question: string
): Promise<ArchetypeResponse> {
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

  return parseArchetypeResponse(archetype, response.content);
}
