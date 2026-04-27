'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
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
  Sunrise,
  Waves,
  Sparkles,
} from 'lucide-react';
import { AGENT_COLORS, AGENT_SLUGS } from '@/lib/agent-colors';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { useAuth } from '@/components/AuthProvider';
import { useArchetypeNames } from '@/hooks/useArchetypeNames';
import { LogoLockup } from '@/components/brand/logo-lockup';
import type { EnabledAgentsMap } from '@/app/api/team/enabled/route';
import type { InboxItem } from '@/app/api/inbox/pending/route';

const navLinks = [
  { href: '/dashboard/briefing/today', label: 'Briefing', icon: Sunrise },
  { href: '/dashboard/ripple', label: 'Ripple', icon: Waves },
  { href: '/dashboard/story-builder', label: 'Story Builder', icon: Sparkles },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/decision-lab', label: 'Advisory Board', icon: FlaskConical },
  { href: '/dashboard/inbox', label: 'Inbox', icon: Inbox },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/memory', label: 'Knowledge Base', icon: Brain },
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
  const [briefingComplete, setBriefingComplete] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<EnabledAgentsMap | null>(null);
  /** Pending approvals count for the Inbox badge. Refreshes on route change. */
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  /** True when today's morning briefing exists but hasn't been viewed yet. */
  const [briefingReady, setBriefingReady] = useState(false);
  /** Pending ripple actions count for the Ripple badge. Refreshes on route change. */
  const [pendingRippleCount, setPendingRippleCount] = useState(0);

  useEffect(() => {
    fetch('/api/team/enabled')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EnabledAgentsMap | null) => setEnabledAgents(data))
      .catch(() => setEnabledAgents(null));
  }, []);

  useEffect(() => {
    // Reuses /api/inbox/pending — same endpoint the Inbox page uses.
    fetch('/api/inbox/pending', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: InboxItem[]) => {
        const count = data.filter((item) => item.status === 'pending').length;
        setPendingApprovalsCount(count);
      })
      .catch(() => setPendingApprovalsCount(0));
  }, [pathname]);

  useEffect(() => {
    fetch('/api/ripple/pending-count', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data: { count: number }) => setPendingRippleCount(data.count))
      .catch(() => setPendingRippleCount(0));
  }, [pathname]);

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

  // Check if today's morning briefing exists but hasn't been viewed
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const viewedKey = `edify_briefing_viewed_${today}`;
    const alreadyViewed = localStorage.getItem(viewedKey) === 'true';

    if (pathname.startsWith('/dashboard/briefing/today')) {
      localStorage.setItem(viewedKey, 'true');
      setBriefingReady(false);
      return;
    }

    if (alreadyViewed) {
      setBriefingReady(false);
      return;
    }

    // Check if a briefing exists for today
    fetch('/api/briefing/generate', { cache: 'no-store' })
      .then((res) => {
        if (res.ok) setBriefingReady(true);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <aside className="w-64 shrink-0 h-full flex flex-col bg-brand-950 overflow-y-auto sidebar-scroll">
      {/* Header — logo lockup replaces old Edify OS text + Sparkles icon */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <LogoLockup size="sm" showBeta={false} />
        <div className="ml-auto flex items-center gap-1.5">
          <NotificationBell />
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
      <nav className="px-3 mt-2 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          // Approvals badge: amber pill on the Inbox row when pending count > 0
          const isInbox = href === '/dashboard/inbox';
          const approvalsBadgeCount = isInbox ? pendingApprovalsCount : 0;
          const showApprovalsBadge = approvalsBadgeCount > 0;

          // Notification badge: red pill on the Inbox row for unread notifications
          const showNotificationBadge = isInbox && unreadCount > 0 && !showApprovalsBadge;

          // Briefing notification dot: shown when today's briefing is ready but not viewed
          const isBriefing = href === '/dashboard/briefing/today';
          const showBriefingDot = isBriefing && briefingReady;

          // Ripple badge: brand pill on the Ripple row when pending actions exist
          const isRipple = href === '/dashboard/ripple';
          const rippleBadgeCount = isRipple ? pendingRippleCount : 0;
          const showRippleBadge = rippleBadgeCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'text-white'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white',
              )}
              style={
                isActive
                  ? {
                      background: 'rgba(159,78,243,0.15)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(159,78,243,0.5), 0 0 8px rgba(159,78,243,0.12)',
                    }
                  : undefined
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {showApprovalsBadge && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
                  {approvalsBadgeCount >= 100 ? '99+' : approvalsBadgeCount}
                </span>
              )}
              {showNotificationBadge && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {showBriefingDot && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: '#9F4EF3', boxShadow: '0 0 6px rgba(159,78,243,0.6)' }}
                />
              )}
              {showRippleBadge && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand-500 text-white text-[10px] font-bold leading-none">
                  {rippleBadgeCount >= 100 ? '99+' : rippleBadgeCount}
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
        <Link
          href="/dashboard/settings"
          className="text-brand-400 hover:text-brand-200 transition"
          aria-label="Settings"
        >
          <Settings size={16} />
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-brand-950 text-brand-300 hover:text-white transition shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:flex h-screen">
        {sidebarContent}
      </div>

      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 flex h-screen overflow-hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}