import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Tag, ChevronRight, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { BlogPost } from '@/types/blog';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { SocialShareButtons } from '@/components/blog/SocialShareButtons';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { AtAGlanceCard } from '@/components/blog/AtAGlanceCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TravelTipsLayoutProps {
  post: BlogPost;
  readTime: number;
  publishedDate: Date;
  author: { name: string; avatar_url: string | null; bio?: string | null };
  relatedPosts?: BlogPost[];
}

export function TravelTipsLayout({
  post,
  readTime,
  publishedDate,
  author,
  relatedPosts,
}: TravelTipsLayoutProps) {
  const authorInitials = author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <ReadingProgress />

      {/* Compact Header */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            {post.category && (
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 uppercase tracking-wider text-xs">
                {post.category.name}
              </Badge>
            )}

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-muted-foreground mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarImage src={author.avatar_url || undefined} alt={author.name} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{author.name}</span>
              </div>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(publishedDate, 'MMM d, yyyy')}
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readTime} min read
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          {/* At a Glance Summary */}
          <AtAGlanceCard
            bestFor="All travelers"
            difficulty="Easy to follow"
            readTime={readTime}
            keyTakeaway="Practical advice to enhance your travel experience"
          />

          {/* Content with Tips-optimized rendering */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground">
              {post.content ? (
                <MarkdownRenderer content={post.content} style="travel-tips" />
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
              <p className="text-sm text-muted-foreground mb-4">Found these tips helpful? Share with friends:</p>
              <SocialShareButtons title={post.title} />
            </div>

            <AuthorBio author={author} className="mt-12" />
            <NewsletterSignup className="mt-12" />
          </motion.article>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                More Tips & Guides
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
