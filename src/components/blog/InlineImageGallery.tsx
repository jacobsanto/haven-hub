import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';

interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

interface InlineImageGalleryProps {
  images: GalleryImage[];
  title?: string;
}

export function InlineImageGallery({ images, title }: InlineImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  
  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };
  
  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="my-10 md:my-14"
    >
      {title && (
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          {title}
        </h4>
      )}

      {/* Mobile: Carousel */}
      {isMobile ? (
        <Carousel className="w-full">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div
                  onClick={() => openLightbox(index)}
                  className="cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-xl">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {image.caption && (
                    <p className="mt-2 text-sm text-muted-foreground text-center">
                      {image.caption}
                    </p>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      ) : (
        /* Desktop: Grid */
        <div className={`grid gap-4 ${
          images.length === 2 ? 'grid-cols-2' : 
          images.length === 3 ? 'grid-cols-3' : 
          'grid-cols-2 md:grid-cols-4'
        }`}>
          {images.map((image, index) => (
            <div
              key={index}
              onClick={() => openLightbox(index)}
              className="cursor-pointer group"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              {image.caption && (
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  {image.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={closeLightbox}
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].alt}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
              {images[lightboxIndex].caption && (
                <p className="mt-4 text-muted-foreground text-center">
                  {images[lightboxIndex].caption}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {lightboxIndex + 1} / {images.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
