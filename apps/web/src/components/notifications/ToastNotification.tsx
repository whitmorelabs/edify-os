'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Info } from 'lucide-react';
import { ARCHETYPE_CONFIG } from '@/lib/archetype-config';
import type { ArchetypeSlug } from '@/app/dashboard/inbox/heartbeats';
import { useNotifications } from './NotificationProvider';
import type { Notification } from './types';
import { cn } from '@/lib/utils';

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 5000;

interface ToastItem {
  notification: Notification;
  id: string; // may differ from notification.id to allow re-showing
  exiting: boolean;
}

export function ToastNotification() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { markAsRead } = useNotifications();
  const router = useRouter();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function scheduleRemoval(toastId: string) {
    const timer = setTimeout(() => beginExit(toastId), AUTO_DISMISS_MS);
    timersRef.current.set(toastId, timer);
  }

  function beginExit(toastId: string) {
    setToasts((prev) =>
      prev.map((t) => (t.id === toastId ? { ...t, exiting: true } : t))
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 300);
  }

  function dismiss(toastId: string) {
    const timer = timersRef.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(toastId);
    }
    beginExit(toastId);
  }

  function handleClick(toast: ToastItem) {
    markAsRead(toast.notification.id);
    dismiss(toast.id);
    router.push(toast.notification.link);
  }

  // Listen for new notifications dispatched by NotificationProvider
  useEffect(() => {
    function handleNewNotifications(e: Event) {
      const newItems = (e as CustomEvent<Notification[]>).detail;
      if (!newItems?.length) return;

      setToasts((prev) => {
        const combined = [
          ...newItems.map((n) => ({
            notification: n,
            id: `${n.id}-${Date.now()}`,
            exiting: false,
          })),
          ...prev,
        ];
        // Keep only most recent MAX_TOASTS
        return combined.slice(0, MAX_TOASTS);
      });

      // Schedule auto-dismiss for each new toast
      newItems.forEach((n) => {
        const toastId = `${n.id}-${Date.now()}`;
        scheduleRemoval(toastId);
      });
    }

    window.addEventListener('edify:new-notifications', handleNewNotifications);
    return () =>
      window.removeEventListener('edify:new-notifications', handleNewNotifications);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const { notification } = toast;
        const archetypeConfig = notification.archetype
          ? ARCHETYPE_CONFIG[notification.archetype as ArchetypeSlug]
          : null;

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto w-80 bg-white rounded-xl shadow-xl border border-slate-200',
              'flex items-start gap-3 p-4 transition-all duration-300',
              toast.exiting
                ? 'opacity-0 translate-x-4'
                : 'opacity-100 translate-x-0 animate-slide-in-right'
            )}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {archetypeConfig ? (
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    archetypeConfig.bg
                  )}
                >
                  <archetypeConfig.icon className="w-4 h-4 text-white" />
                </div>
              ) : notification.type === 'system' ? (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100">
                  <Info className="w-4 h-4 text-slate-500" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-100">
                  <Bell className="w-4 h-4 text-brand-600" />
                </div>
              )}
            </div>

            {/* Content — clickable area */}
            <button
              className="flex-1 min-w-0 text-left"
              onClick={() => handleClick(toast)}
            >
              <p className="text-sm font-semibold text-slate-900 leading-snug truncate">
                {notification.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {notification.body}
              </p>
            </button>

            {/* Dismiss */}
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors -mr-1 -mt-1 p-1 rounded"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
