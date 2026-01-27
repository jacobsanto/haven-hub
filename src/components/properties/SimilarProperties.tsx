import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Property, RoomConfig, NearbyAttraction } from '@/types/database';
import { PropertyCard } from './PropertyCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SimilarPropertiesProps {
  currentPropertyId: string;
  destinationId?: string | null;
  country: string;
  priceRange?: { min: number; max: number };
  className?: string;
  title?: string;
  limit?: number;
}

// Transform raw database row to Property type
function transformProperty(row: any): Property {
  return {
    ...row,
    gallery: row.gallery || [],
    amenities: row.amenities || [],
    highlights: row.highlights || [],
    rooms: (row.rooms || []) as RoomConfig[],
    nearby_attractions: (row.nearby_attractions || []) as NearbyAttraction[],
    house_rules: row.house_rules || [],
  };
}

export function SimilarProperties({
  currentPropertyId,
  destinationId,
  country,
  priceRange,
  className,
  title = 'Similar Properties',
  limit = 3,
}: SimilarPropertiesProps) {
  const { data: similarProperties, isLoading } = useQuery({
    queryKey: ['similar-properties', currentPropertyId, destinationId, country],
    queryFn: async () => {
      // Build query for similar properties
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .neq('id', currentPropertyId)
        .limit(limit);

      // Prefer same destination, then same country
      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      } else {
        query = query.eq('country', country);
      }

      // Optional price range filtering
      if (priceRange) {
        query = query.gte('base_price', priceRange.min).lte('base_price', priceRange.max);
      }

      const { data, error } = await query;

      if (error) throw error;

      const results = (data || []).map(transformProperty);

      // If not enough results from destination, fetch from same country
      if (results.length < limit && destinationId) {
        const existingIds = results.map((p) => p.id);
        const { data: countryData } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'active')
          .eq('country', country)
          .neq('id', currentPropertyId)
          .limit(limit - results.length);

        const additionalResults = (countryData || [])
          .filter((p) => !existingIds.includes(p.id))
          .map(transformProperty);

        return [...results, ...additionalResults];
      }

      return results;
    },
    enabled: !!currentPropertyId,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <h2 className="text-2xl font-serif font-medium">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="card-organic animate-pulse">
              <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!similarProperties || similarProperties.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-6', className)}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-medium">{title}</h2>
        <Button variant="ghost" asChild className="gap-2">
          <Link to={`/properties?location=${encodeURIComponent(country)}`}>
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarProperties.map((property, index) => (
          <PropertyCard key={property.id} property={property} index={index} />
        ))}
      </div>
    </motion.div>
  );
}
