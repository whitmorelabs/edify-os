"use client";

/**
 * ArchetypeMark — the visual "avatar" for a director archetype.
 * Layered identity (plaque + diagonal hairline + glyph), not a flat icon.
 * Use anywhere we'd reach for a user avatar.
 *
 * Accepts either a full `arc` object (client usage) or an `arcKey` string
 * (server-component-safe — avoids passing Icon functions across the boundary).
 */

import type { Archetype, ArchetypeKey } from "./archetypes";
import { ARCHETYPES } from "./archetypes";

export interface ArchetypeMarkProps {
  /** Full archetype object (client components). */
  arc?: Archetype;
  /** Archetype key — use from server components to avoid function boundary error. */
  arcKey?: ArchetypeKey;
  size?: number;
  className?: string;
}

export function ArchetypeMark({ arc: arcProp, arcKey, size = 40, className }: ArchetypeMarkProps) {
  const arc = arcProp ?? (arcKey ? ARCHETYPES[arcKey] : null);
  if (!arc) return null;
  const radius = size >= 44 ? 12 : 8;
  const { Icon, color } = arc;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: `inset 0 0 0 1px ${color}3D, 0 4px 12px ${color}1F`,
        background: `linear-gradient(135deg, ${color}22 0%, ${color}0A 50%, transparent 100%), var(--bg-3)`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 7px, ${color}14 7px 8px)`,
          mixBlendMode: "screen",
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}
      >
        <Icon width={Math.round(size * 0.46)} height={Math.round(size * 0.46)} />
      </div>
    </div>
  );
}

/**
 * ArchetypePortrait — the big hero-spotlight composition.
 * Soft radial glow + concentric arcs + tick marks + centered glyph.
 */

export interface ArchetypePortraitProps {
  arc: Archetype;
  size?: number;
  /** Whether the ambient glow pulses. Off for reduced-motion. */
  breathing?: boolean;
}

export function ArchetypePortrait({
  arc,
  size = 200,
  breathing = true,
}: ArchetypePortraitProps) {
  const { color, Icon } = arc;
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 40% 35%, ${color}40 0%, ${color}10 45%, transparent 75%)`,
          filter: "blur(2px)",
          animation: breathing ? "hero-breathe 5.6s ease-in-out infinite" : undefined,
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 220 220"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* concentric arcs */}
        {[82, 66, 52].map((r, i) => (
          <circle
            key={i}
            cx="110"
            cy="110"
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.14 + i * 0.06}
            strokeWidth="1"
            strokeDasharray={i === 0 ? "2 6" : i === 1 ? "4 4" : undefined}
          />
        ))}
        {/* tick marks around outer arc */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r1 = 98;
          const r2 = 92;
          const x1 = 110 + Math.cos(a) * r1;
          const y1 = 110 + Math.sin(a) * r1;
          const x2 = 110 + Math.cos(a) * r2;
          const y2 = 110 + Math.sin(a) * r2;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeOpacity={i % 6 === 0 ? 0.4 : 0.12}
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "relative",
          width: Math.round(size * 0.345),
          height: Math.round(size * 0.345),
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${color}33, ${color}0A)`,
          boxShadow: `inset 0 0 0 1px ${color}55, 0 0 32px ${color}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}
      >
        <Icon width={Math.round(size * 0.155)} height={Math.round(size * 0.155)} />
      </div>
    </div>
  );
}
