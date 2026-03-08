import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Testimonial {
  id: string;
  platform: string;
  text: string;
  author: string;
  location: string;
  rating: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Fallback testimonials shown while the DB loads or if it is empty
export const fallbackTestimonials: Testimonial[] = [
  {
    id: '1',
    platform: 'booking',
    text: 'The villa was a dream — waking up to the caldera view, the private infinity pool catching the morning light. The team arranged a sunset sailing trip that became the highlight of our entire year.',
    author: 'Elena & Marco',
    location: 'Santorini, August 2025',
    rating: 5,
    display_order: 1,
    is_active: true,
    created_at: '',
  },
  {
    id: '2',
    platform: 'tripadvisor',
    text: 'From the moment we arrived, everything was perfect. The villa exceeded our expectations in every way. The concierge service was exceptional and truly made our stay unforgettable.',
    author: 'Sarah M.',
    location: 'Tuscany, June 2025',
    rating: 5,
    display_order: 2,
    is_active: true,
    created_at: '',
  },
  {
    id: '3',
    platform: 'booking',
    text: "A truly luxurious experience. The attention to detail, the private pool, the location — everything was world-class. We've already booked our return trip.",
    author: 'James K.',
    location: 'Bali, September 2025',
    rating: 5,
    display_order: 3,
    is_active: true,
    created_at: '',
  },
];

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
    staleTime: 1000 * 60 * 10, // Cache 10 minutes
  });
}
