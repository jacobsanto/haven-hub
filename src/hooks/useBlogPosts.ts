import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost, BlogStatus } from '@/types/blog';
import { useToast } from '@/hooks/use-toast';

export function useBlogPosts(options?: { status?: BlogStatus; categorySlug?: string }) {
  return useQuery({
    queryKey: ['blog-posts', options],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*),
          author:blog_authors_public(*)
        `)
        .order('published_at', { ascending: false, nullsFirst: false });
      
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter by category slug if provided and map inline_images
      let posts = (data || []).map(p => ({
        ...p,
        inline_images: Array.isArray(p.inline_images) ? p.inline_images : [],
      })) as unknown as BlogPost[];
      if (options?.categorySlug) {
        posts = posts.filter(p => p.category?.slug === options.categorySlug);
      }
      
      return posts;
    },
  });
}

const POSTS_PER_PAGE = 9;

export function usePaginatedBlogPosts(options?: { 
  status?: BlogStatus; 
  categorySlug?: string;
  page?: number;
}) {
  const page = options?.page || 1;
  const from = (page - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  return useQuery({
    queryKey: ['blog-posts-paginated', options],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*),
          author:blog_authors_public(*)
        `, { count: 'exact' })
        .order('published_at', { ascending: false, nullsFirst: false });
      
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.categorySlug) {
        // Get category ID first
        const { data: category } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', options.categorySlug)
          .maybeSingle();
        
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }
      
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      const posts = (data || []).map(p => ({
        ...p,
        inline_images: Array.isArray(p.inline_images) ? p.inline_images : [],
      })) as unknown as BlogPost[];
      
      return {
        posts,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / POSTS_PER_PAGE),
        currentPage: page,
        hasNextPage: to < (count || 0) - 1,
        hasPrevPage: page > 1,
      };
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*),
          author:blog_authors_public(*)
        `)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        inline_images: Array.isArray(data.inline_images) ? data.inline_images : [],
      } as unknown as BlogPost;
    },
    enabled: !!slug,
  });
}

export function useFeaturedBlogPost() {
  return useQuery({
    queryKey: ['blog-post-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(*),
          author:blog_authors_public(*)
        `)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        inline_images: Array.isArray(data.inline_images) ? data.inline_images : [],
      } as unknown as BlogPost;
    },
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'category' | 'author'>) => {
      const { inline_images, ...rest } = post;
      const insertData = {
        ...rest,
        inline_images: (inline_images || []) as unknown,
      };
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'Blog post created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating blog post', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...post }: Partial<BlogPost> & { id: string }) => {
      // Remove category from update payload
      const { category, ...updateData } = post as any;
      
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      toast({ title: 'Blog post updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating blog post', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'Blog post deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting blog post', description: error.message, variant: 'destructive' });
    },
  });
}
