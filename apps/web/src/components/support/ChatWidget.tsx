'use client';

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { useSupportChat, type SupportMessage } from './ChatProvider';
import { TypingIndicator } from '@/components/typing-indicator';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'edify_support_dismissed';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function MessageBubble({ message }: { message: SupportMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex animate-slide-up', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex gap-2 max-w-[85%]', isUser ? 'flex-row-reverse' : 'flex-row')}>
        {/* Support assistant avatar */}
        {!isUser && (
          <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center">
            <MessageCircle size={14} className="text-white" />
          </div>
        )}
        <div className={isUser ? 'text-right' : 'text-left'}>
          <div
            className={
              isUser
                ? 'bg-brand-500 text-white rounded-2xl rounded-br-sm px-3.5 py-2.5'
                : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5'
            }
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 px-1">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const { isOpen, messages, isLoading, openChat, closeChat, sendMessage } = useSupportChat();
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Read dismissal from sessionStorage on mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // sessionStorage unavailable (e.g. private browsing restrictions) — ignore
    }
  }, []);

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    setIsDismissed(true);
    if (isOpen) closeChat();
  }

  // Render nothing if dismissed for this session
  if (isDismissed) return null;

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
    }
  }, [inputValue]);

  async function handleSend() {
    if (!inputValue.trim() || isLoading) return;
    const value = inputValue;
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleToggle() {
    if (isOpen) {
      setIsMinimized((prev) => !prev);
    } else {
      setIsMinimized(false);
      openChat();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      <div
        className={cn(
          'w-[360px] sm:w-[400px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden',
          'transition-all duration-300 ease-in-out origin-bottom-right',
          'bg-white flex flex-col',
          isOpen && !isMinimized
            ? 'opacity-100 scale-100 pointer-events-auto h-[500px]'
            : 'opacity-0 scale-95 pointer-events-none h-0',
        )}
        role="dialog"
        aria-label="Support chat"
        aria-hidden={!isOpen || isMinimized}
      >
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-brand-500 text-white flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <MessageCircle size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">Need help? Ask your support assistant</h3>
            <p className="text-[11px] text-brand-100 font-medium">We typically reply right away</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition"
              aria-label="Minimize chat"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={closeChat}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 mb-4">
                <MessageCircle size={28} className="text-brand-500" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                Your support assistant is here
              </h4>
              <p className="text-xs text-slate-500 max-w-[220px] leading-relaxed">
                Ask anything about Edify OS, your team members, or how to get the most out of the platform.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex items-end gap-2 animate-slide-up">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center">
                    <MessageCircle size={14} className="text-white" />
                  </div>
                  <TypingIndicator />
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <footer className="bg-white border-t border-slate-200 p-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="input-field flex-1 resize-none text-sm py-2"
              disabled={isLoading}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </footer>
      </div>

      {/* Minimized bar (shown when minimized) */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 bg-brand-500 text-white px-4 py-3 rounded-2xl shadow-xl hover:bg-brand-600 transition-all duration-200"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-semibold">Support</span>
          {messages.length > 0 && (
            <span className="ml-1 text-xs text-brand-200">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          )}
        </button>
      )}

      {/* Floating trigger button (shown when closed) */}
      {!isOpen && (
        <div className="relative flex items-center justify-center">
          {/* Dismiss X — small badge anchored to top-left of the FAB */}
          <button
            onClick={handleDismiss}
            className={cn(
              'absolute -top-1.5 -left-1.5 z-10',
              'flex h-5 w-5 items-center justify-center rounded-full',
              'bg-slate-500 text-white shadow-md',
              'hover:bg-slate-700 transition-colors duration-150',
            )}
            aria-label="Dismiss support chat"
            title="Dismiss support chat"
          >
            <X size={10} />
          </button>

          <button
            onClick={handleToggle}
            className={cn(
              'relative flex h-14 w-14 items-center justify-center rounded-full',
              'bg-brand-500 text-white shadow-xl',
              'hover:bg-brand-600 hover:scale-105 active:scale-95',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
            )}
            aria-label="Open support chat"
          >
            <MessageCircle size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
