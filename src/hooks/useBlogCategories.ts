import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogCategory } from '@/types/blog';
import { useToast } from '@/hooks/use-toast';

export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as BlogCategory[];
    },
  });
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Omit<BlogCategory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('blog_categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast({ title: 'Category created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBlogCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<BlogCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('blog_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast({ title: 'Category updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating category', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast({ title: 'Category deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting category', description: error.message, variant: 'destructive' });
    },
  });
}
