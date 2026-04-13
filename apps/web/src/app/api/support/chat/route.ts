import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

const AGENT_SERVICE_URL =
  process.env.AGENT_SERVICE_URL ?? 'http://localhost:4000';

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

  // Try forwarding to the agent service (Executive Assistant archetype)
  try {
    const res = await fetch(`${AGENT_SERVICE_URL}/api/agents/executive_assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim(), history }),
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { reply?: string; message?: string };
      const reply = data.reply ?? data.message ?? 'Got it! How else can I help?';
      return NextResponse.json<SupportChatResponse>({ reply });
    }
  } catch {
    // Agent service unavailable — fall through to placeholder
  }

  // Placeholder response when agent service is not yet wired up
  const placeholderReplies = [
    "Thanks for reaching out! I'm your Edify OS support assistant. I'm here to help you navigate the platform, understand your team members' capabilities, and get the most out of your workspace. What can I help you with today?",
    "Great question! While I'm getting fully connected, I can share that Edify OS is designed to make working with your AI team as smooth as possible. Is there a specific feature or workflow you'd like to understand better?",
    "I hear you! Let me look into that for you. In the meantime, you can explore the Team section to manage your AI team members, or check Inbox for items awaiting your approval.",
    "Thanks for your patience as I get fully set up. Your support assistant will soon be able to answer questions in real time. For urgent help, check the docs or use the team chat on your dashboard.",
  ];

  // Vary response based on message length to seem less robotic
  const idx = message.length % placeholderReplies.length;
  const reply = placeholderReplies[idx];

  return NextResponse.json<SupportChatResponse>({ reply });
}
