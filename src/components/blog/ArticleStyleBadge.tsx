import { Map, Sparkles, Lightbulb, List, BookOpen, CheckSquare, GitCompare, BarChart3, Users, ShieldQuestion } from 'lucide-react';
import { ArticleStyle } from '@/types/article-styles';
import { cn } from '@/lib/utils';

interface ArticleStyleBadgeProps {
  categorySlug?: string;
  articleStyle?: ArticleStyle | null;
  variant?: 'default' | 'compact' | 'overlay';
  className?: string;
}

const styleConfig: Record<ArticleStyle, {
  icon: typeof Map;
  label: string;
  bgClass: string;
  textClass: string;
}> = {
  'destination-guide': { icon: Map, label: 'Guide', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  'lifestyle': { icon: Sparkles, label: 'Lifestyle', bgClass: 'bg-secondary/20', textClass: 'text-secondary-foreground' },
  'travel-tips': { icon: Lightbulb, label: 'Tips', bgClass: 'bg-amber-500/10', textClass: 'text-amber-600 dark:text-amber-400' },
  'classic-list-post': { icon: List, label: 'List', bgClass: 'bg-blue-500/10', textClass: 'text-blue-600 dark:text-blue-400' },
  'beginners-guide': { icon: BookOpen, label: 'Guide', bgClass: 'bg-green-500/10', textClass: 'text-green-600 dark:text-green-400' },
  'things-to-do-after': { icon: CheckSquare, label: 'Checklist', bgClass: 'bg-violet-500/10', textClass: 'text-violet-600 dark:text-violet-400' },
  'product-showdown': { icon: GitCompare, label: 'Comparison', bgClass: 'bg-orange-500/10', textClass: 'text-orange-600 dark:text-orange-400' },
  'detailed-case-study': { icon: BarChart3, label: 'Case Study', bgClass: 'bg-rose-500/10', textClass: 'text-rose-600 dark:text-rose-400' },
  'how-they-did-it': { icon: Users, label: 'Story', bgClass: 'bg-teal-500/10', textClass: 'text-teal-600 dark:text-teal-400' },
  'myth-debunker': { icon: ShieldQuestion, label: 'Myths', bgClass: 'bg-red-500/10', textClass: 'text-red-600 dark:text-red-400' },
};

export function ArticleStyleBadge({ 
  articleStyle,
  categorySlug, 
  variant = 'default',
  className 
}: ArticleStyleBadgeProps) {
  const style = articleStyle || 'destination-guide';
  const config = styleConfig[style];
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", config.textClass, className)} title={`${config.label} layout`}>
        <Icon className="h-3 w-3" />
      </span>
    );
  }

  if (variant === 'overlay') {
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm", config.textClass, className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.bgClass, config.textClass, className)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
