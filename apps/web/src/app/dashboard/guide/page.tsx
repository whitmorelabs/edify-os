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

const categories = [
  {
    icon: Rocket,
    title: 'Getting Started',
    description: 'Platform overview, key concepts, and your first steps.',
    href: '/dashboard/guide/getting-started',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    icon: Users,
    title: 'Meet Your Team',
    description: 'One guide per specialist: what they do, when to use them, and prompts to try.',
    href: '/dashboard/guide/meet-your-team',
    color: 'bg-emerald-50 text-emerald-600',
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
    title: 'Working With Your Team',
    description: 'How to give good instructions, review outputs, and get better results.',
    href: '/dashboard/guide/working-with-your-team',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: Settings,
    title: 'Organization Setup',
    description: 'Set up your org profile, Memory, and integrations.',
    href: '/dashboard/guide/organization-setup',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    description: 'Privacy, accuracy, pricing, and common questions answered.',
    href: '/dashboard/guide/faq',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: AlertTriangle,
    title: 'Troubleshooting',
    description: 'Common issues and how to fix them.',
    href: '/dashboard/guide/troubleshooting',
    color: 'bg-red-50 text-red-600',
  },
];

export default function GuideLandingPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-12 text-white">
        <h1 className="text-3xl font-bold tracking-tight">How can we help?</h1>
        <p className="mt-2 text-brand-200 max-w-xl">
          Guides, tips, and answers for getting the most out of your AI team.
        </p>
        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <form action="/dashboard/guide/search">
            <input
              type="text"
              name="q"
              placeholder="Search the help center..."
              className="w-full rounded-xl border border-white/20 bg-white px-4 py-3 pl-11 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/40"
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
              <div key={cat.href} className="card p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={cat.href}
                      className="font-semibold text-slate-900 hover:text-brand-600 transition flex items-center gap-1 group"
                    >
                      {cat.title}
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
                    </Link>
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">{cat.description}</p>
                  </div>
                </div>

                {cat.links && (
                  <ul className="mt-4 space-y-1 border-t border-slate-100 pt-4">
                    {cat.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-slate-500 hover:text-brand-600 transition flex items-center gap-1.5"
                        >
                          <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Chat CTA */}
      <div className="card p-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <MessageCircle size={22} className="text-brand-600" />
          </div>
          <div>
            <h3 className="heading-3">Still need help?</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Chat with a support specialist. We typically respond within one business day.
            </p>
          </div>
        </div>
        <Link href="/dashboard/guide/live-chat" className="btn-primary shrink-0">
          Start Chat
        </Link>
      </div>
    </div>
  );
}
