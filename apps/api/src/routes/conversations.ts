import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createQueue } from '../queues/connection.js';
import type { AgentTaskJobData } from '../queues/workers/agent-task.worker.js';

const sendMessageSchema = z.object({
  content: z.string().min(1),
  agent_role: z.string().optional(),
});

const createConversationSchema = z.object({
  agent_role: z.string(),
  title: z.string().optional(),
});

export default async function conversationRoutes(fastify: FastifyInstance) {
  const agentTaskQueue = createQueue('agent-tasks', fastify.redis);

  // List conversations
  fastify.get('/v1/orgs/me/conversations', async (request) => {
    const { data, error } = await fastify.supabaseAdmin
      .from('conversations')
      .select('*, agent_configs(role_slug, display_name)')
      .eq('org_id', request.orgId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  });

  // Create conversation
  fastify.post('/v1/orgs/me/conversations', async (request) => {
    const body = createConversationSchema.parse(request.body);

    const { data: agentConfig } = await fastify.supabaseAdmin
      .from('agent_configs')
      .select('id')
      .eq('org_id', request.orgId)
      .eq('role_slug', body.agent_role)
      .single();

    const { data, error } = await fastify.supabaseAdmin
      .from('conversations')
      .insert({
        org_id: request.orgId,
        agent_config_id: agentConfig?.id,
        member_id: request.userId,
        title: body.title,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  });

  // Get conversation with messages
  fastify.get<{ Params: { convoId: string } }>(
    '/v1/orgs/me/conversations/:convoId',
    async (request) => {
      const { data: conversation, error: convoError } = await fastify.supabaseAdmin
        .from('conversations')
        .select('*, agent_configs(role_slug, display_name)')
        .eq('id', request.params.convoId)
        .eq('org_id', request.orgId)
        .single();

      if (convoError) throw convoError;

      const { data: messages, error: msgError } = await fastify.supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', request.params.convoId)
        .order('created_at');

      if (msgError) throw msgError;

      return { ...conversation, messages };
    }
  );

  // Send message (triggers agent execution)
  fastify.post<{ Params: { convoId: string } }>(
    '/v1/orgs/me/conversations/:convoId/messages',
    async (request, reply) => {
      const body = sendMessageSchema.parse(request.body);

      // Check if AI is enabled for this org
      const { data: org } = await fastify.supabaseAdmin
        .from('orgs')
        .select('ai_enabled, anthropic_api_key_valid')
        .eq('id', request.orgId)
        .single();

      if (!org?.ai_enabled) {
        return reply.code(400).send({
          error: 'AI features are disabled. Please configure your Anthropic API key in Settings.',
        });
      }

      if (!org.anthropic_api_key_valid) {
        return reply.code(400).send({
          error: 'Your Anthropic API key is invalid or has exceeded usage limits. Please update it in Settings.',
        });
      }

      // Get conversation details
      const { data: conversation } = await fastify.supabaseAdmin
        .from('conversations')
        .select('*, agent_configs(role_slug)')
        .eq('id', request.params.convoId)
        .eq('org_id', request.orgId)
        .single();

      if (!conversation) {
        return reply.code(404).send({ error: 'Conversation not found' });
      }

      // Save user message
      const { data: message, error: msgError } = await fastify.supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: request.params.convoId,
          role: 'user',
          content: body.content,
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // Determine agent role
      const agentRole =
        body.agent_role || conversation.agent_configs?.role_slug || 'executive_assistant';

      // Look up member for the task
      const { data: member } = await fastify.supabaseAdmin
        .from('members')
        .select('id')
        .eq('user_id', request.userId)
        .eq('org_id', request.orgId)
        .single();

      // Create task
      const { data: task, error: taskError } = await fastify.supabaseAdmin
        .from('tasks')
        .insert({
          org_id: request.orgId,
          agent_config_id: conversation.agent_config_id,
          source: 'user_request',
          title: body.content.slice(0, 100),
          description: body.content,
          input_data: { conversation_id: request.params.convoId, message_id: message.id },
          requested_by: member?.id,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Enqueue agent task
      const jobData: AgentTaskJobData = {
        task_id: task.id,
        org_id: request.orgId,
        agent_role: agentRole,
        user_message: body.content,
        conversation_id: request.params.convoId,
      };

      await agentTaskQueue.add('execute', jobData, {
        priority: task.priority,
      });

      return {
        message,
        task: { id: task.id, status: 'pending' },
      };
    }
  );
}
