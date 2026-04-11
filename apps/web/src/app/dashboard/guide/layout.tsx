'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Users,
  HelpCircle,
  AlertTriangle,
  Settings,
  MessageCircle,
  ChevronRight,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainLinks = [
  { href: '/dashboard/guide', label: 'Help Center', icon: BookOpen, exact: true },
  { href: '/dashboard/guide/getting-started', label: 'Getting Started', icon: Rocket },
  {
    href: '/dashboard/guide/meet-your-team',
    label: 'Meet Your Team',
    icon: Users,
    children: [
      { href: '/dashboard/guide/meet-your-team/development-director', label: 'Development Director' },
      { href: '/dashboard/guide/meet-your-team/marketing-director', label: 'Marketing Director' },
      { href: '/dashboard/guide/meet-your-team/executive-assistant', label: 'Executive Assistant' },
      { href: '/dashboard/guide/meet-your-team/programs-director', label: 'Programs Director' },
      { href: '/dashboard/guide/meet-your-team/finance-director', label: 'Finance Director' },
      { href: '/dashboard/guide/meet-your-team/hr-volunteer-coordinator', label: 'HR & Volunteer Coordinator' },
      { href: '/dashboard/guide/meet-your-team/events-director', label: 'Events Director' },
    ],
  },
  { href: '/dashboard/guide/working-with-your-team', label: 'Working With Your Team', icon: BookOpen },
  { href: '/dashboard/guide/organization-setup', label: 'Organization Setup', icon: Settings },
  { href: '/dashboard/guide/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/dashboard/guide/troubleshooting', label: 'Troubleshooting', icon: AlertTriangle },
];

function GuideSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white px-3 py-6 overflow-y-auto">
      <p className="label px-3 mb-3">Help Center</p>
      <nav className="space-y-0.5">
        {mainLinks.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <div key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive && !link.children
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  link.children && isActive ? 'text-brand-700' : '',
                )}
              >
                <Icon size={15} className="shrink-0" />
                {link.label}
              </Link>
              {link.children && isActive && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'block rounded-md px-2 py-1.5 text-xs font-medium transition',
                        pathname === child.href
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-500 hover:text-slate-900',
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-4 pt-4 border-t border-slate-200">
          <Link
            href="/dashboard/guide/live-chat"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <MessageCircle size={15} className="shrink-0" />
            Live Chat Support
          </Link>
        </div>
      </nav>
    </aside>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs: { label: string; href: string }[] = [];
  let current = '';
  for (const seg of segments) {
    current += `/${seg}`;
    const label = seg
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    crumbs.push({ label, href: current });
  }

  if (crumbs.length <= 2) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-slate-400 mb-6">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} />}
          {i === crumbs.length - 1 ? (
            <span className="text-slate-600 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-brand-500 transition">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen -m-6 lg:-m-8">
      <GuideSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-4xl">
          <Breadcrumbs />
          {children}
        </div>
      </div>
    </div>
  );
}
