import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Search, Star, Home, Globe, X, ChevronLeft, ChevronRight, Sun, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { useProperties } from '@/hooks/useProperties';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ─── Destination Detail Modal ─── */
function DestinationModal({ destination, propertyCount, onClose }: { destination: any; propertyCount: number; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = [destination.hero_image_url, ...(destination.gallery || [])].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-8 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-muted border border-border rounded-2xl max-w-[900px] w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Gallery */}
        <div className="relative aspect-[21/9] overflow-hidden">
          {images[imgIdx] && <img src={images[imgIdx]} alt={destination.name} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/30 backdrop-blur flex items-center justify-center text-background hover:bg-background/50 transition-colors">
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button onClick={() => setImgIdx(p => (p - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/20 backdrop-blur flex items-center justify-center text-background hover:bg-background/40"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setImgIdx(p => (p + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/20 backdrop-blur flex items-center justify-center text-background hover:bg-background/40"><ChevronRight className="h-4 w-4" /></button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => <button key={i} onClick={() => setImgIdx(i)} className={cn('w-2 h-2 rounded-full transition-colors', i === imgIdx ? 'bg-accent' : 'bg-background/40')} />)}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-1">{destination.country}</p>
              <h2 className="text-2xl font-serif font-medium text-foreground">{destination.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{propertyCount} villa{propertyCount !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground">available</p>
            </div>
          </div>

          {destination.description && <p className="text-sm text-muted-foreground leading-relaxed mb-6">{destination.description}</p>}

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {destination.climate && (
              <div className="bg-card border border-border rounded-xl p-4">
                <Sun className="h-4 w-4 text-accent mb-2" />
                <p className="text-xs text-muted-foreground">Climate</p>
                <p className="text-sm font-medium text-foreground">{destination.climate}</p>
              </div>
            )}
            {destination.best_time_to_visit && (
              <div className="bg-card border border-border rounded-xl p-4">
                <Compass className="h-4 w-4 text-accent mb-2" />
                <p className="text-xs text-muted-foreground">Best Time</p>
                <p className="text-sm font-medium text-foreground">{destination.best_time_to_visit}</p>
              </div>
            )}
            <div className="bg-card border border-border rounded-xl p-4">
              <Home className="h-4 w-4 text-accent mb-2" />
              <p className="text-xs text-muted-foreground">Properties</p>
              <p className="text-sm font-medium text-foreground">{propertyCount} villas</p>
            </div>
          </div>

          {/* Highlights */}
          {destination.highlights?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {destination.highlights.map((h: string, i: number) => (
                  <span key={i} className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full">{h}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link to={`/destinations/${destination.slug}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-full">Explore Destination</Button>
            </Link>
            <Link to={`/properties?destination=${destination.slug}`} className="flex-1">
              <Button variant="gold" className="w-full rounded-full gap-2">View Villas <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const Destinations = () => {
  const { data: destinations, isLoading } = useActiveDestinations();
  const { data: properties } = useProperties();
  const [selectedDest, setSelectedDest] = useState<any>(null);

  const heroContent = usePageContent('destinations', 'hero', {
    heading: 'Discover Our Destinations',
    subtitle: 'Extraordinary locations around the world, each handpicked for its beauty and character.',
  });

  const getPropertyCount = (destinationId: string) => {
    if (!properties) return 0;
    return properties.filter(p => p.destination_id === destinationId).length;
  };

  const totalVillas = properties?.length || 0;
  const avgRating = 4.9;

  return (
    <PageLayout>
      <PageSEO pageSlug="destinations" defaults={{ meta_title: 'Destinations | Haven Hub', meta_description: 'Explore extraordinary luxury destinations around the world.', og_image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80' }} />

      {/* Hero */}
      <section className="relative py-24 md:py-36 overflow-hidden bg-muted">
        {destinations?.[0]?.hero_image_url && (
          <div className="absolute inset-0 overflow-hidden">
            <img src={destinations[0].hero_image_url} alt="" className="w-full h-full object-cover blur-[80px] brightness-[0.15] saturate-50 scale-[1.3]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">Explore</p>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-foreground mb-4">
              {heroContent.heading}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">{heroContent.subtitle}</p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <p className="text-xl font-serif font-semibold text-foreground">{destinations?.length || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Destinations</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xl font-serif font-semibold text-foreground">{totalVillas}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Villas</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xl font-serif font-semibold text-foreground">{avgRating}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Rating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destination Cards */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-[1100px]">
          {isLoading ? (
            <div className="space-y-12">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Skeleton className="aspect-[4/3] rounded-2xl" />
                  <div className="space-y-4 py-8">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : destinations && destinations.length > 0 ? (
            <div className="space-y-16">
              {destinations.map((dest, index) => {
                const count = getPropertyCount(dest.id);
                const isEven = index % 2 === 0;
                const galleryThumbs = (dest.gallery || []).slice(0, 3);
                return (
                  <motion.div
                    key={dest.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={cn('grid grid-cols-1 md:grid-cols-[55%_45%] gap-8 items-center', !isEven && 'md:grid-cols-[45%_55%]')}
                  >
                    {/* Image */}
                    <div className={cn('relative group cursor-pointer', !isEven && 'md:order-2')} onClick={() => setSelectedDest(dest)}>
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                        <img
                          src={dest.hero_image_url || 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80'}
                          alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      {/* Thumbnails */}
                      {galleryThumbs.length > 0 && (
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          {galleryThumbs.map((thumb, ti) => (
                            <div key={ti} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-background/50 opacity-80 hover:opacity-100 transition-opacity">
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Villa count badge */}
                      <div className="absolute top-4 right-4 bg-background/70 backdrop-blur px-3 py-1.5 rounded-full">
                        <span className="text-xs font-medium text-foreground">{count} villa{count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={cn(!isEven && 'md:order-1')}>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-2">
                        <MapPin className="h-3 w-3 inline mr-1" />{dest.country}
                      </p>
                      <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-3">{dest.name}</h2>
                      {dest.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">{dest.description}</p>
                      )}
                      {/* Highlights */}
                      {dest.highlights && dest.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {dest.highlights.slice(0, 4).map((h: string, hi: number) => (
                            <span key={hi} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">{h}</span>
                          ))}
                        </div>
                      )}
                      {/* Climate & Best Time */}
                      <div className="flex gap-4 mb-6 text-sm">
                        {dest.climate && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Sun className="h-3.5 w-3.5 text-accent" /> {dest.climate}
                          </span>
                        )}
                        {dest.best_time_to_visit && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Compass className="h-3.5 w-3.5 text-accent" /> {dest.best_time_to_visit}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" className="rounded-full" onClick={() => setSelectedDest(dest)}>
                          Quick View
                        </Button>
                        <Link to={`/destinations/${dest.slug}`}>
                          <Button variant="gold" className="rounded-full gap-2">
                            Explore <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-medium mb-2">No Destinations Yet</h3>
              <p className="text-muted-foreground">We're adding new destinations soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Always Expanding</p>
          <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-4">
            Can't Find Your <em className="italic text-accent">Dream Destination?</em>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Our concierge team can help you find the perfect villa in any location. Contact us for a bespoke search.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/contact"><Button variant="outline" className="rounded-full">Contact Concierge</Button></Link>
            <Link to="/properties"><Button variant="gold" className="rounded-full gap-2">Browse All Villas <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedDest && <DestinationModal destination={selectedDest} propertyCount={getPropertyCount(selectedDest.id)} onClose={() => setSelectedDest(null)} />}
      </AnimatePresence>
    </PageLayout>
  );
};

export default Destinations;
