import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Sparkles, Calendar, Shield, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchBar } from '@/components/search/SearchBar';
import { QuickBookCard } from '@/components/booking/QuickBookCard';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { TrustBadges } from '@/components/booking/TrustBadges';
import { UrgencyBanner } from '@/components/booking/UrgencyBanner';
import { FloatingBlob } from '@/components/decorative/FloatingBlob';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useFeaturedDestinations } from '@/hooks/useDestinations';
import { useProperties } from '@/hooks/useProperties';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useBrand } from '@/contexts/BrandContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { data: properties, isLoading: propertiesLoading } = useFeaturedProperties();
  const { data: destinations, isLoading: destinationsLoading } = useFeaturedDestinations();
  const { data: allProperties } = useProperties();
  const { data: experiences, isLoading: experiencesLoading } = useActiveExperiences();
  const { data: blogPosts, isLoading: blogLoading } = useBlogPosts({ status: 'published' });
  const { brandName } = useBrand();

  // Properties count for social proof
  const propertiesAvailable = properties?.length || 0;

  // Location-aware hero: use the first featured property's hero image
  const heroProperty = properties?.[0];
  const heroImageUrl = heroProperty?.hero_image_url;

  // Get featured items (limit to 3-4 for homepage)
  const featuredDestinations = destinations?.slice(0, 3);
  const featuredExperiences = experiences?.filter(e => e.is_featured).slice(0, 4) || experiences?.slice(0, 4);
  const latestBlogPosts = blogPosts?.slice(0, 3);

  return (
    <PageLayout>
      {/* Urgency Banner */}
      <UrgencyBanner variant="rotating" />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Dynamic hero background from first available property */}
        {heroImageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
              style={{ backgroundImage: `url(${heroImageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/90" />
          </>
        ) : (
          <div className="absolute inset-0 hero-gradient texture-overlay" />
        )}

        {/* Decorative Elements */}
        <FloatingBlob position="top-left" variant="primary" size="md" animationVariant={1} />
        <FloatingBlob position="bottom-right" variant="accent" size="lg" animationVariant={2} />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-foreground mb-6 leading-tight">
              Book Your Perfect
              <span className="block text-primary">Escape</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
              Discover extraordinary vacation homes in the world's most desirable destinations. 
              Direct booking. Best rates. Instant confirmation.
            </p>
            
            {propertiesAvailable > 0 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-primary font-medium flex items-center justify-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                {propertiesAvailable} properties available for booking
              </motion.p>
            )}

            {heroProperty && heroImageUrl && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5 mt-2"
              >
                <MapPin className="h-3 w-3" />
                {heroProperty.display_name || heroProperty.name} — {heroProperty.city}, {heroProperty.country}
              </motion.p>
            )}
          </motion.div>

          {/* Search Bar - Primary Entry Point */}
          <div className="max-w-4xl mx-auto">
            <SearchBar variant="hero" />
          </div>

          {/* Secondary Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6"
          >
            <Link to="/properties">
              <Button variant="outline" className="rounded-full gap-2">
                View All Properties
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges below search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <TrustBadges 
              variant="compact" 
              badges={['price', 'cancellation', 'instant']}
              className="justify-center"
            />
          </motion.div>
        </div>
      </section>

      {/* Featured Destinations */}
      {(destinationsLoading || (featuredDestinations && featuredDestinations.length > 0)) && (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
            >
              <div>
                <div className="flex items-center gap-2 text-primary mb-2">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Explore</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
                  Featured Destinations
                </h2>
              </div>
              <Link to="/destinations" className="inline-flex items-center gap-2 text-primary hover:underline">
                View all destinations <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {destinationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[4/3] rounded-2xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : featuredDestinations && featuredDestinations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredDestinations.map((destination, index) => (
                  <DestinationCard key={destination.id} destination={destination} index={index} propertyCount={allProperties?.filter(p => p.destination_id === destination.id).length || 0} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Featured Properties - Booking Focused */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              Book Your Stay
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Handpicked luxury homes ready for instant booking. 
              Best rates guaranteed when you book direct.
            </p>
          </motion.div>

          {propertiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-organic animate-pulse">
                  <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property, index) => (
                <QuickBookCard key={property.id} property={property} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No properties available yet. Check back soon!
              </p>
            </div>
          )}

          {properties && properties.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link to="/properties">
                <Button size="lg" className="rounded-full gap-2">
                  View All Properties & Book
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Featured Experiences */}
      {(experiencesLoading || (featuredExperiences && featuredExperiences.length > 0)) && (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
            >
              <div>
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wider">Curated</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
                  Unforgettable Experiences
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  Elevate your stay with our hand-selected experiences, from culinary adventures to cultural immersions.
                </p>
              </div>
              <Link to="/experiences" className="inline-flex items-center gap-2 text-primary hover:underline">
                View all experiences <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {experiencesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[4/3] rounded-xl" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : featuredExperiences && featuredExperiences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredExperiences.map((experience, index) => (
                  <ExperienceCard key={experience.id} experience={experience} index={index} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Why Book Direct Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              Why Book Direct with {brandName}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get the best rates and exclusive benefits when you book directly
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'Best Price Guarantee',
                description: 'Our direct rates are always the lowest. Find it cheaper elsewhere? We\'ll match it.',
              },
              {
                icon: Clock,
                title: 'Free Cancellation',
                description: 'Flexible booking with free cancellation up to 48 hours before check-in.',
              },
              {
                icon: CheckCircle,
                title: 'Instant Confirmation',
                description: 'Book and receive your confirmation immediately. No waiting.',
              },
              {
                icon: Calendar,
                title: '24/7 Support',
                description: 'Our concierge team is available around the clock for your needs.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 card-organic"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-serif font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Central booking CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/properties">
              <Button size="lg" className="rounded-full gap-2 px-8">
                Start Booking Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      {(blogLoading || (latestBlogPosts && latestBlogPosts.length > 0)) && (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
                  Stories & Inspiration
                </h2>
                <p className="text-muted-foreground mt-2">
                  Travel insights, destination guides, and luxury living inspiration.
                </p>
              </div>
              <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline">
                Read all articles <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {blogLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[16/10] rounded-xl" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : latestBlogPosts && latestBlogPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestBlogPosts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* CTA Section - Booking Focused */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium mb-6">
              Ready to Book Your Escape?
            </h2>
            <p className="text-lg opacity-80 mb-8">
              Start exploring our collection of extraordinary vacation homes.
              Best rates guaranteed when you book direct.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/properties">
                <Button size="lg" variant="secondary" className="rounded-full gap-2 px-8">
                  Browse Properties
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="rounded-full gap-2 px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
