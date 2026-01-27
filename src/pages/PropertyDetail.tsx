import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Bed, Bath, ChevronRight, Home, Zap } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PropertyHeroSlider } from '@/components/properties/PropertyHeroSlider';
import { PropertyHighlights } from '@/components/properties/PropertyHighlights';
import { RoomBreakdown } from '@/components/properties/RoomBreakdown';
import { NeighborhoodInfo } from '@/components/properties/NeighborhoodInfo';
import { HouseRulesAccordion } from '@/components/properties/HouseRulesAccordion';
import { SimilarProperties } from '@/components/properties/SimilarProperties';
import { RelatedExperiences } from '@/components/properties/RelatedExperiences';
import { SpecialOfferBadge } from '@/components/properties/SpecialOfferBadge';
import { InstantBookingBadge } from '@/components/properties/InstantBookingBadge';
import { AmenityList } from '@/components/properties/AmenityList';
import { BookingWidget } from '@/components/booking/BookingWidget';
import { MobileBookingCTA } from '@/components/booking/MobileBookingCTA';
import { useProperty } from '@/hooks/useProperties';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: property, isLoading, error } = useProperty(slug || '');
  const { data: activeOffer } = useActiveSpecialOffer(property?.id || '');

  // Fetch destination if property has one
  const { data: destination } = useQuery({
    queryKey: ['destination', property?.destination_id],
    queryFn: async () => {
      if (!property?.destination_id) return null;
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', property.destination_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!property?.destination_id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-[60vh] bg-muted rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-10 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-32 bg-muted rounded" />
              </div>
              <div className="hidden lg:block h-96 bg-muted rounded-2xl" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !property) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-serif font-medium mb-4">Property Not Found</h1>
          <p className="text-muted-foreground">
            The property you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            {destination && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/destinations/${destination.slug}`}>
                      {destination.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/properties">Properties</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{property.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PropertyHeroSlider
            images={property.gallery}
            heroImage={property.hero_image_url}
            videoUrl={property.video_url}
            virtualTourUrl={property.virtual_tour_url}
            propertyName={property.name}
          />
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-foreground">
                  {property.name}
                </h1>
                {property.instant_booking && <InstantBookingBadge />}
              </div>

              {/* Special Offer */}
              {activeOffer && (
                <SpecialOfferBadge offer={activeOffer} variant="card" />
              )}

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-5 w-5" />
                  {property.city}
                  {property.region && `, ${property.region}`}, {property.country}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-5 w-5" />
                  Up to {property.max_guests} guests
                </span>
                <span className="flex items-center gap-1.5">
                  <Bed className="h-5 w-5" />
                  {property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Bath className="h-5 w-5" />
                  {property.bathrooms} {property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}
                </span>
              </div>
            </div>

            {/* Highlights */}
            {property.highlights && property.highlights.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-medium mb-4">Highlights</h2>
                <PropertyHighlights highlights={property.highlights} variant="badges" />
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div className="prose prose-lg max-w-none">
                <h2 className="text-xl sm:text-2xl font-serif font-medium mb-4">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Room Breakdown */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-medium mb-6">Rooms & Spaces</h2>
              <RoomBreakdown
                rooms={property.rooms}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
              />
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-medium mb-6">Amenities & Features</h2>
                <AmenityList 
                  amenities={property.amenities} 
                  variant="grid" 
                  showDescriptions={true}
                />
              </div>
            )}

            {/* Neighborhood & Location */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-medium mb-4">Location & Neighborhood</h2>
              <NeighborhoodInfo
                description={property.neighborhood_description}
                attractions={property.nearby_attractions}
                city={property.city}
                region={property.region}
                country={property.country}
              />
            </div>

            {/* House Rules & Policies */}
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-medium mb-4">House Rules & Policies</h2>
              <HouseRulesAccordion
                houseRules={property.house_rules}
                cancellationPolicy={property.cancellation_policy}
                petPolicy={property.pet_policy}
              />
            </div>
          </motion.div>

          {/* Desktop Booking Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block"
          >
            <BookingWidget property={property} specialOffer={activeOffer} />
          </motion.div>
        </div>

        {/* Related Experiences */}
        {property.destination_id && (
          <div className="mt-16">
            <RelatedExperiences
              destinationId={property.destination_id}
              title="Enhance Your Stay"
            />
          </div>
        )}

        {/* Similar Properties */}
        <div className="mt-16">
          <SimilarProperties
            currentPropertyId={property.id}
            destinationId={property.destination_id}
            country={property.country}
            title={destination ? `More Properties in ${destination.name}` : 'Similar Properties'}
          />
        </div>

        {/* Mobile Booking CTA */}
        <MobileBookingCTA 
          property={property} 
          priceDisplay={formatPrice(property.base_price)} 
        />
      </div>
    </PageLayout>
  );
}
