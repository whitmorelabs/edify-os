import type { KnownBlock } from "@slack/types";
import { markdownToMrkdwn } from "../../utils/formatting";

export interface ApprovalCardParams {
  approvalId: string;
  title: string;
  summary: string;
  preview?: string;
  confidence?: number;
}

/**
 * Builds approval card blocks with title, summary, optional preview,
 * confidence score, and Approve/Edit/Reject action buttons.
 */
export function buildApprovalCardBlocks(params: ApprovalCardParams): KnownBlock[] {
  const { approvalId, title, summary, preview, confidence } = params;

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `:clipboard: ${title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: markdownToMrkdwn(summary),
      },
    },
  ];

  if (preview) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `>>> ${markdownToMrkdwn(preview)}`,
      },
    });
  }

  if (confidence !== undefined) {
    const pct = Math.round(confidence * 100);
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Confidence: *${pct}%*`,
        },
      ],
    });
  }

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

  return blocks;
}
