/**
 * Split plain text into paragraphs by double newlines.
 * Trims each paragraph and filters out empty strings.
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
