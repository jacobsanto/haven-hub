import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Tag, ChevronRight, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { BlogPost } from '@/types/blog';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { FloatingShareBar } from '@/components/blog/FloatingShareBar';
import { MobileTableOfContents } from '@/components/blog/MobileTableOfContents';
import { SocialShareButtons } from '@/components/blog/SocialShareButtons';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import { MarkdownRenderer, extractHeadings } from '@/components/blog/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  post: BlogPost;
  headings?: { id: string; text: string; level: number }[];
  readTime: number;
  publishedDate: Date;
  author: { name: string; avatar_url: string | null; bio?: string | null };
  relatedPosts?: BlogPost[];
}

export function ThingsToDoAfterLayout({ post, readTime, publishedDate, author, relatedPosts }: LayoutProps) {
  const isMobile = useIsMobile();
  const headings = useMemo(() => post.content ? extractHeadings(post.content) : [], [post.content]);
  const authorInitials = author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <ReadingProgress />
      {!isMobile && <FloatingShareBar title={post.title} />}
      {isMobile && headings.length > 0 && <MobileTableOfContents headings={headings} />}

      {/* Hero with checklist vibe */}
      <section className="relative bg-gradient-to-br from-accent/5 via-background to-primary/5 pt-20 pb-16">
        <div className="absolute top-4 left-4 z-10">
          <Link to="/blog" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-background transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
        </div>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 text-sm font-medium mb-6">
            <CheckSquare className="h-4 w-4" />
            Action Checklist
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-foreground mb-6 leading-tight">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{post.excerpt}</p>}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border"><AvatarImage src={author.avatar_url || undefined} /><AvatarFallback className="text-xs bg-primary/10 text-primary">{authorInitials}</AvatarFallback></Avatar>
              <span className="font-medium text-foreground">{author.name}</span>
            </div>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(publishedDate, 'MMMM d, yyyy')}</span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{readTime} min read</span>
          </div>
        </div>
      </section>

      {/* Quick checklist summary */}
      {headings.filter(h => h.level === 2).length > 0 && (
        <div className="container mx-auto px-4 -mt-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 shadow-lg border border-border/50 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-foreground mb-3">Quick Checklist</p>
            <div className="space-y-2">
              {headings.filter(h => h.level === 2).map((h, i) => (
                <a key={h.id} href={`#${h.id}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <span className="flex items-center justify-center w-5 h-5 rounded border border-violet-300 dark:border-violet-700 text-[10px] font-medium text-violet-600 dark:text-violet-400 shrink-0">{i + 1}</span>
                  <span className="line-clamp-1">{h.text}</span>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 md:py-16">
        <article className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-h2:flex prose-h2:items-center prose-h2:gap-3">
              {post.content ? <MarkdownRenderer content={post.content} style="travel-tips" /> : <p className="text-muted-foreground">No content available.</p>}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border"><div className="flex items-center gap-2 flex-wrap"><Tag className="h-4 w-4 text-muted-foreground" />{post.tags.map(tag => <Badge key={tag} variant="outline" className="text-sm">{tag}</Badge>)}</div></div>
            )}
            <div className="mt-8 pt-8 border-t border-border"><p className="text-sm text-muted-foreground mb-4">Share this article:</p><SocialShareButtons title={post.title} /></div>
            <AuthorBio author={author} className="mt-12" />
            <NewsletterSignup className="mt-12" />
          </motion.div>
        </article>
      </div>

      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground">More Action Plans</h2>
              <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link to="/blog" className="gap-2">View All <ChevronRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{relatedPosts.map(p => <BlogPostCard key={p.id} post={p} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
