import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIContentGenerator } from '@/components/admin/AIContentGenerator';
import { useDestinations } from '@/hooks/useDestinations';
import { useExperiences } from '@/hooks/useExperiences';
import { useAdminProperties } from '@/hooks/useProperties';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { ContentType, GeneratedContent, BlogContent, DestinationContent, ExperienceContent, PropertyContent } from '@/hooks/useAIContent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminAIContent() {
  const { data: destinations } = useDestinations();
  const { data: experiences } = useExperiences();
  const { data: properties } = useAdminProperties();
  const { data: posts } = useBlogPosts();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Transform data for the generator component
  const destinationItems = useMemo(() => 
    (destinations || []).map(d => ({
      id: d.id,
      name: d.name,
      existingData: {
        country: d.country,
        description: d.description,
        highlights: d.highlights,
      },
    })),
    [destinations]
  );

  const experienceItems = useMemo(() => 
    (experiences || []).map(e => ({
      id: e.id,
      name: e.name,
      existingData: {
        category: e.category,
        description: e.description,
        duration: e.duration,
        price_from: e.price_from,
      },
    })),
    [experiences]
  );

  const propertyItems = useMemo(() => 
    (properties || []).map(p => ({
      id: p.id,
      name: p.name,
      existingData: {
        city: p.city,
        country: p.country,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        description: p.description,
        amenities: p.amenities,
      },
    })),
    [properties]
  );

  const blogItems = useMemo(() => 
    (posts || []).map(p => ({
      id: p.id,
      name: p.title,
      existingData: {
        title: p.title,
        excerpt: p.excerpt,
        tags: p.tags,
      },
    })),
    [posts]
  );

  // Apply handlers for each content type
  const handleApplyDestination = async (itemId: string, content: GeneratedContent) => {
    const destContent = content as DestinationContent;
    const { error } = await supabase
      .from('destinations')
      .update({
        description: destContent.description,
        long_description: destContent.long_description,
        highlights: destContent.highlights,
        best_time_to_visit: destContent.best_time_to_visit,
        climate: destContent.climate,
      })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      toast({ title: 'Success', description: 'Destination content updated.' });
    }
  };

  const handleApplyExperience = async (itemId: string, content: GeneratedContent) => {
    const expContent = content as ExperienceContent;
    const { error } = await supabase
      .from('experiences')
      .update({
        description: expContent.description,
        long_description: expContent.long_description,
        includes: expContent.includes,
      })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      toast({ title: 'Success', description: 'Experience content updated.' });
    }
  };

  const handleApplyProperty = async (itemId: string, content: GeneratedContent) => {
    const propContent = content as PropertyContent;
    const { error } = await supabase
      .from('properties')
      .update({
        description: propContent.description,
        highlights: propContent.highlights,
        neighborhood_description: propContent.neighborhood_description,
      })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
      toast({ title: 'Success', description: 'Property content updated.' });
    }
  };

  const handleApplyBlog = async (itemId: string, content: GeneratedContent) => {
    const blogContent = content as BlogContent;
    const { error } = await supabase
      .from('blog_posts')
      .update({
        title: blogContent.title,
        excerpt: blogContent.excerpt,
        content: blogContent.content,
        tags: blogContent.tags,
      })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'Success', description: 'Blog post content updated.' });
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-serif font-semibold flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Content Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate and optimize content for your properties, destinations, experiences, and blog posts.
            </p>
          </div>

          <Tabs defaultValue="destinations" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="destinations">Destinations</TabsTrigger>
              <TabsTrigger value="experiences">Experiences</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="blog">Blog Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="destinations">
              <AIContentGenerator
                contentType="destination"
                items={destinationItems}
                onApplyContent={handleApplyDestination}
              />
            </TabsContent>

            <TabsContent value="experiences">
              <AIContentGenerator
                contentType="experience"
                items={experienceItems}
                onApplyContent={handleApplyExperience}
              />
            </TabsContent>

            <TabsContent value="properties">
              <AIContentGenerator
                contentType="property"
                items={propertyItems}
                onApplyContent={handleApplyProperty}
              />
            </TabsContent>

            <TabsContent value="blog">
              <AIContentGenerator
                contentType="blog"
                items={blogItems}
                onApplyContent={handleApplyBlog}
              />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
