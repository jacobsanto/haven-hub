import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBlogPosts, useFeaturedBlogPost, usePaginatedBlogPosts } from '@/hooks/useBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { BlogHero } from '@/components/blog/BlogHero';
import { BlogSecondaryCard } from '@/components/blog/BlogSecondaryCard';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: categories } = useBlogCategories();
  const { data: featuredPost, isLoading: featuredLoading } = useFeaturedBlogPost();
  
  // Use paginated query for main listing
  const { data: paginatedData, isLoading: postsLoading } = usePaginatedBlogPosts({ 
    status: 'published',
    categorySlug: selectedCategory !== 'all' ? selectedCategory : undefined,
    page: currentPage,
  });

  // Use regular query for search (client-side filtering)
  const { data: allPosts } = useBlogPosts({ status: 'published' });

  // Calculate post counts per category
  const postCounts = useMemo(() => {
    if (!allPosts || !categories) return {};
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.slug] = allPosts.filter(p => p.category?.slug === cat.slug).length;
    });
    return counts;
  }, [allPosts, categories]);

  // Filter posts by search query (uses all posts for search)
  const searchFilteredPosts = useMemo(() => {
    if (!allPosts || !searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase().trim();
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query) ||
      post.content?.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      post.category?.name.toLowerCase().includes(query) ||
      post.author?.name.toLowerCase().includes(query)
    );
  }, [allPosts, searchQuery]);

  // Separate posts into tiers for magazine layout (only for first page, no search)
  const { heroPost, secondaryPosts, regularPosts } = useMemo(() => {
    // If searching, use search results
    if (searchQuery.trim() && searchFilteredPosts) {
      return {
        heroPost: null,
        secondaryPosts: [],
        regularPosts: searchFilteredPosts,
      };
    }

    const posts = paginatedData?.posts || [];
    
    // Only show hero layout on first page without search
    if (currentPage > 1 || searchQuery.trim()) {
      return {
        heroPost: null,
        secondaryPosts: [],
        regularPosts: posts,
      };
    }
    
    // If we have a featured post and we're showing all posts, use it as hero
    const hero = selectedCategory === 'all' && featuredPost ? featuredPost : null;
    
    // Filter out hero from the list
    const remaining = hero ? posts.filter(p => p.id !== hero.id) : posts;
    
    // If no featured hero, use first post as hero
    const finalHero = hero || remaining[0] || null;
    const afterHero = hero ? remaining : remaining.slice(1);
    
    // Take next 2 posts as secondary cards
    const secondary = afterHero.slice(0, 2);
    
    // Rest are regular grid posts
    const regular = afterHero.slice(2);
    
    return {
      heroPost: finalHero,
      secondaryPosts: secondary,
      regularPosts: regular,
    };
  }, [paginatedData, featuredPost, selectedCategory, searchQuery, currentPage, searchFilteredPosts]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLoading = featuredLoading || postsLoading;
  const hasNoPosts = !heroPost && regularPosts.length === 0 && !isLoading;

  return (
    <PageLayout>
      {/* Immersive Featured Article Hero - Only on first page with posts */}
      {!isLoading && heroPost && !searchQuery && currentPage === 1 && (
        <section className="relative">
          <BlogHero post={heroPost} />
        </section>
      )}

      {/* Fallback Hero for empty state or search/later pages */}
      {(isLoading || !heroPost || searchQuery || currentPage > 1) && (
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground mb-4">
                {searchQuery ? 'Search Results' : 'Stories & Inspiration'}
              </h1>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `Showing results for "${searchQuery}"`
                  : 'Discover travel insights, destination guides, and luxury living inspiration.'
                }
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Sticky Category Filter & Search */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Category Filter */}
            {!searchQuery && categories && (
              <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  postCounts={postCounts}
                />
              </div>
            )}

            {/* Search Bar - Right aligned on desktop */}
            <div className="relative md:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 text-sm rounded-full border-border bg-muted/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && searchFilteredPosts && (
            <p className="text-sm text-muted-foreground mt-3">
              {searchFilteredPosts.length === 0 
                ? `No articles found for "${searchQuery}"`
                : `Found ${searchFilteredPosts.length} article${searchFilteredPosts.length === 1 ? '' : 's'}`
              }
            </p>
          )}
        </div>
      </div>

      <section id="posts-section" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Loading State */}
          {isLoading && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Skeleton className="h-[280px] rounded-2xl" />
                <Skeleton className="h-[280px] rounded-2xl" />
              </div>
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
            </>
          )}

          {/* Content Layout */}
          {!isLoading && (
            <>
              {/* Secondary Posts - 2 Column Horizontal Cards */}
              {secondaryPosts.length > 0 && !searchQuery && (
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  {secondaryPosts.map((post, index) => (
                    <BlogSecondaryCard key={post.id} post={post} index={index} />
                  ))}
                </div>
              )}

              {/* Regular Posts Grid */}
              {regularPosts.length > 0 && (
                <>
                  {!searchQuery && secondaryPosts.length > 0 && (
                    <div className="flex items-center gap-4 mb-8">
                      <h2 className="text-lg font-serif text-foreground whitespace-nowrap">More Stories</h2>
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

              {/* Empty State */}
              {hasNoPosts && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-serif text-foreground mb-2">
                    {searchQuery ? 'No articles found' : 'No stories yet'}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {searchQuery 
                      ? 'Try adjusting your search terms or browse by category.'
                      : 'We\'re working on inspiring content. Check back soon for travel stories and destination guides!'
                    }
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={handleClearSearch}
                      className="mt-6"
                    >
                      Clear Search
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Pagination */}
              {!searchQuery && paginatedData && paginatedData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16 pt-8 border-t border-border">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!paginatedData.hasPrevPage}
                    aria-label="Previous page"
                    className="h-10 w-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage = 
                        page === 1 || 
                        page === paginatedData.totalPages || 
                        Math.abs(page - currentPage) <= 1;
                      
                      const showEllipsis = 
                        (page === 2 && currentPage > 3) ||
                        (page === paginatedData.totalPages - 1 && currentPage < paginatedData.totalPages - 2);

                      if (showEllipsis && !showPage) {
                        return <span key={page} className="px-2 text-muted-foreground">…</span>;
                      }

                      if (!showPage) return null;

                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => handlePageChange(page)}
                          className="w-10 h-10"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!paginatedData.hasNextPage}
                    aria-label="Next page"
                    className="h-10 w-10"
                  >
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
