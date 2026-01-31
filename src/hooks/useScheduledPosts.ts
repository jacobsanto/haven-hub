import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PersonaType, MarketingAngleType, TravelStyleType, ToneType, LengthType } from '@/hooks/useAIContent';

export interface GenerationSettings {
  tone?: ToneType;
  length?: LengthType;
  template?: string;
  persona?: PersonaType;
  marketingAngle?: MarketingAngleType;
  travelStyle?: TravelStyleType;
  customInstructions?: string;
}

export interface ScheduledPost {
  id: string;
  topic: string;
  category_id: string | null;
  author_id: string | null;
  generation_settings: GenerationSettings;
  scheduled_for: string;
  status: 'pending' | 'generating' | 'review' | 'published' | 'failed';
  auto_publish: boolean;
  generated_post_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  // Joined data
  category?: { id: string; name: string; slug: string } | null;
  author?: { id: string; name: string; slug: string } | null;
}

export interface CreateScheduledPostInput {
  topic: string;
  category_id?: string | null;
  author_id?: string | null;
  generation_settings: GenerationSettings;
  scheduled_for: string;
  auto_publish?: boolean;
}

export function useScheduledPosts() {
  return useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug),
          author:blog_authors(id, name, slug)
        `)
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(post => ({
        ...post,
        generation_settings: (post.generation_settings || {}) as GenerationSettings,
      })) as ScheduledPost[];
    },
  });
}

export function useUpcomingScheduledPosts() {
  return useQuery({
    queryKey: ['scheduled-posts', 'upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug),
          author:blog_authors(id, name, slug)
        `)
        .in('status', ['pending', 'generating'])
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(post => ({
        ...post,
        generation_settings: (post.generation_settings || {}) as GenerationSettings,
      })) as ScheduledPost[];
    },
  });
}

export function useCreateScheduledPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateScheduledPostInput) => {
      const insertData = {
        topic: input.topic,
        category_id: input.category_id || null,
        author_id: input.author_id || null,
        generation_settings: input.generation_settings as unknown as Record<string, unknown>,
        scheduled_for: input.scheduled_for,
        auto_publish: input.auto_publish ?? false,
      };
      
      const { data, error } = await supabase
        .from('scheduled_blog_posts')
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast({ title: 'Post scheduled successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to schedule post', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateScheduledPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateScheduledPostInput> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.topic !== undefined) updateData.topic = input.topic;
      if (input.category_id !== undefined) updateData.category_id = input.category_id;
      if (input.author_id !== undefined) updateData.author_id = input.author_id;
      if (input.generation_settings !== undefined) updateData.generation_settings = input.generation_settings;
      if (input.scheduled_for !== undefined) updateData.scheduled_for = input.scheduled_for;
      if (input.auto_publish !== undefined) updateData.auto_publish = input.auto_publish;
      
      const { data, error } = await supabase
        .from('scheduled_blog_posts')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast({ title: 'Scheduled post updated' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update scheduled post', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteScheduledPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast({ title: 'Scheduled post deleted' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delete scheduled post', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

// Get calendar data combining scheduled and published posts
export function useContentCalendarData(year: number, month: number) {
  return useQuery({
    queryKey: ['content-calendar', year, month],
    queryFn: async () => {
      // Get start and end of month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      // Fetch scheduled posts
      const { data: scheduledPosts, error: scheduledError } = await supabase
        .from('scheduled_blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug),
          author:blog_authors(id, name, slug)
        `)
        .gte('scheduled_for', startDate.toISOString())
        .lte('scheduled_for', endDate.toISOString())
        .order('scheduled_for', { ascending: true });
      
      if (scheduledError) throw scheduledError;
      
      // Fetch published posts for this month
      const { data: publishedPosts, error: publishedError } = await supabase
        .from('blog_posts')
        .select(`
          id, title, slug, status, published_at, scheduled_publish_at,
          category:blog_categories(id, name, slug),
          author:blog_authors(id, name, slug)
        `)
        .or(`published_at.gte.${startDate.toISOString()},scheduled_publish_at.gte.${startDate.toISOString()}`)
        .or(`published_at.lte.${endDate.toISOString()},scheduled_publish_at.lte.${endDate.toISOString()}`)
        .order('published_at', { ascending: true });
      
      if (publishedError) throw publishedError;
      
      return {
        scheduledPosts: (scheduledPosts || []).map(post => ({
          ...post,
          generation_settings: (post.generation_settings || {}) as GenerationSettings,
        })) as ScheduledPost[],
        publishedPosts: publishedPosts || [],
      };
    },
  });
}
