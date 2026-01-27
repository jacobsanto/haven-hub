import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBlogPosts, useFeaturedBlogPost } from '@/hooks/useBlogPosts';
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
  const { data: categories } = useBlogCategories();
  const { data: featuredPost, isLoading: featuredLoading } = useFeaturedBlogPost();
  const { data: posts, isLoading: postsLoading } = useBlogPosts({ 
    status: 'published',
    categorySlug: selectedCategory !== 'all' ? selectedCategory : undefined 
  });

  // Calculate post counts per category
  const { data: allPosts } = useBlogPosts({ status: 'published' });
  const postCounts = useMemo(() => {
    if (!allPosts || !categories) return {};
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.slug] = allPosts.filter(p => p.category?.slug === cat.slug).length;
    });
    return counts;
  }, [allPosts, categories]);

  // Filter posts by search query
  const searchFilteredPosts = useMemo(() => {
    if (!posts || !searchQuery.trim()) return posts;
    
    const query = searchQuery.toLowerCase().trim();
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query) ||
      post.content?.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      post.category?.name.toLowerCase().includes(query) ||
      post.author?.name.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  // Separate posts into tiers for magazine layout
  const { heroPost, secondaryPosts, regularPosts } = useMemo(() => {
    const filteredPosts = searchFilteredPosts;
    if (!filteredPosts) return { heroPost: null, secondaryPosts: [], regularPosts: [] };
    
    // If searching, show all results in grid format (no hero)
    if (searchQuery.trim()) {
      return {
        heroPost: null,
        secondaryPosts: [],
        regularPosts: filteredPosts,
      };
    }
    
    // If we have a featured post and we're showing all posts, use it as hero
    const hero = selectedCategory === 'all' && featuredPost ? featuredPost : null;
    
    // Filter out hero from the list
    const remaining = hero ? filteredPosts.filter(p => p.id !== hero.id) : filteredPosts;
    
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
  }, [searchFilteredPosts, featuredPost, selectedCategory, searchQuery]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSearchQuery(''); // Clear search when changing category
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-foreground mb-6">
              Stories & Inspiration
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover travel insights, destination guides, and luxury living inspiration
              from our curated collection of articles.
            </p>
          </motion.div>
        </div>
      </section>

      <section id="posts-section" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Search and Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6 mb-12"
          >
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 h-12 text-base rounded-full border-border bg-card"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category Filter - hide when searching */}
            {!searchQuery && categories && (
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                postCounts={postCounts}
              />
            )}

            {/* Search Results Info */}
            {searchQuery && (
              <div className="text-center">
                <p className="text-muted-foreground">
                  {searchFilteredPosts?.length === 0 
                    ? `No articles found for "${searchQuery}"`
                    : `Found ${searchFilteredPosts?.length} article${searchFilteredPosts?.length === 1 ? '' : 's'} for "${searchQuery}"`
                  }
                </p>
              </div>
            )}
          </motion.div>

          {/* Loading State */}
          {(featuredLoading || postsLoading) && (
            <>
              <Skeleton className="h-[400px] rounded-3xl mb-8" />
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Skeleton className="h-[300px] rounded-2xl" />
                <Skeleton className="h-[300px] rounded-2xl" />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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

          {/* Magazine Layout */}
          {!postsLoading && !featuredLoading && (
            <>
              {/* Hero Post - Full Width (only when not searching) */}
              {heroPost && !searchQuery && (
                <div className="mb-12">
                  <BlogHero post={heroPost} />
                </div>
              )}

              {/* Secondary Posts - 2 Column Grid (only when not searching) */}
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
                  {!searchQuery && (
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-serif text-foreground">More Stories</h2>
                      <div className="h-px flex-1 bg-border ml-6" />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularPosts.map((post) => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>
                </>
              )}

              {/* Empty State */}
              {!heroPost && regularPosts.length === 0 && !postsLoading && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery 
                      ? 'Try adjusting your search terms or browse by category.'
                      : 'No blog posts available yet. Check back soon for inspiring stories!'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
