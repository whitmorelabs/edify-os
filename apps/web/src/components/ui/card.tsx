"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardElevation = 1 | 2 | 3;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Elevation recipe — 1 (default card), 2 (raised), 3 (sheet). */
  elevation?: CardElevation;
  /** Render with a plum-tinted hero background. Used once per screen. */
  hero?: boolean;
  /** Interactive hover affordance (lift + elev-2). */
  interactive?: boolean;
}

const shadowByElev: Record<CardElevation, string> = {
  1: "shadow-elev-1",
  2: "shadow-elev-2",
  3: "shadow-elev-3",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevation = 1, hero = false, interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[14px] bg-[var(--bg-2)]",
        shadowByElev[elevation],
        hero && "bg-[var(--bg-plum-1)]",
        interactive &&
          "cursor-pointer transition-[transform,box-shadow] hover:-translate-y-[1px] hover:shadow-elev-2",
        className,
      )}
      style={
        interactive
          ? {
              transitionDuration: "var(--dur-fast)",
              transitionTimingFunction: "var(--ease-standard)",
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </div>
  );
});

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={cn("px-6 pt-6 pb-4", className)} {...rest}>
        {children}
      </div>
    );
  },
);

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={cn("px-6 py-4", className)} {...rest}>
        {children}
      </div>
    );
  },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, children, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 pb-6 pt-4 flex items-center gap-2 border-t border-[var(--line-1)]",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
