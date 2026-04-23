import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { readGuideFile, ARTICLE_ORDER } from '@/lib/guide-content';
import { renderMarkdown, extractHeadings } from '@/lib/markdown';
import { ArticleFeedback } from '../../ArticleFeedback';
import { ArchetypeMark, ARCHETYPES } from '@/components/ui';
import type { ArchetypeKey } from '@/components/ui';

const SLUG_TO_ARCHETYPE: Record<string, ArchetypeKey> = {
  'development-director': 'dev',
  'marketing-director': 'marketing',
  'executive-assistant': 'exec',
  'programs-director': 'programs',
  'hr-volunteer-coordinator': 'hr',
  'events-director': 'events',
};

const SLUG_TO_LABEL: Record<string, string> = {
  'development-director': 'Development Director',
  'marketing-director': 'Marketing Director',
  'executive-assistant': 'Executive Assistant',
  'programs-director': 'Programs Director',
  'hr-volunteer-coordinator': 'HR & Volunteer Coordinator',
  'events-director': 'Events Director',
};

const TEAM_SLUG_ORDER = ARTICLE_ORDER
  .filter((s) => s.startsWith('meet-your-team/'))
  .map((s) => s.replace('meet-your-team/', ''));

export function generateStaticParams() {
  return TEAM_SLUG_ORDER.map((slug) => ({ slug }));
}

interface PageProps {
  params: { slug: string };
}

export default function TeamMemberArticlePage({ params }: PageProps) {
  const markdown = readGuideFile(`meet-your-team/${params.slug}.md`);
  if (!markdown) notFound();

  const arcKey = SLUG_TO_ARCHETYPE[params.slug];
  const arc = arcKey ? ARCHETYPES[arcKey] : null; // used for color only
  const html = renderMarkdown(markdown);
  const headings = extractHeadings(markdown).filter((h) => h.level >= 2);

  const slugIdx = TEAM_SLUG_ORDER.indexOf(params.slug);
  const prevSlug = slugIdx > 0 ? TEAM_SLUG_ORDER[slugIdx - 1] : null;
  const nextSlug = slugIdx < TEAM_SLUG_ORDER.length - 1 ? TEAM_SLUG_ORDER[slugIdx + 1] : null;

  return (
    <div className="flex gap-8">
      <article className="flex-1 min-w-0 animate-fade-in">
        {/* Archetype badge */}
        {arcKey && arc && (
          <div
            className="inline-flex items-center gap-2.5 rounded-xl px-4 py-2 mb-6"
            style={{
              background: 'var(--bg-2)',
              boxShadow: `inset 0 0 0 1px ${arc.color}33`,
            }}
          >
            <ArchetypeMark arcKey={arcKey} size={28} />
            <span className="text-sm font-semibold" style={{ color: arc.color }}>
              {arc.role}
            </span>
          </div>
        )}

        <div
          className="prose-guide"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Team member nav */}
        <div
          className="mt-12 pt-8 flex items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--line-1)' }}
        >
          {prevSlug ? (
            <Link
              href={`/dashboard/guide/meet-your-team/${prevSlug}`}
              className="flex items-center gap-2 text-sm font-medium text-fg-2 hover:text-brand-500 transition"
            >
              <ChevronLeft size={16} className="shrink-0" />
              <span>
                <span className="text-xs text-fg-3 block">Previous</span>
                {SLUG_TO_LABEL[prevSlug] ?? prevSlug}
              </span>
            </Link>
          ) : (
            <Link
              href="/dashboard/guide/meet-your-team"
              className="flex items-center gap-2 text-sm font-medium text-fg-2 hover:text-brand-500 transition"
            >
              <ChevronLeft size={16} />
              Meet your team
            </Link>
          )}

          {nextSlug ? (
            <Link
              href={`/dashboard/guide/meet-your-team/${nextSlug}`}
              className="flex items-center gap-2 text-sm font-medium text-fg-2 hover:text-brand-500 transition text-right"
            >
              <span>
                <span className="text-xs text-fg-3 block">Next</span>
                {SLUG_TO_LABEL[nextSlug] ?? nextSlug}
              </span>
              <ChevronRight size={16} className="shrink-0" />
            </Link>
          ) : (
            <Link
              href="/dashboard/guide/working-with-your-team"
              className="flex items-center gap-2 text-sm font-medium text-fg-2 hover:text-brand-500 transition text-right"
            >
              <span>
                <span className="text-xs text-fg-3 block">Next section</span>
                Working with your team
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
            <p className="label mb-3 text-fg-3">On this page</p>
            <nav className="space-y-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className="block text-xs text-fg-3 hover:text-brand-500 transition leading-relaxed"
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
