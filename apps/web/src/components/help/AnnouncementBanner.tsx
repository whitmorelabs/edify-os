'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnouncementBannerProps {
  /** Unique identifier used to remember dismissal in localStorage. */
  id: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

const DISMISSED_KEY = 'edify_dismissed_banners';

function getDismissedBanners(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function dismissBanner(id: string): void {
  try {
    const dismissed = getDismissedBanners();
    dismissed.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
  } catch {
    // Silently ignore
  }
}

export function AnnouncementBanner({
  id,
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
}: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(false);

  // Check dismissal state on mount (client-only)
  useEffect(() => {
    const dismissed = getDismissedBanners();
    if (!dismissed.has(id)) {
      setVisible(true);
    }
  }, [id]);

  function handleDismiss() {
    setVisible(false);
    dismissBanner(id);
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        'relative w-full flex items-center gap-3 px-4 py-3',
        'bg-brand-50 border-b border-brand-100',
        'animate-fade-in',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-100">
        <Sparkles size={14} className="text-brand-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-3">
        <span className="text-sm font-semibold text-brand-800 truncate">
          {title}
        </span>
        <span className="hidden sm:inline text-brand-300 text-sm">·</span>
        <span className="text-sm text-brand-700 truncate">{description}</span>
      </div>

      {/* CTA */}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="flex-shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-800 underline underline-offset-2 transition whitespace-nowrap"
        >
          {ctaLabel}
        </Link>
      )}

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded text-brand-400 hover:text-brand-700 transition"
        aria-label="Dismiss announcement"
      >
        <X size={15} />
      </button>
    </div>
  );
}
