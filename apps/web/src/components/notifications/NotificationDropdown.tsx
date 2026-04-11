'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications } from './NotificationProvider';
import { NotificationItem } from './NotificationItem';
import type { Notification } from './types';

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const recent = notifications.slice(0, 20);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id);
    onClose();
    router.push(notification.link);
  }

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-slide-up"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-900">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">You&apos;re all caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No new updates from your team.</p>
          </div>
        ) : (
          recent.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={handleNotificationClick}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {recent.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5">
          <Link
            href="/dashboard/inbox"
            onClick={onClose}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all in Inbox &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
