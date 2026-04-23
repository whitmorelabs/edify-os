"use client";

import { forwardRef, type HTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  /** Fallback initials (2 chars max) when no `src`. */
  initials?: string;
  /** Pixel size — applied as square. */
  size?: number;
}

/**
 * Avatar — circular frame with image or initials fallback.
 * Uses a purple gradient bg for the fallback to feel on-brand.
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { src, alt = "", initials = "", size = 32, className, ...rest },
  ref,
) {
  const display = (initials || alt).slice(0, 2).toUpperCase();
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-full flex items-center justify-center shrink-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: src
          ? undefined
          : "linear-gradient(135deg, var(--brand-plum), var(--brand-purple))",
        boxShadow: "inset 0 0 0 1px var(--line-2)",
      }}
      {...rest}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span
          className="font-semibold text-white"
          style={{ fontSize: Math.max(10, Math.round(size * 0.4)) }}
        >
          {display}
        </span>
      )}
    </div>
  );
});
