'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

export interface SupportMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SupportChatContextType {
  isOpen: boolean;
  messages: SupportMessage[];
  isLoading: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
}

const SupportChatContext = createContext<SupportChatContextType | null>(null);

const STORAGE_KEY = 'edify_support_chat_history';

function serializeMessages(messages: SupportMessage[]): string {
  return JSON.stringify(
    messages.map((m) => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    })),
  );
}

function deserializeMessages(raw: string): SupportMessage[] {
  try {
    const parsed = JSON.parse(raw) as Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

export function SupportChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(deserializeMessages(stored));
      }
    } catch {
      // Silently ignore storage errors
    }
  }, []);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeMessages(messages));
    } catch {
      // Silently ignore storage errors
    }
  }, [messages]);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: SupportMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as { reply: string };

      const assistantMsg: SupportMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: SupportMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  return (
    <SupportChatContext.Provider
      value={{ isOpen, messages, isLoading, openChat, closeChat, sendMessage }}
    >
      {children}
    </SupportChatContext.Provider>
  );
}

export function useSupportChat(): SupportChatContextType {
  const ctx = useContext(SupportChatContext);
  if (!ctx) {
    throw new Error('useSupportChat must be used within a SupportChatProvider');
  }
  return ctx;
}
