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
  'travel-tips': { icon: Lightbulb, label: 'Tips', bgClass: 'bg-accent/10', textClass: 'text-accent' },
  'classic-list-post': { icon: List, label: 'List', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  'beginners-guide': { icon: BookOpen, label: 'Guide', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  'things-to-do-after': { icon: CheckSquare, label: 'Checklist', bgClass: 'bg-accent/10', textClass: 'text-accent' },
  'product-showdown': { icon: GitCompare, label: 'Comparison', bgClass: 'bg-accent/10', textClass: 'text-accent' },
  'detailed-case-study': { icon: BarChart3, label: 'Case Study', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  'how-they-did-it': { icon: Users, label: 'Story', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  'myth-debunker': { icon: ShieldQuestion, label: 'Myths', bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
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
