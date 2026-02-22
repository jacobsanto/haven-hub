import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, DollarSign } from 'lucide-react';
import { Experience } from '@/types/experiences';
import { Badge } from '@/components/ui/badge';

interface ExperienceCardProps {
  experience: Experience;
  index?: number;
}

export function ExperienceCard({ experience, index = 0 }: ExperienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link 
        to={`/experiences/${experience.slug}`}
        className="group block card-organic overflow-hidden"
      >
        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {experience.hero_image_url ? (
            <img
              src={experience.hero_image_url}
              alt={experience.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
          )}
          
          {/* Category badge */}
          <Badge className="absolute top-4 left-4">
            {experience.category}
          </Badge>
          
          {/* Featured badge */}
          {experience.is_featured && (
            <Badge variant="secondary" className="absolute top-4 right-4">
              Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-serif font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
            {experience.name}
          </h3>
          
          {experience.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
              {experience.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            {experience.duration && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{experience.duration}</span>
              </div>
            )}
            
            {experience.price_from && (
              <div className="flex items-center gap-1 text-primary font-medium">
                <DollarSign className="h-4 w-4" />
                <span>From €{experience.price_from}</span>
                {experience.price_type && (
                  <span className="text-muted-foreground font-normal text-xs">
                    /{experience.price_type}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
