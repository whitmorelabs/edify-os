"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, ArchetypeMark, ARCHETYPES } from '@/components/ui';

const teamMembers = [
  {
    slug: 'development-director',
    arcKey: 'dev' as const,
    label: 'Development Director',
    tagline: 'Grants, donor relationships, fundraising strategy',
    description:
      'Your fundraising engine. They research grants, write proposals, steward donors, and keep your revenue pipeline full.',
  },
  {
    slug: 'marketing-director',
    arcKey: 'marketing' as const,
    label: 'Marketing Director',
    tagline: 'Social media, email campaigns, brand voice, press',
    description:
      'Your voice. They handle every piece of external communication -- from Instagram captions to press releases.',
  },
  {
    slug: 'executive-assistant',
    arcKey: 'exec' as const,
    label: 'Executive Assistant',
    tagline: 'Scheduling, email triage, meeting prep, task tracking',
    description:
      'Your operational backbone. They keep your inbox under control, your calendar organized, and your to-do list manageable.',
  },
  {
    slug: 'programs-director',
    arcKey: 'programs' as const,
    label: 'Programs Director',
    tagline: 'Program design, outcomes, compliance, evaluation',
    description:
      'Your program expert. They help you design programs that work, measure impact, and report to funders.',
  },
  {
    slug: 'hr-volunteer-coordinator',
    arcKey: 'hr' as const,
    label: 'HR & Volunteer Coordinator',
    tagline: 'Hiring, volunteers, policies, staff training',
    description:
      'Your people specialist. They handle hiring, volunteer programs, HR policies, and staff onboarding.',
  },
  {
    slug: 'events-director',
    arcKey: 'events' as const,
    label: 'Events Director',
    tagline: 'Event planning, run-of-show, sponsorships, post-event review',
    description:
      'Your event planning powerhouse. They handle everything from gala strategy to minute-by-minute run of show.',
  },
];

export default function MeetYourTeamPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="heading-1">Meet your team</h1>
        <p className="mt-2 text-fg-3 max-w-2xl">
          You have six AI specialists on staff from day one. Each one has a specific domain.
          Click any team member to learn what they do, when to use them, and example prompts to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {teamMembers.map((member) => {
          const arc = ARCHETYPES[member.arcKey];
          return (
            <Link
              key={member.slug}
              href={`/dashboard/guide/meet-your-team/${member.slug}`}
              className="flex gap-4 items-start group p-5 rounded-[14px] transition hover:-translate-y-[1px]"
              style={{
                background: 'var(--bg-2)',
                boxShadow: 'var(--shadow-elev-1)',
              }}
            >
              <ArchetypeMark arc={arc} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className="font-semibold text-fg-1"
                    style={{ color: arc.color }}
                  >
                    {member.label}
                  </h3>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-fg-3 transition"
                    style={{ color: 'var(--fg-3)' }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-fg-3">{member.tagline}</p>
                <p className="mt-2 text-sm text-fg-2 leading-relaxed">{member.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <Card elevation={1} className="p-5" style={{ background: 'var(--bg-plum-1)' }}>
        <p className="text-sm font-medium text-fg-1">Not sure who to ask?</p>
        <p className="mt-1 text-sm text-fg-2">
          Start with your <strong>Executive Assistant</strong>. They handle a wide range of tasks and can
          point you to the right specialist for anything more specialized.
        </p>
      </Card>
    </div>
  );
}
