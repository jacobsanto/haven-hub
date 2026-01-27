import { motion } from 'framer-motion';
import { Users, Bed, Bath, Home, Ruler } from 'lucide-react';
import { Property } from '@/types/database';

interface PropertyQuickStatsProps {
  property: Property;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  villa: 'Villa',
  apartment: 'Apartment',
  estate: 'Estate',
  cottage: 'Cottage',
  penthouse: 'Penthouse',
};

export function PropertyQuickStats({ property }: PropertyQuickStatsProps) {
  const stats = [
    {
      icon: Home,
      value: PROPERTY_TYPE_LABELS[property.property_type] || property.property_type,
      label: 'Type',
    },
    {
      icon: Bed,
      value: property.bedrooms,
      label: property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms',
    },
    {
      icon: Bath,
      value: property.bathrooms,
      label: property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms',
    },
    {
      icon: Users,
      value: property.max_guests,
      label: 'Guests',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative -mt-16 z-10 mx-4 md:mx-0"
    >
      <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary flex items-center justify-center">
                <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-semibold text-foreground truncate">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
