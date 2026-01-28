import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Tag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { BlogPost } from '@/types/blog';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { FloatingShareBar } from '@/components/blog/FloatingShareBar';
import { MobileTableOfContents } from '@/components/blog/MobileTableOfContents';
import { SocialShareButtons } from '@/components/blog/SocialShareButtons';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { extractHeadings } from '@/components/blog/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMemo } from 'react';

interface LifestyleLayoutProps {
  post: BlogPost;
  readTime: number;
  publishedDate: Date;
  author: { name: string; avatar_url: string | null; bio?: string | null };
  relatedPosts?: BlogPost[];
}

export function LifestyleLayout({
  post,
  readTime,
  publishedDate,
  author,
  relatedPosts,
}: LifestyleLayoutProps) {
  const isMobile = useIsMobile();

  const headings = useMemo(() => {
    if (!post.content) return [];
    return extractHeadings(post.content);
  }, [post.content]);

  const authorInitials = author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <ReadingProgress />
      {!isMobile && <FloatingShareBar title={post.title} />}
      {isMobile && headings.length > 0 && <MobileTableOfContents headings={headings} />}

      {/* Back Link - Consistent Style */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-foreground text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>

      {/* Split Hero - Magazine Style */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-2xl order-2 md:order-1"
          >
            {post.featured_image_url ? (
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/10" />
            )}
          </motion.div>

          {/* Title & Meta */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 md:order-2"
          >
            {post.category && (
              <Badge variant="secondary" className="mb-4">
                {post.category.name}
              </Badge>
            )}

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Author & Meta - Consistent Styling */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={author.avatar_url || undefined} alt={author.name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium text-foreground block">{author.name}</span>
                  <span className="text-xs">{format(publishedDate, 'MMMM d, yyyy')}</span>
                </div>
              </div>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readTime} min read
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content - Centered, Clean */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <article className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
              {post.content ? (
                <MarkdownRenderer content={post.content} style="lifestyle" />
              ) : (
                <p className="text-muted-foreground">No content available.</p>
              )}
            </div>

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

            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Share this article:</p>
              <SocialShareButtons title={post.title} />
            </div>

            <AuthorBio author={author} className="mt-12" />
            <NewsletterSignup className="mt-12" />
          </motion.div>
        </article>
      </div>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground">
                You May Also Enjoy
              </h2>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/blog" className="gap-2">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <BlogPostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
