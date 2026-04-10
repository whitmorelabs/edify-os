import type { FastifyInstance } from 'fastify';

export default async function taskRoutes(fastify: FastifyInstance) {
  // List tasks
  fastify.get('/v1/orgs/me/tasks', async (request) => {
    const url = new URL(request.url, 'http://localhost');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = fastify.supabaseAdmin
      .from('tasks')
      .select('*, agent_configs(role_slug, display_name)')
      .eq('org_id', request.orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  });

  // Get task detail with steps
  fastify.get<{ Params: { taskId: string } }>(
    '/v1/orgs/me/tasks/:taskId',
    async (request) => {
      const { data: task, error: taskError } = await fastify.supabaseAdmin
        .from('tasks')
        .select('*, agent_configs(role_slug, display_name)')
        .eq('id', request.params.taskId)
        .eq('org_id', request.orgId)
        .single();

      if (taskError) throw taskError;

      const { data: steps, error: stepsError } = await fastify.supabaseAdmin
        .from('task_steps')
        .select('*')
        .eq('task_id', request.params.taskId)
        .order('step_number');

      if (stepsError) throw stepsError;

      return { ...task, steps };
    }
  );

  // Cancel task
  fastify.post<{ Params: { taskId: string } }>(
    '/v1/orgs/me/tasks/:taskId/cancel',
    async (request) => {
      const { data, error } = await fastify.supabaseAdmin
        .from('tasks')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('id', request.params.taskId)
        .eq('org_id', request.orgId)
        .in('status', ['pending', 'planning', 'executing', 'awaiting_approval'])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  );
}
