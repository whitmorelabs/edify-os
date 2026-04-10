"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 inline-flex gap-1.5 items-center",
        className
      )}
    >
      {[0, 0.16, 0.32].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce-dot"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
