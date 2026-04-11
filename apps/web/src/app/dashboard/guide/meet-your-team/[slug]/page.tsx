import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { readGuideFile, ARTICLE_ORDER } from '@/lib/guide-content';
import { renderMarkdown, extractHeadings } from '@/lib/markdown';
import { ArticleFeedback } from '../../ArticleFeedback';
import {
  Landmark,
  Megaphone,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  UserCog,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react';

interface ArchetypeStyle {
  icon: LucideIcon;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  label: string;
}

const ARCHETYPE_STYLES: Record<string, ArchetypeStyle> = {
  'development-director': {
    icon: Landmark,
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    accentBorder: 'border-emerald-300',
    label: 'Development Director',
  },
  'marketing-director': {
    icon: Megaphone,
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    accentBorder: 'border-amber-300',
    label: 'Marketing Director',
  },
  'executive-assistant': {
    icon: CalendarCheck,
    accentBg: 'bg-sky-50',
    accentText: 'text-sky-700',
    accentBorder: 'border-sky-300',
    label: 'Executive Assistant',
  },
  'programs-director': {
    icon: ClipboardList,
    accentBg: 'bg-violet-50',
    accentText: 'text-violet-700',
    accentBorder: 'border-violet-300',
    label: 'Programs Director',
  },
  'finance-director': {
    icon: DollarSign,
    accentBg: 'bg-teal-50',
    accentText: 'text-teal-700',
    accentBorder: 'border-teal-300',
    label: 'Finance Director',
  },
  'hr-volunteer-coordinator': {
    icon: UserCog,
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-700',
    accentBorder: 'border-rose-300',
    label: 'HR & Volunteer Coordinator',
  },
  'events-director': {
    icon: PartyPopper,
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-700',
    accentBorder: 'border-orange-300',
    label: 'Events Director',
  },
};

const TEAM_SLUG_ORDER = ARTICLE_ORDER
  .filter((s) => s.startsWith('meet-your-team/'))
  .map((s) => s.replace('meet-your-team/', ''));

interface PageProps {
  params: { slug: string };
}

export default function TeamMemberArticlePage({ params }: PageProps) {
  const markdown = readGuideFile(`meet-your-team/${params.slug}.md`);
  if (!markdown) notFound();

  const style = ARCHETYPE_STYLES[params.slug];
  const html = renderMarkdown(markdown);
  const headings = extractHeadings(markdown).filter((h) => h.level >= 2);

  const slugIdx = TEAM_SLUG_ORDER.indexOf(params.slug);
  const prevSlug = slugIdx > 0 ? TEAM_SLUG_ORDER[slugIdx - 1] : null;
  const nextSlug = slugIdx < TEAM_SLUG_ORDER.length - 1 ? TEAM_SLUG_ORDER[slugIdx + 1] : null;

  return (
    <div className="flex gap-8">
      <article className="flex-1 min-w-0 animate-fade-in">
        {/* Archetype badge */}
        {style && (
          <div className={`inline-flex items-center gap-2.5 rounded-xl border ${style.accentBorder} ${style.accentBg} px-4 py-2 mb-6`}>
            <style.icon size={18} className={style.accentText} />
            <span className={`text-sm font-semibold ${style.accentText}`}>{style.label}</span>
          </div>
        )}

        <div
          className="prose-guide"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Team member nav */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex items-center justify-between gap-4">
          {prevSlug ? (
            <Link
              href={`/dashboard/guide/meet-your-team/${prevSlug}`}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition"
            >
              <ChevronLeft size={16} className="shrink-0" />
              <span>
                <span className="text-xs text-slate-400 block">Previous</span>
                {ARCHETYPE_STYLES[prevSlug]?.label ?? prevSlug}
              </span>
            </Link>
          ) : (
            <Link
              href="/dashboard/guide/meet-your-team"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition"
            >
              <ChevronLeft size={16} />
              Meet Your Team
            </Link>
          )}

          {nextSlug ? (
            <Link
              href={`/dashboard/guide/meet-your-team/${nextSlug}`}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition text-right"
            >
              <span>
                <span className="text-xs text-slate-400 block">Next</span>
                {ARCHETYPE_STYLES[nextSlug]?.label ?? nextSlug}
              </span>
              <ChevronRight size={16} className="shrink-0" />
            </Link>
          ) : (
            <Link
              href="/dashboard/guide/working-with-your-team"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition text-right"
            >
              <span>
                <span className="text-xs text-slate-400 block">Next section</span>
                Working With Your Team
              </span>
              <ChevronRight size={16} />
            </Link>
          )}
        </div>

        <ArticleFeedback slug={`meet-your-team/${params.slug}`} />
      </article>

      {/* Table of contents */}
      {headings.length > 1 && (
        <aside className="hidden xl:block w-48 shrink-0">
          <div className="sticky top-6">
            <p className="label mb-3">On this page</p>
            <nav className="space-y-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className="block text-xs text-slate-500 hover:text-brand-600 transition leading-relaxed"
                  style={{ paddingLeft: h.level === 2 ? 0 : `${(h.level - 2) * 12}px` }}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
