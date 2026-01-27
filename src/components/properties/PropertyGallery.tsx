import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Grid } from 'lucide-react';
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
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden">
        {/* Main Image */}
        <div
          className="md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto cursor-pointer relative group"
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
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
        </div>

        {/* Secondary Images */}
        {allImages.slice(1, 5).map((image, index) => (
          <div
            key={index}
            className="hidden md:block aspect-[4/3] cursor-pointer relative group"
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
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
            
            {/* Show all photos button on last visible image */}
            {index === 3 && allImages.length > 5 && (
              <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                <Button variant="secondary" className="gap-2">
                  <Grid className="h-4 w-4" />
                  +{allImages.length - 5} more
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show All Button (Mobile) */}
      {allImages.length > 1 && (
        <Button
          variant="outline"
          className="mt-4 md:hidden w-full gap-2"
          onClick={() => setLightboxOpen(true)}
        >
          <Grid className="h-4 w-4" />
          View all {allImages.length} photos
        </Button>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] p-0 bg-foreground border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-background hover:bg-background/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-10 text-background hover:bg-background/20"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-10 text-background hover:bg-background/20"
                  onClick={handleNext}
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
                transition={{ duration: 0.3 }}
                className="max-w-full max-h-full object-contain"
              />
            </AnimatePresence>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full text-background text-sm">
              {currentIndex + 1} / {allImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
