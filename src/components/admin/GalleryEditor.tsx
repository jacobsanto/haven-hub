import { useState, useCallback, useEffect } from 'react';
import { GripVertical, X, ChevronUp, ChevronDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface GalleryEditorProps {
  gallery: string[];
  onReorder: (newGallery: string[]) => void;
  onRemove: (index: number) => void;
  onSetAsHero?: (url: string) => void;
}

export function GalleryEditor({ gallery, onReorder, onRemove, onSetAsHero }: GalleryEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [justMovedIndex, setJustMovedIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (justMovedIndex === null) return;
    const t = setTimeout(() => setJustMovedIndex(null), 300);
    return () => clearTimeout(t);
  }, [justMovedIndex]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newGallery = [...gallery];
    const [dragged] = newGallery.splice(dragIndex, 1);
    newGallery.splice(dropIndex, 0, dragged);
    onReorder(newGallery);
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, gallery, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const moveItem = useCallback((index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;
    const newGallery = [...gallery];
    [newGallery[index], newGallery[targetIndex]] = [newGallery[targetIndex], newGallery[index]];
    onReorder(newGallery);
    setJustMovedIndex(targetIndex);
  }, [gallery, onReorder]);

  if (gallery.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {gallery.length} image{gallery.length !== 1 ? 's' : ''} · {isMobile ? 'Use arrows to reorder' : 'Drag to reorder'}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {gallery.map((url, index) => (
          <div
            key={`${url}-${index}`}
            draggable={!isMobile}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'group relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200',
              !isMobile && 'cursor-grab active:cursor-grabbing',
              dragIndex === index && 'opacity-40 scale-95',
              dragOverIndex === index && dragIndex !== index
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-transparent hover:border-border',
              justMovedIndex === index && 'scale-105 ring-2 ring-primary/30'
            )}
          >
            <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 md:bg-black/0 md:group-hover:bg-black/40 transition-colors" />

            {/* Grab handle – desktop only */}
            <div className="absolute top-1 left-1 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-background/80 backdrop-blur-sm rounded p-0.5">
                <GripVertical className="h-4 w-4 text-foreground" />
              </div>
            </div>

            {/* Position badge */}
            <div className="absolute bottom-1 left-1">
              <span className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-medium rounded px-1.5 py-0.5">
                {index + 1}
              </span>
            </div>

            {/* Action buttons – always visible on mobile, hover on desktop */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {onSetAsHero && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 md:h-6 md:w-6"
                  onClick={() => onSetAsHero(url)}
                  title="Set as hero image"
                >
                  <Star className="h-4 w-4 md:h-3 md:w-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 md:h-6 md:w-6"
                onClick={() => onRemove(index)}
              >
                <X className="h-4 w-4 md:h-3 md:w-3" />
              </Button>
            </div>

            {/* Arrow buttons – always visible on mobile, hidden on desktop */}
            <div className="absolute bottom-1 right-1 flex gap-1 md:hidden">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-9 w-9"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-9 w-9"
                onClick={() => moveItem(index, 1)}
                disabled={index === gallery.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
