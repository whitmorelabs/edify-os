'use client';

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { X, Send } from 'lucide-react';
import { useChatPanel } from './chat-provider';
import { ChatMessage } from './chat-message';
import { AgentAvatar } from './agent-avatar';
import { TypingIndicator } from './typing-indicator';
import { AGENT_COLORS } from '@/lib/agent-colors';

export function ChatPanel() {
  const { isOpen, activeAgent, messages, isTyping, closeChat, sendMessage } =
    useChatPanel();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');

  const agentConfig = activeAgent ? AGENT_COLORS[activeAgent] : null;

  // Auto-scroll to bottom when new messages arrive or typing starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
    }
  }, [inputValue]);

  function handleSend() {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={closeChat}
        />
      )}

      {/* Chat panel */}
      <aside
        className={`
          fixed right-0 top-0 h-screen z-50
          lg:relative lg:z-0
          w-full lg:w-[420px] flex-shrink-0
          flex flex-col bg-white border-l border-slate-200 shadow-xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          {activeAgent && agentConfig && (
            <>
              <AgentAvatar role={activeAgent} size="md" showStatus status="active" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {agentConfig.label}
                </h3>
                <p className="text-xs text-emerald-600 font-medium">Active</p>
              </div>
            </>
          )}
          <button
            onClick={closeChat}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && !isTyping && activeAgent && agentConfig ? (
            /* Welcome state */
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <AgentAvatar role={activeAgent} size="lg" />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">
                {agentConfig.label}
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-[280px]">
                {agentConfig.description}
              </p>
              <p className="mt-4 text-sm text-slate-400 italic">
                Ask me anything...
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  agentRole={activeAgent ?? undefined}
                />
              ))}
              {isTyping && (
                <div className="flex items-end gap-2">
                  {activeAgent && (
                    <div className="flex-shrink-0">
                      <AgentAvatar role={activeAgent} size="sm" />
                    </div>
                  )}
                  <TypingIndicator />
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer input area */}
        <footer className="bg-white border-t border-slate-200 p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="input-field flex-1 resize-none text-sm py-2.5"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="flex-shrink-0 p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
