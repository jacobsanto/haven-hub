import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Tag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBlogPost, useBlogPosts } from '@/hooks/useBlogPosts';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { MobileTableOfContents } from '@/components/blog/MobileTableOfContents';
import { FloatingShareBar } from '@/components/blog/FloatingShareBar';
import { SocialShareButtons } from '@/components/blog/SocialShareButtons';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import { MarkdownRenderer, extractHeadings } from '@/components/blog/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax effect for hero
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);

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
          <div className="max-w-4xl mx-auto mt-12 space-y-4">
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

  const author = post.author || {
    name: 'Arivia Editorial',
    avatar_url: null,
    bio: 'Our editorial team curates the finest travel insights, destination guides, and luxury living inspiration.',
  };

  const authorInitials = author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <PageLayout>
      {/* Reading Progress Indicator */}
      <ReadingProgress />

      {/* Floating Share Bar - Desktop Only */}
      {!isMobile && <FloatingShareBar title={post.title} />}

      {/* Mobile TOC */}
      {isMobile && headings.length > 0 && (
        <MobileTableOfContents headings={headings} />
      )}

      {/* Hero Image with Parallax - Reduced Height */}
      <section ref={heroRef} className="relative h-[35vh] md:h-[40vh] overflow-hidden">
        {post.featured_image_url ? (
          <motion.img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            style={{ y: heroY }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        
        {/* Back Link - Top Left */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-background transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Blog
          </Link>
        </div>
      </section>

      {/* Article Header Card - Lifted Design */}
      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-card rounded-2xl p-6 md:p-10 shadow-xl max-w-4xl mx-auto border border-border/50"
        >
          {/* Category Badge */}
          {post.category && (
            <Badge variant="secondary" className="mb-4">
              {post.category.name}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={author.avatar_url || undefined} alt={author.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{author.name}</span>
            </div>
            
            <span className="hidden sm:inline text-border">•</span>
            
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(publishedDate, 'MMMM d, yyyy')}
            </span>
            
            <span className="hidden sm:inline text-border">•</span>
            
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {readTime} min read
            </span>
          </div>
        </motion.div>
      </div>

      {/* Article Content with ToC Sidebar */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex gap-8 lg:gap-16 max-w-6xl mx-auto">
          {/* Main Article */}
          <article className="flex-1 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Excerpt / Lead */}
              {post.excerpt && (
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 font-serif italic leading-relaxed border-l-4 border-primary/30 pl-6">
                  {post.excerpt}
                </p>
              )}

              {/* Content with Markdown Rendering */}
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-blockquote:italic">
                {post.content ? (
                  <MarkdownRenderer content={post.content} />
                ) : (
                  <p className="text-muted-foreground">No content available.</p>
                )}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-sm">
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

              {/* Author Bio - Before Newsletter */}
              <AuthorBio author={author} className="mt-12" />

              {/* Newsletter Signup */}
              <NewsletterSignup className="mt-12" />
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

      {/* Related Posts - Continue Your Journey */}
      {filteredRelated && filteredRelated.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-serif text-foreground">
                Continue Your Journey
              </h2>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/blog" className="gap-2">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRelated.map((relatedPost) => (
                <BlogPostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Button variant="outline" asChild>
                <Link to="/blog">View All Articles</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
}
