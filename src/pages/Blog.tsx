import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBlogPosts, useFeaturedBlogPost } from '@/hooks/useBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { BlogHero } from '@/components/blog/BlogHero';
import { BlogSecondaryCard } from '@/components/blog/BlogSecondaryCard';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { Skeleton } from '@/components/ui/skeleton';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  // Separate posts into tiers for magazine layout
  const { heroPost, secondaryPosts, regularPosts } = useMemo(() => {
    if (!posts) return { heroPost: null, secondaryPosts: [], regularPosts: [] };
    
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
  }, [posts, featuredPost, selectedCategory]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    // Smooth scroll to posts section
    const postsSection = document.getElementById('posts-section');
    if (postsSection) {
      postsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-12"
          >
            {categories && (
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                postCounts={postCounts}
              />
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
              {/* Hero Post - Full Width */}
              {heroPost && (
                <div className="mb-12">
                  <BlogHero post={heroPost} />
                </div>
              )}

              {/* Secondary Posts - 2 Column Grid */}
              {secondaryPosts.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                  {secondaryPosts.map((post, index) => (
                    <BlogSecondaryCard key={post.id} post={post} index={index} />
                  ))}
                </div>
              )}

              {/* Regular Posts Grid */}
              {regularPosts.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-serif text-foreground">More Stories</h2>
                    <div className="h-px flex-1 bg-border ml-6" />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularPosts.map((post) => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>
                </>
              )}

              {/* Empty State */}
              {!heroPost && !postsLoading && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    No blog posts available yet. Check back soon for inspiring stories!
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
