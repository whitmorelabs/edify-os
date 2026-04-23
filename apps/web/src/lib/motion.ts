/**
 * Edify OS — motion library.
 *
 * Ported from Claude Design's MOTION.md spec. Everything here mirrors the
 * CSS custom properties in globals.css so CSS-only motion and Framer Motion
 * motion are visually identical.
 *
 * The spec:
 *   - 6 durations (80ms → 2400ms), mapped to intent
 *   - 4 easings, mapped to intent (standard, entrance, exit, emphasis)
 *   - +linear for loops
 *   - 40ms stagger baseline
 *   - Reduced motion collapses everything
 */

import { useReducedMotion, type Variants } from "framer-motion";

/* ------------------------------------------------------------------------- */
/* DURATIONS (seconds — Framer Motion expects seconds, not ms)                */
/* ------------------------------------------------------------------------- */

export const DURATION = {
  instant: 0.08,
  fast: 0.14,
  base: 0.22,
  slow: 0.36,
  slower: 0.52,
  ambient: 2.4,
} as const;

export type DurationKey = keyof typeof DURATION;

/* ------------------------------------------------------------------------- */
/* EASINGS (Framer Motion accepts bezier tuples [x1, y1, x2, y2])             */
/* ------------------------------------------------------------------------- */

export const EASE = {
  /** Default UI motion — use for hover, toggle, small state changes. */
  standard: [0.32, 0.72, 0, 1] as const,
  /** Things appearing — out-expo. */
  entrance: [0.16, 1, 0.3, 1] as const,
  /** Things leaving — in-expo. */
  exit: [0.7, 0, 0.84, 0] as const,
  /** Tiny overshoot for "satisfying" moments (approval, file arrival). */
  emphasis: [0.2, 0.9, 0.1, 1.2] as const,
  /** Only for loops — spinner, shimmer. Never discrete transitions. */
  linear: [0, 0, 1, 1] as const,
} as const;

export type EaseKey = keyof typeof EASE;

/** Base stagger between multi-item arrivals. */
export const STAGGER = 0.04; // 40ms

/* ------------------------------------------------------------------------- */
/* BASE VARIANTS                                                              */
/* ------------------------------------------------------------------------- */

/** Simple fade in — no movement. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE.entrance },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASE.exit },
  },
};

/**
 * Default entry for cards, rows, chips, bubbles — opacity + 8px rise +
 * subtle scale. Use `staggerContainer` as the parent for lists.
 */
export const entrance: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE.entrance },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION.fast, ease: EASE.exit },
  },
};

/** Same as `entrance` but row-shaped: no scale change. */
export const entranceRow: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.entrance },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION.fast, ease: EASE.exit },
  },
};

/** Parent for staggered children. Cap the stagger sensibly. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: STAGGER,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: STAGGER / 2,
      staggerDirection: -1,
    },
  },
};

/**
 * Approval-card entry — slide-in from the right + fade.
 * Pair with staggerContainer (120ms stagger override, not 40ms).
 */
export const approvalEntry: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.slow, ease: EASE.entrance },
  },
};

/** Approval accepted — slide right + fade + height collapse. */
export const approvalAccept: Variants = {
  exit: {
    x: 40,
    opacity: 0,
    height: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: {
      duration: 0.45,
      ease: EASE.exit,
      height: { delay: 0.27, duration: 0.18 },
    },
  },
};

/** Approval rejected — shorter slide left + wobble + collapse. "Discarded" feel. */
export const approvalReject: Variants = {
  exit: {
    x: -20,
    rotate: -2,
    opacity: 0,
    height: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: {
      duration: 0.45,
      ease: EASE.exit,
      height: { delay: 0.27, duration: 0.18 },
    },
  },
};

/** File arrival — small scale pop with emphasis overshoot. */
export const fileArrival: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.slower, ease: EASE.emphasis },
  },
};

/** Page / route transitions. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.entrance },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION.fast, ease: EASE.exit },
  },
};

/** Chat bubble entry — mirrors CSS `bubbleIn`. */
export const chatBubble: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE.entrance },
  },
};

/* ------------------------------------------------------------------------- */
/* REDUCED-MOTION HELPERS                                                     */
/* ------------------------------------------------------------------------- */

/**
 * Returns variants with durations collapsed to `0.01s` if the user prefers
 * reduced motion. Use this whenever a component defines its own inline
 * variants. For the pre-built variants above, pass them through
 * `maybeReduce()` before handing off to a `motion` element.
 */
export function useMotionPrefs(): {
  reduced: boolean;
  duration: Record<DurationKey, number>;
  ease: typeof EASE;
  stagger: number;
} {
  const reduced = useReducedMotion() ?? false;
  if (reduced) {
    return {
      reduced: true,
      duration: {
        instant: 0,
        fast: 0,
        base: 0,
        slow: 0,
        slower: 0,
        ambient: 0,
      },
      ease: EASE,
      stagger: 0,
    };
  }
  return { reduced: false, duration: { ...DURATION }, ease: EASE, stagger: STAGGER };
}

/**
 * Collapse a variants object's durations for reduced-motion users.
 * Use when a component imports a shared variant and needs to honor prefs.
 */
export function maybeReduce<T extends Variants>(variants: T, reduced: boolean): T {
  if (!reduced) return variants;
  const collapsed = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(variants)) {
    if (value && typeof value === "object" && "transition" in value) {
      collapsed[key] = {
        ...(value as object),
        transition: {
          ...((value as { transition?: object }).transition ?? {}),
          duration: 0,
        },
      };
    } else {
      collapsed[key] = value;
    }
  }
  return collapsed as T;
}

/* ------------------------------------------------------------------------- */
/* UTILS                                                                       */
/* ------------------------------------------------------------------------- */

/** `useCountUp` — animates from 0 (or current value) to target over `duration` ms. */
export function countUpEase(progress: number): number {
  // matches `1 - Math.pow(1 - pr, 4)` from the reference components.jsx
  return 1 - Math.pow(1 - progress, 4);
}
