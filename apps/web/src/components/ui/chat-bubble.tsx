"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArchetypeMark } from "./archetype-mark";
import type { Archetype } from "./archetypes";
import { chatBubble } from "@/lib/motion";

export interface ChatBubbleProps {
  /** "user" renders right-aligned purple bubble; "agent" renders left-aligned with archetype mark. */
  role: "user" | "agent";
  /** Message body — plain text or React nodes (e.g. Markdown). */
  children: ReactNode;
  /** Required for agent bubbles — the director producing the message. */
  arc?: Archetype;
  /** Optional file / action node rendered under an agent bubble. */
  trailing?: ReactNode;
}

/**
 * ChatBubble — speech bubble in two shapes.
 * User: brand purple, right-aligned, fg-on-purple text.
 * Agent: bg-3, left-aligned, 2px archetype-colored left border, mark avatar.
 */
export function ChatBubble({ role, children, arc, trailing }: ChatBubbleProps) {
  if (role === "user") {
    return (
      <motion.div
        variants={chatBubble}
        initial="hidden"
        animate="show"
        className="flex justify-end"
      >
        <div
          className="max-w-[70%] rounded-[14px_14px_4px_14px] px-4 py-3 text-[14px] font-medium leading-[1.5]"
          style={{
            background: "var(--brand-purple)",
            color: "var(--fg-on-purple)",
          }}
        >
          {children}
        </div>
      </motion.div>
    );
  }

  if (!arc) {
    // Avoid a hard crash in dev when an agent bubble is misconfigured.
    return null;
  }

  return (
    <motion.div
      variants={chatBubble}
      initial="hidden"
      animate="show"
      className="flex gap-2.5 items-start"
    >
      <ArchetypeMark arc={arc} size={28} />
      <div className="flex flex-col gap-2.5 max-w-[70%]">
        <div
          className="rounded-[4px_14px_14px_14px] px-4 py-3 text-[14px] leading-[1.55] text-[var(--fg-1)]"
          style={{
            background: "var(--bg-3)",
            /* P2 — inset top-edge highlight added to existing hairline border */
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px var(--line-2)",
            borderLeft: `2px solid ${arc.color}`,
          }}
        >
          {children}
        </div>
        {trailing}
      </div>
    </motion.div>
  );
}
