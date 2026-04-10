import type { Config } from '../config.js';

export interface AgentExecutionRequest {
  task_id: string;
  org_id: string;
  agent_role: string;
  input: {
    user_message: string;
    conversation_id?: string;
    context?: Record<string, unknown>;
  };
  anthropic_api_key: string;
}

export interface AgentExecutionResult {
  task_id: string;
  status: 'completed' | 'awaiting_approval' | 'failed';
  output: {
    response: string;
    structured_data?: Record<string, unknown>;
    subtasks_completed?: number;
    confidence_score: number;
  };
  approval_needed?: {
    title: string;
    summary: string;
    proposed_action: Record<string, unknown>;
    output_preview: string;
    urgency: string;
  };
  error?: string;
}

export async function dispatchToAgentService(
  request: AgentExecutionRequest,
  agentServiceUrl: string
): Promise<AgentExecutionResult> {
  const response = await fetch(`${agentServiceUrl}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Agent service error (${response.status}): ${error}`);
  }

  return response.json() as Promise<AgentExecutionResult>;
}
