// Client-side Claude API caller.
// All calls happen in the browser using the user's BYOK key stored in localStorage.
// Uses the anthropic-dangerous-direct-browser-access header for CORS.

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  id: string;
  content: string;
  role: "assistant";
  timestamp: string;
}

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

/**
 * Send a chat message to Claude using the user's API key.
 * Returns the assistant's response.
 */
export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  messages: ClaudeMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<ClaudeResponse> {
  const { maxTokens = 4096, temperature = 0.3 } = options;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    let errorMessage = `Claude API error ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed?.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  const content =
    data?.content?.[0]?.type === "text"
      ? (data.content[0].text as string)
      : "";

  return {
    id: data.id ?? crypto.randomUUID(),
    content,
    role: "assistant",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fan out calls to all 7 archetypes in parallel for Decision Lab.
 * Each archetype gets its own system prompt and produces an independent response.
 */
export async function callClaudeParallel(
  apiKey: string,
  calls: Array<{
    slug: string;
    systemPrompt: string;
    userMessage: string;
  }>,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<Array<{ slug: string; content: string; error?: string }>> {
  const { maxTokens = 2048, temperature = 0.25 } = options;

  const results = await Promise.allSettled(
    calls.map(async ({ slug, systemPrompt, userMessage }) => {
      const response = await callClaude(
        apiKey,
        systemPrompt,
        [{ role: "user", content: userMessage }],
        { maxTokens, temperature }
      );
      return { slug, content: response.content };
    })
  );

  return results.map((result, idx) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      slug: calls[idx].slug,
      content: "",
      error:
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown error",
    };
  });
}
