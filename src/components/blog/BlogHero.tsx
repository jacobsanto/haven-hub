import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { BlogPost } from '@/types/blog';
import { Badge } from '@/components/ui/badge';

interface BlogHeroProps {
  post: BlogPost;
}

function estimateReadTime(content: string | null): number {
  if (!content) return 1;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function BlogHero({ post }: BlogHeroProps) {
  const readTime = estimateReadTime(post.content);
  const publishedDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative group overflow-hidden rounded-3xl bg-card"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden">
          {post.featured_image_url ? (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-muted-foreground">Featured Story</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
            <div className="max-w-3xl">
              {post.category && (
                <Badge 
                  variant="secondary" 
                  className="mb-4 bg-white/20 text-white border-0 backdrop-blur-sm"
                >
                  {post.category.name}
                </Badge>
              )}
              
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-white mb-4 group-hover:text-primary-foreground/90 transition-colors">
                {post.title}
              </h2>
              
              {post.excerpt && (
                <p className="text-white/80 text-sm md:text-base lg:text-lg mb-6 line-clamp-2 max-w-2xl">
                  {post.excerpt}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <span className="flex items-center gap-2 text-white/70 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(publishedDate, 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-2 text-white/70 text-sm">
                  <Clock className="h-4 w-4" />
                  {readTime} min read
                </span>
                <span className="inline-flex items-center gap-2 text-white font-medium group-hover:gap-3 transition-all ml-auto">
                  Read Story <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
