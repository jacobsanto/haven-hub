import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { InlineImage as InlineImageType } from '@/types/blog';
import { ArticleStyle } from '@/types/article-styles';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  inlineImages?: InlineImageType[];
  style?: ArticleStyle;
}

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Custom renderer for enhanced styling
const renderer = new marked.Renderer();

// Enhanced heading rendering with better spacing
renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map(t => ('raw' in t ? t.raw : '')).join('');
  const id = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  const marginClass = depth === 2 ? 'mt-16 mb-6' : 'mt-10 mb-4';
  const sizeClass = depth === 2 ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl';
  
  return `<h${depth} id="${id}" class="${sizeClass} ${marginClass} font-serif text-foreground scroll-mt-24">${text}</h${depth}>`;
};

// Enhanced paragraph with better spacing
renderer.paragraph = ({ tokens }) => {
  const text = tokens.map(t => {
    if ('raw' in t) return (t as { raw: string }).raw;
    if ('text' in t) return (t as { text: string }).text;
    return '';
  }).join('');
  
  return `<p class="text-muted-foreground leading-relaxed mb-8">${text}</p>`;
};

// Enhanced blockquote - will be processed for pull quotes
renderer.blockquote = ({ tokens }) => {
  const text = tokens.map(t => {
    if ('raw' in t) return t.raw;
    return '';
  }).join('');
  
  // Check for special patterns
  if (text.includes('**Pro Tip:**') || text.includes('**Tip:**')) {
    const cleanText = text.replace(/\*\*(Pro )?Tip:\*\*/i, '').replace(/<\/?p[^>]*>/g, '').trim();
    return `<div class="callout-tip">${cleanText}</div>`;
  }
  
  if (text.includes('**Note:**') || text.includes('**Info:**')) {
    const cleanText = text.replace(/\*\*(Note|Info):\*\*/i, '').replace(/<\/?p[^>]*>/g, '').trim();
    return `<div class="callout-info">${cleanText}</div>`;
  }
  
  if (text.includes('**Best Time:**') || text.includes('**When:**')) {
    const cleanText = text.replace(/\*\*(Best Time|When):\*\*/i, '').replace(/<\/?p[^>]*>/g, '').trim();
    return `<div class="callout-timing">${cleanText}</div>`;
  }
  
  if (text.includes('**Recommendation:**') || text.includes('**Our Pick:**')) {
    const cleanText = text.replace(/\*\*(Recommendation|Our Pick):\*\*/i, '').replace(/<\/?p[^>]*>/g, '').trim();
    return `<div class="callout-recommendation">${cleanText}</div>`;
  }
  
  // Check if it looks like a pull quote (short, impactful statement)
  const plainText = text.replace(/<[^>]*>/g, '').trim();
  if (plainText.length < 200 && !plainText.includes('\n\n')) {
    return `<div class="pull-quote">${plainText}</div>`;
  }
  
  // Default blockquote
  return `<blockquote class="border-l-4 border-primary/50 pl-6 my-8 py-2 italic text-muted-foreground">${text}</blockquote>`;
};

// Enhanced horizontal rule as section divider
renderer.hr = () => {
  return `<div class="section-divider"></div>`;
};

// Enhanced list styling
renderer.list = ({ items, ordered }) => {
  const tag = ordered ? 'ol' : 'ul';
  const listClass = ordered 
    ? 'list-decimal pl-6 my-8 space-y-3' 
    : 'list-disc pl-6 my-8 space-y-3';
  const content = items.map(item => {
    const text = item.tokens.map(t => ('raw' in t ? t.raw : '')).join('');
    return `<li class="text-muted-foreground leading-relaxed">${text}</li>`;
  }).join('');
  return `<${tag} class="${listClass}">${content}</${tag}>`;
};

// Enhanced link styling
renderer.link = ({ href, text }) => {
  return `<a href="${href}" class="text-primary hover:underline font-medium">${text}</a>`;
};

// Enhanced strong text
renderer.strong = ({ text }) => {
  return `<strong class="font-semibold text-foreground">${text}</strong>`;
};

// Enhanced code blocks
renderer.code = ({ text, lang }) => {
  return `<pre class="bg-muted rounded-xl p-5 my-8 overflow-x-auto"><code class="text-sm">${text}</code></pre>`;
};

// Enhanced inline code
renderer.codespan = ({ text }) => {
  return `<code class="bg-muted px-2 py-1 rounded text-sm font-mono">${text}</code>`;
};

// Enhanced images
renderer.image = ({ href, title, text }) => {
  const caption = title || text;
  return `
    <figure class="my-10 md:my-14">
      <div class="overflow-hidden rounded-xl md:rounded-2xl shadow-lg">
        <img src="${href}" alt="${text}" class="w-full h-auto object-cover" loading="lazy" />
      </div>
      ${caption ? `<figcaption class="mt-4 text-center text-sm text-muted-foreground italic">${caption}</figcaption>` : ''}
    </figure>
  `;
};

marked.use({ renderer });

export function MarkdownRenderer({ content, className = '', inlineImages = [], style = 'destination-guide' }: MarkdownRendererProps) {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    
    const isDestinationGuide = style === 'destination-guide';
    const isLifestyle = style === 'lifestyle';
    const isTravelTips = style === 'travel-tips';
    let rawHtml = marked.parse(content) as string;
    
    // Process pull quotes
    rawHtml = rawHtml.replace(
      /<div class="pull-quote">([\s\S]*?)<\/div>/g,
      `<div class="my-12 md:my-16 px-6 md:px-12 py-8 md:py-10 relative">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-2xl"></div>
        <div class="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-primary via-accent to-primary/50 rounded-full"></div>
        <span class="absolute -top-4 left-4 text-7xl md:text-8xl font-serif text-primary/20 select-none leading-none">"</span>
        <div class="relative z-10 text-xl md:text-2xl lg:text-3xl font-serif italic text-foreground leading-relaxed text-center md:text-left">$1</div>
        <span class="absolute -bottom-8 right-4 text-7xl md:text-8xl font-serif text-primary/20 select-none leading-none rotate-180">"</span>
      </div>`
    );
    
    // Process tip callouts
    rawHtml = rawHtml.replace(
      /<div class="callout-tip">([\s\S]*?)<\/div>/g,
      `<div class="my-8 md:my-10 rounded-xl border bg-accent/5 border-accent/20 overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-3 border-b border-accent/20">
          <svg class="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
          <span class="font-semibold text-sm uppercase tracking-wide text-accent">Pro Tip</span>
        </div>
        <div class="px-5 py-4 text-foreground/90 leading-relaxed">$1</div>
      </div>`
    );
    
    // Process info callouts
    rawHtml = rawHtml.replace(
      /<div class="callout-info">([\s\S]*?)<\/div>/g,
      `<div class="my-8 md:my-10 rounded-xl border bg-primary/5 border-primary/20 overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-3 border-b border-primary/20">
          <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="font-semibold text-sm uppercase tracking-wide text-primary">Good to Know</span>
        </div>
        <div class="px-5 py-4 text-foreground/90 leading-relaxed">$1</div>
      </div>`
    );
    
    // Process timing callouts
    rawHtml = rawHtml.replace(
      /<div class="callout-timing">([\s\S]*?)<\/div>/g,
      `<div class="my-8 md:my-10 rounded-xl border bg-muted border-border overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-3 border-b border-border">
          <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Best Time</span>
        </div>
        <div class="px-5 py-4 text-foreground/90 leading-relaxed">$1</div>
      </div>`
    );
    
    // Process recommendation callouts
    rawHtml = rawHtml.replace(
      /<div class="callout-recommendation">([\s\S]*?)<\/div>/g,
      `<div class="my-8 md:my-10 rounded-xl border bg-accent/5 border-accent/20 overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-3 border-b border-accent/20">
          <svg class="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span class="font-semibold text-sm uppercase tracking-wide text-accent">Recommendation</span>
        </div>
        <div class="px-5 py-4 text-foreground/90 leading-relaxed">$1</div>
      </div>`
    );
    
    // Process section dividers
    rawHtml = rawHtml.replace(
      /<div class="section-divider"><\/div>/g,
      `<div class="my-14 md:my-20 flex items-center justify-center gap-4">
        <div class="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-primary/30"></div>
        <div class="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-accent"></div>
        <div class="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-primary/30"></div>
      </div>`
    );
    
    // Add drop cap to first paragraph - only for destination guides
    if (isDestinationGuide) {
      rawHtml = rawHtml.replace(
        /<p class="text-muted-foreground leading-relaxed mb-8">([\s\S]*?)<\/p>/,
        (match, content) => {
          const firstChar = content.trim().charAt(0);
          const rest = content.trim().slice(1);
          return `<p class="text-muted-foreground leading-relaxed mb-8">
            <span class="float-left text-6xl md:text-7xl font-serif text-primary mr-3 mt-1 leading-none">${firstChar}</span>${rest}
          </p>`;
        }
      );
    }
    
    // Travel tips: style H2s as numbered sections
    if (isTravelTips) {
      let sectionNumber = 0;
      rawHtml = rawHtml.replace(
        /<h2([^>]*)class="([^"]*)"([^>]*)>([^<]*)<\/h2>/g,
        (match, before, classes, after, text) => {
          sectionNumber++;
          return `<div class="relative mt-12 mb-6">
            <span class="absolute -left-2 md:-left-12 top-0 text-4xl md:text-5xl font-medium text-primary/20">${sectionNumber.toString().padStart(2, '0')}</span>
            <h2${before}class="${classes}"${after}>${text}</h2>
          </div>`;
        }
      );
    }
    
    // Lifestyle: clean minimal dividers
    if (isLifestyle) {
      rawHtml = rawHtml.replace(
        /<div class="my-14 md:my-20 flex items-center justify-center gap-4">[\s\S]*?<\/div>/g,
        `<div class="my-12 md:my-16 border-t border-border/50"></div>`
      );
    }
    
    return DOMPurify.sanitize(rawHtml);
  }, [content, style]);

  return (
    <div
      className={`
        prose prose-lg max-w-none
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
