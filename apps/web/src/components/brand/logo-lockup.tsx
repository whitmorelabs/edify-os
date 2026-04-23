/**
 * LogoLockup — shared brand component for navbar, footer, and sidebar.
 *
 * Renders: [E-mark] [DIFY text] [OS chip] [PRIVATE BETA pill]
 * - The E-mark SVG (edify-mark.svg) is rendered via <Image>.
 * - "DIFY" is rendered as real HTML text (Instrument Sans, 700, --fg-1).
 *   This replaces the previous single combined edify-wordmark.svg approach,
 *   which relied on an external CSS class (.wm) that Next.js <Image> cannot
 *   resolve — causing the DIFY text to be invisible on the live site.
 * - "OS" uses monospace font, same color as wordmark, no border (Option A).
 * - "PRIVATE BETA" pill is env-gated via NEXT_PUBLIC_SHOW_BETA_BADGE.
 *   Defaults to visible if unset. Set to "false" to hide.
 */

import Image from "next/image";

type LogoSize = "sm" | "md" | "lg";

export interface LogoLockupProps {
  /** Visual size variant. Defaults to "md". */
  size?: LogoSize;
  /** Override the env gate for the PRIVATE BETA pill. Defaults to env var. */
  showBeta?: boolean;
  /** Whether to show the "OS" monospace chip. Defaults to true. */
  showOS?: boolean;
  /** Extra class names for the outer wrapper. */
  className?: string;
}

const sizeMap: Record<
  LogoSize,
  { markHeight: number; difySize: string; osSize: string; betaSize: string }
> = {
  sm: { markHeight: 20, difySize: "text-[15px]", osSize: "text-[10px]", betaSize: "text-[8px]" },
  md: { markHeight: 28, difySize: "text-[21px]", osSize: "text-[13px]", betaSize: "text-[10px]" },
  lg: { markHeight: 36, difySize: "text-[27px]", osSize: "text-[16px]", betaSize: "text-[11px]" },
};

export function LogoLockup({
  size = "md",
  showBeta,
  showOS = true,
  className = "",
}: LogoLockupProps) {
  // Env gate: show beta pill if NEXT_PUBLIC_SHOW_BETA_BADGE is not "false".
  // Explicit prop overrides env.
  const envFlag = process.env.NEXT_PUBLIC_SHOW_BETA_BADGE;
  const isBetaVisible = showBeta !== undefined ? showBeta : envFlag !== "false";

  const { markHeight, difySize, osSize, betaSize } = sizeMap[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Wordmark: E-mark SVG + "DIFY" as real HTML text */}
      <span className="inline-flex items-center gap-1.5">
        {/* 3-bar purple E-mark */}
        <Image
          src="/brand/edify-mark.svg"
          alt=""
          aria-hidden
          height={markHeight}
          width={markHeight}
          style={{ height: markHeight, width: markHeight }}
          priority
        />
        {/* "DIFY" — real text so it renders in every context, including Next.js Image */}
        <span
          className={`font-sans font-bold leading-none tracking-[-0.02em] ${difySize}`}
          style={{ color: "var(--fg-1)" }}
          aria-label="EDIFY"
        >
          DIFY
        </span>
      </span>

      {/* "OS" monospace chip — Option A: text only, no border, ~8px gap */}
      {showOS && (
        <span
          className={`font-mono font-medium tracking-tight leading-none ${osSize}`}
          style={{ color: "var(--fg-1)", letterSpacing: "-0.01em" }}
        >
          OS
        </span>
      )}

      {/* PRIVATE BETA pill — env-gated */}
      {isBetaVisible && (
        <span
          className={`inline-flex items-center font-mono uppercase tracking-wider rounded px-2 py-0.5 leading-none border ${betaSize}`}
          style={{
            color: "var(--fg-3)",
            borderColor: "var(--line-3)",
          }}
        >
          PRIVATE BETA
        </span>
      )}
    </span>
  );
}