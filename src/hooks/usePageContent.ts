import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageContentRow {
  id: string;
  page_slug: string;
  section_key: string;
  content_key: string;
  content_type: string;
  value: string;
  updated_at: string;
}

/**
 * Fetch all content for a given page slug.
 * Returns a nested map: { [sectionKey]: { [contentKey]: value } }
 */
export function usePageContent<T extends Record<string, string>>(
  pageSlug: string,
  sectionKey: string,
  defaults: T
): T & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['page-content', pageSlug, sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('content_key, value')
        .eq('page_slug', pageSlug)
        .eq('section_key', sectionKey);

      if (error) throw error;
      return data as { content_key: string; value: string }[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const merged = { ...defaults } as T;
  if (data) {
    for (const row of data) {
      if (row.content_key in defaults) {
        (merged as Record<string, string>)[row.content_key] = row.value;
      }
    }
  }

  return { ...merged, isLoading };
}

/**
 * Fetch ALL content rows for a page (used by admin editor).
 */
export function useAllPageContent(pageSlug: string) {
  return useQuery({
    queryKey: ['page-content', pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_slug', pageSlug)
        .order('section_key')
        .order('content_key');

      if (error) throw error;
      return data as PageContentRow[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Upsert a page content value.
 */
export function useUpsertPageContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      page_slug: string;
      section_key: string;
      content_key: string;
      content_type?: string;
      value: string;
    }) => {
      const { data, error } = await supabase
        .from('page_content')
        .upsert(
          {
            page_slug: params.page_slug,
            section_key: params.section_key,
            content_key: params.content_key,
            content_type: params.content_type || 'text',
            value: params.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'page_slug,section_key,content_key' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['page-content', vars.page_slug] });
      queryClient.invalidateQueries({ queryKey: ['page-content', vars.page_slug, vars.section_key] });
    },
  });
}

/**
 * Bulk upsert multiple content values for a page/section.
 */
export function useBulkUpsertPageContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      page_slug: string;
      section_key: string;
      entries: { content_key: string; value: string; content_type?: string }[];
    }) => {
      const rows = params.entries.map((e) => ({
        page_slug: params.page_slug,
        section_key: params.section_key,
        content_key: e.content_key,
        content_type: e.content_type || 'text',
        value: e.value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('page_content')
        .upsert(rows, { onConflict: 'page_slug,section_key,content_key' });

      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['page-content', vars.page_slug] });
      queryClient.invalidateQueries({ queryKey: ['page-content', vars.page_slug, vars.section_key] });
    },
  });
}

// ===== Content Schema: defines every editable field per page/section =====

export interface ContentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'icon';
  defaultValue: string;
}

export interface ContentSection {
  sectionKey: string;
  title: string;
  fields: ContentField[];
}

export interface PageContentSchema {
  pageSlug: string;
  pageTitle: string;
  sections: ContentSection[];
}

export const PAGE_CONTENT_SCHEMAS: PageContentSchema[] = [
  {
    pageSlug: 'home',
    pageTitle: 'Homepage',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'Luxury Vacation Homes | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: 'Discover and book extraordinary luxury vacation homes around the world. Best rates guaranteed when you book direct.' },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' },
        ],
      },
      {
        sectionKey: 'hero',
        title: 'Hero Section',
        fields: [
          { key: 'heading_prefix', label: 'Heading Prefix', type: 'text', defaultValue: 'Experience' },
          { key: 'subtitle_with_property', label: 'Subtitle (when property)', type: 'text', defaultValue: 'Book a luxury villa in {city}, {country}' },
          { key: 'subtitle_default', label: 'Subtitle (default)', type: 'text', defaultValue: 'Discover extraordinary vacation homes around the world' },
        ],
      },
      {
        sectionKey: 'trust_badges',
        title: 'Trust Badges',
        fields: [
          { key: 'badge_1_icon', label: 'Badge 1 Icon', type: 'icon', defaultValue: 'Star' },
          { key: 'badge_1_title', label: 'Badge 1 Title', type: 'text', defaultValue: 'Handpicked Excellence' },
          { key: 'badge_1_description', label: 'Badge 1 Description', type: 'text', defaultValue: 'Every property personally vetted for quality' },
          { key: 'badge_2_icon', label: 'Badge 2 Icon', type: 'icon', defaultValue: 'Eye' },
          { key: 'badge_2_title', label: 'Badge 2 Title', type: 'text', defaultValue: 'Unmatched Views' },
          { key: 'badge_2_description', label: 'Badge 2 Description', type: 'text', defaultValue: 'Stunning locations in prime destinations' },
          { key: 'badge_3_icon', label: 'Badge 3 Icon', type: 'icon', defaultValue: 'Headphones' },
          { key: 'badge_3_title', label: 'Badge 3 Title', type: 'text', defaultValue: 'Concierge Service' },
          { key: 'badge_3_description', label: 'Badge 3 Description', type: 'text', defaultValue: 'Dedicated support from booking to checkout' },
        ],
      },
      {
        sectionKey: 'properties',
        title: 'Featured Properties',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Book Your Stay' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: 'Handpicked luxury homes ready for instant booking. Best rates guaranteed when you book direct.' },
        ],
      },
      {
        sectionKey: 'experiences',
        title: 'Featured Experiences',
        fields: [
          { key: 'label', label: 'Section Label', type: 'text', defaultValue: 'Curated' },
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Unforgettable Experiences' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: 'Elevate your stay with our hand-selected experiences, from culinary adventures to cultural immersions.' },
        ],
      },
      {
        sectionKey: 'why_book_direct',
        title: 'Why Book Direct',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Why Book Direct with {brandName}' },
          { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Get the best rates and exclusive benefits when you book directly' },
          { key: 'feature_1_icon', label: 'Feature 1 Icon', type: 'icon', defaultValue: 'Shield' },
          { key: 'feature_1_title', label: 'Feature 1 Title', type: 'text', defaultValue: 'Best Price Guarantee' },
          { key: 'feature_1_description', label: 'Feature 1 Description', type: 'text', defaultValue: "Our direct rates are always the lowest. Find it cheaper elsewhere? We'll match it." },
          { key: 'feature_2_icon', label: 'Feature 2 Icon', type: 'icon', defaultValue: 'Clock' },
          { key: 'feature_2_title', label: 'Feature 2 Title', type: 'text', defaultValue: 'Free Cancellation' },
          { key: 'feature_2_description', label: 'Feature 2 Description', type: 'text', defaultValue: 'Flexible booking with free cancellation up to 48 hours before check-in.' },
          { key: 'feature_3_icon', label: 'Feature 3 Icon', type: 'icon', defaultValue: 'CheckCircle' },
          { key: 'feature_3_title', label: 'Feature 3 Title', type: 'text', defaultValue: 'Instant Confirmation' },
          { key: 'feature_3_description', label: 'Feature 3 Description', type: 'text', defaultValue: 'Book and receive your confirmation immediately. No waiting.' },
          { key: 'feature_4_icon', label: 'Feature 4 Icon', type: 'icon', defaultValue: 'Calendar' },
          { key: 'feature_4_title', label: 'Feature 4 Title', type: 'text', defaultValue: '24/7 Support' },
          { key: 'feature_4_description', label: 'Feature 4 Description', type: 'text', defaultValue: 'Our concierge team is available around the clock for your needs.' },
        ],
      },
      {
        sectionKey: 'blog',
        title: 'Blog Section',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Stories & Inspiration' },
          { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Travel insights, destination guides, and luxury living inspiration.' },
        ],
      },
      {
        sectionKey: 'cta',
        title: 'CTA Section',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Ready to Book Your Escape?' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: 'Start exploring our collection of extraordinary vacation homes. Best rates guaranteed when you book direct.' },
        ],
      },
    ],
  },
  {
    pageSlug: 'about',
    pageTitle: 'About',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'About Us | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: "Learn about Haven Hub's story, values, and commitment to extraordinary luxury vacation experiences." },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' },
        ],
      },
      {
        sectionKey: 'hero',
        title: 'Hero Section',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'About {brandName}' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: "Crafting extraordinary vacation experiences in the world's most beautiful destinations." },
          { key: 'hero_image', label: 'Hero Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80' },
        ],
      },
      {
        sectionKey: 'our_story',
        title: 'Our Story',
        fields: [
          { key: 'heading', label: 'Section Heading', type: 'text', defaultValue: 'Our Story' },
          { key: 'paragraph_1', label: 'Paragraph 1', type: 'textarea', defaultValue: '{brandName} was born from a simple belief: that the right vacation home can transform an ordinary trip into an extraordinary memory. What began as a passion project curating exceptional properties has grown into a trusted name in luxury villa rentals.' },
          { key: 'paragraph_2', label: 'Paragraph 2', type: 'textarea', defaultValue: 'Our founders, avid travelers themselves, noticed a gap in the market—stunning properties often came with impersonal service, while personalized attention was reserved for only the most exclusive bookings. We set out to change that.' },
          { key: 'paragraph_3', label: 'Paragraph 3', type: 'textarea', defaultValue: "Today, we offer a carefully curated collection of villas across the world's most desirable destinations. Each property is personally inspected, each host relationship nurtured, and each guest treated as if they're our only one." },
        ],
      },
      {
        sectionKey: 'values',
        title: 'Our Values',
        fields: [
          { key: 'heading', label: 'Section Heading', type: 'text', defaultValue: 'Our Values' },
          { key: 'subtitle', label: 'Section Subtitle', type: 'text', defaultValue: 'The principles that guide everything we do' },
          { key: 'value_1_icon', label: 'Value 1 Icon', type: 'icon', defaultValue: 'Heart' },
          { key: 'value_1_title', label: 'Value 1 Title', type: 'text', defaultValue: 'Passion for Excellence' },
          { key: 'value_1_description', label: 'Value 1 Description', type: 'text', defaultValue: 'Every property in our collection is chosen with care, ensuring exceptional quality and unforgettable experiences.' },
          { key: 'value_2_icon', label: 'Value 2 Icon', type: 'icon', defaultValue: 'Shield' },
          { key: 'value_2_title', label: 'Value 2 Title', type: 'text', defaultValue: 'Trust & Transparency' },
          { key: 'value_2_description', label: 'Value 2 Description', type: 'text', defaultValue: 'We believe in honest communication and straightforward booking, with no hidden fees or surprises.' },
          { key: 'value_3_icon', label: 'Value 3 Icon', type: 'icon', defaultValue: 'Sparkles' },
          { key: 'value_3_title', label: 'Value 3 Title', type: 'text', defaultValue: 'Curated Luxury' },
          { key: 'value_3_description', label: 'Value 3 Description', type: 'text', defaultValue: 'Our team personally vets each villa to guarantee it meets our exacting standards for comfort and style.' },
          { key: 'value_4_icon', label: 'Value 4 Icon', type: 'icon', defaultValue: 'Users' },
          { key: 'value_4_title', label: 'Value 4 Title', type: 'text', defaultValue: 'Personal Service' },
          { key: 'value_4_description', label: 'Value 4 Description', type: 'text', defaultValue: 'From your first inquiry to checkout, our dedicated concierge team is here to make your stay seamless.' },
        ],
      },
      {
        sectionKey: 'stats',
        title: 'Statistics',
        fields: [
          { key: 'stat_1_value', label: 'Stat 1 Value', type: 'text', defaultValue: '10+' },
          { key: 'stat_1_label', label: 'Stat 1 Label', type: 'text', defaultValue: 'Years of Excellence' },
          { key: 'stat_2_value', label: 'Stat 2 Value', type: 'text', defaultValue: '25+' },
          { key: 'stat_2_label', label: 'Stat 2 Label', type: 'text', defaultValue: 'Luxury Properties' },
          { key: 'stat_3_value', label: 'Stat 3 Value', type: 'text', defaultValue: '5000+' },
          { key: 'stat_3_label', label: 'Stat 3 Label', type: 'text', defaultValue: 'Happy Guests' },
          { key: 'stat_4_value', label: 'Stat 4 Value', type: 'text', defaultValue: '15+' },
          { key: 'stat_4_label', label: 'Stat 4 Label', type: 'text', defaultValue: 'Destinations' },
        ],
      },
      {
        sectionKey: 'cta',
        title: 'CTA Section',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Ready to Book Your Escape?' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: 'Browse our collection of handpicked luxury villas and secure the best rates.' },
        ],
      },
    ],
  },
  {
    pageSlug: 'properties',
    pageTitle: 'Properties',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'Luxury Properties | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: 'Browse our curated collection of luxury vacation homes. Best rates guaranteed with instant booking available.' },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' },
        ],
      },
      {
        sectionKey: 'header',
        title: 'Page Header',
        fields: [
          { key: 'heading', label: 'Default Heading', type: 'text', defaultValue: 'Find & Book Your Perfect Stay' },
          { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Best rates guaranteed when you book direct. Instant confirmation available.' },
        ],
      },
    ],
  },
  {
    pageSlug: 'destinations',
    pageTitle: 'Destinations',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'Destinations | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: 'Explore extraordinary luxury destinations around the world. Find your perfect getaway.' },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80' },
        ],
      },
      {
        sectionKey: 'hero',
        title: 'Hero Section',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Choose Your Destination' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: 'Discover extraordinary locations around the world and book your perfect luxury stay.' },
          { key: 'hero_image', label: 'Hero Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920&q=80' },
        ],
      },
      {
        sectionKey: 'cta',
        title: 'Booking CTA',
        fields: [
          { key: 'heading', label: 'CTA Heading', type: 'text', defaultValue: 'Ready to Book Your Stay?' },
          { key: 'subtitle', label: 'CTA Subtitle', type: 'text', defaultValue: 'Pick a destination above, or browse all our properties with best price guarantee.' },
        ],
      },
    ],
  },
  {
    pageSlug: 'experiences',
    pageTitle: 'Experiences',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'Curated Experiences | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: 'Enhance your luxury stay with curated experiences — culinary adventures, cultural immersions, and more.' },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' },
        ],
      },
      {
        sectionKey: 'hero',
        title: 'Hero Section',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Enhance Your Stay' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: 'Add unforgettable experiences to your booking. Curated adventures available exclusively for our guests.' },
        ],
      },
      {
        sectionKey: 'cta',
        title: 'CTA Section',
        fields: [
          { key: 'heading', label: 'CTA Heading', type: 'text', defaultValue: 'Complete Your Trip' },
          { key: 'subtitle', label: 'CTA Subtitle', type: 'textarea', defaultValue: 'These experiences are available exclusively for guests staying at our properties. Book your luxury accommodation first, then add experiences to your stay.' },
        ],
      },
    ],
  },
  {
    pageSlug: 'contact',
    pageTitle: 'Contact',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'Contact Us | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: 'Get in touch with Haven Hub. We are here to help you plan your perfect luxury vacation.' },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80' },
        ],
      },
      {
        sectionKey: 'hero',
        title: 'Hero Section',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Get in Touch' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', defaultValue: "Have a question or ready to plan your next luxury escape? We'd love to hear from you." },
          { key: 'hero_image', label: 'Hero Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920&q=80' },
        ],
      },
      {
        sectionKey: 'form',
        title: 'Form Section',
        fields: [
          { key: 'form_heading', label: 'Form Heading', type: 'text', defaultValue: 'Send Us a Message' },
          { key: 'info_heading', label: 'Info Heading', type: 'text', defaultValue: 'Contact Information' },
        ],
      },
      {
        sectionKey: 'assistance',
        title: 'Assistance Card',
        fields: [
          { key: 'heading', label: 'Card Heading', type: 'text', defaultValue: 'Need Immediate Assistance?' },
          { key: 'description', label: 'Card Description', type: 'textarea', defaultValue: "For urgent booking inquiries or assistance during your stay, our concierge team is available around the clock. Simply call our priority line and we'll be happy to help." },
        ],
      },
      {
        sectionKey: 'map',
        title: 'Map Section',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Visit Our Office' },
          { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'While our properties span the globe, our headquarters is where the magic begins.' },
        ],
      },
    ],
  },
  {
    pageSlug: 'footer',
    pageTitle: 'Footer',
    sections: [
      {
        sectionKey: 'cta',
        title: 'Booking CTA',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Ready to Book Your Dream Escape?' },
          { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Browse our curated collection of luxury properties' },
        ],
      },
      {
        sectionKey: 'newsletter',
        title: 'Newsletter',
        fields: [
          { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Exclusive Offers' },
          { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Get early access to deals & new properties.' },
        ],
      },
    ],
  },
  {
    pageSlug: 'privacy',
    pageTitle: 'Privacy Policy',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'Privacy Policy | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: 'Read our privacy policy to understand how Haven Hub collects, uses, and protects your personal data.' },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' },
        ],
      },
    ],
  },
  {
    pageSlug: 'terms',
    pageTitle: 'Terms of Service',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'Terms of Service | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: 'Review the terms and conditions for using Haven Hub services and booking luxury vacation properties.' },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' },
        ],
      },
    ],
  },
  {
    pageSlug: 'blog',
    pageTitle: 'Blog',
    sections: [
      {
        sectionKey: 'seo',
        title: 'SEO Metadata',
        fields: [
          { key: 'meta_title', label: 'Meta Title', type: 'text', defaultValue: 'Travel Stories & Inspiration | Haven Hub' },
          { key: 'meta_description', label: 'Meta Description', type: 'textarea', defaultValue: 'Discover travel insights, destination guides, and luxury living inspiration on the Haven Hub blog.' },
          { key: 'og_image', label: 'OG Image URL', type: 'image', defaultValue: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80' },
        ],
      },
    ],
  },
];
