import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUploadWithOptimizer, } from '@/components/admin/ImageUploadWithOptimizer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OptimizeOptions } from '@/utils/image-optimizer';

interface ImageFieldWithAIProps {
  value?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  bucket?: string;
  storagePath?: string;
  preset?: OptimizeOptions;
  label?: string;
  aspectClass?: string;
  compact?: boolean;
  /** Prompt sent to the AI image generator */
  generatePrompt: string;
  /** Structured context passed to backend for prompt enrichment */
  generateContext?: Record<string, string | undefined>;
  /** Short label describing what will be generated */
  promptLabel?: string;
}

export function ImageFieldWithAI({
  value,
  onUpload,
  onRemove,
  bucket,
  storagePath,
  preset,
  label,
  aspectClass,
  compact,
  generatePrompt,
  generateContext,
  promptLabel,
}: ImageFieldWithAIProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      toast({ title: 'Cannot generate', description: 'Fill in the required fields first to generate an image.', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: generatePrompt, context: generateContext },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Generation failed', description: data.error, variant: 'destructive' });
        return;
      }
      if (data?.url) {
        onUpload(data.url);
        toast({ title: 'Image generated', description: 'AI image has been generated and uploaded.' });
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      toast({ title: 'Generation failed', description: err.message || 'Could not generate image.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <ImageUploadWithOptimizer
        value={value}
        onUpload={onUpload}
        onRemove={onRemove}
        bucket={bucket}
        storagePath={storagePath}
        preset={preset}
        label={label}
        aspectClass={aspectClass}
        compact={compact}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={generating}
        className="gap-2 w-full"
      >
        {generating ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> {promptLabel || 'Generate with AI'}</>
        )}
      </Button>
    </div>
  );
}
