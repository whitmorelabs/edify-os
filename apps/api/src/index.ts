import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { loadConfig, type Config } from './config.js';
import supabasePlugin from './plugins/supabase.js';
import authPlugin from './plugins/auth.js';
import redisPlugin from './plugins/redis.js';
import orgRoutes from './routes/orgs.js';
import agentRoutes from './routes/agents.js';
import conversationRoutes from './routes/conversations.js';
import approvalRoutes from './routes/approvals.js';
import memoryRoutes from './routes/memory.js';
import taskRoutes from './routes/tasks.js';
import slackWebhookRoutes from './routes/webhooks/slack.js';
import { createWorker } from './queues/connection.js';
import { processAgentTask } from './queues/workers/agent-task.worker.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

async function main() {
  const config = loadConfig();

  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Decorate with config
  fastify.decorate('config', config);

  // Register plugins
  await fastify.register(cors, { origin: true });
  await fastify.register(sensible);
  await fastify.register(supabasePlugin);
  await fastify.register(authPlugin);
  await fastify.register(redisPlugin);

  // Register routes
  await fastify.register(orgRoutes);
  await fastify.register(agentRoutes);
  await fastify.register(conversationRoutes);
  await fastify.register(approvalRoutes);
  await fastify.register(memoryRoutes);
  await fastify.register(taskRoutes);
  await fastify.register(slackWebhookRoutes);

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', service: 'edify-api' }));

  // Start BullMQ workers
  const agentWorker = createWorker(
    'agent-tasks',
    async (job) => {
      await processAgentTask(
        job,
        fastify.supabaseAdmin,
        config.AGENT_SERVICE_URL,
        config.ENCRYPTION_KEY
      );
    },
    fastify.redis,
    3
  );

  agentWorker.on('failed', (job, err) => {
    fastify.log.error({ jobId: job?.id, err: err.message }, 'Agent task failed');
  });

  // Graceful shutdown
  const shutdown = async () => {
    await agentWorker.close();
    await fastify.close();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start server
  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    fastify.log.info(`Edify API running on port ${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
