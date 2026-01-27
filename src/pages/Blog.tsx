import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { useBlogPosts, useFeaturedBlogPost } from '@/hooks/useBlogPosts';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data: categories } = useBlogCategories();
  const { data: featuredPost, isLoading: featuredLoading } = useFeaturedBlogPost();
  const { data: posts, isLoading: postsLoading } = useBlogPosts({ 
    status: 'published',
    categorySlug: selectedCategory !== 'all' ? selectedCategory : undefined 
  });

  // Filter out featured post from regular posts list
  const regularPosts = posts?.filter(p => !p.is_featured || p.id !== featuredPost?.id);

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

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Featured Post */}
          {featuredLoading ? (
            <Skeleton className="h-[400px] rounded-2xl mb-16" />
          ) : featuredPost ? (
            <div className="mb-16">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
                Featured Story
              </h2>
              <BlogPostCard post={featuredPost} featured />
            </div>
          ) : null}

          {/* Category Filter */}
          <div className="mb-12">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                {categories?.map((category) => (
                  <TabsTrigger key={category.id} value={category.slug}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Posts Grid */}
          {postsLoading ? (
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
          ) : regularPosts && regularPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No blog posts available yet. Check back soon for inspiring stories!
              </p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
