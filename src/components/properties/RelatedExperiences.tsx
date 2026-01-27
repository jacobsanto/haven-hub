import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ExperienceCard } from '@/components/experiences/ExperienceCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RelatedExperiencesProps {
  destinationId?: string | null;
  className?: string;
  title?: string;
  limit?: number;
}

export function RelatedExperiences({
  destinationId,
  className,
  title = 'Enhance Your Stay',
  limit = 3,
}: RelatedExperiencesProps) {
  const { data: experiences, isLoading } = useQuery({
    queryKey: ['related-experiences', destinationId],
    queryFn: async () => {
      let query = supabase
        .from('experiences')
        .select(`
          *,
          destination:destinations(name, slug)
        `)
        .eq('status', 'active')
        .limit(limit);

      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      } else {
        // If no destination, get featured experiences
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If not enough from destination, get featured
      if ((data?.length || 0) < limit && destinationId) {
        const { data: featuredData } = await supabase
          .from('experiences')
          .select(`
            *,
            destination:destinations(name, slug)
          `)
          .eq('status', 'active')
          .eq('is_featured', true)
          .neq('destination_id', destinationId)
          .limit(limit - (data?.length || 0));

        return [...(data || []), ...(featuredData || [])];
      }

      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-serif font-medium">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="card-organic animate-pulse">
              <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!experiences || experiences.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-6', className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-serif font-medium">{title}</h2>
        </div>
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/experiences">
            View All Experiences
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiences.map((experience, index) => (
          <ExperienceCard key={experience.id} experience={experience} index={index} />
        ))}
      </div>
    </motion.div>
  );
}
