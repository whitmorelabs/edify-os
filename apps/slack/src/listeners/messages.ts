import type { App, MessageEvent } from "@slack/bolt";
import type { Config } from "../config";
import { EdifyApiClient } from "../services/api-client";
import { buildAgentResponseBlocks } from "../views/blocks/agent-response";

/**
 * Detects which agent the user wants to talk to based on message content.
 * Falls back to executive_assistant if no specific agent is mentioned.
 */
function detectAgent(text: string): string {
  const normalized = text.toLowerCase();

  const agentKeywords: Record<string, string[]> = {
    sales_rep: ["sales", "deal", "pipeline", "prospect", "lead"],
    marketing_strategist: ["marketing", "campaign", "content", "seo", "brand"],
    customer_success: ["customer", "support", "ticket", "churn", "onboard"],
    data_analyst: ["data", "analytics", "report", "metrics", "dashboard"],
    engineer: ["code", "deploy", "bug", "feature", "release"],
    hr_manager: ["hiring", "recruit", "onboard", "pto", "benefits"],
  };

  for (const [agent, keywords] of Object.entries(agentKeywords)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return agent;
    }
  }

  return "executive_assistant";
}

export function registerMessageListeners(app: App, config: Config): void {
  const api = new EdifyApiClient(config.API_URL);

  // Handle direct messages only
  app.message(async ({ message, client, say }) => {
    // Only handle standard user messages in DMs
    const msg = message as MessageEvent & { channel_type?: string };
    if (msg.channel_type !== "im" || msg.subtype || !msg.text) {
      return;
    }

    const userText = msg.text;
    const slackUserId = msg.user;

    // Post a thinking indicator
    const thinkingMsg = await client.chat.postMessage({
      channel: msg.channel,
      thread_ts: msg.ts,
      text: ":hourglass_flowing_sand: Thinking...",
    });

    try {
      const agent = detectAgent(userText);
      const authToken = await api.resolveAuthToken(slackUserId);

      // Create or reuse a conversation - using the channel as a stable ID
      const conversationId = `slack-dm-${slackUserId}`;

      const response = await api.sendMessage(authToken, conversationId, {
        role: agent,
        content: userText,
      });

      const blocks = buildAgentResponseBlocks({
        agentName: response.agent ?? agent,
        text: response.content,
        confidence: response.confidence,
        approvalId: response.approvalId,
      });

      // Update the thinking message with the actual response
      await client.chat.update({
        channel: msg.channel,
        ts: thinkingMsg.ts!,
        text: response.content,
        blocks,
      });
    } catch (error) {
      console.error("[edify-slack] Message handling error:", error);

      await client.chat.update({
        channel: msg.channel,
        ts: thinkingMsg.ts!,
        text: ":warning: Sorry, I ran into an issue processing your request. Please try again.",
      });
    }
  });
}
