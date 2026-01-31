import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ContentType = 'blog' | 'destination' | 'experience' | 'property';
export type ToneType = 'luxury' | 'warm' | 'professional';
export type LengthType = 'short' | 'medium' | 'long';

// Targeting types
export type PersonaType = 
  | 'honeymoon_couples'
  | 'luxury_families'
  | 'solo_adventurers'
  | 'wellness_seekers'
  | 'celebration_groups'
  | 'business_travelers'
  | 'retirees';

export type MarketingAngleType = 
  | 'aspirational'
  | 'fomo_urgency'
  | 'value_proposition'
  | 'social_proof'
  | 'exclusivity'
  | 'transformation';

export type TravelStyleType = 
  | 'adventure_active'
  | 'wellness_spa'
  | 'cultural_immersion'
  | 'culinary_wine'
  | 'romance_celebration'
  | 'beach_relaxation';

// Disclosure types
export type DisclosureType = 'none' | 'subtle' | 'badge' | 'full';

export const disclosureOptions: { value: DisclosureType; label: string; preview: string }[] = [
  { value: 'none', label: 'None', preview: '' },
  { value: 'subtle', label: 'Subtle Footer', preview: '*Content created with AI assistance*' },
  { value: 'badge', label: 'Badge Prefix', preview: '[AI Assisted] ' },
  { value: 'full', label: 'Full Disclosure', preview: 'This content was generated with AI assistance and reviewed by our editorial team.' },
];

export const disclosureTexts: Record<DisclosureType, string> = {
  none: '',
  subtle: '\n\n*Content created with AI assistance*',
  badge: '[AI Assisted] ',
  full: '\n\n---\n*This content was generated with AI assistance and reviewed by our editorial team.*',
};

// Option arrays for UI consumption
export const personaOptions: { value: PersonaType; label: string; description: string }[] = [
  { value: 'honeymoon_couples', label: 'Honeymoon Couples', description: 'Romantic, intimate experiences' },
  { value: 'luxury_families', label: 'Luxury Families', description: 'Multi-generational, kid-friendly' },
  { value: 'solo_adventurers', label: 'Solo Adventurers', description: 'Independence, local immersion' },
  { value: 'wellness_seekers', label: 'Wellness Seekers', description: 'Relaxation, mindfulness' },
  { value: 'celebration_groups', label: 'Celebration Groups', description: 'Events, gatherings, milestones' },
  { value: 'business_travelers', label: 'Business Travelers', description: 'Connectivity, convenience' },
  { value: 'retirees', label: 'Retirees & Empty Nesters', description: 'Comfort, cultural depth' },
];

export const marketingAngleOptions: { value: MarketingAngleType; label: string; description: string }[] = [
  { value: 'aspirational', label: 'Aspirational/Dream', description: 'Paint the ultimate lifestyle' },
  { value: 'fomo_urgency', label: 'FOMO/Urgency', description: 'Limited availability, seasonal' },
  { value: 'value_proposition', label: 'Value Proposition', description: 'Justify the investment' },
  { value: 'social_proof', label: 'Social Proof', description: 'Acclaim, popularity, reviews' },
  { value: 'exclusivity', label: 'Exclusivity', description: 'Private access, VIP treatment' },
  { value: 'transformation', label: 'Transformation', description: 'Life-changing moments' },
];

export const travelStyleOptions: { value: TravelStyleType; label: string; description: string }[] = [
  { value: 'adventure_active', label: 'Adventure & Active', description: 'Outdoor activities, exploration' },
  { value: 'wellness_spa', label: 'Wellness & Spa', description: 'Relaxation, health, rejuvenation' },
  { value: 'cultural_immersion', label: 'Cultural Immersion', description: 'Local traditions, history' },
  { value: 'culinary_wine', label: 'Culinary & Wine', description: 'Food, dining, wine tours' },
  { value: 'romance_celebration', label: 'Romance & Celebration', description: 'Special occasions, intimate' },
  { value: 'beach_relaxation', label: 'Beach & Relaxation', description: 'Sun, sea, laid-back vibes' },
];

export interface GenerateContentParams {
  contentType: ContentType;
  targetName: string;
  existingData?: Record<string, unknown>;
  customInstructions?: string;
  tone?: ToneType;
  length?: LengthType;
  template?: string;
  persona?: PersonaType;
  marketingAngle?: MarketingAngleType;
  travelStyle?: TravelStyleType;
}

export interface HumanizeContentParams {
  contentType: ContentType;
  contentToHumanize: GeneratedContent;
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
  const [isHumanizing, setIsHumanizing] = useState(false);
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

  const humanizeContent = async (params: HumanizeContentParams): Promise<GeneratedContent | null> => {
    setIsHumanizing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-content', {
        body: {
          humanize: true,
          contentType: params.contentType,
          contentToHumanize: params.contentToHumanize,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to humanize content');
      }

      const content = data.content as GeneratedContent;
      setGeneratedContent(content);
      
      toast({
        title: 'Content Humanized',
        description: 'The content has been refined to sound more natural.',
      });

      return content;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to humanize content';
      setError(message);
      
      toast({
        title: 'Humanization Failed',
        description: message,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsHumanizing(false);
    }
  };

  const clearContent = () => {
    setGeneratedContent(null);
    setError(null);
  };

  return {
    generateContent,
    humanizeContent,
    isGenerating,
    isHumanizing,
    generatedContent,
    error,
    clearContent,
  };
}
