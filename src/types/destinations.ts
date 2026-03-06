export type DestinationStatus = 'active' | 'draft';

export interface Destination {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string | null;
  long_description: string | null;
  hero_image_url: string | null;
  gallery: string[];
  highlights: string[];
  best_time_to_visit: string | null;
  climate: string | null;
  latitude: number | null;
  longitude: number | null;
  is_featured: boolean;
  featured_sort_order: number;
  status: DestinationStatus;
  created_at: string;
  updated_at: string;
}
