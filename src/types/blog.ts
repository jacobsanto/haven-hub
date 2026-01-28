export type BlogStatus = 'draft' | 'published' | 'archived';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  website_url: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InlineImage {
  url: string;
  alt: string;
  caption?: string;
  position: string; // e.g., 'after-heading-1', 'after-section-2'
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  category_id: string | null;
  author_id: string | null;
  tags: string[];
  is_featured: boolean;
  status: BlogStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  inline_images?: InlineImage[] | null;
  category?: BlogCategory;
  author?: BlogAuthor;
}
