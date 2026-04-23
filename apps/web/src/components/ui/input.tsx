"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full bg-[var(--bg-2)] text-[var(--fg-1)] placeholder:text-[var(--fg-4)] " +
  "rounded-[10px] border border-[var(--line-2)] " +
  "px-3.5 py-2.5 text-[14px] " +
  "outline-none transition-[border-color,box-shadow] " +
  "focus:border-[var(--line-purple)] focus:shadow-[0_0_0_1px_var(--line-purple),0_0_24px_var(--purple-a20)] " +
  "disabled:opacity-50";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(fieldBase, className)}
      style={{
        transitionDuration: "var(--dur-fast)",
        transitionTimingFunction: "var(--ease-standard)",
      }}
      {...rest}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(fieldBase, "resize-y min-h-[80px]", className)}
      style={{
        transitionDuration: "var(--dur-fast)",
        transitionTimingFunction: "var(--ease-standard)",
      }}
      {...rest}
    />
  );
});
