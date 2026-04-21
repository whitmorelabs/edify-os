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
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { AGENT_COLORS, AGENT_SLUGS } from '@/lib/agent-colors';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { useAuth } from '@/components/AuthProvider';
import { useArchetypeNames } from '@/hooks/useArchetypeNames';
import type { EnabledAgentsMap } from '@/app/api/team/enabled/route';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/decision-lab', label: 'Decision Lab', icon: FlaskConical },
  { href: '/dashboard/inbox', label: 'Inbox', icon: Inbox },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/memory', label: 'Memory', icon: Brain },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/guide', label: 'Help Center', icon: BookOpen },
  { href: '/dashboard/admin', label: 'Admin', icon: Shield },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const { names: archetypeNames } = useArchetypeNames();
  const [briefingComplete, setBriefingComplete] = useState(true); // default true to avoid flash
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<EnabledAgentsMap | null>(null);

  useEffect(() => {
    // Drive the "Active"/"Disabled" label from agent_configs so the sidebar
    // matches the admin dashboard's source of truth instead of hardcoding "Active".
    fetch('/api/team/enabled')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EnabledAgentsMap | null) => setEnabledAgents(data))
      .catch(() => setEnabledAgents(null));
  }, []);

  // Derive display name: prefer full_name > name > email local-part, capitalised
  const displayName: string = (() => {
    const meta = user?.user_metadata as Record<string, string> | undefined;
    if (meta?.full_name) return meta.full_name;
    if (meta?.name) return meta.name;
    if (user?.email) {
      const local = user.email.split('@')[0] ?? '';
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return 'Nonprofit User';
  })();
  const avatarInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    try {
      const done = localStorage.getItem('edify_briefing_completed');
      setBriefingComplete(done === 'true');
    } catch {
      setBriefingComplete(true);
    }
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <aside className="w-64 shrink-0 h-full flex flex-col bg-brand-950 overflow-y-auto sidebar-scroll">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-5">
        <Sparkles size={22} className="text-brand-300" />
        <span className="text-white font-bold text-lg">Edify OS</span>
        <div className="ml-auto flex items-center gap-1.5">
          <NotificationBell />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-300 bg-white/10 px-2 py-0.5 rounded-full">
            AI Teams
          </span>
          {/* Close button — mobile only */}
          <button
            className="lg:hidden ml-1 text-brand-300 hover:text-white transition"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
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
            const isChatActive = pathname.startsWith(`/dashboard/team/${slug}`);
            const customName = archetypeNames[slug];
            const displayLabel = customName ? `${customName} (${config.label})` : config.label;
            // Until the enabled-agents fetch returns we simply hide the badge
            // rather than flashing a stale "Active" label.
            const enabled = enabledAgents ? enabledAgents[slug] : null;

            return (
              <Link
                key={slug}
                href={`/dashboard/team/${slug}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                  isChatActive
                    ? 'bg-white/15 text-white'
                    : 'text-brand-200 hover:bg-white/10',
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    enabled === false ? 'bg-slate-600' : config.bg,
                  )}
                />
                <span
                  className={cn(
                    'flex-1 truncate',
                    enabled === false && 'text-brand-400/70',
                  )}
                >
                  {displayLabel}
                </span>
                {enabled === true && (
                  <span className="text-[10px] text-brand-400">Active</span>
                )}
                {enabled === false && (
                  <span className="text-[10px] text-brand-400/70">Off</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-semibold text-brand-200">
          {avatarInitial}
        </div>
        <span className="text-sm text-brand-200 flex-1 truncate">
          {displayName}
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

  return (
    <>
      {/* Hamburger button — mobile only, fixed top-left */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-brand-950 text-brand-300 hover:text-white transition shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:flex h-screen">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — overlay when open */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Slide-in panel */}
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 flex h-screen overflow-hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
