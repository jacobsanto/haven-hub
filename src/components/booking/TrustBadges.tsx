import { motion } from 'framer-motion';
import { Shield, CreditCard, Clock, HeadphonesIcon, Award, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadge {
  icon: React.ElementType;
  title: string;
  description?: string;
}

const allBadges: TrustBadge[] = [
  {
    icon: Shield,
    title: 'Best Price Guarantee',
    description: 'Find it cheaper? We\'ll match it',
  },
  {
    icon: CreditCard,
    title: 'Secure Booking',
    description: 'Your data is protected',
  },
  {
    icon: Clock,
    title: 'Free Cancellation',
    description: 'Up to 48 hours before check-in',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description: 'We\'re here when you need us',
  },
  {
    icon: Award,
    title: 'Verified Properties',
    description: 'Quality checked & approved',
  },
  {
    icon: CheckCircle,
    title: 'Instant Confirmation',
    description: 'Book and receive confirmation immediately',
  },
];

interface TrustBadgesProps {
  variant?: 'horizontal' | 'grid' | 'compact' | 'inline';
  badges?: (keyof typeof badgeKeys)[];
  showDescriptions?: boolean;
  className?: string;
}

const badgeKeys = {
  price: 0,
  secure: 1,
  cancellation: 2,
  support: 3,
  verified: 4,
  instant: 5,
};

export function TrustBadges({ 
  variant = 'horizontal', 
  badges = ['price', 'secure', 'cancellation', 'support'],
  showDescriptions = true,
  className 
}: TrustBadgesProps) {
  const selectedBadges = badges.map(key => allBadges[badgeKeys[key]]);

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-4 flex-wrap", className)}>
        {selectedBadges.map((badge, index) => (
          <motion.div
            key={badge.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/50 dark:bg-card/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/40 dark:border-border/30"
          >
            <badge.icon className="h-3.5 w-3.5 text-primary" />
            <span>{badge.title}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {selectedBadges.slice(0, 3).map((badge) => (
          <div
            key={badge.title}
            className="flex items-center gap-1 text-[11px] text-muted-foreground"
          >
            <badge.icon className="h-3 w-3 text-primary" />
            <span>{badge.title}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
        {selectedBadges.map((badge, index) => (
          <motion.div
            key={badge.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center text-center p-4 rounded-xl card-organic"
          >
            <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-primary/10 backdrop-blur-sm border border-white/40 dark:border-border/30 flex items-center justify-center mb-2">
              <badge.icon className="h-5 w-5 text-primary" />
            </div>
            <h4 className="font-medium text-sm">{badge.title}</h4>
            {showDescriptions && badge.description && (
              <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn("flex items-center justify-center gap-6 md:gap-10 flex-wrap", className)}>
      {selectedBadges.map((badge, index) => (
        <motion.div
          key={badge.title}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2"
        >
          <badge.icon className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">{badge.title}</p>
            {showDescriptions && badge.description && (
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
