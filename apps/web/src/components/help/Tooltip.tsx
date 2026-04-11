'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  /** Unique identifier — used to track whether the user has seen this tooltip. */
  id: string;
  /** Help text shown inside the tooltip. */
  content: string;
  /** The element to wrap. */
  children: ReactNode;
  /** Tooltip position relative to the child. Default: 'top'. */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** If true, always show tooltip (ignore localStorage). Useful for debugging. */
  alwaysShow?: boolean;
}

const SEEN_KEY = 'edify_seen_tooltips';

function getSeenTooltips(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markTooltipSeen(id: string): void {
  try {
    const seen = getSeenTooltips();
    seen.add(id);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // Silently ignore
  }
}

const positionClasses: Record<'top' | 'bottom' | 'left' | 'right', string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function HelpTooltip({
  id,
  content,
  children,
  position = 'top',
  alwaysShow = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(true); // Optimistic — hidden until check
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Check localStorage on mount
  useEffect(() => {
    if (alwaysShow) {
      setHasBeenSeen(false);
      return;
    }
    const seen = getSeenTooltips();
    setHasBeenSeen(seen.has(id));
  }, [id, alwaysShow]);

  const showTooltip = useCallback(() => {
    if (hasBeenSeen) return;
    setVisible(true);
    markTooltipSeen(id);
    setHasBeenSeen(true);
  }, [hasBeenSeen, id]);

  const hideTooltip = useCallback(() => {
    setVisible(false);
  }, []);

  // Also trigger on focus (keyboard nav)
  const handleFocus = useCallback(() => {
    showTooltip();
  }, [showTooltip]);

  const handleBlur = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}

      {visible && (
        <div
          className={cn(
            'absolute z-50 pointer-events-none',
            positionClasses[position],
          )}
          role="tooltip"
        >
          <div className="max-w-[220px] rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg leading-relaxed animate-fade-in">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
