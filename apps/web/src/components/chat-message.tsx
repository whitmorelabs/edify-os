'use client';

import type { ChatMessage as ChatMessageType } from './chat-provider';
import type { AgentRoleSlug } from '@/lib/agent-colors';
import { AgentAvatar } from './agent-avatar';

interface ChatMessageProps {
  message: ChatMessageType;
  agentRole?: AgentRoleSlug;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function ChatMessage({ message, agentRole }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Agent avatar for assistant messages */}
        {!isUser && agentRole && (
          <div className="flex-shrink-0 mt-1">
            <AgentAvatar role={agentRole} size="sm" />
          </div>
        )}

        <div className={isUser ? 'text-right' : 'text-left'}>
          <div
            className={
              isUser
                ? 'bg-brand-500 text-white rounded-2xl rounded-br-sm px-4 py-2.5'
                : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm px-4 py-2.5'
            }
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-1 px-1">
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}
