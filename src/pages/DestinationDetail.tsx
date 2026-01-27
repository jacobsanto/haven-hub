import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Sun, Calendar, Sparkles, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { QuickBookCard } from '@/components/booking/QuickBookCard';
import { TrustBadges } from '@/components/booking/TrustBadges';
import { useDestination } from '@/hooks/useDestinations';
import { useProperties } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const DestinationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: destination, isLoading } = useDestination(slug || '');
  const { data: allProperties } = useProperties();

  // Filter properties for this destination (by country)
  const destinationProperties = allProperties?.filter(
    p => destination && p.country.toLowerCase() === destination.country.toLowerCase()
  ) || [];

  if (isLoading) {
    return (
      <PageLayout>
        <div className="py-24">
          <div className="container mx-auto px-4">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!destination) {
    return (
      <PageLayout>
        <div className="py-24 text-center">
          <div className="container mx-auto px-4">
            <MapPin className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-3xl font-serif font-medium mb-4">Destination Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The destination you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/destinations">
              <Button variant="outline" className="rounded-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Destinations
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 hero-gradient texture-overlay overflow-hidden">
        {destination.hero_image_url && (
          <div className="absolute inset-0">
            <img
              src={destination.hero_image_url}
              alt={destination.name}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          </div>
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium">{destination.country}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-foreground mb-6">
              {destination.name}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {destination.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview & Highlights */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Long Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-2"
              >
                <h2 className="text-2xl md:text-3xl font-serif font-medium mb-6">
                  About {destination.name}
                </h2>
                <div className="prose prose-lg text-muted-foreground">
                  <p className="leading-relaxed">
                    {destination.long_description || destination.description}
                  </p>
                </div>

                {/* Highlights */}
                {destination.highlights && destination.highlights.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-xl font-serif font-medium mb-6 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Highlights
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {destination.highlights.map((highlight, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-3 text-muted-foreground"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>

              {/* Info Cards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {destination.best_time_to_visit && (
                  <div className="card-organic p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Best Time to Visit</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {destination.best_time_to_visit}
                    </p>
                  </div>
                )}

                {destination.climate && (
                  <div className="card-organic p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Sun className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Climate</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {destination.climate}
                    </p>
                  </div>
                )}

                <div className="card-organic p-6 bg-primary/5">
                  <h4 className="font-medium mb-2">
                    {destinationProperties.length} {destinationProperties.length === 1 ? 'Property' : 'Properties'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Available in {destination.name}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Properties in this Destination - Booking Focused */}
      {destinationProperties.length > 0 && (
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4">
                Book Your Stay in {destination.name}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Discover our handpicked selection of luxury villas. Best rates guaranteed when you book direct.
              </p>
              <TrustBadges variant="compact" badges={['price', 'cancellation']} className="justify-center" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {destinationProperties.map((property, index) => (
                <QuickBookCard key={property.id} property={property} index={index} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to={`/properties`}>
                <Button className="rounded-full gap-2">
                  View All Properties
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {destination.gallery && destination.gallery.length > 0 && (
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4">
                Gallery
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {destination.gallery.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img
                    src={image}
                    alt={`${destination.name} ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">
              Ready to Visit {destination.name}?
            </h2>
            <p className="text-lg opacity-80 mb-8">
              Start planning your luxury escape today
            </p>
            <Link to="/properties">
              <Button
                size="lg"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                Browse All Properties
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default DestinationDetail;
