import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ImageFieldWithAI } from '@/components/admin/ImageFieldWithAI';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, ChevronDown, RefreshCw, Feather, Check } from 'lucide-react';
import { useAIContent, ToneType, BlogContent, contentTemplates } from '@/hooks/useAIContent';
import { cn } from '@/lib/utils';

import { articleStyleOptions, ArticleStyle } from '@/types/article-styles';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  featured_image_url: z.string().url().optional().or(z.literal('')),
  category_id: z.string().optional(),
  author_id: z.string().optional(),
  article_style: z.string().optional(),
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

  // AI assist state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTone, setAiTone] = useState<ToneType>('luxury');
  const [aiTemplate, setAiTemplate] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const { generateContent, humanizeContent, isGenerating, isHumanizing, generatedContent, clearContent } = useAIContent();

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
      article_style: '',
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
        article_style: post.article_style || '',
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
        article_style: '',
        status: 'draft',
        is_featured: false,
        tags: '',
      });
    }
    clearContent();
  }, [post, form]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleAIGenerate = async () => {
    const title = form.getValues('title');
    if (!title) return;
    await generateContent({
      contentType: 'blog',
      targetName: title,
      existingData: {
        title,
        excerpt: form.getValues('excerpt'),
        tags: form.getValues('tags'),
      },
      tone: aiTone,
      template: aiTemplate || undefined,
      customInstructions: aiInstructions || undefined,
    });
  };

  const handleAIHumanize = async () => {
    if (!generatedContent) return;
    await humanizeContent({ contentType: 'blog', contentToHumanize: generatedContent });
  };

  const applyField = (field: 'title' | 'excerpt' | 'content' | 'tags') => {
    if (!generatedContent) return;
    const c = generatedContent as BlogContent;
    if (field === 'tags') {
      form.setValue('tags', c.tags.join(', '));
    } else {
      form.setValue(field, c[field]);
    }
    if (field === 'title' && !post) {
      form.setValue('slug', generateSlug(c.title));
    }
  };

  const applyAll = () => {
    if (!generatedContent) return;
    const c = generatedContent as BlogContent;
    form.setValue('title', c.title);
    if (!post) form.setValue('slug', generateSlug(c.title));
    form.setValue('excerpt', c.excerpt);
    form.setValue('content', c.content);
    form.setValue('tags', c.tags.join(', '));
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
      article_style: (values.article_style as ArticleStyle) || null,
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
              name="article_style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Article Style (Layout)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Auto (based on category)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {articleStyleOptions.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div className="flex flex-col">
                            <span>{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
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
                      generatePrompt={[
                        `Editorial featured image for a travel article titled "${form.watch('title') || 'travel blog post'}".`,
                        form.watch('excerpt') ? `Article summary: ${form.watch('excerpt')}.` : '',
                        'Magazine quality, evocative travel photography that draws readers in.',
                      ].filter(Boolean).join(' ')}
                      generateContext={{
                        name: form.watch('title') || undefined,
                        category: categories.find(c => c.id === form.watch('category_id'))?.name,
                        description: form.watch('excerpt') || undefined,
                      }}
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

            {/* AI Content Assistant */}
            <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-full justify-between border-primary/30 text-primary hover:bg-primary/5">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Content Assistant
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", aiOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3 border border-primary/20 rounded-lg p-4 mt-2 bg-primary/[0.02]">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <Select value={aiTone} onValueChange={(v) => setAiTone(v as ToneType)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="warm">Warm & Inviting</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Structure Template (optional)</label>
                  <Select value={aiTemplate} onValueChange={setAiTemplate}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="No template — freeform" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTemplates
                        .filter(t => t.contentTypes.includes('blog'))
                        .map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Instructions (optional)</label>
                  <Textarea
                    placeholder="e.g. Focus on wellness aspects, mention private pool..."
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={!form.watch('title') || isGenerating}
                  size="sm"
                  className="w-full"
                >
                  {isGenerating ? (
                    <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Content</>
                  )}
                </Button>

                {!form.watch('title') && (
                  <p className="text-xs text-muted-foreground">Enter a title above first to generate content.</p>
                )}

                {generatedContent && (
                  <div className="space-y-3 pt-2 border-t border-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">Generated Preview</span>
                      <div className="flex gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={handleAIHumanize} disabled={isHumanizing} className="h-7 text-xs">
                          <Feather className={cn("h-3 w-3 mr-1", isHumanizing && "animate-pulse")} />
                          {isHumanizing ? 'Humanizing...' : 'Humanize'}
                        </Button>
                        <Button type="button" size="sm" onClick={applyAll} className="h-7 text-xs">
                          <Check className="h-3 w-3 mr-1" /> Apply All
                        </Button>
                      </div>
                    </div>

                    {(['title', 'excerpt', 'content', 'tags'] as const).map((field) => {
                      const c = generatedContent as BlogContent;
                      const val = field === 'tags' ? c.tags.join(', ') : c[field];
                      return (
                        <div key={field} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium capitalize text-muted-foreground">{field}</label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => applyField(field)} className="h-6 text-xs px-2">
                              Apply
                            </Button>
                          </div>
                          <div className="bg-muted/50 rounded p-2 text-xs max-h-24 overflow-y-auto whitespace-pre-wrap">
                            {field === 'tags' ? (
                              <div className="flex flex-wrap gap-1">
                                {c.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>)}
                              </div>
                            ) : (
                              <span>{val.length > 300 ? val.slice(0, 300) + '…' : val}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

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
