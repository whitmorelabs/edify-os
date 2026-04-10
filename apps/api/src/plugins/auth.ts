import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    orgId: string;
    memberRole: string;
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('userId', '');
  fastify.decorateRequest('orgId', '');
  fastify.decorateRequest('memberRole', '');

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for webhooks and health check
    if (
      request.url.startsWith('/v1/webhooks') ||
      request.url === '/health'
    ) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing authorization header' });
    }

    const token = authHeader.slice(7);

    const { data: { user }, error } = await fastify.supabase.auth.getUser(token);
    if (error || !user) {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    // Look up member record to get org_id
    const { data: member, error: memberError } = await fastify.supabaseAdmin
      .from('members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return reply.code(403).send({ error: 'User is not a member of any organization' });
    }

    request.userId = user.id;
    request.orgId = member.org_id;
    request.memberRole = member.role;
  });
});
