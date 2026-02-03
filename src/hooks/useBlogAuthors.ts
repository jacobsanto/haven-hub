import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogAuthor } from '@/types/blog';
import { useToast } from '@/hooks/use-toast';

export function useBlogAuthors() {
  return useQuery({
    queryKey: ['blog-authors'],
    queryFn: async () => {
      // Use blog_authors_public view to exclude sensitive data (email) for public access
      const { data, error } = await supabase
        .from('blog_authors_public')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as BlogAuthor[];
    },
  });
}

export function useBlogAuthor(id: string) {
  return useQuery({
    queryKey: ['blog-author', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_authors')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as BlogAuthor | null;
    },
    enabled: !!id,
  });
}

export function useCreateBlogAuthor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (author: Omit<BlogAuthor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('blog_authors')
        .insert(author)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-authors'] });
      toast({ title: 'Author created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating author', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBlogAuthor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...author }: Partial<BlogAuthor> & { id: string }) => {
      const { data, error } = await supabase
        .from('blog_authors')
        .update(author)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-authors'] });
      queryClient.invalidateQueries({ queryKey: ['blog-author'] });
      toast({ title: 'Author updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating author', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBlogAuthor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_authors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-authors'] });
      toast({ title: 'Author deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting author', description: error.message, variant: 'destructive' });
    },
  });
}
