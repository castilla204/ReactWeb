import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'lucide-react';
import { SD_MOBILE_GUTTER_CLASS } from '../../constants/homepageTypography';

const MAX_PILL_INDICATORS = 7;

interface ServiceDetailMobileHeroCarouselProps {
  images: string[];
  loadingImages: Set<string>;
  failedImages: Set<string>;
  onImageError: (url: string) => void;
  onImageLoad: (url: string) => void;
  onImageLoadStart: (url: string) => void;
  onOpenImage: (index: number) => void;
  /** Mitad izquierda del hero foto+mapa */
  layout?: 'full' | 'split';
}

export const ServiceDetailMobileHeroCarousel: React.FC<ServiceDetailMobileHeroCarouselProps> = ({
  images,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
  onOpenImage,
  layout = 'full',
}) => {
  const isSplit = layout === 'split';
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
    carousel.addEventListener('scrollend', syncIndexFromScroll, { passive: true });
    return () => {
      carousel.removeEventListener('scroll', syncIndexFromScroll);
      carousel.removeEventListener('scrollend', syncIndexFromScroll);
    };
  }, [syncIndexFromScroll]);

  useEffect(() => {
    setActiveIndex(0);
    const carousel = carouselRef.current;
    if (carousel) carousel.scrollLeft = 0;
  }, [images]);

  if (images.length === 0) {
    return (
      <div
        className={`sd-gallery-hero-empty w-full bg-[#f5f5f5] ${
          isSplit ? 'h-full' : 'aspect-[4/3]'
        }`}
      >
        <div className={`flex h-full flex-col items-center justify-center text-center ${SD_MOBILE_GUTTER_CLASS}`}>
          <Image className="mb-2 h-10 w-10 text-[#b0b0b0]" strokeWidth={1.5} aria-hidden />
          <p className="text-sm font-medium text-[#484848]">Sin imágenes disponibles</p>
        </div>
      </div>
    );
  }

  const showPills = images.length > 1 && images.length <= MAX_PILL_INDICATORS;
  const showCounter = images.length > MAX_PILL_INDICATORS;

  return (
    <div
      className={`sd-gallery-hero group/hero relative overflow-hidden bg-[#1c1c1c] ${
        isSplit ? 'h-full w-full' : 'w-full'
      }`}
    >
      <div
        ref={carouselRef}
        className={`sd-gallery-hero-track scrollbar-hide flex snap-x snap-mandatory overflow-x-auto ${
          isSplit ? 'h-full w-full' : 'w-full'
        }`}
        aria-roledescription="carrusel"
        aria-label="Fotos del servicio"
      >
        {images.map((img, idx) => (
          <button
            type="button"
            key={`${img}-${idx}`}
            className={`sd-gallery-hero-slide relative shrink-0 snap-start snap-always overflow-hidden border-0 bg-[#1c1c1c] p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/80 active:opacity-[0.97] ${
              isSplit ? 'h-full w-full' : 'aspect-[4/3] w-full'
            }`}
            onClick={() => onOpenImage(idx)}
            aria-label={`Ver foto ${idx + 1} de ${images.length}`}
            aria-current={idx === activeIndex ? 'true' : undefined}
          >
            {loadingImages.has(img) ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1c1c1c]">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
              </div>
            ) : null}
            <img
              src={img}
              alt={`Imagen ${idx + 1} del servicio`}
              className={`h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out ${
                loadingImages.has(img) ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
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
                <div className="px-4 text-center">
                  <Image className="mx-auto mb-2 h-10 w-10 text-[#b0b0b0]" strokeWidth={1.5} aria-hidden />
                  <p className="text-xs text-[#717171]">Imagen no disponible</p>
                </div>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <div
            className="sd-gallery-hero-scrim pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-black/40 via-black/15 to-transparent"
            aria-hidden
          />
          {showPills ? (
            <div
              className="pointer-events-none absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5"
              aria-hidden
            >
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`rounded-full bg-white transition-all duration-300 ease-out ${
                    idx === activeIndex
                      ? 'h-[3px] w-[18px] opacity-100'
                      : 'h-[3px] w-[3px] opacity-45'
                  }`}
                />
              ))}
            </div>
          ) : null}
          {showCounter ? (
            <div
              className="pointer-events-none absolute bottom-2.5 left-1/2 z-20 -translate-x-1/2"
              aria-live="polite"
            >
              <span className="inline-flex rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium tabular-nums tracking-wide text-white/95 backdrop-blur-[3px]">
                {activeIndex + 1} / {images.length}
              </span>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
