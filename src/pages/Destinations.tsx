import { motion } from 'framer-motion';
import { Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeroBanner } from '@/components/ui/PageHeroBanner';
import { DestinationCard } from '@/components/destinations/DestinationCard';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { useProperties } from '@/hooks/useProperties';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const Destinations = () => {
  const { data: destinations, isLoading } = useActiveDestinations();
  const { data: properties } = useProperties();

  const ctaContent = usePageContent('destinations', 'cta', {
    heading: 'Ready to Book Your Stay?',
    subtitle: 'Pick a destination above, or browse all our properties with best price guarantee.',
  });

  const getPropertyCount = (destinationId: string) => {
    if (!properties) return 0;
    return properties.filter(p => p.destination_id === destinationId).length;
  };

  const totalVillas = properties?.length || 0;

  return (
    <PageLayout>
      <PageSEO pageSlug="destinations" defaults={{ meta_title: 'Destinations | Haven Hub', meta_description: 'Explore extraordinary luxury destinations around the world.', og_image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80' }} />

      {/* Hero */}
      <PageHeroBanner
        label="Our Destinations"
        labelIcon={Globe}
        title={
          <>
            Sun-Drenched <em className="font-normal text-accent italic">Escapes</em>
          </>
        }
        subtitle={`From Aegean clifftops to tropical jungle canopies — every destination handpicked for extraordinary stays across ${destinations?.length || 0} curated regions.`}
        stats={[
          { value: destinations?.length || 0, label: 'Destinations' },
          { value: totalVillas, label: 'Villas' },
          { value: '4.8', label: 'Avg Rating' },
        ]}
        backgroundImage="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=50"
      />

      {/* Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-[1200px] mx-auto px-[5%]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : destinations && destinations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {destinations.map((destination, index) => (
                <DestinationCard key={destination.id} destination={destination} propertyCount={getPropertyCount(destination.id)} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-medium mb-2">No Destinations Yet</h3>
              <p className="text-muted-foreground">We're adding new destinations soon.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="max-w-[1200px] mx-auto px-[5%] mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto"
          >
            <h3 className="text-2xl font-serif font-semibold text-foreground mb-3">{ctaContent.heading}</h3>
            <p className="text-muted-foreground mb-6">{ctaContent.subtitle}</p>
            <Link to="/properties">
              <Button size="lg" className="gap-2">
                Browse All Properties <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Destinations;
