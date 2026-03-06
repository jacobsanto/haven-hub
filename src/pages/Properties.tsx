import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Zap, LayoutGrid, LayoutList, Search, ArrowUpDown, Calendar as CalendarIcon, Home } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeroBanner } from '@/components/ui/PageHeroBanner';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { SearchResultCard } from '@/components/properties/SearchResultCard';
import { RecentlyViewedWidget } from '@/components/properties/RecentlyViewedWidget';
import { useProperties } from '@/hooks/useProperties';
import { useAvailableProperties } from '@/hooks/useAvailableProperties';
import { useActiveDestinations } from '@/hooks/useDestinations';
import { usePageContent } from '@/hooks/usePageContent';
import { PageSEO } from '@/components/seo/PageSEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const [bedrooms, setBedrooms] = useState<number | undefined>(undefined);
  const [bathrooms, setBathrooms] = useState<number | undefined>(undefined);
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>(undefined);
  const [instantBooking, setInstantBooking] = useState(false);

  const location = searchParams.get('location') || undefined;
  const guests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined;
  const checkIn = searchParams.get('checkIn') || undefined;
  const checkOut = searchParams.get('checkOut') || undefined;

  const hasDateSearch = !!checkIn && !!checkOut;
  const nights = hasDateSearch ? differenceInDays(parseISO(checkOut!), parseISO(checkIn!)) : undefined;
  const { data: destinations } = useActiveDestinations();

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

  // Client-side search filter
  const filteredProperties = properties?.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.country?.toLowerCase().includes(q);
  });

  // Sort
  const sortedProperties = [...(filteredProperties || [])].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.base_price - b.base_price;
      case 'price-desc': return b.base_price - a.base_price;
      case 'guests': return b.max_guests - a.max_guests;
      default: return 0; // featured = default order
    }
  });

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
    setSearchQuery('');
  };

  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < 5000 || selectedAmenities.length > 0 ||
    bedrooms !== undefined || bathrooms !== undefined || propertyType !== undefined || instantBooking;

  const activeFilterCount = (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0) +
    selectedAmenities.length +
    (bedrooms !== undefined ? 1 : 0) +
    (bathrooms !== undefined ? 1 : 0) +
    (propertyType !== undefined ? 1 : 0) +
    (instantBooking ? 1 : 0);

  const uniqueDestinations = destinations?.length || 0;

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <Label htmlFor="instant-booking" className="font-medium text-sm">Instant Book Only</Label>
        </div>
        <Switch id="instant-booking" checked={instantBooking} onCheckedChange={setInstantBooking} />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Property Types</h3>
        <Select value={propertyType || 'all'} onValueChange={(value) => setPropertyType(value === 'all' ? undefined : value as PropertyType)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All property types" /></SelectTrigger>
          <SelectContent className="bg-card">
            <SelectItem value="all">All Types</SelectItem>
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{PROPERTY_TYPE_LABELS[type]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bedrooms</h3>
        <div className="flex flex-wrap gap-2">
          {[undefined, 1, 2, 3, 4, 5].map((num) => (
            <Button key={num ?? 'any'} variant={bedrooms === num ? 'default' : 'outline'} size="sm" onClick={() => setBedrooms(num)} className="rounded-full h-8 w-8 p-0 text-xs">
              {num === undefined ? 'Any' : num === 5 ? '5+' : num}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bathrooms</h3>
        <div className="flex flex-wrap gap-2">
          {[undefined, 1, 2, 3, 4].map((num) => (
            <Button key={num ?? 'any'} variant={bathrooms === num ? 'default' : 'outline'} size="sm" onClick={() => setBathrooms(num)} className="rounded-full h-8 w-8 p-0 text-xs">
              {num === undefined ? 'Any' : num === 4 ? '4+' : num}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Price Range</h3>
        <Slider value={priceRange} onValueChange={setPriceRange} max={5000} step={50} className="mb-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}+</span>
        </div>
      </div>

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

      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} className="w-full text-sm text-muted-foreground">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout>
      <PageSEO pageSlug="properties" defaults={{ meta_title: 'Luxury Villas | Haven Hub', meta_description: 'Browse our curated collection of luxury vacation villas. Best rates guaranteed.', og_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' }} />

      {/* Hero Banner */}
      <PageHeroBanner
        label="Our Collection"
        labelIcon={Home}
        title={
          <>
            Handpicked <em className="font-normal text-accent italic">Villas</em>
          </>
        }
        subtitle={`Curated luxury properties across ${uniqueDestinations} destinations — each personally inspected, each genuinely extraordinary.`}
        stats={[
          { value: sortedProperties.length || '—', label: 'Villas' },
          { value: uniqueDestinations, label: 'Destinations' },
          { value: '4.9', label: 'Avg Rating' },
        ]}
        backgroundImage="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1400&q=50"
      />

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1200px] mx-auto px-[5%] py-3.5 flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search villas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm bg-muted/50 border-border rounded-lg"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
              <SelectItem value="guests">Most Guests</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile filters */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden gap-2 h-9 rounded-lg">
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">{activeFilterCount}</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader><SheetTitle className="font-serif">Filters</SheetTitle></SheetHeader>
              <div className="mt-6"><FilterContent /></div>
            </SheetContent>
          </Sheet>

          {/* Date info */}
          {hasDateSearch && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{format(parseISO(checkIn!), 'MMM d')} – {format(parseISO(checkOut!), 'MMM d')}</span>
              <span className="text-muted-foreground/40">·</span>
              <span>{guests || 2} guests</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 rounded-md"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 rounded-md"
              aria-label="List view"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground hidden sm:block">
            {isLoading ? 'Searching...' : `${sortedProperties.length} villas`}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-background">
        <div className="max-w-[1200px] mx-auto px-[5%] py-10">
          <div className="flex gap-8">
            {/* Left Sidebar — Desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-36 bg-card border border-border rounded-2xl p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Filter Results</h2>
                <FilterContent />
              </div>
            </aside>

            {/* Grid/List Content */}
            <main className="flex-1 min-w-0">
              {isLoading ? (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                      <div className="aspect-[4/3] bg-muted" />
                      <div className="p-5 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedProperties.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedProperties.map((property, index) => (
                      <PropertyCard key={property.id} property={property} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedProperties.map((property, index) => (
                      <SearchResultCard key={property.id} property={property} index={index} nights={nights} checkIn={checkIn} checkOut={checkOut} guests={guests} />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-20 bg-card border border-border rounded-2xl">
                  <Home className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-lg text-foreground mb-2">No villas found</p>
                  <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search criteria</p>
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                </div>
              )}

              <RecentlyViewedWidget variant="inline" className="mt-12" />
            </main>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
