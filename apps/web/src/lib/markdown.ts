/**
 * Minimal markdown-to-HTML renderer for the guide content.
 * Handles headings, bold, italic, blockquotes, lists, horizontal rules,
 * and inline code. No external dependencies.
 */

export interface HeadingEntry {
  id: string;
  level: number;
  text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function extractHeadings(markdown: string): HeadingEntry[] {
  const headings: HeadingEntry[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ id: slugify(text), level, text });
    }
  }
  return headings;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(text: string): string {
  // Escape HTML first
  let result = escapeHtml(text);

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* (not preceded by another *)
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Inline code: `code`
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-100 text-brand-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>',
  );

  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-brand-600 underline hover:text-brand-800" target="_blank" rel="noreferrer">$1</a>',
  );

  return result;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  const output: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let inBlockquote = false;

  const closeList = () => {
    if (inList) {
      output.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = null;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      output.push('</blockquote>');
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      closeList();
      closeBlockquote();
      output.push('<hr class="my-6 border-slate-200" />');
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      closeBlockquote();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = slugify(text);
      const classes: Record<number, string> = {
        1: 'text-2xl font-bold text-slate-900 mt-8 mb-4',
        2: 'text-xl font-semibold text-slate-900 mt-8 mb-3',
        3: 'text-base font-semibold text-slate-900 mt-6 mb-2',
        4: 'text-sm font-semibold text-slate-700 mt-4 mb-1',
      };
      output.push(
        `<h${level} id="${id}" class="${classes[level] ?? ''}"><a href="#${id}" class="hover:text-brand-600 no-underline">${renderInline(text)}</a></h${level}>`,
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      closeList();
      if (!inBlockquote) {
        output.push(
          '<blockquote class="my-4 border-l-4 border-brand-300 pl-4 text-slate-600 italic">',
        );
        inBlockquote = true;
      }
      output.push(`<p class="mb-1">${renderInline(line.slice(2))}</p>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      closeBlockquote();
      if (!inList || listType !== 'ul') {
        closeList();
        output.push('<ul class="my-3 space-y-1 list-disc pl-5 text-slate-700">');
        inList = true;
        listType = 'ul';
      }
      output.push(`<li class="text-sm leading-relaxed">${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      closeBlockquote();
      if (!inList || listType !== 'ol') {
        closeList();
        output.push('<ol class="my-3 space-y-1 list-decimal pl-5 text-slate-700">');
        inList = true;
        listType = 'ol';
      }
      output.push(`<li class="text-sm leading-relaxed">${renderInline(olMatch[1])}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      closeBlockquote();
      continue;
    }

    // Regular paragraph
    closeList();
    closeBlockquote();
    output.push(
      `<p class="my-3 text-sm leading-relaxed text-slate-700">${renderInline(line)}</p>`,
    );
  }

  closeList();
  closeBlockquote();

  return output.join('\n');
}
