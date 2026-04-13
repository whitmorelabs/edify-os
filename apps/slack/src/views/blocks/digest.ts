import type { KnownBlock } from "@slack/types";

export interface DigestItem {
  title: string;
  agent: string;
  detail?: string;
}

export interface DigestParams {
  completed: DigestItem[];
  inProgress: DigestItem[];
  needsInput: DigestItem[];
  date?: string;
}

/**
 * Builds daily digest blocks with sections for Completed,
 * In Progress, and Needs Input.
 */
export function buildDigestBlocks(params: DigestParams): KnownBlock[] {
  const { completed, inProgress, needsInput, date } = params;
  const displayDate = date ?? new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const blocks: KnownBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `:newspaper: Daily Digest - ${displayDate}`,
        emoji: true,
      },
    },
  ];

  // Completed section
  blocks.push(
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:white_check_mark: *Completed* (${completed.length})`,
      },
    }
  );

  if (completed.length === 0) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: "_No completed tasks today._" }],
    });
  } else {
    for (const item of completed) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `~${item.title}~ - _${item.agent}_${item.detail ? `\n${item.detail}` : ""}`,
        },
      });
    }
  }

  // In Progress section
  blocks.push(
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:arrows_counterclockwise: *In Progress* (${inProgress.length})`,
      },
    }
  );

  if (inProgress.length === 0) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: "_Nothing in progress._" }],
    });
  } else {
    for (const item of inProgress) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${item.title}* - _${item.agent}_${item.detail ? `\n${item.detail}` : ""}`,
        },
      });
    }
  }

  // Needs Input section
  blocks.push(
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:raised_hand: *Needs Input* (${needsInput.length})`,
      },
    }
  );

  if (needsInput.length === 0) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: "_No items waiting for input._" }],
    });
  } else {
    for (const item of needsInput) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:warning: *${item.title}* - _${item.agent}_${item.detail ? `\n${item.detail}` : ""}`,
        },
      });
    }
  }

  return blocks;
}
