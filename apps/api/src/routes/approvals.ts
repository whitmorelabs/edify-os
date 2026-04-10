import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const decideSchema = z.object({
  action: z.enum(['approved', 'rejected']),
  note: z.string().optional(),
  modifications: z.record(z.unknown()).optional(),
});

export default async function approvalRoutes(fastify: FastifyInstance) {
  // List pending approvals
  fastify.get('/v1/orgs/me/approvals', async (request) => {
    const url = new URL(request.url, 'http://localhost');
    const status = url.searchParams.get('status') || 'pending';

    const { data, error } = await fastify.supabaseAdmin
      .from('approvals')
      .select('*, agent_configs(role_slug, display_name), tasks(title, description)')
      .eq('org_id', request.orgId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  });

  // Get approval detail
  fastify.get<{ Params: { id: string } }>(
    '/v1/orgs/me/approvals/:id',
    async (request) => {
      const { data, error } = await fastify.supabaseAdmin
        .from('approvals')
        .select('*, agent_configs(role_slug, display_name), tasks(*)')
        .eq('id', request.params.id)
        .eq('org_id', request.orgId)
        .single();

      if (error) throw error;
      return data;
    }
  );

  // Decide on approval
  fastify.post<{ Params: { id: string } }>(
    '/v1/orgs/me/approvals/:id/decide',
    async (request) => {
      const body = decideSchema.parse(request.body);

      const { data: member } = await fastify.supabaseAdmin
        .from('members')
        .select('id')
        .eq('user_id', request.userId)
        .eq('org_id', request.orgId)
        .single();

      const { data: approval, error } = await fastify.supabaseAdmin
        .from('approvals')
        .update({
          status: body.action,
          decided_by: member?.id,
          decision_note: body.note,
          decided_at: new Date().toISOString(),
        })
        .eq('id', request.params.id)
        .eq('org_id', request.orgId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;

      // Update the linked task status
      if (approval) {
        const newTaskStatus = body.action === 'approved' ? 'approved' : 'cancelled';
        await fastify.supabaseAdmin
          .from('tasks')
          .update({
            status: newTaskStatus,
            completed_at: new Date().toISOString(),
          })
          .eq('id', approval.task_id);
      }

      return approval;
    }
  );
}
