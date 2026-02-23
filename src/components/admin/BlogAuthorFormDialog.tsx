import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BlogAuthor } from '@/types/blog';
import { useCreateBlogAuthor, useUpdateBlogAuthor } from '@/hooks/useBlogAuthors';
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
import { Switch } from '@/components/ui/switch';
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
  email: z.string().email().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  social_twitter: z.string().max(50).optional(),
  social_linkedin: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface BlogAuthorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  author: BlogAuthor | null;
}

export function BlogAuthorFormDialog({ open, onOpenChange, author }: BlogAuthorFormDialogProps) {
  const createAuthor = useCreateBlogAuthor();
  const updateAuthor = useUpdateBlogAuthor();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      avatar_url: '',
      bio: '',
      email: '',
      website_url: '',
      social_twitter: '',
      social_linkedin: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (author) {
      form.reset({
        name: author.name,
        slug: author.slug,
        avatar_url: author.avatar_url || '',
        bio: author.bio || '',
        email: author.email || '',
        website_url: author.website_url || '',
        social_twitter: author.social_twitter || '',
        social_linkedin: author.social_linkedin || '',
        is_active: author.is_active,
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        avatar_url: '',
        bio: '',
        email: '',
        website_url: '',
        social_twitter: '',
        social_linkedin: '',
        is_active: true,
      });
    }
  }, [author, form]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = (values: FormValues) => {
    const authorData = {
      name: values.name,
      slug: values.slug,
      avatar_url: values.avatar_url || null,
      bio: values.bio || null,
      email: values.email || null,
      website_url: values.website_url || null,
      social_twitter: values.social_twitter || null,
      social_linkedin: values.social_linkedin || null,
      is_active: values.is_active,
    };

    if (author) {
      updateAuthor.mutate({ id: author.id, ...authorData }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createAuthor.mutate(authorData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{author ? 'Edit Author' : 'Create Author'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Author name"
                      onChange={(e) => {
                        field.onChange(e);
                        if (!author) {
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
                    <Input {...field} placeholder="author-slug" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <ImageFieldWithAI
                      value={field.value || undefined}
                      onUpload={(url) => form.setValue('avatar_url', url)}
                      onRemove={() => form.setValue('avatar_url', '')}
                      storagePath="authors"
                      preset={{ maxWidth: 512, maxHeight: 512, quality: 0.85, format: 'webp' }}
                      label="Upload Avatar"
                      aspectClass="aspect-square max-w-[200px]"
                      compact
                      generatePrompt={`Professional portrait photograph of a travel writer named ${form.watch('name') || 'an author'}. Headshot style, warm lighting, editorial quality, friendly expression.`}
                      promptLabel="Generate avatar"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Short biography..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="author@example.com" type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://authorwebsite.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="social_twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter/X Handle</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://linkedin.com/in/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <FormLabel className="text-base">Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Active authors can be assigned to blog posts
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createAuthor.isPending || updateAuthor.isPending}>
                {author ? 'Update' : 'Create'} Author
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
