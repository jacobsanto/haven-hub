import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Sparkles, Calendar, Shield, Clock, CheckCircle, Leaf, Smartphone } from 'lucide-react';
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
import { WorldMapDecor } from '@/components/decorative/WorldMapDecor';
import { BookingSummaryCard } from '@/components/booking/BookingSummaryCard';
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

  const propertiesAvailable = properties?.length || 0;
  const featuredDestinations = destinations?.slice(0, 3);
  const featuredExperiences = experiences?.filter(e => e.is_featured).slice(0, 4) || experiences?.slice(0, 4);
  const latestBlogPosts = blogPosts?.slice(0, 3);

  return (
    <PageLayout>
      <UrgencyBanner variant="rotating" />

      {/* Hero Section — Immersive Sky Atmosphere */}
      <section className="relative min-h-[90vh] flex items-center justify-center hero-gradient texture-overlay cloud-layer overflow-hidden">
        {/* World Map Background */}
        <WorldMapDecor />

        {/* Cloud Blobs — Dense atmospheric feel */}
        <FloatingBlob position="top-left" variant="cloud" size="xl" animationVariant={1} />
        <FloatingBlob position="top-right" variant="cloud" size="lg" animationVariant={2} />
        <FloatingBlob position="bottom-left" variant="cloud" size="xl" animationVariant={3} />
        <FloatingBlob position="center-right" variant="cloud" size="lg" animationVariant={4} />
        <FloatingBlob position="bottom-right" variant="primary" size="md" animationVariant={2} />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex items-start justify-center gap-8">
            {/* Main hero content */}
            <div className="flex-1 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-12"
              >
                <h1 className="text-5xl md:text-7xl font-serif font-medium text-foreground mb-6 leading-tight" style={{ textShadow: '0 2px 12px hsla(220, 60%, 20%, 0.08)' }}>
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
              </motion.div>

              {/* Search Bar */}
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

              {/* Trust Badges */}
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

            {/* Booking Summary Card — decorative widget */}
            <BookingSummaryCard />
          </div>

          {/* Feature Icons — "Your Journey Awaits" */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-16 text-center"
          >
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">Your Journey Awaits</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {[
                { icon: Smartphone, label: 'Smart Check-in' },
                { icon: MapPin, label: 'Local Guides' },
                { icon: Leaf, label: 'Eco-Friendly Stays' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-white/50 dark:border-border/30 flex items-center justify-center shadow-glass">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Destinations */}
      {(destinationsLoading || (featuredDestinations && featuredDestinations.length > 0)) && (
        <section className="py-24 sky-atmosphere">
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

      {/* Featured Properties */}
      <section className="py-24 sky-atmosphere cloud-layer relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
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
        <section className="py-24 sky-atmosphere">
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

      {/* Why Book Direct */}
      <section className="py-24 sky-atmosphere cloud-layer relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
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
              { icon: Shield, title: 'Best Price Guarantee', description: 'Our direct rates are always the lowest. Find it cheaper elsewhere? We\'ll match it.' },
              { icon: Clock, title: 'Free Cancellation', description: 'Flexible booking with free cancellation up to 48 hours before check-in.' },
              { icon: CheckCircle, title: 'Instant Confirmation', description: 'Book and receive your confirmation immediately. No waiting.' },
              { icon: Calendar, title: '24/7 Support', description: 'Our concierge team is available around the clock for your needs.' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 card-organic hover-lift"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/70 dark:bg-primary/10 backdrop-blur-xl border border-white/50 dark:border-border/30 flex items-center justify-center shadow-glass">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-serif font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

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

      {/* Blog */}
      {(blogLoading || (latestBlogPosts && latestBlogPosts.length > 0)) && (
        <section className="py-24 sky-atmosphere">
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

      {/* CTA — Deep navy gradient with radial glow */}
      <section className="py-24 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, hsl(220, 60%, 15%) 0%, hsl(220, 70%, 25%) 50%, hsl(220, 60%, 35%) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, hsla(220, 70%, 50%, 0.2), transparent 70%)' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
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
                <Button size="lg" className="rounded-full gap-2 px-8 bg-white text-foreground hover:bg-white/90 hover:shadow-glow">
                  Browse Properties
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="rounded-full gap-2 px-8 border-white/40 text-white hover:bg-white/10">
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
