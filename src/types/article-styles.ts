export type ArticleStyle = 
  | 'destination-guide' 
  | 'lifestyle' 
  | 'travel-tips'
  | 'classic-list-post'
  | 'beginners-guide'
  | 'things-to-do-after'
  | 'product-showdown'
  | 'detailed-case-study'
  | 'how-they-did-it'
  | 'myth-debunker';

export const articleStyleOptions: { value: ArticleStyle; label: string; description: string }[] = [
  { value: 'destination-guide', label: 'Destination Guide', description: 'Immersive parallax hero, sticky ToC, drop caps' },
  { value: 'lifestyle', label: 'Lifestyle', description: 'Editorial typography, magazine-style hero' },
  { value: 'travel-tips', label: 'Travel Tips', description: 'Compact hero, at-a-glance card, utility-focused' },
  { value: 'classic-list-post', label: 'Classic List Post', description: 'Numbered tips with benefit-driven subheadings' },
  { value: 'beginners-guide', label: "Beginner's Guide", description: 'Step-by-step with progress tracker sidebar' },
  { value: 'things-to-do-after', label: 'Things To Do After X', description: 'Actionable checklist with visual steps' },
  { value: 'product-showdown', label: 'Product Showdown', description: 'Side-by-side comparison with verdict cards' },
  { value: 'detailed-case-study', label: 'Detailed Case Study', description: 'Data-driven with results highlights and timeline' },
  { value: 'how-they-did-it', label: 'How They Did It', description: 'Strategy-focused with apply-it-yourself sections' },
  { value: 'myth-debunker', label: 'Myth Debunker', description: 'Myth vs reality cards with verdict badges' },
];

export function getArticleStyle(categorySlug?: string): ArticleStyle {
  switch (categorySlug?.toLowerCase()) {
    case 'lifestyle':
      return 'lifestyle';
    case 'travel-tips':
    case 'tips':
      return 'travel-tips';
    case 'destination-guides':
    case 'destinations':
    default:
      return 'destination-guide';
  }
}
