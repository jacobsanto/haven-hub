import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Zap, LayoutGrid, List, Map, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchBar } from '@/components/search/SearchBar';
import { QuickBookCard } from '@/components/booking/QuickBookCard';
import { SearchResultCard } from '@/components/properties/SearchResultCard';
import { RecentlyViewedWidget } from '@/components/properties/RecentlyViewedWidget';
import { useSectionDisplay } from '@/hooks/useSectionDisplay';
import { SectionRenderer } from '@/components/ui/SectionRenderer';
import { useProperties } from '@/hooks/useProperties';
import { useAvailableProperties } from '@/hooks/useAvailableProperties';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AMENITIES, AMENITY_LABELS, Amenity, PROPERTY_TYPES, PROPERTY_TYPE_LABELS, PropertyTypeValue } from '@/lib/constants';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PropertyType } from '@/types/database';

export default function Properties() {
  const [searchParams] = useSearchParams();
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  
  const [bedrooms, setBedrooms] = useState<number | undefined>(undefined);
  const [bathrooms, setBathrooms] = useState<number | undefined>(undefined);
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>(undefined);
  const [instantBooking, setInstantBooking] = useState(false);
  const propertiesDisplay = useSectionDisplay('properties', 'grid');

  const location = searchParams.get('location') || undefined;
  const guests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined;
  const checkIn = searchParams.get('checkIn') || undefined;
  const checkOut = searchParams.get('checkOut') || undefined;

  const headerContent = usePageContent('properties', 'header', {
    heading: 'Find & Book Your Perfect Stay',
    subtitle: 'Best rates guaranteed when you book direct. Instant confirmation available.',
  });

  const hasDateSearch = !!checkIn && !!checkOut;
  const nights = hasDateSearch ? differenceInDays(parseISO(checkOut!), parseISO(checkIn!)) : undefined;

  const searchParams_ = {
    location,
    guests,
    checkIn,
    checkOut,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    bedrooms,
    bathrooms,
    propertyType,
    instantBooking: instantBooking ? true : undefined,
  };

  const { data: availableProperties, isLoading: availLoading } = useAvailableProperties(searchParams_);
  const { data: allProperties, isLoading: allLoading } = useProperties({
    ...searchParams_,
    checkIn: undefined,
    checkOut: undefined,
  });

  const properties = hasDateSearch ? availableProperties : allProperties;
  const isLoading = hasDateSearch ? availLoading : allLoading;
  const effectiveView = hasDateSearch && viewMode === 'grid' ? 'list' : viewMode;

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedAmenities([]);
    setBedrooms(undefined);
    setBathrooms(undefined);
    setPropertyType(undefined);
    setInstantBooking(false);
  };

  const hasActiveFilters = 
    priceRange[0] > 0 || priceRange[1] < 5000 || selectedAmenities.length > 0 ||
    bedrooms !== undefined || bathrooms !== undefined || propertyType !== undefined || instantBooking;

  const activeFilterCount = 
    (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0) +
    selectedAmenities.length +
    (bedrooms !== undefined ? 1 : 0) +
    (bathrooms !== undefined ? 1 : 0) +
    (propertyType !== undefined ? 1 : 0) +
    (instantBooking ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Instant Booking */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <Label htmlFor="instant-booking" className="font-medium text-sm">Instant Book Only</Label>
        </div>
        <Switch id="instant-booking" checked={instantBooking} onCheckedChange={setInstantBooking} />
      </div>

      {/* Property Type */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Property Types</h3>
        <Select
          value={propertyType || 'all'}
          onValueChange={(value) => setPropertyType(value === 'all' ? undefined : value as PropertyType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All property types" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            <SelectItem value="all">All Types</SelectItem>
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{PROPERTY_TYPE_LABELS[type]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bedrooms</h3>
        <div className="flex flex-wrap gap-2">
          {[undefined, 1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num ?? 'any'}
              variant={bedrooms === num ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBedrooms(num)}
              className="rounded-full h-8 w-8 p-0 text-xs"
            >
              {num === undefined ? 'Any' : num === 5 ? '5+' : num}
            </Button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bathrooms</h3>
        <div className="flex flex-wrap gap-2">
          {[undefined, 1, 2, 3, 4].map((num) => (
            <Button
              key={num ?? 'any'}
              variant={bathrooms === num ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBathrooms(num)}
              className="rounded-full h-8 w-8 p-0 text-xs"
            >
              {num === undefined ? 'Any' : num === 4 ? '4+' : num}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Price Range</h3>
        <Slider value={priceRange} onValueChange={setPriceRange} max={5000} step={50} className="mb-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}+</span>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Amenities</h3>
        <div className="space-y-2.5 max-h-48 overflow-y-auto">
          {AMENITIES.slice(0, 15).map((amenity) => (
            <label key={amenity} className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={selectedAmenities.includes(amenity)} onCheckedChange={() => toggleAmenity(amenity)} />
              <span className="text-sm">{AMENITY_LABELS[amenity as Amenity]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Search CTA */}
      <Button className="w-full rounded-full" size="lg">
        Search & Find
      </Button>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} className="w-full text-sm text-muted-foreground">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout>
      <PageSEO pageSlug="properties" defaults={{ meta_title: 'Luxury Properties | Haven Hub', meta_description: 'Browse our curated collection of luxury vacation homes. Best rates guaranteed with instant booking available.', og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' }} />
      <div className="min-h-screen bg-background">
        {/* Clean Header */}
        <div className="border-b border-border bg-background py-6">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-serif font-medium text-foreground">
                    {hasDateSearch && location ? `Stays in ${location}` : location ? `Properties in ${location}` : headerContent.heading}
                  </h1>
                  {hasDateSearch && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>{format(parseISO(checkIn!), 'MMM d')} – {format(parseISO(checkOut!), 'MMM d')}</span>
                      <span>·</span>
                      <span>{guests || 2} Guest{(guests || 2) > 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{properties?.length || 0} results</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Mobile filter trigger */}
                  <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">{activeFilterCount}</span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      <SheetHeader><SheetTitle className="font-serif">Filters</SheetTitle></SheetHeader>
                      <div className="mt-6"><FilterContent /></div>
                    </SheetContent>
                  </Sheet>
                  {hasDateSearch && (
                    <Button variant={effectiveView === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} className="rounded-full h-8 w-8" aria-label="List view">
                      <List className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant={effectiveView === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} className="rounded-full h-8 w-8" aria-label="Grid view">
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {!hasDateSearch && (
                <div className="max-w-2xl">
                  <SearchBar variant="compact" className="justify-start" />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Left Sidebar — Desktop Only */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Filter Results</h2>
                <div className="bg-card border border-border rounded-2xl p-5">
                  <FilterContent />
                </div>
              </div>
            </aside>

            {/* Center — Property Grid */}
            <main className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Checking availability...' : `${properties?.length || 0} properties found`}
                </p>
              </div>

              {effectiveView === 'list' ? (
                <>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse flex flex-col md:flex-row">
                          <div className="md:w-[280px] lg:w-[320px] aspect-[4/3] md:aspect-auto md:min-h-[220px] bg-muted" />
                          <div className="flex-1 p-6 space-y-4">
                            <div className="h-6 bg-muted rounded w-1/3" />
                            <div className="h-4 bg-muted rounded w-1/4" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="h-8 bg-muted rounded w-1/3 mt-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : properties && properties.length > 0 ? (
                    <div className="space-y-4">
                      {properties.map((property, index) => (
                        <SearchResultCard key={property.id} property={property} index={index} nights={nights} checkIn={checkIn} checkOut={checkOut} guests={guests} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState onClear={clearFilters} message="No properties available for these dates" />
                  )}
                </>
              ) : effectiveView === 'grid' ? (
                <>
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                          <div className="aspect-[4/3] bg-muted" />
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-muted rounded w-1/4" />
                            <div className="h-5 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-full" />
                            <div className="h-8 bg-muted rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : properties && properties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {properties.map((property, index) => (
                        <QuickBookCard key={property.id} property={property} index={index} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState onClear={clearFilters} message="No properties match your criteria" />
                  )}
                </>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-serif text-xl font-medium mb-2">Map View Coming Soon</h3>
                  <p className="text-muted-foreground">Interactive map view with property pins is in development.</p>
                </div>
              )}

              <RecentlyViewedWidget variant="inline" className="mt-12" />
            </main>

            {/* Right — Map Placeholder (xl+) */}
            <aside className="hidden xl:block w-72 shrink-0">
              <div className="sticky top-24">
                <div className="bg-card border border-border rounded-2xl overflow-hidden h-[600px] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MapPin className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-medium mb-2">Explore on Map</h3>
                  <p className="text-sm text-muted-foreground">Interactive map with property locations coming soon.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function EmptyState({ onClear, message }: { onClear: () => void; message: string }) {
  return (
    <div className="text-center py-16 bg-card border border-border rounded-2xl">
      <p className="text-muted-foreground text-lg mb-2">{message}</p>
      <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
      <Button variant="outline" onClick={onClear}>Clear Filters</Button>
    </div>
  );
}
