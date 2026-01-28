import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { BlogPost } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArticleStyleBadge } from './ArticleStyleBadge';

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
      className="relative group overflow-hidden"
    >
      <Link to={`/blog/${post.slug}`} className="block">
        {/* Full-width immersive hero */}
        <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
          {post.featured_image_url ? (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-muted-foreground text-lg">Featured Story</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
          
          {/* Content positioned at bottom */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 lg:p-16">
            <div className="container mx-auto">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  {post.category && (
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-0 backdrop-blur-sm"
                    >
                      {post.category.name}
                    </Badge>
                  )}
                  <ArticleStyleBadge 
                    categorySlug={post.category?.slug} 
                    variant="overlay"
                    className="text-white/90"
                  />
                </div>
                
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-white mb-4 leading-tight group-hover:text-white/90 transition-colors">
                  {post.title}
                </h2>
                
                {post.excerpt && (
                  <p className="text-white/80 text-base md:text-lg lg:text-xl mb-6 line-clamp-2 max-w-2xl leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  {post.author && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white/30">
                        <AvatarImage src={post.author.avatar_url || undefined} alt={post.author.name} />
                        <AvatarFallback className="text-xs bg-white/20 text-white">
                          {post.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{post.author.name}</span>
                    </div>
                  )}
                  <span className="flex items-center gap-2 text-white/70 text-sm">
                    <Calendar className="h-4 w-4" />
                    {format(publishedDate, 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-2 text-white/70 text-sm">
                    <Clock className="h-4 w-4" />
                    {readTime} min read
                  </span>
                </div>
                
                <Button 
                  variant="secondary" 
                  className="mt-6 gap-2 group-hover:gap-3 transition-all"
                >
                  Read Article <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
