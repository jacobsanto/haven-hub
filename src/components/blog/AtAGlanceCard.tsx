import { motion } from 'framer-motion';
import { ClipboardList, Clock, Target, Lightbulb } from 'lucide-react';

interface AtAGlanceItem {
  label: string;
  value: string;
}

interface AtAGlanceCardProps {
  items?: AtAGlanceItem[];
  bestFor?: string;
  difficulty?: string;
  readTime?: number;
  keyTakeaway?: string;
}

export function AtAGlanceCard({ 
  items,
  bestFor,
  difficulty,
  readTime,
  keyTakeaway 
}: AtAGlanceCardProps) {
  // Use provided items or build from individual props
  const displayItems: AtAGlanceItem[] = items || [
    ...(bestFor ? [{ label: 'Best for', value: bestFor }] : []),
    ...(difficulty ? [{ label: 'Difficulty', value: difficulty }] : []),
    ...(readTime ? [{ label: 'Time to read', value: `${readTime} minutes` }] : []),
    ...(keyTakeaway ? [{ label: 'Key takeaway', value: keyTakeaway }] : []),
  ];

  if (displayItems.length === 0) return null;

  const getIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('best') || lower.includes('for')) return Target;
    if (lower.includes('time') || lower.includes('read')) return Clock;
    if (lower.includes('key') || lower.includes('takeaway')) return Lightbulb;
    return ClipboardList;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-10 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
          At a Glance
        </h3>
      </div>

      <ul className="space-y-4">
        {displayItems.map((item, index) => {
          const Icon = getIcon(item.label);
          return (
            <li key={index} className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-foreground">{item.label}:</span>{' '}
                <span className="text-muted-foreground">{item.value}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
