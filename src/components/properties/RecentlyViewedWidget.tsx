import { motion } from 'framer-motion';
import { Clock, X, Bed, Bath, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useBooking } from '@/contexts/BookingContext';
import { cn } from '@/lib/utils';

interface RecentlyViewedWidgetProps {
  variant?: 'inline' | 'floating';
  excludeSlug?: string;
  className?: string;
}

export function RecentlyViewedWidget({ 
  variant = 'inline', 
  excludeSlug,
  className 
}: RecentlyViewedWidgetProps) {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const { openBooking } = useBooking();
  
  const filteredItems = excludeSlug 
    ? recentlyViewed.filter(item => item.slug !== excludeSlug)
    : recentlyViewed;

  if (filteredItems.length === 0) return null;

  const handleClick = (item: typeof filteredItems[0]) => {
    openBooking({ mode: 'direct', property: item as any });
  };

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40",
          "bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl",
          className
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Continue where you left off
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearRecentlyViewed}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {filteredItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => handleClick(item)}
                className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
              >
                <div className="w-16 h-12 rounded-md overflow-hidden flex-shrink-0">
                  <img src={item.hero_image_url || '/placeholder.svg'} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.city}, {item.country}</p>
                  <p className="text-xs font-semibold text-primary">From ${item.base_price.toLocaleString()}/night</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn("py-8", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-serif font-semibold text-foreground">Recently Viewed</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={clearRecentlyViewed} className="text-muted-foreground hover:text-foreground">Clear all</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item, index) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <div
              onClick={() => handleClick(item)}
              className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={item.hero_image_url || '/placeholder.svg'} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {item.instant_booking && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Instant
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{item.city}, {item.country}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{item.bedrooms}</span>
                  <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{item.bathrooms}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{item.max_guests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    From ${item.base_price.toLocaleString()}<span className="text-muted-foreground font-normal">/night</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Book now →</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
