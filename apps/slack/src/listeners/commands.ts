import type { App } from "@slack/bolt";
import type { Config } from "../config";
import { EdifyApiClient } from "../services/api-client";
import { buildAgentResponseBlocks } from "../views/blocks/agent-response";
import { buildApprovalCardBlocks } from "../views/blocks/approval-card";

export function registerCommandListeners(app: App, config: Config): void {
  const api = new EdifyApiClient(config.API_URL);

  app.command("/edify", async ({ command, ack, respond }) => {
    await ack();

    const rawText = command.text.trim();
    const [subcommand, ...rest] = rawText.split(/\s+/);

    try {
      const authToken = await api.resolveAuthToken(command.user_id);

      switch (subcommand?.toLowerCase()) {
        case "ask": {
          const [role, ...messageParts] = rest;
          if (!role || messageParts.length === 0) {
            await respond({
              response_type: "ephemeral",
              text: "Usage: `/edify ask [role] [message]`\nExample: `/edify ask sales_rep How is the Q2 pipeline?`",
            });
            return;
          }

          const conversationId = `slack-cmd-${command.user_id}`;
          const message = messageParts.join(" ");

          const response = await api.sendMessage(authToken, conversationId, {
            role,
            content: message,
          });

          const blocks = buildAgentResponseBlocks({
            agentName: response.agent ?? role,
            text: response.content,
            confidence: response.confidence,
            approvalId: response.approvalId,
          });

          await respond({ response_type: "ephemeral", blocks, text: response.content });
          break;
        }

        case "status": {
          const status = await api.getTeamStatus(authToken);

          const sections = status.agents.map((agent) => ({
            type: "section" as const,
            text: {
              type: "mrkdwn" as const,
              text: `*${agent.name}* - ${agent.status}\n${agent.currentTask ?? "_Idle_"}`,
            },
          }));

          await respond({
            response_type: "ephemeral",
            blocks: [
              {
                type: "header",
                text: { type: "plain_text", text: "Team Status" },
              },
              ...sections,
            ],
            text: "Team status summary",
          });
          break;
        }

        case "approve": {
          const approvals = await api.getApprovals(authToken);

          if (approvals.items.length === 0) {
            await respond({
              response_type: "ephemeral",
              text: "No pending approvals.",
            });
            return;
          }

          const blocks = approvals.items.flatMap((item) =>
            buildApprovalCardBlocks({
              approvalId: item.id,
              title: item.title,
              summary: item.summary,
              preview: item.preview,
              confidence: item.confidence,
            })
          );

          await respond({
            response_type: "ephemeral",
            blocks,
            text: `${approvals.items.length} pending approval(s)`,
          });
          break;
        }

        case "team": {
          const status = await api.getTeamStatus(authToken);

          const memberList = status.agents
            .map((a) => `- *${a.name}* (${a.role}) - ${a.status}`)
            .join("\n");

          await respond({
            response_type: "ephemeral",
            blocks: [
              {
                type: "header",
                text: { type: "plain_text", text: "Your AI Team" },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: memberList || "_No team members configured._",
                },
              },
            ],
            text: "AI team members",
          });
          break;
        }

        default: {
          await respond({
            response_type: "ephemeral",
            text: [
              "*Edify OS Commands*",
              "`/edify ask [role] [message]` - Ask a specific agent",
              "`/edify status` - Current task summary",
              "`/edify approve` - Pending approvals",
              "`/edify team` - List AI team members",
            ].join("\n"),
          });
        }
      }
    } catch (error) {
      console.error("[edify-slack] Command error:", error);
      await respond({
        response_type: "ephemeral",
        text: ":warning: Something went wrong. Please try again.",
      });
    }
  });
}
