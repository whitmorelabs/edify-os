/**
 * LogoLockup — shared brand component for navbar, footer, and sidebar.
 *
 * Renders: [Edify SVG mark] [edify wordmark text] [OS chip] [PRIVATE BETA pill]
 * - The mark is an inline SVG (3 purple horizontal bars) — always transparent background.
 * - The wordmark "edify" is rendered as text in the brand color.
 * - "OS" uses monospace font, same color as wordmark, no border (Option A).
 * - "PRIVATE BETA" pill is env-gated via NEXT_PUBLIC_SHOW_BETA_BADGE.
 *   Defaults to visible if unset. Set to "false" to hide.
 */

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
  { markSize: number; wordmarkSize: string; osSize: string; betaSize: string }
> = {
  sm: { markSize: 18, wordmarkSize: "text-[15px]", osSize: "text-[10px]", betaSize: "text-[8px]" },
  md: { markSize: 22, wordmarkSize: "text-[18px]", osSize: "text-[13px]", betaSize: "text-[10px]" },
  lg: { markSize: 28, wordmarkSize: "text-[22px]", osSize: "text-[16px]", betaSize: "text-[11px]" },
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

  const { markSize, wordmarkSize, osSize, betaSize } = sizeMap[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Edify E-mark — inline SVG: 3 purple horizontal bars, always transparent bg */}
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        style={{ display: "block", flexShrink: 0 }}
      >
        <rect x="4" y="8" width="56" height="12" rx="2" fill="#9F4EF3" />
        <rect x="4" y="26" width="40" height="12" rx="2" fill="#9F4EF3" />
        <rect x="4" y="44" width="56" height="12" rx="2" fill="#9F4EF3" />
      </svg>

      {/* "DIFY" wordmark — the SVG E-mark replaces the letter E */}
      <span
        className={`font-bold leading-none tracking-[-0.03em] ${wordmarkSize}`}
        style={{ color: "var(--fg-1)", marginLeft: "-4px" }}
      >
        DIFY
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