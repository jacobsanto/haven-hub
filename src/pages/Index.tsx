import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Sparkles, Calendar, Shield, Clock, CheckCircle, Star, Eye, Headphones, Home, BookOpen, LucideIcon } from 'lucide-react';
import { resolveIcon } from '@/utils/icon-resolver';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { useHeroSettings } from '@/hooks/useHeroSettings';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchBar } from '@/components/search/SearchBar';
import { QuickBookCard } from '@/components/booking/QuickBookCard';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { useFeaturedProperties } from '@/hooks/useProperties';
import { useFeaturedDestinations } from '@/hooks/useDestinations';
import { useProperties } from '@/hooks/useProperties';
import { useActiveExperiences } from '@/hooks/useExperiences';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { useFormatCurrency } from '@/hooks/useFormatCurrency';
import { useBrand } from '@/contexts/BrandContext';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { data: properties, isLoading: propertiesLoading } = useFeaturedProperties();
  const { data: destinations, isLoading: destinationsLoading } = useFeaturedDestinations();
  const { data: allProperties } = useProperties();
  const { data: experiences, isLoading: experiencesLoading } = useActiveExperiences();
  const { data: blogPosts, isLoading: blogLoading } = useBlogPosts({ status: 'published' });
  const { brandName } = useBrand();
  const { format } = useFormatCurrency();
  const { data: quickNavItems = [] } = useNavigationItems('hero_quicknav');
  const { showSearchBar, showFeaturedVilla, showQuickNav, featuredPropertyId } = useHeroSettings();

  // CMS content
  const hero = usePageContent('home', 'hero', {
    heading_prefix: 'Experience',
    subtitle_with_property: 'Book a luxury villa in {city}, {country}',
    subtitle_default: 'Discover extraordinary vacation homes around the world',
  });
  const trustBadges = usePageContent('home', 'trust_badges', {
    badge_1_icon: 'Star',
    badge_1_title: 'Handpicked Excellence',
    badge_1_description: 'Every property personally vetted for quality',
    badge_2_icon: 'Eye',
    badge_2_title: 'Unmatched Views',
    badge_2_description: 'Stunning locations in prime destinations',
    badge_3_icon: 'Headphones',
    badge_3_title: 'Concierge Service',
    badge_3_description: 'Dedicated support from booking to checkout',
  });
  const propertiesContent = usePageContent('home', 'properties', {
    heading: 'Book Your Stay',
    subtitle: 'Handpicked luxury homes ready for instant booking. Best rates guaranteed when you book direct.',
  });
  const experiencesContent = usePageContent('home', 'experiences', {
    label: 'Curated',
    heading: 'Unforgettable Experiences',
    subtitle: 'Elevate your stay with our hand-selected experiences, from culinary adventures to cultural immersions.',
  });
  const whyBookDirect = usePageContent('home', 'why_book_direct', {
    heading: 'Why Book Direct with {brandName}',
    subtitle: 'Get the best rates and exclusive benefits when you book directly',
    feature_1_icon: 'Shield',
    feature_1_title: 'Best Price Guarantee',
    feature_1_description: "Our direct rates are always the lowest. Find it cheaper elsewhere? We'll match it.",
    feature_2_icon: 'Clock',
    feature_2_title: 'Free Cancellation',
    feature_2_description: 'Flexible booking with free cancellation up to 48 hours before check-in.',
    feature_3_icon: 'CheckCircle',
    feature_3_title: 'Instant Confirmation',
    feature_3_description: 'Book and receive your confirmation immediately. No waiting.',
    feature_4_icon: 'Calendar',
    feature_4_title: '24/7 Support',
    feature_4_description: 'Our concierge team is available around the clock for your needs.',
  });
  const blogContent = usePageContent('home', 'blog', {
    heading: 'Stories & Inspiration',
    subtitle: 'Travel insights, destination guides, and luxury living inspiration.',
  });
  const ctaContent = usePageContent('home', 'cta', {
    heading: 'Ready to Book Your Escape?',
    subtitle: 'Start exploring our collection of extraordinary vacation homes. Best rates guaranteed when you book direct.',
  });

  const propertiesAvailable = properties?.length || 0;
  const heroProperty = featuredPropertyId === 'auto'
    ? properties?.[0]
    : properties?.find(p => p.id === featuredPropertyId) || properties?.[0];
  const heroImageUrl = heroProperty?.hero_image_url;
  const featuredDestinations = destinations?.slice(0, 3);
  const featuredExperiences = experiences?.filter(e => e.is_featured).slice(0, 4) || experiences?.slice(0, 4);
  const latestBlogPosts = blogPosts?.slice(0, 3);

  const replaceBrand = (text: string) => text.replace('{brandName}', brandName);

  const badges = [
    { icon: resolveIcon(trustBadges.badge_1_icon, Star), title: trustBadges.badge_1_title, description: trustBadges.badge_1_description },
    { icon: resolveIcon(trustBadges.badge_2_icon, Eye), title: trustBadges.badge_2_title, description: trustBadges.badge_2_description },
    { icon: resolveIcon(trustBadges.badge_3_icon, Headphones), title: trustBadges.badge_3_title, description: trustBadges.badge_3_description },
  ];

  const features = [
    { icon: resolveIcon(whyBookDirect.feature_1_icon, Shield), title: whyBookDirect.feature_1_title, description: whyBookDirect.feature_1_description },
    { icon: resolveIcon(whyBookDirect.feature_2_icon, Clock), title: whyBookDirect.feature_2_title, description: whyBookDirect.feature_2_description },
    { icon: resolveIcon(whyBookDirect.feature_3_icon, CheckCircle), title: whyBookDirect.feature_3_title, description: whyBookDirect.feature_3_description },
    { icon: resolveIcon(whyBookDirect.feature_4_icon, Calendar), title: whyBookDirect.feature_4_title, description: whyBookDirect.feature_4_description },
  ];

  return (
    <PageLayout>
      <PageSEO pageSlug="home" defaults={{ meta_title: 'Luxury Vacation Homes | Haven Hub', meta_description: 'Discover and book extraordinary luxury vacation homes around the world. Best rates guaranteed when you book direct.', og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' }} />
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden pb-20">
        {heroImageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${heroImageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 hero-gradient texture-overlay" />
        )}

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center mb-10 px-4"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium text-white mb-3">
            {hero.heading_prefix} {heroProperty?.city || brandName}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {heroProperty
              ? hero.subtitle_with_property
                  .replace('{city}', heroProperty.city)
                  .replace('{country}', heroProperty.country)
              : hero.subtitle_default}
          </p>
        </motion.div>

        {showSearchBar && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-10 w-full max-w-3xl mx-auto px-4"
          >
            <SearchBar variant="hero" />
          </motion.div>
        )}

        {showFeaturedVilla && heroProperty && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative z-10 mt-6 px-4"
          >
            <Link
              to={`/properties/${heroProperty.slug}`}
              className="glass-panel rounded-2xl overflow-hidden flex flex-row items-center w-full max-w-md mx-auto group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500"
            >
              <div className="relative w-28 h-28 shrink-0 overflow-hidden rounded-l-2xl">
                <img
                  src={heroProperty.hero_image_url || '/placeholder.svg'}
                  alt={heroProperty.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-1.5 left-1.5 bg-gold-accent/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  Featured
                </div>
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center gap-0.5">
                <h3 className="text-sm font-serif font-semibold text-white truncate">
                  {heroProperty.display_name || heroProperty.name}
                </h3>
                <div className="flex items-center gap-0.5 text-gold-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 fill-current" />
                  ))}
                  <span className="text-white/60 text-[10px] ml-1">4.9</span>
                </div>
                <p className="text-[11px] text-white/70 flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {heroProperty.city}, {heroProperty.country}
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  From {format(heroProperty.base_price)} <span className="text-[10px] font-normal text-white/60">/ night</span>
                </p>
                <span className="text-[11px] font-medium text-gold-accent group-hover:underline mt-0.5 inline-flex items-center gap-1">
                  View Details <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        )}

        {showQuickNav && quickNavItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-6 z-10 flex items-center gap-6"
          >
            {quickNavItems.map((nav) => {
              const IconComponent = resolveIcon(nav.icon || 'Sparkles', Sparkles);
              return (
                <Link key={nav.path + nav.label} to={nav.path} className="flex flex-col items-center gap-1.5 group">
                  <div className="w-12 h-12 rounded-full glass-panel border border-gold-accent/30 flex items-center justify-center group-hover:bg-gold-accent/20 transition-colors duration-200">
                    <IconComponent className="h-5 w-5 text-gold-accent" />
                  </div>
                  <span className="text-[11px] text-gold-accent/90 font-medium">{nav.label}</span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* Trust Badges */}
      <section className="py-16 bg-warm-cream">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full border-2 border-gold-accent flex items-center justify-center">
                  <badge.icon className="h-6 w-6 text-gold-accent" />
                </div>
                <h3 className="text-base font-serif font-medium text-foreground">{badge.title}</h3>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      {(destinationsLoading || (featuredDestinations && featuredDestinations.length > 0)) && (
        <section className="py-24 bg-warm-cream">
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
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              {propertiesContent.heading}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {propertiesContent.subtitle}
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
                <Button variant="gold" size="lg" className="rounded-full gap-2">
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
                  <span className="text-sm font-medium uppercase tracking-wider">{experiencesContent.label}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
                  {experiencesContent.heading}
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  {experiencesContent.subtitle}
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
      <section className="py-24 bg-warm-cream">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-4">
              {replaceBrand(whyBookDirect.heading)}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {whyBookDirect.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 card-organic"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold-accent/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-gold-accent" />
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
              <Button variant="gold" size="lg" className="rounded-full gap-2 px-8">
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
                  {blogContent.heading}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {blogContent.subtitle}
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

      {/* CTA Section */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-medium mb-6">
              {ctaContent.heading}
            </h2>
            <p className="text-lg opacity-80 mb-8">
              {ctaContent.subtitle}
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
