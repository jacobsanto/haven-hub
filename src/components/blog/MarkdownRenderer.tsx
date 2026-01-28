import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  return (
    <div
      className={`
        prose prose-lg max-w-none
        prose-headings:font-serif prose-headings:text-foreground prose-headings:scroll-mt-24
        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground prose-strong:font-semibold
        prose-blockquote:border-l-4 prose-blockquote:border-primary/50 
        prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground
        prose-blockquote:my-8 prose-blockquote:py-2
        prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
        prose-li:text-muted-foreground prose-li:my-2
        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
        first:prose-p:first-letter:text-5xl first:prose-p:first-letter:font-serif 
        first:prose-p:first-letter:float-left first:prose-p:first-letter:mr-3 
        first:prose-p:first-letter:mt-1 first:prose-p:first-letter:text-primary
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

// Helper function to extract headings for Table of Contents
export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    headings.push({ id, text, level });
  }

  return headings;
}
