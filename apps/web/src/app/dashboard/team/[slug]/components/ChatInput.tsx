"use client";

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import { Send, ChevronDown, ChevronUp, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isDisabled: boolean;
  suggestedPrompts?: string[];
  showPrompts?: boolean;
  /** When true (conversation is empty), prompts are expanded by default. */
  isEmptyConversation?: boolean;
}

export function ChatInput({
  onSend,
  isDisabled,
  suggestedPrompts = [],
  showPrompts = false,
  isEmptyConversation = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  // Item 5: Expand prompts by default when the conversation is empty
  const [promptsVisible, setPromptsVisible] = useState(
    showPrompts || isEmptyConversation
  );
  const [fileTooltip, setFileTooltip] = useState(false);

  // Sync promptsVisible when isEmptyConversation changes (e.g. first message sent)
  useEffect(() => {
    if (isEmptyConversation) {
      setPromptsVisible(true);
    }
  }, [isEmptyConversation]);

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

  // Item 9: File upload button handler
  function handleFileClick() {
    setFileTooltip(true);
    setTimeout(() => setFileTooltip(false), 3000);
  }

  const charCount = value.length;
  const isLong = charCount > 400;

  return (
    <div className="border-t border-[var(--line-1)] bg-[var(--bg-1)]">
      {/* Suggested prompts row — visible by default when conversation is empty */}
      {suggestedPrompts.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--fg-3)] uppercase tracking-wide">
              Suggestions
            </span>
            <button
              onClick={() => setPromptsVisible((v) => !v)}
              className="flex items-center gap-1 text-xs text-[var(--fg-3)] hover:text-[var(--fg-1)] transition"
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
                  className="text-xs rounded-full border border-[var(--line-2)] bg-[var(--bg-2)] px-3 py-1.5 text-[var(--fg-2)] hover:bg-[var(--bg-3)] hover:border-[var(--line-purple)] hover:text-[var(--fg-1)] transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
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
        {/* Item 9: File upload button (placeholder) */}
        <div className="relative">
          <button
            onClick={handleFileClick}
            className="flex-shrink-0 p-2.5 rounded-lg text-[var(--fg-3)] hover:text-[var(--fg-1)] hover:bg-[var(--bg-2)] transition"
            aria-label="Attach file"
            type="button"
          >
            <Paperclip size={18} />
          </button>
          {fileTooltip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[var(--bg-3)] border border-[var(--line-2)] text-xs text-[var(--fg-2)] whitespace-nowrap shadow-lg z-10">
              File sharing coming soon — for now, paste text or describe what you need.
            </div>
          )}
        </div>

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
              "w-full rounded-lg border border-[var(--line-2)] bg-[var(--bg-2)]",
              "px-3.5 py-2.5 text-sm text-[var(--fg-1)] placeholder:text-[var(--fg-4)]",
              "resize-none pr-16",
              "outline-none transition-[border-color,box-shadow]",
              "focus:border-[var(--line-purple)] focus:shadow-[0_0_0_1px_var(--line-purple),0_0_24px_var(--purple-a20)]",
              isDisabled && "opacity-60 cursor-not-allowed"
            )}
          />
          {/* Character hint */}
          {charCount > 200 && (
            <span
              className={cn(
                "absolute bottom-2 right-3 text-xs",
                isLong ? "text-amber-500" : "text-[var(--fg-3)]"
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

      <p className="px-4 pb-3 text-xs text-[var(--fg-3)]">
        Enter to send &middot; Shift+Enter for new line
      </p>
    </div>
  );
}
