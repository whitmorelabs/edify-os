'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useSupportChat, isSupportChatDismissed } from './ChatProvider';
import { cn } from '@/lib/utils';

interface ProactiveHelperProps {
  /** Page-level idle threshold in milliseconds. Default: 60000 (60s). */
  idleThreshold?: number;
  /** Number of failed form actions before showing the tooltip. Default: 3. */
  failedActionThreshold?: number;
}

const DISMISSED_KEY = 'edify_proactive_helper_dismissed';

function getDismissedPages(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function dismissPage(page: string): void {
  try {
    const pages = getDismissedPages();
    pages.add(page);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...pages]));
  } catch {
    // Silently ignore
  }
}

export function ProactiveHelper({
  idleThreshold = 60_000,
  failedActionThreshold = 3,
}: ProactiveHelperProps) {
  const { isOpen, openChat } = useSupportChat();
  const [visible, setVisible] = useState(false);
  const [chatWidgetDismissed, setChatWidgetDismissed] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageKey = useRef<string>('');

  const failedActionsRef = useRef(0);

  const show = useCallback(() => {
    if (isOpen) return;
    if (chatWidgetDismissed) return;
    const dismissed = getDismissedPages();
    if (dismissed.has(pageKey.current)) return;
    setVisible(true);
  }, [isOpen, chatWidgetDismissed]);

  const dismiss = useCallback(() => {
    setVisible(false);
    dismissPage(pageKey.current);
  }, []);

  const handleOpenChat = useCallback(() => {
    dismiss();
    openChat();
  }, [dismiss, openChat]);

  // Set page key on mount
  useEffect(() => {
    pageKey.current = typeof window !== 'undefined' ? window.location.pathname : '/';
  }, []);

  // Sync ChatWidget dismissal state on mount — if user dismissed the chat widget,
  // never show the proactive helper (it would be a ghost tooltip with no widget to open).
  useEffect(() => {
    if (isSupportChatDismissed()) setChatWidgetDismissed(true);
  }, []);

  // Idle detection: reset timer on user activity
  useEffect(() => {
    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(show, idleThreshold);
    };

    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    // Start the timer immediately
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [show, idleThreshold]);

  // Listen for failed form submissions
  useEffect(() => {
    const handleInvalid = () => {
      failedActionsRef.current += 1;
      if (failedActionsRef.current >= failedActionThreshold) {
        show();
      }
    };

    document.addEventListener('invalid', handleInvalid, true);
    return () => document.removeEventListener('invalid', handleInvalid, true);
  }, [show, failedActionThreshold]);

  // Hide tooltip if user opens chat manually
  useEffect(() => {
    if (isOpen) setVisible(false);
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-24 right-6 z-40',
        'flex items-end gap-2',
        'animate-slide-up',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative max-w-[240px] rounded-2xl bg-slate-800 text-white px-4 py-3 shadow-xl">
        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-white transition"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>

        <p className="text-sm font-medium pr-5 leading-snug">
          Stuck? Your support assistant can help.
        </p>

        <button
          onClick={handleOpenChat}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200 transition"
        >
          <MessageCircle size={13} />
          Get help now
        </button>

        {/* Tail pointing down-right */}
        <span
          className="absolute -bottom-2 right-8 w-4 h-2 overflow-hidden"
          aria-hidden="true"
        >
          <span className="block w-3 h-3 bg-slate-800 rotate-45 translate-y-[-50%] translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}
