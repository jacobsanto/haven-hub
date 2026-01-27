import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BlogCategory } from '@/types/blog';
import { useCreateBlogCategory, useUpdateBlogCategory } from '@/hooks/useBlogCategories';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BlogCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: BlogCategory | null;
}

export function BlogCategoryFormDialog({ open, onOpenChange, category }: BlogCategoryFormDialogProps) {
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
      });
    }
  }, [category, form]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = (values: FormValues) => {
    const categoryData = {
      name: values.name,
      slug: values.slug,
      description: values.description || null,
    };

    if (category) {
      updateCategory.mutate({ id: category.id, ...categoryData }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createCategory.mutate(categoryData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Category name"
                      onChange={(e) => {
                        field.onChange(e);
                        if (!category) {
                          form.setValue('slug', generateSlug(e.target.value));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="category-slug" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Brief description of this category" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createCategory.isPending || updateCategory.isPending}>
                {category ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
