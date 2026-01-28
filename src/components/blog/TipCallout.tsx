import { Lightbulb, Info, Star, MapPin, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type CalloutType = 'tip' | 'info' | 'highlight' | 'location' | 'timing' | 'recommendation';

interface TipCalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutConfig: Record<CalloutType, { icon: typeof Lightbulb; label: string; bgClass: string; borderClass: string; iconClass: string }> = {
  tip: {
    icon: Lightbulb,
    label: 'Pro Tip',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    label: 'Good to Know',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  highlight: {
    icon: Star,
    label: 'Highlight',
    bgClass: 'bg-primary/5',
    borderClass: 'border-primary/20',
    iconClass: 'text-primary',
  },
  location: {
    icon: MapPin,
    label: 'Location',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  timing: {
    icon: Clock,
    label: 'Best Time',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-800',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
  recommendation: {
    icon: CheckCircle,
    label: 'Recommendation',
    bgClass: 'bg-teal-50 dark:bg-teal-950/30',
    borderClass: 'border-teal-200 dark:border-teal-800',
    iconClass: 'text-teal-600 dark:text-teal-400',
  },
};

export function TipCallout({ type = 'tip', title, children }: TipCalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.label;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4 }}
      className={`my-8 md:my-10 rounded-xl border ${config.bgClass} ${config.borderClass} overflow-hidden`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-5 py-3 border-b ${config.borderClass}`}>
        <Icon className={`h-5 w-5 ${config.iconClass}`} />
        <span className={`font-semibold text-sm uppercase tracking-wide ${config.iconClass}`}>
          {displayTitle}
        </span>
      </div>
      
      {/* Content */}
      <div className="px-5 py-4 text-foreground/90 leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}
