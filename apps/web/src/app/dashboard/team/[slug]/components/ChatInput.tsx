"use client";

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import { Send, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isDisabled: boolean;
  suggestedPrompts?: string[];
  showPrompts?: boolean;
}

export function ChatInput({
  onSend,
  isDisabled,
  suggestedPrompts = [],
  showPrompts = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [promptsVisible, setPromptsVisible] = useState(showPrompts);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [value]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handlePromptClick(prompt: string) {
    setValue(prompt);
    setPromptsVisible(false);
    textareaRef.current?.focus();
  }

  const charCount = value.length;
  const isLong = charCount > 400;

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Suggested prompts row */}
      {suggestedPrompts.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Suggestions
            </span>
            <button
              onClick={() => setPromptsVisible((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
            >
              {promptsVisible ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
              {promptsVisible ? "Hide" : "Show"}
            </button>
          </div>

          {promptsVisible && (
            <div className="flex flex-wrap gap-2 pb-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isDisabled}
                  className="text-xs rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message... (Shift+Enter for new line)"
            rows={1}
            disabled={isDisabled}
            className={cn(
              "input-field resize-none text-sm py-2.5 pr-16",
              "focus:outline-none focus:[box-shadow:0_0_0_1px_var(--line-purple)]",
              isDisabled && "opacity-60 cursor-not-allowed"
            )}
          />
          {/* Character hint */}
          {charCount > 200 && (
            <span
              className={cn(
                "absolute bottom-2 right-3 text-xs",
                isLong ? "text-amber-500" : "text-slate-300"
              )}
            >
              {charCount}
            </span>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!value.trim() || isDisabled}
          className="flex-shrink-0 p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>

      <p className="px-4 pb-3 text-xs text-slate-400">
        Enter to send &middot; Shift+Enter for new line
      </p>
    </div>
  );
}
