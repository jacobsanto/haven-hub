import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Flame, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrgencyMessage {
  icon: React.ElementType;
  text: string;
  highlight?: string;
}

const messages: UrgencyMessage[] = [
  {
    icon: Users,
    text: 'guests are viewing properties right now',
    highlight: '12',
  },
  {
    icon: Flame,
    text: 'properties booked in the last 24 hours',
    highlight: '8',
  },
  {
    icon: TrendingUp,
    text: 'increase in bookings this week',
    highlight: '35%',
  },
  {
    icon: Clock,
    text: 'Limited availability for peak season',
    highlight: '',
  },
];

interface UrgencyBannerProps {
  variant?: 'rotating' | 'static' | 'property';
  propertyName?: string;
  viewCount?: number;
  lastBooked?: string;
  className?: string;
  dismissible?: boolean;
}

export function UrgencyBanner({ 
  variant = 'rotating',
  propertyName,
  viewCount,
  lastBooked,
  className,
  dismissible = true,
}: UrgencyBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (variant !== 'rotating') return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [variant]);

  if (isDismissed) return null;

  if (variant === 'property') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 flex items-center justify-between",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm">
              <strong>{viewCount || Math.floor(Math.random() * 8) + 3}</strong> people viewing
            </span>
          </div>
          {lastBooked && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">Last booked {lastBooked}</span>
              </div>
            </>
          )}
        </div>
        {dismissible && (
          <button
            onClick={() => setIsDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    );
  }

  if (variant === 'static') {
    const message = messages[0];
    return (
      <div className={cn(
        "bg-primary text-primary-foreground py-2 px-4 text-center text-sm",
        className
      )}>
        <div className="container mx-auto flex items-center justify-center gap-2">
          <message.icon className="h-4 w-4" />
          <span>
            {message.highlight && <strong>{message.highlight}</strong>} {message.text}
          </span>
        </div>
      </div>
    );
  }

  // Rotating variant
  const currentMessage = messages[currentIndex];

  return (
    <div className={cn(
      "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-2 px-4 overflow-hidden",
      className
    )}>
      <div className="container mx-auto flex items-center justify-center gap-2 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-sm"
          >
            <currentMessage.icon className="h-4 w-4" />
            <span>
              {currentMessage.highlight && (
                <strong className="font-semibold">{currentMessage.highlight} </strong>
              )}
              {currentMessage.text}
            </span>
          </motion.div>
        </AnimatePresence>
        
        {dismissible && (
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute right-0 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
