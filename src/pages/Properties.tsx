import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Zap, LayoutGrid, Map, Shield, Clock, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { SearchBar } from '@/components/search/SearchBar';
import { QuickBookCard } from '@/components/booking/QuickBookCard';
import { TrustBadges } from '@/components/booking/TrustBadges';
import { useProperties } from '@/hooks/useProperties';
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
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // New advanced filters
  const [bedrooms, setBedrooms] = useState<number | undefined>(undefined);
  const [bathrooms, setBathrooms] = useState<number | undefined>(undefined);
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>(undefined);
  const [instantBooking, setInstantBooking] = useState(false);

  const location = searchParams.get('location') || undefined;
  const guests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined;

  const { data: properties, isLoading } = useProperties({
    location,
    guests,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    bedrooms,
    bathrooms,
    propertyType,
    instantBooking: instantBooking ? true : undefined,
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
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
    priceRange[0] > 0 || 
    priceRange[1] < 5000 || 
    selectedAmenities.length > 0 ||
    bedrooms !== undefined ||
    bathrooms !== undefined ||
    propertyType !== undefined ||
    instantBooking;

  const activeFilterCount = 
    (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0) +
    selectedAmenities.length +
    (bedrooms !== undefined ? 1 : 0) +
    (bathrooms !== undefined ? 1 : 0) +
    (propertyType !== undefined ? 1 : 0) +
    (instantBooking ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Instant Booking Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <Label htmlFor="instant-booking" className="font-medium">Instant Book Only</Label>
        </div>
        <Switch
          id="instant-booking"
          checked={instantBooking}
          onCheckedChange={setInstantBooking}
        />
      </div>

      {/* Property Type */}
      <div>
        <h3 className="font-medium mb-4">Property Type</h3>
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
              <SelectItem key={type} value={type}>
                {PROPERTY_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms */}
      <div>
        <h3 className="font-medium mb-4">Bedrooms</h3>
        <div className="flex flex-wrap gap-2">
          {[undefined, 1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num ?? 'any'}
              variant={bedrooms === num ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBedrooms(num)}
              className="rounded-full"
            >
              {num === undefined ? 'Any' : num === 5 ? '5+' : num}
            </Button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <h3 className="font-medium mb-4">Bathrooms</h3>
        <div className="flex flex-wrap gap-2">
          {[undefined, 1, 2, 3, 4].map((num) => (
            <Button
              key={num ?? 'any'}
              variant={bathrooms === num ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBathrooms(num)}
              className="rounded-full"
            >
              {num === undefined ? 'Any' : num === 4 ? '4+' : num}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-4">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={5000}
          step={50}
          className="mb-4"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>${priceRange[0]}</span>
          <span>${priceRange[1]}+</span>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="font-medium mb-4">Amenities</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {AMENITIES.slice(0, 15).map((amenity) => (
            <label
              key={amenity}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={selectedAmenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <span className="text-sm">{AMENITY_LABELS[amenity as Amenity]}</span>
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        {/* Header with Booking Focus */}
        <div className="bg-secondary/30 py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">
                {location ? `Book Your Stay in ${location}` : 'Find & Book Your Perfect Stay'}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Best rates guaranteed when you book direct. Instant confirmation available.
              </p>
            </motion.div>
            <div className="max-w-3xl mx-auto mb-6">
              <SearchBar variant="compact" className="justify-center" />
            </div>
            {/* Trust badges */}
            <TrustBadges 
              variant="compact" 
              badges={['price', 'cancellation', 'instant']} 
              className="justify-center"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 card-organic p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl font-medium">Filters</h2>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
                <FilterContent />
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full shadow-lg gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-serif">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Properties Grid */}
            <div className="flex-1">
              {/* Results Count & View Toggle */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  {isLoading
                    ? 'Loading...'
                    : `${properties?.length || 0} properties found`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="rounded-full"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('map')}
                    className="rounded-full"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <>
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {properties.map((property, index) => (
                        <QuickBookCard key={property.id} property={property} index={index} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 card-organic">
                      <p className="text-muted-foreground text-lg mb-4">
                        No properties match your criteria
                      </p>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="card-organic p-8 text-center">
                  <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-serif text-xl font-medium mb-2">Map View Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Interactive map view with property pins is in development.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
