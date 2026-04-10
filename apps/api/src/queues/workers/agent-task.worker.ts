import type { Job } from 'bullmq';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatchToAgentService, type AgentExecutionRequest } from '../../services/agent-dispatch.js';
import { decrypt } from '../../services/encryption.js';

export interface AgentTaskJobData {
  task_id: string;
  org_id: string;
  agent_role: string;
  user_message: string;
  conversation_id?: string;
}

export async function processAgentTask(
  job: Job<AgentTaskJobData>,
  supabaseAdmin: SupabaseClient,
  agentServiceUrl: string,
  encryptionKey: string
) {
  const { task_id, org_id, agent_role, user_message, conversation_id } = job.data;

  // Update task status to executing
  await supabaseAdmin
    .from('tasks')
    .update({ status: 'executing', started_at: new Date().toISOString() })
    .eq('id', task_id);

  try {
    // Fetch the org's API key
    const { data: org } = await supabaseAdmin
      .from('orgs')
      .select('anthropic_api_key_encrypted, autonomy_level')
      .eq('id', org_id)
      .single();

    if (!org?.anthropic_api_key_encrypted) {
      throw new Error('Organization has not configured an Anthropic API key. AI features are disabled.');
    }

    const apiKey = decrypt(org.anthropic_api_key_encrypted, encryptionKey);

    const request: AgentExecutionRequest = {
      task_id,
      org_id,
      agent_role,
      input: { user_message, conversation_id },
      anthropic_api_key: apiKey,
    };

    const result = await dispatchToAgentService(request, agentServiceUrl);

    if (result.status === 'completed') {
      await supabaseAdmin
        .from('tasks')
        .update({
          status: 'completed',
          output_data: result.output,
          confidence_score: result.output.confidence_score,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task_id);
    } else if (result.status === 'awaiting_approval' && result.approval_needed) {
      await supabaseAdmin
        .from('tasks')
        .update({
          status: 'awaiting_approval',
          output_data: result.output,
          confidence_score: result.output.confidence_score,
        })
        .eq('id', task_id);

      // Get agent_config_id
      const { data: agentConfig } = await supabaseAdmin
        .from('agent_configs')
        .select('id')
        .eq('org_id', org_id)
        .eq('role_slug', agent_role)
        .single();

      await supabaseAdmin.from('approvals').insert({
        org_id,
        task_id,
        agent_config_id: agentConfig?.id,
        title: result.approval_needed.title,
        summary: result.approval_needed.summary,
        proposed_action: result.approval_needed.proposed_action,
        output_preview: result.approval_needed.output_preview,
        confidence_score: result.output.confidence_score,
        urgency: result.approval_needed.urgency,
      });
    } else if (result.status === 'failed') {
      throw new Error(result.error || 'Agent execution failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabaseAdmin
      .from('tasks')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', task_id);

    throw error;
  }
}
