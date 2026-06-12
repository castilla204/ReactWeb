import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'lucide-react';
import { SD_MOBILE_GUTTER_CLASS } from '../../constants/homepageTypography';

interface ServiceDetailMobileHeroCarouselProps {
  images: string[];
  loadingImages: Set<string>;
  failedImages: Set<string>;
  onImageError: (url: string) => void;
  onImageLoad: (url: string) => void;
  onImageLoadStart: (url: string) => void;
  onOpenImage: (index: number) => void;
}

export const ServiceDetailMobileHeroCarousel: React.FC<ServiceDetailMobileHeroCarouselProps> = ({
  images,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
  onOpenImage,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncIndexFromScroll = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel || images.length === 0) return;
    const width = carousel.offsetWidth;
    if (width <= 0) return;
    const next = Math.min(images.length - 1, Math.max(0, Math.round(carousel.scrollLeft / width)));
    setActiveIndex((prev) => (prev === next ? prev : next));
  }, [images.length]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.addEventListener('scroll', syncIndexFromScroll, { passive: true });
    return () => carousel.removeEventListener('scroll', syncIndexFromScroll);
  }, [syncIndexFromScroll]);

  if (images.length === 0) {
    return (
      <div className="sd-gallery-hero-empty aspect-[4/3] w-full bg-[#f5f5f5]">
        <div className={`flex h-full flex-col items-center justify-center text-center ${SD_MOBILE_GUTTER_CLASS}`}>
          <Image className="mb-2 h-10 w-10 text-[#b0b0b0]" strokeWidth={1.5} aria-hidden />
          <p className="text-sm font-medium text-[#484848]">Sin imágenes disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-gallery-hero relative w-full overflow-hidden bg-[#1c1c1c]">
      <div
        ref={carouselRef}
        className="sd-gallery-hero-track scrollbar-hide flex w-full snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        aria-roledescription="carrusel"
        aria-label="Fotos del servicio"
      >
        {images.map((img, idx) => (
          <button
            type="button"
            key={`${img}-${idx}`}
            className="sd-gallery-hero-slide relative aspect-[4/3] w-full shrink-0 snap-start overflow-hidden border-0 bg-[#1c1c1c] p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/80"
            onClick={() => onOpenImage(idx)}
            aria-label={`Ver foto ${idx + 1} de ${images.length}`}
          >
            {loadingImages.has(img) ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1c1c1c]">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
              </div>
            ) : null}
            <img
              src={img}
              alt={`Imagen ${idx + 1} del servicio`}
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                loadingImages.has(img) ? 'opacity-0' : 'opacity-100'
              }`}
              onError={() => onImageError(img)}
              onLoad={() => onImageLoad(img)}
              onLoadStart={() => onImageLoadStart(img)}
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
            />
            {failedImages.has(img) ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#f0f0f0]">
                <div className="text-center px-4">
                  <Image className="mx-auto mb-2 h-10 w-10 text-[#b0b0b0]" strokeWidth={1.5} aria-hidden />
                  <p className="text-xs text-[#717171]">Imagen no disponible</p>
                </div>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      {images.length > 1 ? (
        <div
          className="pointer-events-none absolute left-1/2 top-[max(1rem,env(safe-area-inset-top,0px))] z-20 flex -translate-x-1/2 gap-1.5"
          aria-hidden
        >
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 w-1.5 rounded-full bg-white transition-opacity ${
                idx === activeIndex ? 'opacity-100' : 'opacity-40'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
