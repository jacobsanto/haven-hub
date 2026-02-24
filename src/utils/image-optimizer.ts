export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

export interface OptimizedResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  format: string;
}

const DEFAULT_OPTIONS: Required<OptimizeOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.82,
  format: 'webp',
};

function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function calculateDimensions(
  imgWidth: number,
  imgHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (imgWidth <= maxWidth && imgHeight <= maxHeight) {
    return { width: imgWidth, height: imgHeight };
  }

  const ratioW = maxWidth / imgWidth;
  const ratioH = maxHeight / imgHeight;
  const ratio = Math.min(ratioW, ratioH);

  return {
    width: Math.round(imgWidth * ratio),
    height: Math.round(imgHeight * ratio),
  };
}

export async function optimizeImage(
  file: File,
  options?: OptimizeOptions
): Promise<OptimizedResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // SVGs don't need optimization
  if (file.type === 'image/svg+xml') {
    return {
      blob: file,
      width: 0,
      height: 0,
      originalSize: file.size,
      optimizedSize: file.size,
      format: 'svg',
    };
  }

  const img = await loadImage(file);
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth,
    opts.maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  const useWebP = opts.format === 'webp' && supportsWebP();
  const mimeType = useWebP ? 'image/webp' : 'image/jpeg';

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Blob conversion failed'))),
      mimeType,
      opts.quality
    );
  });

  return {
    blob,
    width,
    height,
    originalSize: file.size,
    optimizedSize: blob.size,
    format: useWebP ? 'webp' : 'jpeg',
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const IMAGE_PRESETS = {
  hero: { maxWidth: 1920, maxHeight: 1080, quality: 0.82, format: 'webp' as const },
  gallery: { maxWidth: 1600, maxHeight: 1200, quality: 0.80, format: 'webp' as const },
  logo: { maxWidth: 800, maxHeight: 400, quality: 0.90, format: 'webp' as const },
  og: { maxWidth: 1200, maxHeight: 630, quality: 0.80, format: 'webp' as const },
} as const;
