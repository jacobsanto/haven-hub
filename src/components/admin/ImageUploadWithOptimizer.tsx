import { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { optimizeImage, formatFileSize, OptimizeOptions, OptimizedResult } from '@/utils/image-optimizer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadWithOptimizerProps {
  /** Current image URL (if already set) */
  value?: string;
  /** Called with the public URL after successful upload */
  onUpload: (url: string) => void;
  /** Called when the image is removed */
  onRemove?: () => void;
  /** Storage bucket name */
  bucket?: string;
  /** Storage path prefix */
  storagePath?: string;
  /** Optimization preset options */
  preset?: OptimizeOptions;
  /** Label text */
  label?: string;
  /** Aspect ratio class for the preview area */
  aspectClass?: string;
  /** Whether to show a compact layout */
  compact?: boolean;
}

export function ImageUploadWithOptimizer({
  value,
  onUpload,
  onRemove,
  bucket = 'property-images',
  storagePath = 'optimized',
  preset = { maxWidth: 1920, maxHeight: 1080, quality: 0.82, format: 'webp' },
  label = 'Upload Image',
  aspectClass = 'aspect-video',
  compact = false,
}: ImageUploadWithOptimizerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [optimizing, setOptimizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quality, setQuality] = useState(Math.round((preset.quality ?? 0.82) * 100));
  const [result, setResult] = useState<OptimizedResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 20MB allowed.', variant: 'destructive' });
      return;
    }

    setSelectedFile(file);
    setOptimizing(true);

    try {
      const optimized = await optimizeImage(file, { ...preset, quality: quality / 100 });
      setResult(optimized);
      const url = URL.createObjectURL(optimized.blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Optimization failed:', err);
      toast({ title: 'Optimization failed', description: 'Could not process image.', variant: 'destructive' });
    } finally {
      setOptimizing(false);
    }
  }, [preset, quality, toast]);

  const handleReoptimize = useCallback(async (newQuality: number) => {
    if (!selectedFile) return;
    setOptimizing(true);
    try {
      const optimized = await optimizeImage(selectedFile, { ...preset, quality: newQuality / 100 });
      setResult(optimized);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(optimized.blob));
    } catch (err) {
      console.error('Re-optimization failed:', err);
    } finally {
      setOptimizing(false);
    }
  }, [selectedFile, preset, previewUrl]);

  const handleUpload = useCallback(async () => {
    if (!result) return;
    setUploading(true);

    try {
      const ext = result.format === 'svg' ? 'svg' : result.format;
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
      const filePath = `${storagePath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, result.blob, { upsert: true, contentType: `image/${result.format}` });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      handleClear();

      toast({ title: 'Image uploaded', description: `Optimized from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.optimizedSize)}` });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [result, bucket, storagePath, onUpload, toast]);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setResult(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const savingsPercent = result ? Math.round((1 - result.optimizedSize / result.originalSize) * 100) : 0;

  // If there's already an uploaded image and no pending optimization
  if (value && !result) {
    return (
      <div className="space-y-2">
        <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden border border-border/50`}>
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Replace
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  // Optimization preview card
  if (result && previewUrl) {
    return (
      <div className="space-y-4 rounded-xl border border-border/50 p-4 bg-card">
        {/* Preview */}
        <div className={`relative w-full ${compact ? 'aspect-square max-w-[200px]' : aspectClass} rounded-lg overflow-hidden bg-muted`}>
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Original</span>
            <span className="font-medium">{formatFileSize(result.originalSize)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Optimized</span>
            <span className="font-medium text-primary">{formatFileSize(result.optimizedSize)}</span>
          </div>
          {savingsPercent > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={savingsPercent} className="h-2 flex-1" />
              <span className="text-xs font-medium text-primary">{savingsPercent}% smaller</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {result.width}×{result.height}px · {result.format.toUpperCase()}
          </p>
        </div>

        {/* Quality slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Quality</Label>
            <span className="text-xs text-muted-foreground">{quality}%</span>
          </div>
          <Slider
            value={[quality]}
            onValueChange={([v]) => setQuality(v)}
            onValueCommit={([v]) => handleReoptimize(v)}
            min={60}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={uploading || optimizing}
            className="gap-2 flex-1"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Check className="h-4 w-4" /> Upload</>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Empty state — file picker
  return (
    <div>
      <label className={`block w-full ${aspectClass} border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors`}>
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
          {optimizing ? (
            <>
              <Loader2 className="h-8 w-8 mb-2 animate-spin" />
              <span className="text-sm">Optimizing...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-sm">{label}</span>
              <span className="text-xs mt-1">Auto-optimized before upload</span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={optimizing}
        />
      </label>
    </div>
  );
}
