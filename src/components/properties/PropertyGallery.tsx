import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Grid, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PropertyGalleryProps {
  images: string[];
  heroImage?: string | null;
  propertyName: string;
}

export function PropertyGallery({ images, heroImage, propertyName }: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const allImages = heroImage ? [heroImage, ...images] : images;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!lightboxOpen) return;
    
    if (e.key === 'ArrowLeft') {
      setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    } else if (e.key === 'ArrowRight') {
      setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'Escape') {
      setLightboxOpen(false);
    }
  }, [lightboxOpen, allImages.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (allImages.length === 0) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-2xl flex items-center justify-center">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Bento Gallery Grid */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[300px] md:h-[500px]">
          {/* Main Hero Image */}
          <div
            className="md:col-span-2 md:row-span-2 cursor-pointer relative group overflow-hidden"
            onClick={() => {
              setCurrentIndex(0);
              setLightboxOpen(true);
            }}
          >
            <img
              src={allImages[0]}
              alt={propertyName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Secondary Images - Bento Layout */}
          {allImages.slice(1, 5).map((image, index) => (
            <div
              key={index}
              className="hidden md:block cursor-pointer relative group overflow-hidden"
              onClick={() => {
                setCurrentIndex(index + 1);
                setLightboxOpen(true);
              }}
            >
              <img
                src={image}
                alt={`${propertyName} - ${index + 2}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Show all photos overlay on last visible image */}
              {index === 3 && allImages.length > 5 && (
                <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="text-center text-background">
                    <Images className="h-8 w-8 mx-auto mb-2" />
                    <span className="font-medium">+{allImages.length - 5} more</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Photo Count Badge */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-background transition-colors shadow-lg"
        >
          <Grid className="h-4 w-4" />
          {allImages.length} photos
        </button>

        {/* Mobile: Floating View Photos Button */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="md:hidden absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-background transition-colors shadow-lg"
        >
          <Images className="h-4 w-4" />
          View all photos
        </button>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-foreground/95 backdrop-blur-xl border-none">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-foreground/50 to-transparent">
              <span className="text-background/80 text-sm">
                {currentIndex + 1} / {allImages.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-background hover:bg-background/20"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close gallery"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Main Image Area */}
            <div className="flex-1 flex items-center justify-center px-4 md:px-16">
              {/* Navigation */}
              {allImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 md:left-4 z-10 text-background hover:bg-background/20 w-12 h-12"
                    onClick={handlePrevious}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 md:right-4 z-10 text-background hover:bg-background/20 w-12 h-12"
                    onClick={handleNext}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* Image */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={allImages[currentIndex]}
                  alt={`${propertyName} - ${currentIndex + 1}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </AnimatePresence>
            </div>

            {/* Thumbnail Strip */}
            <div className="p-4 bg-gradient-to-t from-foreground/50 to-transparent">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all ${
                      currentIndex === index 
                        ? 'ring-2 ring-background scale-105' 
                        : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
