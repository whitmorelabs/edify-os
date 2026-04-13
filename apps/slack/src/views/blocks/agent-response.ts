import type { KnownBlock } from "@slack/types";
import { markdownToMrkdwn } from "../../utils/formatting";

export interface AgentResponseParams {
  agentName: string;
  text: string;
  confidence?: number;
  approvalId?: string;
}

/**
 * Builds Slack Block Kit blocks for an agent response.
 * Includes the agent name, response text, confidence score,
 * and action buttons when an approval is required.
 */
export function buildAgentResponseBlocks(params: AgentResponseParams): KnownBlock[] {
  const { agentName, text, confidence, approvalId } = params;

  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*:robot_face: ${agentName}*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: markdownToMrkdwn(text),
      },
    },
  ];

  if (confidence !== undefined) {
    const pct = Math.round(confidence * 100);
    const bar = confidenceBar(confidence);
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Confidence: ${bar} ${pct}%`,
        },
      ],
    });
  }

  if (approvalId) {
    blocks.push(
      { type: "divider" },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Approve" },
            style: "primary",
            action_id: "approval_approve",
            value: approvalId,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Edit" },
            action_id: "approval_edit",
            value: approvalId,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Reject" },
            style: "danger",
            action_id: "approval_reject",
            value: approvalId,
          },
        ],
      }
    );
  }

  return blocks;
}

function confidenceBar(score: number): string {
  const filled = Math.round(score * 5);
  return ":large_green_square:".repeat(filled) + ":white_large_square:".repeat(5 - filled);
}
