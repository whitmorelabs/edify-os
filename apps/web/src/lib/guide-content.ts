import fs from 'fs';
import path from 'path';

// Resolve from the monorepo root
const CONTENT_ROOT = path.resolve(process.cwd(), '../../content/guide');

export interface GuideArticle {
  slug: string;
  title: string;
  content: string;
}

export function readGuideFile(relativePath: string): string | null {
  const filePath = path.join(CONTENT_ROOT, relativePath);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

export function getAllGuideArticles(): GuideArticle[] {
  const articles: GuideArticle[] = [];

  const topLevelFiles = [
    'getting-started',
    'working-with-your-team',
    'organization-setup',
    'faq',
    'troubleshooting',
  ];

  for (const slug of topLevelFiles) {
    const content = readGuideFile(`${slug}.md`);
    if (content) {
      articles.push({ slug, title: extractTitle(content), content });
    }
  }

  const meetTeamSlugs = [
    'development-director',
    'marketing-director',
    'executive-assistant',
    'programs-director',
    'finance-director',
    'hr-volunteer-coordinator',
    'events-director',
  ];

  for (const slug of meetTeamSlugs) {
    const content = readGuideFile(`meet-your-team/${slug}.md`);
    if (content) {
      articles.push({ slug: `meet-your-team/${slug}`, title: extractTitle(content), content });
    }
  }

  return articles;
}

export const ARTICLE_ORDER = [
  'getting-started',
  'meet-your-team/development-director',
  'meet-your-team/marketing-director',
  'meet-your-team/executive-assistant',
  'meet-your-team/programs-director',
  'meet-your-team/finance-director',
  'meet-your-team/hr-volunteer-coordinator',
  'meet-your-team/events-director',
  'working-with-your-team',
  'organization-setup',
  'faq',
  'troubleshooting',
];

export function getAdjacentArticles(currentSlug: string): {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
} {
  const idx = ARTICLE_ORDER.indexOf(currentSlug);
  if (idx === -1) return { prev: null, next: null };

  const allArticles = getAllGuideArticles();
  const bySlug = Object.fromEntries(allArticles.map((a) => [a.slug, a]));

  const prevSlug = idx > 0 ? ARTICLE_ORDER[idx - 1] : null;
  const nextSlug = idx < ARTICLE_ORDER.length - 1 ? ARTICLE_ORDER[idx + 1] : null;

  return {
    prev: prevSlug && bySlug[prevSlug] ? { slug: prevSlug, title: bySlug[prevSlug].title } : null,
    next: nextSlug && bySlug[nextSlug] ? { slug: nextSlug, title: bySlug[nextSlug].title } : null,
  };
}
