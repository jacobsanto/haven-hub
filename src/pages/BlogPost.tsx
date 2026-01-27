import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBlogPost, useBlogPosts } from '@/hooks/useBlogPosts';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { SocialShareButtons } from '@/components/blog/SocialShareButtons';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { MarkdownRenderer, extractHeadings } from '@/components/blog/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function estimateReadTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Add IDs to headings in content for Table of Contents navigation
function addHeadingIds(content: string): string {
  return content.replace(/^(#{2,3})\s+(.+)$/gm, (_, hashes, text) => {
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${hashes} ${text} {#${id}}`;
  });
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || '');
  const { data: relatedPosts } = useBlogPosts({ 
    status: 'published',
    categorySlug: post?.category?.slug 
  });

  // Filter out current post from related
  const filteredRelated = relatedPosts?.filter(p => p.id !== post?.id).slice(0, 3);

  // Extract headings for Table of Contents
  const headings = useMemo(() => {
    if (!post?.content) return [];
    return extractHeadings(post.content);
  }, [post?.content]);

  // Add IDs to the content headings after render
  useEffect(() => {
    if (!post?.content) return;
    
    headings.forEach(({ id, text }) => {
      // Find heading elements and add IDs
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
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-[400px] rounded-2xl mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
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
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const readTime = estimateReadTime(post.content);
  const publishedDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  // Mock author data (in real app, would come from profiles table)
  const author = {
    name: 'Arivia Editorial',
    avatar_url: null,
    bio: 'Our editorial team curates the finest travel insights, destination guides, and luxury living inspiration to help you plan your perfect getaway.',
  };

  return (
    <PageLayout>
      {/* Reading Progress Indicator */}
      <ReadingProgress />

      {/* Hero Image */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </section>

      {/* Article Content with ToC Sidebar */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex gap-8 lg:gap-12">
          {/* Main Article */}
          <article className="flex-1 max-w-3xl mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Back Link */}
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>

              {/* Category Badge */}
              {post.category && (
                <Badge variant="secondary" className="mb-4">
                  {post.category.name}
                </Badge>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground mb-6">
                {post.title}
              </h1>

              {/* Meta & Social Sharing */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(publishedDate, 'MMMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {readTime} min read
                </span>
                <div className="ml-auto">
                  <SocialShareButtons title={post.title} />
                </div>
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-8 font-serif italic">
                  {post.excerpt}
                </p>
              )}

              {/* Content with Markdown Rendering */}
              {post.content ? (
                <MarkdownRenderer content={post.content} />
              ) : (
                <p className="text-muted-foreground">No content available.</p>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Sharing (Bottom) */}
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">Enjoyed this article? Share it with others:</p>
                <SocialShareButtons title={post.title} />
              </div>

              {/* Author Bio */}
              <AuthorBio author={author} className="mt-12" />
            </motion.div>
          </article>

          {/* Table of Contents Sidebar - Desktop Only */}
          {headings.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {filteredRelated && filteredRelated.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/30 mt-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-8">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRelated.map((relatedPost) => (
                <BlogPostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
}
