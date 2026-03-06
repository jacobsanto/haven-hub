import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, BookOpen, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBlogPosts, useFeaturedBlogPost, usePaginatedBlogPosts } from '@/hooks/useBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/seo/PageSEO';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function readTime(content?: string | null) {
  if (!content) return '3 min read';
  const words = content.split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categories } = useBlogCategories();
  const { data: featuredPost, isLoading: featuredLoading } = useFeaturedBlogPost();
  const { data: paginatedData, isLoading: postsLoading } = usePaginatedBlogPosts({
    status: 'published',
    categorySlug: selectedCategory !== 'all' ? selectedCategory : undefined,
    page: currentPage,
  });
  const { data: allPosts } = useBlogPosts({ status: 'published' });

  const postCounts = useMemo(() => {
    if (!allPosts || !categories) return {};
    const counts: Record<string, number> = {};
    categories.forEach(cat => { counts[cat.slug] = allPosts.filter(p => p.category?.slug === cat.slug).length; });
    return counts;
  }, [allPosts, categories]);

  const searchFilteredPosts = useMemo(() => {
    if (!allPosts || !searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return allPosts.filter(post =>
      post.title.toLowerCase().includes(q) ||
      post.excerpt?.toLowerCase().includes(q) ||
      post.tags?.some(tag => tag.toLowerCase().includes(q))
    );
  }, [allPosts, searchQuery]);

  const displayPosts = useMemo(() => {
    if (searchQuery.trim() && searchFilteredPosts) return searchFilteredPosts;
    const posts = paginatedData?.posts || [];
    // Exclude featured from first page
    if (currentPage === 1 && featuredPost && selectedCategory === 'all' && !searchQuery) {
      return posts.filter(p => p.id !== featuredPost.id);
    }
    return posts;
  }, [paginatedData, featuredPost, selectedCategory, searchQuery, currentPage, searchFilteredPosts]);

  const showHero = currentPage === 1 && !searchQuery && selectedCategory === 'all' && featuredPost;
  const isLoading = featuredLoading || postsLoading;

  return (
    <PageLayout>
      <PageSEO pageSlug="blog" defaults={{ meta_title: 'Journal | Haven Hub', meta_description: 'Travel stories, destination guides, and luxury living inspiration.' }} />

      {/* Featured Hero */}
      {!isLoading && showHero && featuredPost && (
        <Link to={`/blog/${featuredPost.slug}`}>
          <section className="relative h-[70vh] min-h-[500px] overflow-hidden group cursor-pointer">
            <img
              src={featuredPost.featured_image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80'}
              alt={featuredPost.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  {featuredPost.category && (
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-accent/90 text-background px-2.5 py-1 rounded">{featuredPost.category.name}</span>
                  )}
                  <span className="text-xs text-background/60">{readTime(featuredPost.content)}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-serif font-medium text-background mb-4 leading-tight">{featuredPost.title}</h1>
                {featuredPost.excerpt && <p className="text-background/70 text-lg max-w-2xl line-clamp-2 mb-4">{featuredPost.excerpt}</p>}
                <div className="flex items-center gap-3">
                  {featuredPost.author && (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={featuredPost.author.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{featuredPost.author.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-background/80">{featuredPost.author.name}</span>
                    </>
                  )}
                  {featuredPost.published_at && <span className="text-sm text-background/50">· {format(new Date(featuredPost.published_at), 'MMM d, yyyy')}</span>}
                </div>
              </div>
            </div>
          </section>
        </Link>
      )}

      {/* Fallback Hero */}
      {(isLoading || !showHero) && (
        <section className="relative py-20 md:py-28 bg-muted">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Journal</p>
              <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground mb-4">
                {searchQuery ? 'Search Results' : 'Stories & Inspiration'}
              </h1>
              <p className="text-muted-foreground">{searchQuery ? `Showing results for "${searchQuery}"` : 'Travel insights, destination guides, and luxury living.'}</p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Filter Bar */}
      <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {!searchQuery && categories && (
              <div className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-2">
                <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} className="rounded-full whitespace-nowrap">
                  All ({allPosts?.length || 0})
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.slug}
                    variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
                    className="rounded-full whitespace-nowrap"
                  >
                    {cat.name} ({postCounts[cat.slug] || 0})
                  </Button>
                ))}
              </div>
            )}
            <div className="relative md:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-9 text-sm rounded-full border-border bg-muted/50"
              />
              {searchQuery && (
                <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full">
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          {searchQuery && searchFilteredPosts && (
            <p className="text-sm text-muted-foreground mt-3">{searchFilteredPosts.length} article{searchFilteredPosts.length !== 1 ? 's' : ''} found</p>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[16/10] rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : displayPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {displayPosts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <motion.article
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
                      <img
                        src={post.featured_image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {post.category && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest bg-accent/90 text-background px-2.5 py-1 rounded">{post.category.name}</span>
                      )}
                    </div>
                    <h3 className="font-serif font-medium text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">{post.title}</h3>
                    {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.excerpt}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {post.author && (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={post.author.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">{post.author.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span>{post.author.name}</span>
                        </div>
                      )}
                      {post.published_at && <span>{format(new Date(post.published_at), 'MMM d, yyyy')}</span>}
                      <span>{readTime(post.content)}</span>
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-serif text-foreground mb-2">{searchQuery ? 'No articles found' : 'No stories yet'}</h3>
              <p className="text-muted-foreground text-sm">{searchQuery ? 'Try adjusting your search.' : 'Check back soon for travel stories.'}</p>
              {searchQuery && <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">Clear Search</Button>}
            </div>
          )}

          {/* Pagination */}
          {!searchQuery && paginatedData && paginatedData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-16 pt-8 border-t border-border">
              <Button variant="outline" size="icon" onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={!paginatedData.hasPrevPage} className="h-10 w-10">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1).map(page => {
                const show = page === 1 || page === paginatedData.totalPages || Math.abs(page - currentPage) <= 1;
                if (!show) return null;
                return (
                  <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="icon" onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-10 h-10">{page}</Button>
                );
              })}
              <Button variant="outline" size="icon" onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={!paginatedData.hasNextPage} className="h-10 w-10">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-muted border-t border-border">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Stay Inspired</p>
          <h2 className="text-2xl font-serif font-medium text-foreground mb-3">
            Subscribe to Our <em className="italic text-accent">Journal</em>
          </h2>
          <p className="text-sm text-muted-foreground mb-6">Get the latest travel stories and exclusive offers delivered to your inbox.</p>
          <form className="flex gap-2" onSubmit={e => e.preventDefault()}>
            <Input placeholder="Your email address" className="flex-1 rounded-full bg-card border-border" />
            <Button variant="gold" className="rounded-full px-6">Subscribe</Button>
          </form>
        </div>
      </section>
    </PageLayout>
  );
}
