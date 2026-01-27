import { motion } from 'framer-motion';
import { BlogCategory } from '@/types/blog';

interface CategoryFilterProps {
  categories: BlogCategory[];
  selectedCategory: string;
  onCategoryChange: (slug: string) => void;
  postCounts?: Record<string, number>;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  postCounts,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCategoryChange('all')}
        className={`
          relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
          ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }
        `}
      >
        All Posts
        {postCounts && (
          <span className="ml-1.5 opacity-70">
            ({Object.values(postCounts).reduce((a, b) => a + b, 0)})
          </span>
        )}
        {selectedCategory === 'all' && (
          <motion.div
            layoutId="category-indicator"
            className="absolute inset-0 bg-primary rounded-full -z-10"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
      
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.slug)}
          className={`
            relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${
              selectedCategory === category.slug
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }
          `}
        >
          {category.name}
          {postCounts && postCounts[category.slug] !== undefined && (
            <span className="ml-1.5 opacity-70">({postCounts[category.slug]})</span>
          )}
          {selectedCategory === category.slug && (
            <motion.div
              layoutId="category-indicator"
              className="absolute inset-0 bg-primary rounded-full -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
