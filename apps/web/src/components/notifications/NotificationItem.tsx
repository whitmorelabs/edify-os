'use client';

import { Bell, Info } from 'lucide-react';
import { ARCHETYPE_CONFIG } from '@/lib/archetype-config';
import type { ArchetypeSlug } from '@/app/dashboard/inbox/heartbeats';
import type { Notification } from './types';
import { cn } from '@/lib/utils';

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'yesterday';
  return `${diffDay} days ago`;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { type, title, body, archetype, timestamp, read } = notification;

  const archetypeConfig = archetype ? ARCHETYPE_CONFIG[archetype as ArchetypeSlug] : null;

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors',
        'hover:bg-slate-50 border-l-2',
        read ? 'border-l-transparent' : 'border-l-brand-500 bg-brand-50/30'
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
        ) : type === 'system' ? (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100">
            <Info className="w-4 h-4 text-slate-500" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-100">
            <Bell className="w-4 h-4 text-brand-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug truncate',
            read ? 'font-normal text-slate-700' : 'font-semibold text-slate-900'
          )}
        >
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{body}</p>
        <p className="text-[11px] text-slate-400 mt-1">{formatRelativeTime(timestamp)}</p>
      </div>

      {/* Unread dot */}
      {!read && (
        <div className="shrink-0 mt-2">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
        </div>
      )}
    </button>
  );
}
