/**
 * LogoLockup — shared brand component for navbar, footer, and sidebar.
 *
 * Renders: [EDIFY wordmark] [OS chip] [PRIVATE BETA pill]
 * - The wordmark SVG embeds the 3-bar E-mark + "DIFY" as a single file.
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

const sizeMap: Record<LogoSize, { height: number; osSize: string; betaSize: string }> = {
  sm: { height: 20, osSize: "text-[10px]", betaSize: "text-[8px]" },
  md: { height: 28, osSize: "text-[13px]", betaSize: "text-[10px]" },
  lg: { height: 36, osSize: "text-[16px]", betaSize: "text-[11px]" },
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

  const { height, osSize, betaSize } = sizeMap[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Wordmark: E-mark + DIFY text */}
      <Image
        src="/brand/edify-wordmark.svg"
        alt="Edify"
        height={height}
        width={Math.round(height * (200 / 48))}
        style={{ height, width: "auto", color: "var(--fg-1)" }}
        priority
      />

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