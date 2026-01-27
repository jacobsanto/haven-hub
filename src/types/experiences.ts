export type ExperienceStatus = 'active' | 'draft';
export type EnquiryStatus = 'new' | 'contacted' | 'confirmed' | 'cancelled';

export interface Experience {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  hero_image_url: string | null;
  gallery: string[];
  duration: string | null;
  price_from: number | null;
  price_type: string | null;
  includes: string[];
  destination_id: string | null;
  category: string;
  is_featured: boolean;
  status: ExperienceStatus;
  created_at: string;
  updated_at: string;
}

export interface ExperienceEnquiry {
  id: string;
  experience_id: string;
  name: string;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  group_size: number | null;
  message: string | null;
  status: EnquiryStatus;
  created_at: string;
  experience?: Experience;
}
