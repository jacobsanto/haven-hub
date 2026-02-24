import { useEffect } from 'react';
import { usePageContent } from '@/hooks/usePageContent';

type PageSEODefaults = Record<string, string> & {
  meta_title: string;
  meta_description: string;
  og_image: string;
};

function setMetaTag(nameOrProperty: string, content: string, attr: 'name' | 'property' = 'name') {
  const selector = `meta[${attr}="${nameOrProperty}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, nameOrProperty);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

interface PageSEOProps {
  pageSlug: string;
  defaults: PageSEODefaults;
}

export function PageSEO({ pageSlug, defaults }: PageSEOProps) {
  const seo = usePageContent(pageSlug, 'seo', defaults);

  useEffect(() => {
    if (seo.isLoading) return;

    document.title = seo.meta_title;
    setMetaTag('description', seo.meta_description);
    setMetaTag('og:title', seo.meta_title, 'property');
    setMetaTag('og:description', seo.meta_description, 'property');
    setMetaTag('og:image', seo.og_image, 'property');
    setMetaTag('twitter:image', seo.og_image);
    setMetaTag('twitter:card', 'summary_large_image');
  }, [seo.meta_title, seo.meta_description, seo.og_image, seo.isLoading]);

  return null;
}
