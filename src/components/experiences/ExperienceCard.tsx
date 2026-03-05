import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, DollarSign, MapPin } from 'lucide-react';
import { Experience } from '@/types/experiences';

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
        className="group block overflow-hidden rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
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
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
          )}
          
          {/* Category pill */}
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground">
            {experience.category}
          </span>
          
          {experience.is_featured && (
            <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-accent/90 backdrop-blur-sm text-xs font-medium text-accent-foreground">
              Featured
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-serif font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
            {experience.name}
          </h3>
          
          {experience.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
              {experience.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
            {experience.duration && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{experience.duration}</span>
              </div>
            )}
            
            {experience.price_from && (
              <div className="flex items-center gap-1 text-accent font-medium">
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
