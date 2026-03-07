import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Tag, ChevronRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { BlogPost } from '@/types/blog';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { FloatingShareBar } from '@/components/blog/FloatingShareBar';
import { MobileTableOfContents } from '@/components/blog/MobileTableOfContents';
import { TableOfContents } from '@/components/blog/TableOfContents';
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

export function BeginnersGuideLayout({ post, readTime, publishedDate, author, relatedPosts }: LayoutProps) {
  const isMobile = useIsMobile();
  const headings = useMemo(() => post.content ? extractHeadings(post.content) : [], [post.content]);
  const authorInitials = author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const h2Headings = headings.filter(h => h.level === 2);

  return (
    <>
      <ReadingProgress />
      {!isMobile && <FloatingShareBar title={post.title} />}
      {isMobile && headings.length > 0 && <MobileTableOfContents headings={headings} />}

      {/* Clean educational hero */}
      <section className="relative bg-gradient-to-b from-green-50/50 to-background dark:from-green-950/20 dark:to-background pt-20 pb-16 border-b border-border/50">
        <div className="absolute top-4 left-4 z-10">
          <Link to="/blog" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground text-sm font-medium hover:bg-background transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
        </div>
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            Beginner's Guide
          </div>
          {post.category && <Badge variant="secondary" className="mb-4 ml-2">{post.category.name}</Badge>}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-foreground mb-6 leading-tight">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{post.excerpt}</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

      {/* Content with step progress sidebar */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex gap-8 lg:gap-16 max-w-6xl mx-auto">
          <article className="flex-1 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
                {post.content ? <MarkdownRenderer content={post.content} style="destination-guide" /> : <p className="text-muted-foreground">No content available.</p>}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border"><div className="flex items-center gap-2 flex-wrap"><Tag className="h-4 w-4 text-muted-foreground" />{post.tags.map(tag => <Badge key={tag} variant="outline" className="text-sm">{tag}</Badge>)}</div></div>
              )}
              <div className="mt-8 pt-8 border-t border-border"><p className="text-sm text-muted-foreground mb-4">Share this article:</p><SocialShareButtons title={post.title} /></div>
              <AuthorBio author={author} className="mt-12" />
              <NewsletterSignup className="mt-12" />
            </motion.div>
          </article>

          {/* Step progress tracker sidebar */}
          {h2Headings.length > 0 && !isMobile && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Progress</p>
                <div className="space-y-0">
                  {h2Headings.map((h, i) => (
                    <a key={h.id} href={`#${h.id}`} className="flex items-start gap-3 group py-2">
                      <div className="flex flex-col items-center">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-primary/30 text-primary text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{i + 1}</span>
                        {i < h2Headings.length - 1 && <div className="w-0.5 h-6 bg-border mt-1" />}
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors pt-1 line-clamp-2">{h.text}</span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {relatedPosts && relatedPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground">Continue Learning</h2>
              <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link to="/blog" className="gap-2">View All <ChevronRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{relatedPosts.map(p => <BlogPostCard key={p.id} post={p} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
