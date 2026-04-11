'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from './NotificationProvider';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const prevCountRef = useRef(unreadCount);

  // Pulse animation when unread count increases
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      prevCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        className={cn(
          'relative flex items-center justify-center w-9 h-9 rounded-lg',
          'text-brand-200 hover:text-white hover:bg-white/10 transition-colors',
          open && 'bg-white/15 text-white',
          pulse && 'animate-pulse'
        )}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1 rounded-full',
              'bg-red-500 text-white text-[10px] font-bold leading-none',
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
