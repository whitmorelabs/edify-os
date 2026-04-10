'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  LayoutDashboard,
  Users,
  Inbox,
  CheckSquare,
  Brain,
  Plug,
  Settings,
} from 'lucide-react';
import { useChatPanel } from './chat-provider';
import { AGENT_COLORS, AGENT_SLUGS } from '@/lib/agent-colors';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/inbox', label: 'Inbox', icon: Inbox },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/memory', label: 'Memory', icon: Brain },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openChat, activeAgent, isOpen } = useChatPanel();

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-brand-950 overflow-y-auto sidebar-scroll">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-5">
        <Sparkles size={22} className="text-brand-300" />
        <span className="text-white font-bold text-lg">Edify OS</span>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-brand-300 bg-white/10 px-2 py-0.5 rounded-full">
          AI Teams
        </span>
      </div>

      {/* Navigation */}
      <nav className="px-3 mt-6 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

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
              {label}
            </Link>
          );
        })}
      </nav>

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
