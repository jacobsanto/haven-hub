import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BlogPost, BlogCategory, BlogStatus, BlogAuthor } from '@/types/blog';
import { useCreateBlogPost, useUpdateBlogPost } from '@/hooks/useBlogPosts';
import { useBlogAuthors } from '@/hooks/useBlogAuthors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  featured_image_url: z.string().url().optional().or(z.literal('')),
  category_id: z.string().optional(),
  author_id: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  is_featured: z.boolean(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BlogPostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
  categories: BlogCategory[];
}

export function BlogPostFormDialog({ open, onOpenChange, post, categories }: BlogPostFormDialogProps) {
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const { data: authors } = useBlogAuthors();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      category_id: '',
      author_id: '',
      status: 'draft',
      is_featured: false,
      tags: '',
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content || '',
        featured_image_url: post.featured_image_url || '',
        category_id: post.category_id || '',
        author_id: post.author_id || '',
        status: post.status,
        is_featured: post.is_featured,
        tags: post.tags?.join(', ') || '',
      });
    } else {
      form.reset({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image_url: '',
        category_id: '',
        author_id: '',
        status: 'draft',
        is_featured: false,
        tags: '',
      });
    }
  }, [post, form]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = (values: FormValues) => {
    const tagsArray = values.tags
      ? values.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const postData = {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt || null,
      content: values.content || null,
      featured_image_url: values.featured_image_url || null,
      category_id: values.category_id || null,
      author_id: values.author_id || null,
      status: values.status as BlogStatus,
      is_featured: values.is_featured,
      tags: tagsArray,
      published_at: values.status === 'published' && !post?.published_at 
        ? new Date().toISOString() 
        : post?.published_at || null,
    };

    if (post) {
      updatePost.mutate({ id: post.id, ...postData }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createPost.mutate(postData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Blog Post' : 'Create Blog Post'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter post title"
                      onChange={(e) => {
                        field.onChange(e);
                        if (!post) {
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
                    <Input {...field} placeholder="post-url-slug" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="author_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select author" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {authors?.filter(a => a.is_active).map((author) => (
                        <SelectItem key={author.id} value={author.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={author.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {author.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Image</FormLabel>
                  <FormControl>
                    <ImageFieldWithAI
                      value={field.value || undefined}
                      onUpload={(url) => form.setValue('featured_image_url', url)}
                      onRemove={() => form.setValue('featured_image_url', '')}
                      storagePath="blog"
                      label="Upload Featured Image"
                      generatePrompt={`Beautiful editorial blog featured image for article titled "${form.watch('title') || 'travel blog post'}". Ultra high resolution, magazine quality, travel photography.`}
                      promptLabel="Generate featured image"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Brief summary of the post" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Full post content..." rows={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="travel, luxury, tips (comma separated)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <FormLabel className="text-base">Featured Post</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Display this post prominently on the blog page
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
              <Button type="submit" className="flex-1" disabled={createPost.isPending || updatePost.isPending}>
                {post ? 'Update' : 'Create'} Post
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
