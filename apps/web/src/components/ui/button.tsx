"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered after the label. */
  trailingIcon?: ReactNode;
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold " +
  "transition-[background,transform,box-shadow,color,border-color] " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-purple)] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-1)]";

const sizes: Record<ButtonSize, string> = {
  sm: "text-[13px] px-3.5 py-2 h-9",
  md: "text-[14px] px-[18px] py-2.5 h-10",
  lg: "text-[15px] px-[22px] py-3.5 h-12",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    // P5 — two-layer accent glow, expands on hover
    "bg-[var(--brand-purple)] text-[var(--fg-on-purple)] " +
    "shadow-[0_0_15px_0_rgba(159,78,243,0.35),0_0_5px_0_rgba(159,78,243,0.35),0_0_0_1px_rgba(159,78,243,0.48)] " +
    "hover:bg-[var(--brand-purple-hover)] hover:-translate-y-[1px] " +
    "hover:shadow-[0_0_25px_5px_rgba(159,78,243,0.4),0_0_10px_0_rgba(159,78,243,0.4),0_0_0_1px_rgba(159,78,243,0.6)] " +
    "active:bg-[var(--brand-purple-press)] active:translate-y-0 " +
    "active:scale-[0.98] active:shadow-[0_0_8px_0_rgba(159,78,243,0.3),0_0_0_1px_rgba(159,78,243,0.32)]",
  secondary:
    // hairline on near-black
    "bg-transparent text-[var(--fg-1)] " +
    "shadow-[inset_0_0_0_1px_var(--line-2)] " +
    "hover:bg-[var(--bg-2)] hover:shadow-[inset_0_0_0_1px_var(--line-3)] " +
    "active:scale-[0.99]",
  ghost:
    "bg-transparent text-[var(--fg-2)] " +
    "hover:bg-[var(--bg-2)] hover:text-[var(--fg-1)]",
  destructive:
    "bg-[var(--error)] text-[var(--bg-0)] " +
    "shadow-[0_0_0_1px_rgba(249,115,115,0.32),0_4px_16px_rgba(249,115,115,0.24)] " +
    "hover:brightness-110 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, sizes[size], variants[variant], className)}
      style={{
        transitionDuration: "var(--dur-fast)",
        transitionTimingFunction: "var(--ease-standard)",
      }}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});
