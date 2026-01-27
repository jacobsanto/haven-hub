import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play, Pause, Maximize2, Video, View } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';

interface PropertyHeroSliderProps {
  images: string[];
  heroImage?: string | null;
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  propertyName: string;
}

export function PropertyHeroSlider({
  images,
  heroImage,
  videoUrl,
  virtualTourUrl,
  propertyName,
}: PropertyHeroSliderProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  const allImages = heroImage ? [heroImage, ...images] : images;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [thumbsRef, thumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
    thumbsApi?.scrollTo(emblaApi.selectedScrollSnap());
  }, [emblaApi, thumbsApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (allImages.length === 0 && !videoUrl) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-2xl flex items-center justify-center">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  const hasVideo = !!videoUrl;
  const hasVirtualTour = !!virtualTourUrl;

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden">
        {/* Main Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {allImages.map((image, index) => (
              <div
                key={index}
                className="relative flex-[0_0_100%] min-w-0 aspect-[16/9] cursor-pointer group"
                onClick={() => {
                  setCurrentIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={image}
                  alt={`${propertyName} - ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background backdrop-blur-sm rounded-full shadow-lg"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background backdrop-blur-sm rounded-full shadow-lg"
              onClick={scrollNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
          {currentIndex + 1} / {allImages.length}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {hasVirtualTour && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-background/80 backdrop-blur-sm hover:bg-background gap-2"
              onClick={() => setShowVirtualTour(true)}
            >
              <View className="h-4 w-4" />
              Virtual Tour
            </Button>
          )}
          {hasVideo && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-background/80 backdrop-blur-sm hover:bg-background gap-2"
              onClick={() => {
                setIsVideoPlaying(true);
                setLightboxOpen(true);
              }}
            >
              <Video className="h-4 w-4" />
              Watch Video
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="bg-background/80 backdrop-blur-sm hover:bg-background gap-2"
            onClick={() => setLightboxOpen(true)}
          >
            <Maximize2 className="h-4 w-4" />
            View All
          </Button>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="mt-4 overflow-hidden" ref={thumbsRef}>
          <div className="flex gap-2">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  'flex-[0_0_auto] w-20 h-14 rounded-lg overflow-hidden transition-all',
                  currentIndex === index
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                )}
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
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-foreground border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-background hover:bg-background/20"
              onClick={() => {
                setLightboxOpen(false);
                setIsVideoPlaying(false);
              }}
            >
              <X className="h-6 w-6" />
            </Button>

            {isVideoPlaying && videoUrl ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg"
                />
              </div>
            ) : (
              <>
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 z-10 text-background hover:bg-background/20"
                      onClick={() =>
                        setCurrentIndex((prev) =>
                          prev === 0 ? allImages.length - 1 : prev - 1
                        )
                      }
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 z-10 text-background hover:bg-background/20"
                      onClick={() =>
                        setCurrentIndex((prev) =>
                          prev === allImages.length - 1 ? 0 : prev + 1
                        )
                      }
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}

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

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full text-background text-sm">
                  {currentIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Virtual Tour Modal */}
      <Dialog open={showVirtualTour} onOpenChange={setShowVirtualTour}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <div className="w-full h-full">
            <iframe
              src={virtualTourUrl || ''}
              className="w-full h-full rounded-lg"
              allowFullScreen
              title={`${propertyName} Virtual Tour`}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
