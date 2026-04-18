import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthContext } from '@/lib/supabase/server';
import { getAnthropicClientForOrg } from '@/lib/anthropic';

const SUPPORT_SYSTEM_PROMPT = `You are the Edify OS support assistant. You help nonprofit organizations navigate the Edify OS platform.

You are knowledgeable about:
- The 6 AI team members (Director of Development, Marketing Director, Executive Assistant, Programs Director, HR & Volunteer Coordinator, Events Director)
- How to use the chat interface to work with each team member
- The Inbox and heartbeat check-in system
- The Integrations settings and how to connect tools
- The Briefing (onboarding) flow
- Account settings and org management

Keep responses concise and practical. If a question is outside Edify OS (e.g., general fundraising advice), let the user know they should ask their Development Director instead.

Do not compliment or flatter. Be direct and helpful.`;

export interface SupportChatRequest {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface SupportChatResponse {
  reply: string;
}

export async function POST(req: NextRequest) {
  let body: SupportChatRequest;

  try {
    body = (await req.json()) as SupportChatRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { message, history } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // Get auth context — support chat is available to authenticated users
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  // Get org's Claude API key
  const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId);
  if ('error' in anthropicResult) return anthropicResult.error;
  const { client: anthropic } = anthropicResult;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 1024,
      system: SUPPORT_SYSTEM_PROMPT,
      messages: [
        ...(history ?? []).slice(-10), // Keep last 10 history messages
        { role: 'user', content: message.trim() },
      ],
    });

    const reply =
      response.content[0]?.type === 'text' ? response.content[0].text : 'Sorry, I could not generate a response.';

    // Persist both messages to support_messages table
    await serviceClient.from('support_messages').insert([
      { org_id: orgId, member_id: memberId, role: 'user', content: message.trim() },
      { org_id: orgId, member_id: memberId, role: 'assistant', content: reply },
    ]);

    return NextResponse.json<SupportChatResponse>({ reply });
  } catch (err) {
    console.error('[support/chat] Claude API error:', err);
    const msg = err instanceof Error ? err.message : 'Claude API error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
