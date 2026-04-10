/**
 * Converts standard Markdown to Slack mrkdwn format.
 *
 * Key differences between Markdown and Slack mrkdwn:
 * - Bold: **text** / __text__  ->  *text*
 * - Italic: *text* / _text_   ->  _text_
 * - Strikethrough: ~~text~~   ->  ~text~
 * - Links: [text](url)       ->  <url|text>
 * - Inline code: `code`      ->  `code`  (same)
 * - Code blocks: ```code```   ->  ```code``` (same)
 * - Headers: # text           ->  *text* (bolded)
 * - Lists stay mostly the same
 */
export function markdownToMrkdwn(markdown: string): string {
  if (!markdown) return "";

  let result = markdown;

  // Preserve code blocks from transformation
  const codeBlocks: string[] = [];
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Preserve inline code
  const inlineCode: string[] = [];
  result = result.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match);
    return `__INLINE_CODE_${inlineCode.length - 1}__`;
  });

  // Convert links: [text](url) -> <url|text>
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<$2|$1>");

  // Convert bold: **text** or __text__ -> *text*
  // Must happen before italic conversion
  result = result.replace(/\*\*(.+?)\*\*/g, "*$1*");
  result = result.replace(/__(.+?)__/g, "*$1*");

  // Convert italic: single *text* (that isn't bold) -> _text_
  // Only match single asterisks not preceded/followed by another asterisk
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "_$1_");

  // Convert strikethrough: ~~text~~ -> ~text~
  result = result.replace(/~~(.+?)~~/g, "~$1~");

  // Convert headers: # text -> *text*
  result = result.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  // Convert images: ![alt](url) -> <url|alt>
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<$2|$1>");

  // Convert blockquotes: > text -> > text (already compatible, just clean up)
  result = result.replace(/^>\s?/gm, ">");

  // Convert horizontal rules
  result = result.replace(/^---+$/gm, "---");

  // Restore inline code
  for (let i = 0; i < inlineCode.length; i++) {
    result = result.replace(`__INLINE_CODE_${i}__`, inlineCode[i]);
  }

  // Restore code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    result = result.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
  }

  return result;
}
