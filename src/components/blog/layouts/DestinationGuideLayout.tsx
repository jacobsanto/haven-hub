import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GrainOverlay } from '@/components/home/hero/GrainOverlay';
import { Calendar, Clock, ArrowLeft, Tag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useRef } from 'react';
import { BlogPost } from '@/types/blog';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { MobileTableOfContents } from '@/components/blog/MobileTableOfContents';
import { FloatingShareBar } from '@/components/blog/FloatingShareBar';
import { SocialShareButtons } from '@/components/blog/SocialShareButtons';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';

interface DestinationGuideLayoutProps {
  post: BlogPost;
  headings: { id: string; text: string; level: number }[];
  readTime: number;
  publishedDate: Date;
  author: { name: string; avatar_url: string | null; bio?: string | null };
  relatedPosts?: BlogPost[];
}

export function DestinationGuideLayout({
  post,
  headings,
  readTime,
  publishedDate,
  author,
  relatedPosts,
}: DestinationGuideLayoutProps) {
  const isMobile = useIsMobile();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);

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

      {/* Hero Image with Parallax */}
      <section ref={heroRef} className="relative h-[35vh] overflow-hidden">
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
        
        {/* Back Button - Consistent Style */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-background transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </section>

      {/* Article Header Card */}
      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-card rounded-2xl p-6 md:p-10 shadow-xl max-w-4xl mx-auto border border-border/50"
        >
          {post.category && (
            <Badge variant="secondary" className="mb-4">
              {post.category.name}
            </Badge>
          )}

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
          <article className="flex-1 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {post.excerpt && (
                <p className="text-xl md:text-2xl text-muted-foreground mb-10 font-serif italic leading-relaxed border-l-4 border-primary/30 pl-6">
                  {post.excerpt}
                </p>
              )}

              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-blockquote:italic">
                {post.content ? (
                  <MarkdownRenderer content={post.content} style="destination-guide" />
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

          {headings.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>
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
