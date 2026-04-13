import Link from 'next/link';
import {
  Landmark,
  Megaphone,
  CalendarCheck,
  ClipboardList,
  UserCog,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';

const teamMembers = [
  {
    slug: 'development-director',
    icon: Landmark,
    label: 'Development Director',
    tagline: 'Grants, donor relationships, fundraising strategy',
    description:
      'Your fundraising engine. They research grants, write proposals, steward donors, and keep your revenue pipeline full.',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    accentBorder: 'border-emerald-200',
    iconBg: 'bg-emerald-500',
  },
  {
    slug: 'marketing-director',
    icon: Megaphone,
    label: 'Marketing Director',
    tagline: 'Social media, email campaigns, brand voice, press',
    description:
      'Your voice. They handle every piece of external communication -- from Instagram captions to press releases.',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    accentBorder: 'border-amber-200',
    iconBg: 'bg-amber-500',
  },
  {
    slug: 'executive-assistant',
    icon: CalendarCheck,
    label: 'Executive Assistant',
    tagline: 'Scheduling, email triage, meeting prep, task tracking',
    description:
      'Your operational backbone. They keep your inbox under control, your calendar organized, and your to-do list manageable.',
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-700',
    accentBorder: 'border-sky-200',
    iconBg: 'bg-sky-500',
  },
  {
    slug: 'programs-director',
    icon: ClipboardList,
    label: 'Programs Director',
    tagline: 'Program design, outcomes, compliance, evaluation',
    description:
      'Your program expert. They help you design programs that work, measure impact, and report to funders.',
    accentBg: 'bg-violet-50',
    accentText: 'text-violet-700',
    accentBorder: 'border-violet-200',
    iconBg: 'bg-violet-500',
  },
  {
    slug: 'hr-volunteer-coordinator',
    icon: UserCog,
    label: 'HR & Volunteer Coordinator',
    tagline: 'Hiring, volunteers, policies, staff training',
    description:
      'Your people specialist. They handle hiring, volunteer programs, HR policies, and staff onboarding.',
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-700',
    accentBorder: 'border-rose-200',
    iconBg: 'bg-rose-500',
  },
  {
    slug: 'events-director',
    icon: PartyPopper,
    label: 'Events Director',
    tagline: 'Event planning, run-of-show, sponsorships, post-event review',
    description:
      'Your event planning powerhouse. They handle everything from gala strategy to minute-by-minute run of show.',
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-700',
    accentBorder: 'border-orange-200',
    iconBg: 'bg-orange-500',
  },
];

export default function MeetYourTeamPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="heading-1">Meet Your Team</h1>
        <p className="mt-2 text-slate-500 max-w-2xl">
          You have six AI specialists on staff from day one. Each one has a specific domain.
          Click any team member to learn what they do, when to use them, and example prompts to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {teamMembers.map((member) => {
          const Icon = member.icon;
          return (
            <Link
              key={member.slug}
              href={`/dashboard/guide/meet-your-team/${member.slug}`}
              className={`card-interactive p-5 border ${member.accentBorder} flex gap-4 items-start group`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${member.iconBg}`}>
                <Icon size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`font-semibold ${member.accentText}`}>{member.label}</h3>
                  <ArrowRight size={14} className="shrink-0 text-slate-400 group-hover:text-brand-500 transition" />
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{member.tagline}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{member.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="card p-5 bg-brand-50 border-brand-100">
        <p className="text-sm font-medium text-brand-800">Not sure who to ask?</p>
        <p className="mt-1 text-sm text-brand-700">
          Start with your <strong>Executive Assistant</strong>. They handle a wide range of tasks and can
          point you to the right specialist for anything more specialized.
        </p>
      </div>
    </div>
  );
}
