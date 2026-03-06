import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeroBanner } from '@/components/ui/PageHeroBanner';
import { CategoryFilterTabs } from '@/components/ui/CategoryFilterTabs';
import { useBlogPosts, useFeaturedBlogPost, usePaginatedBlogPosts } from '@/hooks/useBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { BlogHero } from '@/components/blog/BlogHero';
import { BlogSecondaryCard } from '@/components/blog/BlogSecondaryCard';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageSEO } from '@/components/seo/PageSEO';

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
    categories.forEach(cat => {
      counts[cat.slug] = allPosts.filter(p => p.category?.slug === cat.slug).length;
    });
    return counts;
  }, [allPosts, categories]);

  const searchFilteredPosts = useMemo(() => {
    if (!allPosts || !searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    return allPosts.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [allPosts, searchQuery]);

  const { heroPost, secondaryPosts, regularPosts } = useMemo(() => {
    if (searchQuery.trim() && searchFilteredPosts) {
      return { heroPost: null, secondaryPosts: [], regularPosts: searchFilteredPosts };
    }
    const posts = paginatedData?.posts || [];
    if (currentPage > 1 || searchQuery.trim()) {
      return { heroPost: null, secondaryPosts: [], regularPosts: posts };
    }
    const hero = selectedCategory === 'all' && featuredPost ? featuredPost : null;
    const remaining = hero ? posts.filter(p => p.id !== hero.id) : posts;
    const finalHero = hero || remaining[0] || null;
    const afterHero = hero ? remaining : remaining.slice(1);
    return {
      heroPost: finalHero,
      secondaryPosts: afterHero.slice(0, 2),
      regularPosts: afterHero.slice(2),
    };
  }, [paginatedData, featuredPost, selectedCategory, searchQuery, currentPage, searchFilteredPosts]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLoading = featuredLoading || postsLoading;
  const hasNoPosts = !heroPost && regularPosts.length === 0 && !isLoading;

  // Build category tabs
  const categoryTabs = [
    { id: 'all', label: 'All Stories', count: allPosts?.length },
    ...(categories?.map(c => ({ id: c.slug, label: c.name, count: postCounts[c.slug] })) || []),
  ];

  return (
    <PageLayout>
      <PageSEO pageSlug="blog" defaults={{ meta_title: 'Travel Stories & Inspiration | Haven Hub', meta_description: 'Discover travel insights, destination guides, and luxury living inspiration.', og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' }} />

      {/* Featured Hero */}
      {!isLoading && heroPost && !searchQuery && currentPage === 1 && (
        <section className="relative">
          <BlogHero post={heroPost} />
        </section>
      )}

      {/* Fallback Hero */}
      {(isLoading || !heroPost || searchQuery || currentPage > 1) && (
        <PageHeroBanner
          label="The Journal"
          labelIcon={BookOpen}
          title={
            searchQuery ? <>Search Results</> : (
              <>
                Stories & <em className="font-normal text-accent italic">Inspiration</em>
              </>
            )
          }
          subtitle={searchQuery ? `Showing results for "${searchQuery}"` : 'Discover travel insights, destination guides, and luxury living inspiration.'}
          backgroundImage="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=50"
        />
      )}

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1200px] mx-auto px-[5%] py-3.5 flex flex-col md:flex-row md:items-center gap-3">
          {!searchQuery && (
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <CategoryFilterTabs
                categories={categoryTabs}
                activeCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          )}
          <div className="relative md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-9 text-sm rounded-lg bg-muted/50 border-border"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {searchQuery && searchFilteredPosts && (
            <p className="text-xs text-muted-foreground">
              {searchFilteredPosts.length} result{searchFilteredPosts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Posts */}
      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-[1200px] mx-auto px-[5%]">
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-muted" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (
            <>
              {secondaryPosts.length > 0 && !searchQuery && (
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  {secondaryPosts.map((post, index) => (
                    <BlogSecondaryCard key={post.id} post={post} index={index} />
                  ))}
                </div>
              )}

              {regularPosts.length > 0 && (
                <>
                  {!searchQuery && secondaryPosts.length > 0 && (
                    <div className="flex items-center gap-4 mb-8">
                      <h2 className="text-sm font-sans uppercase tracking-[0.2em] text-accent whitespace-nowrap">More Stories</h2>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                    {regularPosts.map((post) => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>
                </>
              )}

              {hasNoPosts && (
                <div className="text-center py-20">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-serif font-medium mb-2">{searchQuery ? 'No articles found' : 'No stories yet'}</h3>
                  <p className="text-muted-foreground">{searchQuery ? 'Try adjusting your search.' : 'Check back soon for travel stories!'}</p>
                  {searchQuery && <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">Clear Search</Button>}
                </div>
              )}

              {/* Pagination */}
              {!searchQuery && paginatedData && paginatedData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16 pt-8 border-t border-border">
                  <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={!paginatedData.hasPrevPage} className="h-10 w-10">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage = page === 1 || page === paginatedData.totalPages || Math.abs(page - currentPage) <= 1;
                    if (!showPage) return null;
                    return (
                      <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="icon" onClick={() => handlePageChange(page)} className="w-10 h-10">
                        {page}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={!paginatedData.hasNextPage} className="h-10 w-10">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
