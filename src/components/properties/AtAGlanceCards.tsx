import { motion } from 'framer-motion';
import { MapPin, DollarSign, Zap, Clock } from 'lucide-react';
import { Property, SpecialOffer } from '@/types/database';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/hooks/useCurrency';

interface AtAGlanceCardsProps {
  property: Property;
  specialOffer?: SpecialOffer | null;
  destinationName?: string | null;
}

export function AtAGlanceCards({ property, specialOffer, destinationName }: AtAGlanceCardsProps) {
  const { formatPrice } = useCurrency();
  
  const priceFormatted = formatPrice(property.base_price);

  const cards = [
    {
      icon: MapPin,
      title: 'Location',
      value: destinationName || property.city,
      description: `${property.city}, ${property.country}`,
      color: 'bg-secondary',
      iconColor: 'text-primary',
    },
    {
      icon: DollarSign,
      title: 'From',
      value: `${priceFormatted.display}/night`,
      description: specialOffer 
        ? `${specialOffer.discount_percent}% off available!` 
        : priceFormatted.isConverted ? priceFormatted.original : 'Best rate guaranteed',
      color: 'bg-accent/20',
      iconColor: 'text-accent-foreground',
      highlight: !!specialOffer,
    },
    ...(property.instant_booking
      ? [
          {
            icon: Zap,
            title: 'Instant Book',
            value: 'Available',
            description: 'Book now, no waiting',
            color: 'bg-accent/10',
            iconColor: 'text-accent',
          },
        ]
      : []),
    {
      icon: Clock,
      title: 'Response',
      value: 'Within 24h',
      description: 'Quick host response',
      color: 'bg-secondary',
      iconColor: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05 }}
        >
          <Card className={`p-4 h-full border-border/50 hover:shadow-md transition-shadow ${card.highlight ? 'ring-2 ring-accent' : ''}`}>
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {card.title}
            </p>
            <p className="font-semibold text-foreground mb-1 truncate">
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {card.description}
            </p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
