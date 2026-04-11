'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Users,
  Inbox,
  CheckSquare,
  Brain,
  Plug,
  Settings,
  BookOpen,
  FlaskConical,
  FileText,
} from 'lucide-react';
import { useChatPanel } from './chat-provider';
import { AGENT_COLORS, AGENT_SLUGS } from '@/lib/agent-colors';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNotifications } from '@/components/notifications/NotificationProvider';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/decision-lab', label: 'Decision Lab', icon: FlaskConical },
  { href: '/dashboard/inbox', label: 'Inbox', icon: Inbox },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/memory', label: 'Memory', icon: Brain },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/guide', label: 'Help Center', icon: BookOpen },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openChat, activeAgent, isOpen } = useChatPanel();
  const { unreadCount } = useNotifications();
  const [briefingComplete, setBriefingComplete] = useState(true); // default true to avoid flash

  useEffect(() => {
    try {
      const done = localStorage.getItem('edify_briefing_completed');
      setBriefingComplete(done === 'true');
    } catch {
      setBriefingComplete(true);
    }
  }, []);

  return (
    <aside className="w-64 shrink-0 h-screen flex flex-col bg-brand-950 overflow-y-auto sidebar-scroll">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-5">
        <Sparkles size={22} className="text-brand-300" />
        <span className="text-white font-bold text-lg">Edify OS</span>
        <div className="ml-auto flex items-center gap-1.5">
          <NotificationBell />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-300 bg-white/10 px-2 py-0.5 rounded-full">
            AI Teams
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 mt-6 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
          const showBadge = href === '/dashboard/inbox' && unreadCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-brand-200 hover:bg-white/10',
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Briefing prompt — shown until org briefing is complete */}
      {!briefingComplete && (
        <div className="mx-3 mt-3">
          <Link
            href="/dashboard/briefing"
            className={cn(
              'flex items-center gap-2.5 rounded-lg border border-brand-400/30 bg-brand-900/50 px-3 py-2.5 text-sm font-medium transition',
              pathname.startsWith('/dashboard/briefing')
                ? 'bg-white/15 text-white'
                : 'text-brand-200 hover:bg-white/10',
            )}
          >
            <FileText size={16} className="shrink-0 text-brand-300" />
            <span className="flex-1 truncate">Brief Your Team</span>
            <span className="shrink-0 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Setup
            </span>
          </Link>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/10 mx-3 my-4" />

      {/* AI Team section */}
      <div className="px-3">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-300 px-3 mb-2">
          Your AI Team
        </p>
        <div className="space-y-0.5">
          {AGENT_SLUGS.map((slug) => {
            const config = AGENT_COLORS[slug];
            const isChatActive = isOpen && activeAgent === slug;

            return (
              <button
                key={slug}
                onClick={() => openChat(slug)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition text-left',
                  isChatActive
                    ? 'bg-white/15 text-white'
                    : 'text-brand-200 hover:bg-white/10',
                )}
              >
                <span
                  className={cn('w-2 h-2 rounded-full flex-shrink-0', config.bg)}
                />
                <span className="flex-1 truncate">{config.label}</span>
                <span className="text-[10px] text-brand-400">Active</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-semibold text-brand-200">
          U
        </div>
        <span className="text-sm text-brand-200 flex-1 truncate">
          Nonprofit User
        </span>
        <button
          className="text-brand-400 hover:text-brand-200 transition"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
}
