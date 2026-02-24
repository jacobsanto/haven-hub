import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { parseISO, format } from 'date-fns';
import { motion } from 'framer-motion';
import { MapPin, Heart, ArrowLeft, Bed, Bath, Maximize, Users, Clock, Shield, MessageCircle, Calendar } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PropertyHeroSlider } from '@/components/properties/PropertyHeroSlider';
import { PropertyHighlights } from '@/components/properties/PropertyHighlights';
import { RoomBreakdown } from '@/components/properties/RoomBreakdown';
import { NeighborhoodInfo } from '@/components/properties/NeighborhoodInfo';
import { CollapsibleDescription } from '@/components/properties/CollapsibleDescription';
import { HouseRulesAccordion } from '@/components/properties/HouseRulesAccordion';
import { SimilarProperties } from '@/components/properties/SimilarProperties';
import { RelatedExperiences } from '@/components/properties/RelatedExperiences';
import { SpecialOfferBadge } from '@/components/properties/SpecialOfferBadge';
import { AmenityList } from '@/components/properties/AmenityList';
import { MobileBookingCTA } from '@/components/booking/MobileBookingCTA';
import { BookingFlowDialog } from '@/components/booking/BookingFlowDialog';
import { Button } from '@/components/ui/button';
import { useProperty } from '@/hooks/useProperties';
import { useActiveSpecialOffer } from '@/hooks/useSpecialOffers';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useCurrency } from '@/hooks/useCurrency';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const initialCheckIn = searchParams.get('checkIn') ? parseISO(searchParams.get('checkIn')!) : undefined;
  const initialCheckOut = searchParams.get('checkOut') ? parseISO(searchParams.get('checkOut')!) : undefined;
  const initialGuests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!, 10) : undefined;
  const { data: property, isLoading, error } = useProperty(slug || '');
  const { data: activeOffer } = useActiveSpecialOffer(property?.id || '');
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (property) {
      addToRecentlyViewed(property);
    }
  }, [property, addToRecentlyViewed]);

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

  // Fetch related experiences for the strip
  const { data: relatedExperiences } = useQuery({
    queryKey: ['experiences', 'destination', property?.destination_id],
    queryFn: async () => {
      if (!property?.destination_id) return [];
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('destination_id', property.destination_id)
        .eq('status', 'active')
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!property?.destination_id,
  });

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
      <div className="container mx-auto px-4 py-6">
        {/* Top Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          {/* Left: Back */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Center: Name + subtitle */}
          <div className="hidden md:flex flex-col items-center text-center flex-1 px-4">
            <h1 className="text-xl font-serif font-semibold text-foreground truncate max-w-md">
              {property.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span>{property.city}, {property.country}</span>
              {property.highlights?.[0] && (
                <>
                  <span className="text-border">·</span>
                  <span>{property.highlights[0]}</span>
                </>
              )}
              {property.instant_booking && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-accent">Verified Exclusive</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Save + Heart */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSaved(!saved)}
            >
              Save
              <Heart className={`h-4 w-4 ${saved ? 'fill-accent text-accent' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {/* Hero: Gallery + Booking Summary side-by-side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          {/* Gallery Slider - 3/5 width */}
          <div className="lg:col-span-3">
            <PropertyHeroSlider
              images={property.gallery || []}
              heroImage={property.hero_image_url}
              videoUrl={property.video_url}
              virtualTourUrl={property.virtual_tour_url}
              propertyName={property.name}
            />
          </div>

          {/* Booking Summary Card - 2/5 width */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 h-full flex flex-col justify-between">
              <div className="space-y-5">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Booking Summary
                </h3>

                {/* Special Offer */}
                {activeOffer && (
                  <SpecialOfferBadge offer={activeOffer} variant="card" />
                )}

                {/* Date boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBookingOpen(true)}
                    className="text-left rounded-xl border border-border bg-secondary/30 p-3 hover:border-accent transition-colors"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Check-in</div>
                    <div className="text-sm font-medium mt-1">
                      {initialCheckIn ? format(initialCheckIn, 'MMM d, yyyy') : 'Select date'}
                    </div>
                  </button>
                  <button
                    onClick={() => setBookingOpen(true)}
                    className="text-left rounded-xl border border-border bg-secondary/30 p-3 hover:border-accent transition-colors"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Check-out</div>
                    <div className="text-sm font-medium mt-1">
                      {initialCheckOut ? format(initialCheckOut, 'MMM d, yyyy') : 'Select date'}
                    </div>
                  </button>
                </div>

                {/* Guests */}
                <button
                  onClick={() => setBookingOpen(true)}
                  className="w-full text-left rounded-xl border border-border bg-secondary/30 p-3 hover:border-accent transition-colors"
                >
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Guests</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {initialGuests ? `${initialGuests} guest${initialGuests > 1 ? 's' : ''}` : `Up to ${property.max_guests} guests`}
                    </span>
                  </div>
                </button>

                {/* Price */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-serif font-semibold text-foreground">
                      {formatPrice(property.base_price).display}
                    </span>
                    <span className="text-sm text-muted-foreground">/ per night</span>
                  </div>
                </div>
              </div>

              {/* Reserve Button + Trust */}
              <div className="space-y-3">
                <Button
                  className="w-full h-12 text-base font-medium bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setBookingOpen(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reserve Villa
                </Button>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Free Cancellation
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Pay Later
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Highlight Pills */}
        {property.highlights && property.highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="flex flex-wrap gap-2">
              {property.highlights.map((highlight, i) => (
                <span
                  key={i}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground border border-border"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Inline Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
        >
          {property.area_sqm && (
            <span className="flex items-center gap-1.5">
              <Maximize className="h-4 w-4" />
              {property.area_sqm} m²
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Bed className="h-4 w-4" />
            {property.bedrooms} Bedroom{property.bedrooms !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            {property.bathrooms} Bathroom{property.bathrooms !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Up to {property.max_guests} guests
          </span>
        </motion.div>

        {/* Experiences Strip */}
        {relatedExperiences && relatedExperiences.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-center gap-4 overflow-x-auto pb-2"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
              Experiences
            </span>
            {relatedExperiences.map((exp) => (
              <Link
                key={exp.id}
                to={`/experiences/${exp.slug}`}
                className="shrink-0 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 hover:border-accent transition-colors group"
              >
                {exp.hero_image_url && (
                  <img
                    src={exp.hero_image_url}
                    alt={exp.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                )}
                <div>
                  <div className="text-sm font-medium group-hover:text-accent transition-colors">{exp.name}</div>
                  {exp.price_from && (
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(exp.price_from).display}
                      {exp.price_type === 'per_person' && ' /person'}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            <Link
              to="/contact"
              className="shrink-0 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-accent hover:bg-accent/10 transition-colors text-sm font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              Talk to Concierge
            </Link>
          </motion.div>
        )}

        {/* Mobile title (shown only on mobile) */}
        <div className="md:hidden mt-6">
          <h1 className="text-2xl font-serif font-semibold text-foreground">{property.name}</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            {property.city}, {property.country}
          </div>
        </div>

        {/* Content sections below the fold */}
        <div className="mt-16 max-w-4xl space-y-16">
          {/* Overview / Description */}
          <section id="overview" className="scroll-mt-32">
            <CollapsibleDescription
              shortDescription={(property as any).short_description}
              fullDescription={property.description}
              visibleCount={2}
              collapseThreshold={3}
              dropCap={true}
              variant="overview"
            />
          </section>

          {/* Rooms & Spaces */}
          <section id="rooms" className="border-t border-border/30 pt-16">
            <h2 className="text-xl sm:text-2xl font-serif font-medium mb-6">Rooms & Spaces</h2>
            <RoomBreakdown
              rooms={property.rooms}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
            />
          </section>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <section id="amenities" className="border-t border-border/30 pt-16">
              <h2 className="text-xl sm:text-2xl font-serif font-medium mb-6">Amenities & Features</h2>
              <AmenityList
                amenities={property.amenities}
                variant="grid"
                showDescriptions={false}
                collapsible={true}
                initialVisible={8}
              />
            </section>
          )}

          {/* Location & Neighborhood */}
          <section id="location" className="border-t border-border/30 pt-16">
            <h2 className="text-xl sm:text-2xl font-serif font-medium mb-6">Location & Neighborhood</h2>
            <NeighborhoodInfo
              description={property.neighborhood_description}
              attractions={property.nearby_attractions}
              city={property.city}
              region={property.region}
              country={property.country}
              latitude={property.latitude}
              longitude={property.longitude}
            />
          </section>

          {/* House Rules & Policies */}
          <section id="policies" className="border-t border-border/30 pt-16">
            <h2 className="text-xl sm:text-2xl font-serif font-medium mb-6">House Rules & Policies</h2>
            <HouseRulesAccordion
              houseRules={property.house_rules}
              cancellationPolicy={property.cancellation_policy}
              petPolicy={property.pet_policy}
            />
          </section>
        </div>

        {/* Related Experiences (full section) */}
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
          priceDisplay={formatPrice(property.base_price).display}
          specialOffer={activeOffer}
          initialCheckIn={initialCheckIn}
          initialCheckOut={initialCheckOut}
          initialGuests={initialGuests}
        />
      </div>

      {/* Booking Flow Dialog */}
      <BookingFlowDialog
        property={property}
        specialOffer={activeOffer}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        initialCheckIn={initialCheckIn}
        initialCheckOut={initialCheckOut}
        initialGuests={initialGuests}
      />
    </PageLayout>
  );
}
