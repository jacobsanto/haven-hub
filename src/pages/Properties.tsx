import { useState, useMemo, useCallback, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageSEO } from '@/components/seo/PageSEO';
import { PropertiesHeroBanner } from '@/components/properties/PropertiesHeroBanner';
import { PropertiesFilterBar } from '@/components/properties/PropertiesFilterBar';
import { VillaCardGrid } from '@/components/properties/VillaCardGrid';
import { VillaCardList } from '@/components/properties/VillaCardList';
import { VillaDetailModal } from '@/components/properties/VillaDetailModal';
import { RecentlyViewedWidget } from '@/components/properties/RecentlyViewedWidget';
import { useProperties } from '@/hooks/useProperties';
import { useAvailableProperties } from '@/hooks/useAvailableProperties';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { usePageContent } from '@/hooks/usePageContent';
import { Button } from '@/components/ui/button';
import { Property, PropertyType } from '@/types/database';

export default function Properties() {
  const [searchParams] = useSearchParams();

  // Filter state
  const [search, setSearch] = useState('');
  const { openBooking } = useBooking();
  const [selectedDestination, setSelectedDestination] = useState('');
  const [priceRange, setPriceRange] = useState('any');
  const [guestFilter, setGuestFilter] = useState(0);
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>(undefined);
  const [instantBooking, setInstantBooking] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // URL search params
  const location = searchParams.get('location') || undefined;
  const guests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined;
  const checkIn = searchParams.get('checkIn') || undefined;
  const checkOut = searchParams.get('checkOut') || undefined;
  const hasDateSearch = !!checkIn && !!checkOut;

  // Parse price range
  const [minPrice, maxPrice] = useMemo(() => {
    if (priceRange === 'any') return [undefined, undefined];
    const [min, max] = priceRange.split('-').map(Number);
    return [min || undefined, max < 99999 ? max : undefined];
  }, [priceRange]);

  const queryParams = {
    location: search || location,
    guests: guestFilter || guests,
    checkIn,
    checkOut,
    minPrice,
    maxPrice,
    propertyType,
    instantBooking: instantBooking || undefined,
  };

  const { data: availableProperties, isLoading: availLoading } = useAvailableProperties(queryParams);
  const { data: allProperties, isLoading: allLoading } = useProperties({
    ...queryParams,
    checkIn: undefined,
    checkOut: undefined,
  });
  const { data: destinations } = useActiveDestinations();
  const headerContent = usePageContent('properties', 'header', {
    heading: 'Find & Book Your Perfect Stay',
    subtitle: 'Best rates guaranteed when you book direct. Instant confirmation available.',
    hero_image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=50',
  });

  const properties = hasDateSearch ? availableProperties : allProperties;
  const isLoading = hasDateSearch ? availLoading : allLoading;

  // Client-side destination filter + sort
  const filteredProperties = useMemo(() => {
    let list = [...(properties || [])];

    if (selectedDestination) {
      list = list.filter((p) => p.city === selectedDestination || p.country === selectedDestination);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.base_price - a.base_price);
        break;
      case 'featured':
      default:
        break;
    }

    return list;
  }, [properties, selectedDestination, sortBy]);

  const destinationNames = useMemo(() => {
    if (destinations) return destinations.map((d) => d.name);
    const names = new Set<string>();
    (properties || []).forEach((p) => { names.add(p.city); names.add(p.country); });
    return Array.from(names).sort();
  }, [destinations, properties]);

  const toggleFav = useCallback((id: string) => {
    setFavorites((f) => {
      const n = new Set(f);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const clearAll = () => {
    setSearch('');
    setSelectedDestination('');
    setPriceRange('any');
    setGuestFilter(0);
    setPropertyType(undefined);
    setInstantBooking(false);
  };

  // Stats for hero
  const totalVillas = properties?.length || 0;
  const destCount = destinationNames.length;
  const avgRating = 4.8;
  const heroImage = properties?.[0]?.hero_image_url || undefined;

  return (
    <PageLayout>
      <PageSEO
        pageSlug="properties"
        defaults={{
          meta_title: 'Luxury Properties | Haven Hub',
          meta_description: 'Browse our curated collection of luxury vacation homes. Best rates guaranteed with instant booking available.',
          og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
        }}
      />

      <div className="min-h-screen bg-background">
        <PropertiesHeroBanner
          totalVillas={totalVillas}
          destinationsCount={destCount}
          avgRating={avgRating}
          heroImageUrl={heroImage}
        />

        <PropertiesFilterBar
          search={search}
          onSearchChange={setSearch}
          destinations={destinationNames}
          selectedDestination={selectedDestination}
          onDestinationChange={setSelectedDestination}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          guestFilter={guestFilter}
          onGuestFilterChange={setGuestFilter}
          propertyType={propertyType}
          onPropertyTypeChange={setPropertyType}
          instantBooking={instantBooking}
          onInstantBookingChange={setInstantBooking}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          resultCount={filteredProperties.length}
          onClearAll={clearAll}
        />

        {/* Villa Listing */}
        <main className="max-w-[1200px] mx-auto px-[5%] py-10 pb-20">
          {isLoading ? (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-5'
            }>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={
                    viewMode === 'grid'
                      ? 'bg-card border border-border rounded-2xl overflow-hidden animate-pulse'
                      : 'bg-card border border-border rounded-xl overflow-hidden animate-pulse flex flex-col md:flex-row'
                  }
                >
                  <div className={viewMode === 'grid' ? 'aspect-[4/3] bg-muted' : 'md:w-[360px] aspect-[4/3] md:aspect-auto md:min-h-[220px] bg-muted'} />
                  <div className="p-5 space-y-3 flex-1">
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4 opacity-40">🏖️</div>
              <h3 className="font-serif text-2xl text-foreground mb-2">No villas match your filters</h3>
              <p className="font-sans text-sm text-muted-foreground/60 mb-6">
                Try adjusting your search or clearing filters.
              </p>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All Filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((p, i) => (
                <VillaCardGrid
                  key={p.id}
                  property={p}
                  index={i}
                  onClick={setSelectedProperty}
                  isFavorite={favorites.has(p.id)}
                  onToggleFavorite={toggleFav}
                  onInstantBook={(prop) => openBooking({ mode: 'direct', property: prop })}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filteredProperties.map((p, i) => (
                <VillaCardList
                  key={p.id}
                  property={p}
                  index={i}
                  onClick={setSelectedProperty}
                  isFavorite={favorites.has(p.id)}
                  onToggleFavorite={toggleFav}
                />
              ))}
            </div>
          )}

          <RecentlyViewedWidget variant="inline" className="mt-12" />
        </main>

        {/* CTA Banner */}
        <section className="bg-muted border-t border-border py-16 px-[5%]">
          <div className="max-w-[800px] mx-auto text-center bg-gradient-to-br from-accent/5 to-destructive/5 border border-accent/15 rounded-2xl p-12">
            <p className="font-sans text-[11px] tracking-[0.3em] text-accent uppercase mb-3">Can't Decide?</p>
            <h2 className="font-serif text-[clamp(24px,3vw,36px)] font-semibold text-foreground leading-[1.1] mb-3">
              Let Our Concierge <em className="font-normal text-primary italic">Find It</em>
            </h2>
            <p className="font-sans text-sm text-muted-foreground/60 leading-relaxed max-w-[440px] mx-auto mb-7">
              Tell us your dream holiday and our team will curate a shortlist of perfect villas — tailored just for you.
            </p>
            <Button className="gap-2">
              Talk to Concierge <ArrowRight size={15} />
            </Button>
          </div>
        </section>
      </div>

      {/* Detail Modal */}
      <VillaDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        isFavorite={selectedProperty ? favorites.has(selectedProperty.id) : false}
        onToggleFavorite={toggleFav}
      />
    </PageLayout>
  );
}
