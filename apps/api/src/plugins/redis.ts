import fp from 'fastify-plugin';
import IORedis from 'ioredis';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: IORedis;
  }
}

export default fp(async function redisPlugin(fastify: FastifyInstance) {
  const config = fastify.config as Config;
  const redis = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});
