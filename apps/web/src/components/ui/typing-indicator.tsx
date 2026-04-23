"use client";

/**
 * TypingIndicator — "director is thinking" cue.
 * Three purple dots in a tinted pill. Respects reduced-motion (dots go
 * flat at 0.7 opacity with no loop — handled by the global CSS override).
 */

export interface TypingIndicatorProps {
  /** Label next to the dots. Default "Thinking". */
  label?: string;
}

export function TypingIndicator({ label = "Thinking" }: TypingIndicatorProps) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-[4px_14px_14px_14px] px-3.5 py-2.5"
      style={{
        background: "var(--bg-3)",
        /* Purple glow ring — design preview §10 */
        boxShadow:
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(159,78,243,0.2), 0 0 16px rgba(159,78,243,0.2)",
      }}
    >
      <ThinkDot delay="0s" />
      <ThinkDot delay="0.16s" />
      <ThinkDot delay="0.32s" />
      <span className="ml-1.5 text-[12px] italic text-[var(--fg-3)]">{label}</span>
      <style jsx>{`
        @keyframes edify-think-dot {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}

function ThinkDot({ delay }: { delay: string }) {
  return (
    <span
      aria-hidden
      className="inline-block"
      style={{
        width: 6,
        height: 6,
        borderRadius: 9999,
        background: "var(--brand-purple)",
        animation: "edify-think-dot 1.2s ease-in-out infinite",
        animationDelay: delay,
      }}
    />
  );
}
