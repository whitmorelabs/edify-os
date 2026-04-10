import type { App } from "@slack/bolt";
import type { Config } from "../config";
import { EdifyApiClient } from "../services/api-client";

export function registerActionListeners(app: App, config: Config): void {
  const api = new EdifyApiClient(config.API_URL);

  // Handle approval button clicks
  app.action("approval_approve", async ({ action, ack, body, client }) => {
    await ack();

    const approvalId = "value" in action ? action.value : undefined;
    if (!approvalId) return;

    const slackUserId = body.user.id;

    try {
      const authToken = await api.resolveAuthToken(slackUserId);
      await api.decideApproval(authToken, approvalId, "approved");

      await client.chat.postEphemeral({
        channel: body.channel?.id ?? slackUserId,
        user: slackUserId,
        text: `:white_check_mark: Approval \`${approvalId}\` has been approved.`,
      });
    } catch (error) {
      console.error("[edify-slack] Approve action error:", error);
      await client.chat.postEphemeral({
        channel: body.channel?.id ?? slackUserId,
        user: slackUserId,
        text: ":warning: Failed to process approval. Please try again.",
      });
    }
  });

  // Handle rejection button clicks
  app.action("approval_reject", async ({ action, ack, body, client }) => {
    await ack();

    const approvalId = "value" in action ? action.value : undefined;
    if (!approvalId) return;

    const slackUserId = body.user.id;

    try {
      const authToken = await api.resolveAuthToken(slackUserId);
      await api.decideApproval(authToken, approvalId, "rejected");

      await client.chat.postEphemeral({
        channel: body.channel?.id ?? slackUserId,
        user: slackUserId,
        text: `:x: Approval \`${approvalId}\` has been rejected.`,
      });
    } catch (error) {
      console.error("[edify-slack] Reject action error:", error);
      await client.chat.postEphemeral({
        channel: body.channel?.id ?? slackUserId,
        user: slackUserId,
        text: ":warning: Failed to process rejection. Please try again.",
      });
    }
  });

  // Handle edit button clicks - opens a modal for the user to provide feedback
  app.action("approval_edit", async ({ action, ack, body, client }) => {
    await ack();

    const approvalId = "value" in action ? action.value : undefined;
    if (!approvalId || !("trigger_id" in body)) return;

    try {
      await client.views.open({
        trigger_id: body.trigger_id as string,
        view: {
          type: "modal",
          callback_id: "approval_edit_modal",
          private_metadata: approvalId,
          title: {
            type: "plain_text",
            text: "Edit Before Approving",
          },
          blocks: [
            {
              type: "input",
              block_id: "feedback_block",
              element: {
                type: "plain_text_input",
                action_id: "feedback_input",
                multiline: true,
                placeholder: {
                  type: "plain_text",
                  text: "Describe what changes are needed...",
                },
              },
              label: {
                type: "plain_text",
                text: "Feedback",
              },
            },
          ],
          submit: {
            type: "plain_text",
            text: "Submit Feedback",
          },
        },
      });
    } catch (error) {
      console.error("[edify-slack] Edit modal error:", error);
    }
  });
}
