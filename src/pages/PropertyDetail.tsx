import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Star } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PropertyGallery } from '@/components/properties/PropertyGallery';
import { AmenityList } from '@/components/properties/AmenityList';
import { BookingWidget } from '@/components/booking/BookingWidget';
import { useProperty } from '@/hooks/useProperties';

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: property, isLoading, error } = useProperty(slug || '');

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
              <div className="h-96 bg-muted rounded-2xl" />
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <PropertyGallery
            images={property.gallery}
            heroImage={property.hero_image_url}
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
              <h1 className="text-4xl md:text-5xl font-serif font-medium text-foreground">
                {property.name}
              </h1>
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
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-serif font-medium mb-4">About This Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif font-medium mb-6">Amenities</h2>
                <AmenityList amenities={property.amenities} variant="grid" />
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="text-2xl font-serif font-medium mb-4">Location</h2>
              <div className="card-organic p-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">{property.city}</p>
                    {property.region && (
                      <p className="text-muted-foreground">{property.region}</p>
                    )}
                    <p className="text-muted-foreground">{property.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* House Rules (Placeholder) */}
            <div>
              <h2 className="text-2xl font-serif font-medium mb-4">House Rules</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Check-in: 3:00 PM - 10:00 PM
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Checkout: 11:00 AM
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  No smoking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  No parties or events
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Booking Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BookingWidget property={property} />
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
