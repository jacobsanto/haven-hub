import { useParams } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBlogPost, useBlogPosts } from '@/hooks/useBlogPosts';
import { extractHeadings } from '@/components/blog/MarkdownRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { getArticleStyle } from '@/types/article-styles';
import type { ArticleStyle } from '@/types/article-styles';
import { DestinationGuideLayout } from '@/components/blog/layouts/DestinationGuideLayout';
import { LifestyleLayout } from '@/components/blog/layouts/LifestyleLayout';
import { TravelTipsLayout } from '@/components/blog/layouts/TravelTipsLayout';
import { ClassicListPostLayout } from '@/components/blog/layouts/ClassicListPostLayout';
import { BeginnersGuideLayout } from '@/components/blog/layouts/BeginnersGuideLayout';
import { ThingsToDoAfterLayout } from '@/components/blog/layouts/ThingsToDoAfterLayout';
import { ProductShowdownLayout } from '@/components/blog/layouts/ProductShowdownLayout';
import { DetailedCaseStudyLayout } from '@/components/blog/layouts/DetailedCaseStudyLayout';
import { HowTheyDidItLayout } from '@/components/blog/layouts/HowTheyDidItLayout';
import { MythDebunkerLayout } from '@/components/blog/layouts/MythDebunkerLayout';

function estimateReadTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || '');
  const { data: relatedPosts } = useBlogPosts({ 
    status: 'published',
    categorySlug: post?.category?.slug 
  });

  const filteredRelated = relatedPosts?.filter(p => p.id !== post?.id).slice(0, 3);

  const headings = useMemo(() => {
    if (!post?.content) return [];
    return extractHeadings(post.content);
  }, [post?.content]);

  useEffect(() => {
    if (!post?.content) return;
    headings.forEach(({ id, text }) => {
      const headingElements = document.querySelectorAll('h2, h3');
      headingElements.forEach((el) => {
        if (el.textContent?.trim() === text && !el.id) {
          el.id = id;
        }
      });
    });
  }, [post?.content, headings]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="h-[35vh] md:h-[40vh] bg-muted" />
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <div className="bg-card rounded-2xl p-6 md:p-10 shadow-lg max-w-4xl mx-auto">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!post) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-serif text-foreground mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Button asChild><Link to="/blog">Back to Blog</Link></Button>
        </div>
      </PageLayout>
    );
  }

  const readTime = estimateReadTime(post.content);
  const publishedDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  const author = post.author || {
    name: 'Arivia Editorial',
    avatar_url: null,
    bio: 'Our editorial team curates the finest travel insights, destination guides, and luxury living inspiration.',
  };

  // Use explicit article_style if set, otherwise fall back to category-based
  const articleStyle: ArticleStyle = post.article_style || getArticleStyle(post.category?.slug);

  const layoutProps = {
    post,
    headings,
    readTime,
    publishedDate,
    author,
    relatedPosts: filteredRelated,
  };

  const layoutMap: Record<ArticleStyle, React.ReactNode> = {
    'destination-guide': <DestinationGuideLayout {...layoutProps} />,
    'lifestyle': <LifestyleLayout {...layoutProps} />,
    'travel-tips': <TravelTipsLayout {...layoutProps} />,
    'classic-list-post': <ClassicListPostLayout {...layoutProps} />,
    'beginners-guide': <BeginnersGuideLayout {...layoutProps} />,
    'things-to-do-after': <ThingsToDoAfterLayout {...layoutProps} />,
    'product-showdown': <ProductShowdownLayout {...layoutProps} />,
    'detailed-case-study': <DetailedCaseStudyLayout {...layoutProps} />,
    'how-they-did-it': <HowTheyDidItLayout {...layoutProps} />,
    'myth-debunker': <MythDebunkerLayout {...layoutProps} />,
  };

  return (
    <PageLayout>
      {layoutMap[articleStyle] || <DestinationGuideLayout {...layoutProps} />}
    </PageLayout>
  );
}
