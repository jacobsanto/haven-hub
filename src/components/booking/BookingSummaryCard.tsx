import { motion } from 'framer-motion';
import { Calendar, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';

export function BookingSummaryCard() {
  const { openBooking } = useBooking();

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="bg-white/85 dark:bg-card/90 backdrop-blur-2xl border border-white/60 dark:border-border rounded-2xl p-6 shadow-glass-lg w-72 hidden lg:block"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Your Trip
      </h3>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Destination</p>
            <p className="text-sm font-medium">Santorini, Greece</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Check-in</p>
            <p className="text-sm font-medium">Mar 15, 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Check-out</p>
            <p className="text-sm font-medium">Mar 22, 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Guests</p>
            <p className="text-sm font-medium">2 Adults</p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-serif font-semibold text-foreground">€2,450</span>
        </div>
        <Button
          onClick={() => openBooking({ mode: 'search' })}
          className="w-full rounded-full"
          size="lg"
        >
          Book Now
        </Button>
      </div>
    </motion.div>
  );
}
