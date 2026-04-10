import type { FastifyInstance } from 'fastify';

export default async function slackWebhookRoutes(fastify: FastifyInstance) {
  // Slack Events API
  fastify.post('/v1/webhooks/slack/events', async (request, reply) => {
    const body = request.body as Record<string, unknown>;

    // Handle Slack URL verification challenge
    if (body.type === 'url_verification') {
      return { challenge: body.challenge };
    }

    // TODO: Verify Slack signature
    // TODO: Process events (messages, app_mention, etc.)

    return reply.code(200).send();
  });

  // Slack Interactivity (button clicks, modals)
  fastify.post('/v1/webhooks/slack/interactions', async (_request, reply) => {
    // TODO: Parse payload, handle approve/reject actions
    return reply.code(200).send();
  });
}
