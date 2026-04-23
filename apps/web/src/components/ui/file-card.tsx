"use client";

import { Download } from "lucide-react";

// ---------------------------------------------------------------------------
// FileCard — file attachment card primitive
// Matches design spec in `14-files.html` exactly.
// ---------------------------------------------------------------------------

export interface FileCardProps {
  /** File name, e.g. "Board-prep-Q3-fundraising.pdf" */
  name: string;
  /** File size in bytes. Pass undefined/0 to hide size in meta line. */
  size?: number;
  /** File type — drives the badge treatment. Unknown extensions render as DOCX-style. */
  type: "pdf" | "docx" | "image" | string;
  /** ISO datetime string used for relative time display. */
  createdAt: string;
  /** URL for download/open */
  href: string;
  /** If true, renders the just-arrived state with purple glow. Defaults to false. */
  isNew?: boolean;
  /** Optional image preview URL for image-type files. */
  thumbnailUrl?: string;
  /** Extra classnames for the outer element */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${Math.round(bytes / 1_024)} KB`;
  return `${bytes} B`;
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 2) return "yesterday";
  if (days < 7) return `${days}d ago`;

  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Derive a short badge label from a MIME type or extension string. */
function badgeLabel(type: string, name: string): string {
  const normalized = type.toLowerCase();
  if (normalized === "pdf" || normalized.includes("pdf")) return "PDF";
  if (normalized === "docx" || normalized.includes("wordprocessingml") || normalized.includes("word")) return "DOCX";
  if (normalized === "image" || normalized.startsWith("image/")) {
    const ext = name.split(".").pop()?.toUpperCase();
    return ext ?? "IMG";
  }
  // Fallback: extract extension from name
  const ext = name.split(".").pop()?.toUpperCase();
  return ext ?? "FILE";
}

/** Determine the visual treatment for the badge. */
function badgeTreatment(type: string, name: string): "pdf" | "docx" | "image" {
  const normalized = type.toLowerCase();
  if (normalized === "pdf" || normalized.includes("pdf")) return "pdf";
  if (normalized === "image" || normalized.startsWith("image/")) return "image";
  return "docx";
}

// ---------------------------------------------------------------------------
// Badge sub-component
// ---------------------------------------------------------------------------

interface BadgeProps {
  treatment: "pdf" | "docx" | "image";
  label: string;
  thumbnailUrl?: string;
}

function FileTypeBadge({ treatment, label, thumbnailUrl }: BadgeProps) {
  const baseStyle: React.CSSProperties = {
    width: 44,
    height: 54,
    flexShrink: 0,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 500,
    overflow: "hidden",
    position: "relative",
  };

  if (treatment === "pdf") {
    return (
      <div
        style={{
          ...baseStyle,
          background: "#1A1030",
          boxShadow: "inset 0 0 0 1px rgba(159,78,243,0.32)",
          color: "#D8B8F9",
        }}
      >
        {label}
      </div>
    );
  }

  if (treatment === "image") {
    if (thumbnailUrl) {
      return (
        <div
          style={{
            ...baseStyle,
            background: "linear-gradient(135deg, #3F1F5C, #1A1030)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      );
    }
    return (
      <div
        style={{
          ...baseStyle,
          background: "linear-gradient(135deg, #3F1F5C, #1A1030)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      />
    );
  }

  // DOCX / unknown
  return (
    <div
      style={{
        ...baseStyle,
        background: "#17171F",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        color: "#8E8B9C",
      }}
    >
      {label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FileCard({
  name,
  size,
  type,
  createdAt,
  href,
  isNew = false,
  thumbnailUrl,
  className,
}: FileCardProps) {
  const treatment = badgeTreatment(type, name);
  const label = badgeLabel(type, name);
  const time = relativeTime(createdAt);
  const sizeStr = size && size > 0 ? formatSize(size) : null;
  const meta = [sizeStr, time].filter(Boolean).join(" · ");

  const restingShadow =
    "0 0 0 1px rgba(255,255,255,0.06)";
  const newShadow =
    "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(159,78,243,0.32), 0 0 32px rgba(159,78,243,0.24)";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 12,
        background: "var(--bg-2)",
        boxShadow: isNew ? newShadow : restingShadow,
        // Glow decay: when isNew, animate from the purple glow shadow to the resting shadow over 5s.
        animation: isNew ? "filecard-glow-decay 5s var(--ease-standard) forwards" : undefined,
      }}
    >
      <FileTypeBadge treatment={treatment} label={label} thumbnailUrl={thumbnailUrl} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--fg-1)",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={name}
        >
          {name}
        </div>
        {meta && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-3)",
              marginTop: 2,
            }}
          >
            {meta}
          </div>
        )}
      </div>

      {isNew && (
        <a
          href={href}
          download={name}
          aria-label={`Download ${name}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            flexShrink: 0,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background var(--dur-fast) var(--ease-standard)",
            color: "var(--fg-2)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          <Download size={16} />
        </a>
      )}
    </div>
  );
}
