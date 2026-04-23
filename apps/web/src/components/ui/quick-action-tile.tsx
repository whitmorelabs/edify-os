"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface QuickActionTileProps {
  /** Short label — sentence-case. */
  title: string;
  /** Optional one-line description. */
  description?: string;
  /** Icon on the tile — any ReactNode (SVG preferred). */
  icon: ReactNode;
  /** Optional link target — renders as `<Link>`. If omitted, renders a button. */
  href?: string;
  onClick?: () => void;
  /** Color hint for the icon tile — hex or CSS var. Default: brand purple. */
  accent?: string;
  /** Stagger index for entrance. */
  index?: number;
  className?: string;
}

/**
 * QuickActionTile — hero CTA tile. Composable stack: icon, title, subtext.
 * Hover lifts 1px + swaps border to purple.
 */
export function QuickActionTile({
  title,
  description,
  icon,
  href,
  onClick,
  accent = "var(--brand-purple)",
  index = 0,
  className,
}: QuickActionTileProps) {
  const delay = Math.min(index, 6) * 0.05;

  const inner = (
    <>
      <div
        className="flex items-center justify-center rounded-[10px]"
        style={{
          width: 40,
          height: 40,
          background: `linear-gradient(135deg, ${accent}2A, ${accent}0A)`,
          boxShadow: `inset 0 0 0 1px ${accent}55`,
          color: accent,
        }}
      >
        {icon}
      </div>
      <div className="mt-4">
        <div className="text-[15px] font-medium text-[var(--fg-1)]">{title}</div>
        {description && (
          <div className="mt-1 text-[13px] text-[var(--fg-3)] leading-[1.5]">
            {description}
          </div>
        )}
      </div>
    </>
  );

  const wrapperClass = cn(
    "block rounded-[14px] bg-[var(--bg-2)] p-5 text-left",
    "shadow-[0_0_0_1px_var(--line-2)]",
    "transition-[transform,box-shadow,border-color]",
    "hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_var(--line-purple),var(--elev-2)]",
    "cursor-pointer",
    className,
  );

  const motionProps = {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: DURATION.slow, ease: EASE.entrance, delay },
    style: {
      transitionDuration: "var(--dur-fast)",
      transitionTimingFunction: "var(--ease-standard)",
    } as React.CSSProperties,
  };

  if (href) {
    return (
      <motion.div {...motionProps}>
        <Link href={href} className={wrapperClass}>
          {inner}
        </Link>
      </motion.div>
    );
  }
  return (
    <motion.button type="button" onClick={onClick} className={wrapperClass} {...motionProps}>
      {inner}
    </motion.button>
  );
}
