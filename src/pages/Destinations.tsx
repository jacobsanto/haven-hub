import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { useProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrustBadges } from '@/components/booking/TrustBadges';

const Destinations = () => {
  const { data: destinations, isLoading } = useActiveDestinations();
  const { data: properties } = useProperties();

  // Count properties per destination (by country matching)
  const getPropertyCount = (country: string) => {
    if (!properties) return 0;
    return properties.filter(p => 
      p.country.toLowerCase() === country.toLowerCase()
    ).length;
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 hero-gradient texture-overlay overflow-hidden">
        <div className="absolute top-10 right-20 w-64 h-64 bg-primary/5 organic-blob animate-pulse" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/10 organic-blob" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Explore</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-foreground mb-6">
              Choose Your Destination
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
              Discover extraordinary locations around the world and book your perfect luxury stay.
            </p>
            <Link to="/properties">
              <Button size="lg" className="rounded-full gap-2">
                <Search className="h-4 w-4" />
                Browse All Properties
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-organic">
                  <Skeleton className="aspect-[4/3] rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : destinations && destinations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {destinations.map((destination, index) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  propertyCount={getPropertyCount(destination.country)}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-medium mb-2">
                No Destinations Yet
              </h3>
              <p className="text-muted-foreground">
                We're adding new destinations soon. Check back later!
              </p>
            </div>
          )}
        </div>

        {/* Booking CTA */}
        <div className="container mx-auto px-4 mt-16 text-center">
          <div className="card-organic p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-serif font-medium mb-4">
              Ready to Book Your Stay?
            </h3>
            <p className="text-muted-foreground mb-6">
              Pick a destination above, or browse all our properties with best price guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/properties">
                <Button size="lg" className="rounded-full gap-2 w-full sm:w-auto">
                  Browse All Properties
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-6">
              <TrustBadges variant="compact" badges={['price', 'cancellation']} className="justify-center" />
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Destinations;
