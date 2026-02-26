import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecentItem {
  id: string;
  slug: string;
  name: string;
  hero_image_url: string | null;
  city: string;
  country: string;
  base_price: number;
}

interface WelcomeBackBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function WelcomeBackBanner({ isVisible, onDismiss }: WelcomeBackBannerProps) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recently_viewed_properties');
      if (stored) {
        const parsed = JSON.parse(stored) as RecentItem[];
        setItems(parsed.slice(0, 3));
      }
    } catch {
      // ignore
    }
  }, []);

  if (items.length === 0) return null;

  const firstName = items[0]?.name;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[400px] z-40"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-5 py-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    Welcome back!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Still dreaming about {firstName}?
                  </p>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Property cards */}
            <div className="px-4 py-3 space-y-2">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.08 }}
                >
                  <Link
                    to={`/properties/${item.slug}`}
                    onClick={onDismiss}
                    className="flex gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-14 h-11 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.hero_image_url || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {item.city}, {item.country}
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          ${item.base_price.toLocaleString()}/nt
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-4 pb-4">
              <Button
                asChild
                variant="default"
                size="sm"
                className="w-full gap-2"
              >
                <Link to="/properties" onClick={onDismiss}>
                  Browse all properties
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
