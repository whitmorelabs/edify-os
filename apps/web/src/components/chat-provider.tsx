'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  Suspense,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AGENT_COLORS, type AgentRoleSlug } from '@/lib/agent-colors';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelContextType {
  isOpen: boolean;
  activeAgent: AgentRoleSlug | null;
  messages: ChatMessage[];
  isTyping: boolean;
  openChat: (agent: AgentRoleSlug) => void;
  closeChat: () => void;
  sendMessage: (content: string) => void;
}

const ChatPanelContext = createContext<ChatPanelContextType | null>(null);

function ChatPanelProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentRoleSlug | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-open from URL param on mount
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam && chatParam in AGENT_COLORS) {
      setActiveAgent(chatParam as AgentRoleSlug);
      setIsOpen(true);
    }
  }, [searchParams]);

  const openChat = useCallback(
    (agent: AgentRoleSlug) => {
      setActiveAgent(agent);
      setIsOpen(true);
      setMessages([]);
      setIsTyping(false);

      const params = new URLSearchParams(searchParams.toString());
      params.set('chat', agent);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setActiveAgent(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('chat');
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, {
      scroll: false,
    });
  }, [router, searchParams]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !activeAgent) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Simulated assistant response (placeholder for real API)
      setTimeout(() => {
        const agentLabel = AGENT_COLORS[activeAgent!]?.label ?? 'Agent';
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Thanks for your message! I'm the ${agentLabel}. This is a simulated response — real AI integration coming soon.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsTyping(false);
      }, 2000);
    },
    [activeAgent],
  );

  return (
    <ChatPanelContext.Provider
      value={{
        isOpen,
        activeAgent,
        messages,
        isTyping,
        openChat,
        closeChat,
        sendMessage,
      }}
    >
      {children}
    </ChatPanelContext.Provider>
  );
}

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ChatPanelProviderInner>{children}</ChatPanelProviderInner>
    </Suspense>
  );
}

export function useChatPanel(): ChatPanelContextType {
  const ctx = useContext(ChatPanelContext);
  if (!ctx) {
    throw new Error('useChatPanel must be used within a ChatPanelProvider');
  }
  return ctx;
}
