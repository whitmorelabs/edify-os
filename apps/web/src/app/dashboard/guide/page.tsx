import Link from 'next/link';
import {
  Rocket,
  Users,
  BookOpen,
  Settings,
  HelpCircle,
  AlertTriangle,
  MessageCircle,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Card, Button } from '@/components/ui';

const categories = [
  {
    icon: Rocket,
    title: 'Getting started',
    description: 'Platform overview, key concepts, and your first steps.',
    href: '/dashboard/guide/getting-started',
    colorVar: 'var(--brand-purple)',
    bgVar: 'var(--bg-3)',
  },
  {
    icon: Users,
    title: 'Meet your team',
    description: 'One guide per specialist: what they do, when to use them, and prompts to try.',
    href: '/dashboard/guide/meet-your-team',
    colorVar: 'var(--dir-programs)',
    bgVar: 'var(--bg-3)',
    links: [
      { label: 'Development Director', href: '/dashboard/guide/meet-your-team/development-director' },
      { label: 'Marketing Director', href: '/dashboard/guide/meet-your-team/marketing-director' },
      { label: 'Executive Assistant', href: '/dashboard/guide/meet-your-team/executive-assistant' },
      { label: 'Programs Director', href: '/dashboard/guide/meet-your-team/programs-director' },
      { label: 'HR & Volunteer Coordinator', href: '/dashboard/guide/meet-your-team/hr-volunteer-coordinator' },
      { label: 'Events Director', href: '/dashboard/guide/meet-your-team/events-director' },
    ],
  },
  {
    icon: BookOpen,
    title: 'Working with your team',
    description: 'How to give good instructions, review outputs, and get better results.',
    href: '/dashboard/guide/working-with-your-team',
    colorVar: 'var(--dir-marketing)',
    bgVar: 'var(--bg-3)',
  },
  {
    icon: Settings,
    title: 'Organization setup',
    description: 'Set up your org profile, Memory, and integrations.',
    href: '/dashboard/guide/organization-setup',
    colorVar: 'var(--dir-dev)',
    bgVar: 'var(--bg-3)',
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    description: 'Privacy, accuracy, pricing, and common questions answered.',
    href: '/dashboard/guide/faq',
    colorVar: 'var(--brand-purple)',
    bgVar: 'var(--bg-3)',
  },
  {
    icon: AlertTriangle,
    title: 'Troubleshooting',
    description: 'Common issues and how to fix them.',
    href: '/dashboard/guide/troubleshooting',
    colorVar: 'var(--dir-events)',
    bgVar: 'var(--bg-3)',
  },
];

export default function GuideLandingPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero */}
      <div
        className="rounded-xl px-8 py-12"
        style={{ background: 'var(--bg-plum-1)', boxShadow: 'var(--shadow-elev-2)' }}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-fg-1">How can we help?</h1>
        <p className="mt-2 max-w-xl" style={{ color: 'var(--brand-200)' }}>
          Guides, tips, and answers for getting the most out of your AI team.
        </p>
        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-3" />
          <form action="/dashboard/guide/search">
            <input
              type="text"
              name="q"
              placeholder="Search the help center..."
              className="w-full rounded-[10px] border px-4 py-3 pl-11 text-sm focus:outline-none"
              style={{
                background: 'var(--bg-2)',
                borderColor: 'var(--line-2)',
                color: 'var(--fg-1)',
              }}
            />
          </form>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="heading-2 mb-5">Browse by topic</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.href} elevation={1} className="p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'var(--bg-3)' }}
                  >
                    <Icon size={18} style={{ color: cat.colorVar }} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={cat.href}
                      className="font-semibold text-fg-1 hover:text-brand-500 transition flex items-center gap-1 group"
                    >
                      {cat.title}
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
                    </Link>
                    <p className="mt-1 text-sm text-fg-3 leading-relaxed">{cat.description}</p>
                  </div>
                </div>

                {cat.links && (
                  <ul
                    className="mt-4 space-y-1 pt-4"
                    style={{ borderTop: '1px solid var(--line-1)' }}
                  >
                    {cat.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-fg-3 hover:text-brand-500 transition flex items-center gap-1.5"
                        >
                          <span
                            className="w-1 h-1 rounded-full shrink-0"
                            style={{ background: 'var(--line-3)' }}
                          />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Live Chat CTA */}
      <Card elevation={1} className="p-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--bg-3)' }}
          >
            <MessageCircle size={22} style={{ color: 'var(--brand-purple)' }} />
          </div>
          <div>
            <h3 className="heading-3">Still need help?</h3>
            <p className="mt-0.5 text-sm text-fg-3">
              Chat with a support specialist. We typically respond within one business day.
            </p>
          </div>
        </div>
        <Link href="/dashboard/guide/live-chat">
          <Button variant="primary" size="md">Start chat</Button>
        </Link>
      </Card>
    </div>
  );
}
