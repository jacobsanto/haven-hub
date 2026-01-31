import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ContentType = 'blog' | 'destination' | 'experience' | 'property';
export type ToneType = 'luxury' | 'warm' | 'professional';
export type LengthType = 'short' | 'medium' | 'long';

export interface GenerateContentParams {
  contentType: ContentType;
  targetName: string;
  existingData?: Record<string, unknown>;
  customInstructions?: string;
  tone?: ToneType;
  length?: LengthType;
  template?: string;
}

export interface BlogContent {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export interface DestinationContent {
  description: string;
  long_description: string;
  highlights: string[];
  best_time_to_visit: string;
  climate: string;
}

export interface ExperienceContent {
  description: string;
  long_description: string;
  includes: string[];
}

export interface PropertyContent {
  description: string;
  highlights: string[];
  neighborhood_description: string;
}

export type GeneratedContent = BlogContent | DestinationContent | ExperienceContent | PropertyContent;

export interface GenerateResult {
  success: boolean;
  content: GeneratedContent;
  contentType: ContentType;
  targetName: string;
}

export const contentTemplates = [
  { value: 'destination_guide', label: 'Destination Guide', contentTypes: ['blog'] },
  { value: 'experience_spotlight', label: 'Experience Spotlight', contentTypes: ['blog', 'experience'] },
  { value: 'property_showcase', label: 'Property Showcase', contentTypes: ['blog', 'property'] },
  { value: 'seasonal_promotion', label: 'Seasonal Promotion', contentTypes: ['blog'] },
] as const;

export function useAIContent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateContent = async (params: GenerateContentParams): Promise<GeneratedContent | null> => {
    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-content', {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate content');
      }

      const content = data.content as GeneratedContent;
      setGeneratedContent(content);
      
      toast({
        title: 'Content Generated',
        description: `AI content for "${params.targetName}" has been generated successfully.`,
      });

      return content;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate content';
      setError(message);
      
      toast({
        title: 'Generation Failed',
        description: message,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearContent = () => {
    setGeneratedContent(null);
    setError(null);
  };

  return {
    generateContent,
    isGenerating,
    generatedContent,
    error,
    clearContent,
  };
}
