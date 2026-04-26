"use client";

import { Download } from "lucide-react";
import { relativeTime } from "@/lib/utils";

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
// Constants
// ---------------------------------------------------------------------------

const SHADOW_RESTING = "0 0 0 1px rgba(255,255,255,0.06)";
const SHADOW_NEW =
  "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(159,78,243,0.32), 0 0 32px rgba(159,78,243,0.24)";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${Math.round(bytes / 1_024)} KB`;
  return `${bytes} B`;
}

type BadgeTreatment = "pdf" | "docx" | "image";

/** Returns both the visual treatment and display label for the badge in one pass. */
function badgeInfo(type: string, name: string): { treatment: BadgeTreatment; label: string } {
  const t = type.toLowerCase();
  if (t === "pdf" || t.includes("pdf")) return { treatment: "pdf", label: "PDF" };
  if (t === "image" || t.startsWith("image/")) {
    const label = name.split(".").pop()?.toUpperCase() ?? "IMG";
    return { treatment: "image", label };
  }
  if (t === "docx" || t.includes("wordprocessingml") || t.includes("word")) {
    return { treatment: "docx", label: "DOCX" };
  }
  // Unknown extension — DOCX styling with the actual extension text
  const label = name.split(".").pop()?.toUpperCase() ?? "FILE";
  return { treatment: "docx", label };
}

// ---------------------------------------------------------------------------
// Badge sub-component
// ---------------------------------------------------------------------------

const BADGE_BASE: React.CSSProperties = {
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

interface BadgeProps {
  treatment: BadgeTreatment;
  label: string;
  thumbnailUrl?: string;
}

function FileTypeBadge({ treatment, label, thumbnailUrl }: BadgeProps) {
  if (treatment === "pdf") {
    return (
      <div
        style={{
          ...BADGE_BASE,
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
    const imgStyle: React.CSSProperties = {
      ...BADGE_BASE,
      background: "linear-gradient(135deg, #3F1F5C, #1A1030)",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
    };
    return (
      <div style={imgStyle}>
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden={true}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    );
  }

  // DOCX / unknown
  return (
    <div
      style={{
        ...BADGE_BASE,
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
  const { treatment, label } = badgeInfo(type, name);
  const sizeStr = size && size > 0 ? formatSize(size) : null;
  const meta = sizeStr ? `${sizeStr} · ${relativeTime(createdAt)}` : relativeTime(createdAt);

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
        boxShadow: isNew ? SHADOW_NEW : SHADOW_RESTING,
        animation: isNew ? "filecard-glow-decay 5s var(--ease-standard) forwards" : undefined,
      }}
    >
      <FileTypeBadge treatment={treatment} label={label} thumbnailUrl={thumbnailUrl} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            fontSize: 13,
            color: "var(--fg-1)",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: "none",
          }}
          title={name}
        >
          {name}
        </a>
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
