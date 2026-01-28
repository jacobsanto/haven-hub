export type ArticleStyle = 'destination-guide' | 'lifestyle' | 'travel-tips';

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
