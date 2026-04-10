import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const updateAgentSchema = z.object({
  display_name: z.string().min(1).optional(),
  persona_overrides: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
  autonomy_level: z.enum(['suggestion', 'assisted', 'autonomous']).nullable().optional(),
});

export default async function agentRoutes(fastify: FastifyInstance) {
  // List agent configs for the org
  fastify.get('/v1/orgs/me/agents', async (request) => {
    const { data, error } = await fastify.supabaseAdmin
      .from('agent_configs')
      .select('*')
      .eq('org_id', request.orgId)
      .order('role_slug');

    if (error) throw error;
    return data;
  });

  // Get specific agent config
  fastify.get<{ Params: { roleSlug: string } }>(
    '/v1/orgs/me/agents/:roleSlug',
    async (request) => {
      const { data, error } = await fastify.supabaseAdmin
        .from('agent_configs')
        .select('*')
        .eq('org_id', request.orgId)
        .eq('role_slug', request.params.roleSlug)
        .single();

      if (error) throw error;
      return data;
    }
  );

  // Update agent config
  fastify.patch<{ Params: { roleSlug: string } }>(
    '/v1/orgs/me/agents/:roleSlug',
    async (request) => {
      const body = updateAgentSchema.parse(request.body);

      const { data, error } = await fastify.supabaseAdmin
        .from('agent_configs')
        .update(body)
        .eq('org_id', request.orgId)
        .eq('role_slug', request.params.roleSlug)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  );

  // Get agent's task history
  fastify.get<{ Params: { roleSlug: string } }>(
    '/v1/orgs/me/agents/:roleSlug/tasks',
    async (request) => {
      // First get the agent_config_id
      const { data: config } = await fastify.supabaseAdmin
        .from('agent_configs')
        .select('id')
        .eq('org_id', request.orgId)
        .eq('role_slug', request.params.roleSlug)
        .single();

      if (!config) return [];

      const { data, error } = await fastify.supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('agent_config_id', config.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  );
}
