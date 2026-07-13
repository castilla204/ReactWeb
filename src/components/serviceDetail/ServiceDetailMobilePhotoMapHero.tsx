import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Image, MapPin } from 'lucide-react';
import { SileoSkeleton } from '../ui/sileo-skeleton';

const ServiceDetailCoverageMap = lazy(() =>
  import('./ServiceDetailCoverageMap').then((m) => ({
    default: m.ServiceDetailCoverageMap,
  })),
);

interface ServiceDetailMobilePhotoMapHeroProps {
  images: string[];
  loadingImages: Set<string>;
  failedImages: Set<string>;
  onImageError: (url: string) => void;
  onImageLoad: (url: string) => void;
  onImageLoadStart: (url: string) => void;
  onOpenImage: (index: number) => void;
  location: { latitude: number; longitude: number } | null;
  locationLabel?: string;
  rangeKm?: number;
  /** Superpuesto sobre el hero (p. ej. formación animada). */
  overlay?: React.ReactNode;
}

const MAX_PILL_INDICATORS = 7;

function PhotoSlide({
  src,
  index,
  alt,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
  onOpen,
  eager = false,
}: {
  src: string;
  index: number;
  alt: string;
  loadingImages: Set<string>;
  failedImages: Set<string>;
  onImageError: (url: string) => void;
  onImageLoad: (url: string) => void;
  onImageLoadStart: (url: string) => void;
  onOpen: (index: number) => void;
  eager?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="sd-mobile-hero-slide relative h-full w-full overflow-hidden border-0 bg-ink-strong p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/80 active:opacity-[0.97]"
      aria-label={alt}
    >
      {loadingImages.has(src) ? (
        <SileoSkeleton className="absolute inset-0 z-10 h-full w-full" rounded="none" />
      ) : null}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loadingImages.has(src) ? 'opacity-0' : 'opacity-100'
        }`}
        onError={() => onImageError(src)}
        onLoad={() => onImageLoad(src)}
        onLoadStart={() => onImageLoadStart(src)}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
      {failedImages.has(src) ? (
        <div className="absolute inset-0 flex items-center justify-center bg-line-soft">
          <Image className="h-8 w-8 text-ink-soft" strokeWidth={1.5} aria-hidden />
        </div>
      ) : null}
    </button>
  );
}

function MapSlide({
  location,
  locationLabel,
  radius,
  isWorkshopOnly,
}: {
  location: { latitude: number; longitude: number } | null;
  locationLabel?: string;
  radius: number;
  isWorkshopOnly: boolean;
}) {
  return (
    <div
      className="sd-mobile-hero-slide relative h-full w-full overflow-hidden bg-surface-tinted"
      aria-label={
        location
          ? isWorkshopOnly
            ? 'Mapa: el experto atiende en su taller'
            : `Mapa de cobertura, radio ${radius} km`
          : 'Sin ubicación'
      }
    >
      {location ? (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-brand/10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
            </div>
          }
        >
          <ServiceDetailCoverageMap
            latitude={location.latitude}
            longitude={location.longitude}
            rangeKm={isWorkshopOnly ? 0 : radius}
            variant="preview"
            className="h-full min-h-0 w-full rounded-none border-0"
          />
        </Suspense>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 px-3 text-center">
          <MapPin className="h-6 w-6 text-ink-soft" strokeWidth={1.5} aria-hidden />
          <p className="text-kicker font-medium leading-snug text-ink-muted">
            {locationLabel || 'Sin ubicación'}
          </p>
        </div>
      )}
    </div>
  );
}

function HeroSlideIndicator({
  activeIndex,
  slideCount,
  photoCount,
}: {
  activeIndex: number;
  slideCount: number;
  photoCount: number;
}) {
  if (slideCount <= 1) return null;

  const showPills = slideCount <= MAX_PILL_INDICATORS;
  const onMap = activeIndex === 0;
  const showSwipeHint = onMap && photoCount > 0;

  return (
    <>
      <div
        className={`sd-mobile-hero-indicator-scrim${
          showSwipeHint ? ' sd-mobile-hero-indicator-scrim--with-hint' : ''
        }`}
        aria-hidden
      />

      {showSwipeHint ? (
        <div className="sd-mobile-hero-swipe-hint" aria-hidden>
          <span className="sd-mobile-hero-swipe-hint-pill">
            Desliza
            <span className="sd-mobile-hero-swipe-hint-arrow">→</span>
          </span>
        </div>
      ) : null}

      {showPills ? (
        <div className="sd-mobile-hero-indicator-dots" aria-hidden>
          {Array.from({ length: slideCount }).map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <span
                key={idx}
                className={`sd-mobile-hero-indicator-dot ${
                  isActive
                    ? 'sd-mobile-hero-indicator-dot--active'
                    : 'sd-mobile-hero-indicator-dot--inactive'
                }`}
              />
            );
          })}
        </div>
      ) : (
        <div className="sd-mobile-hero-indicator-counter" aria-live="polite">
          <span className="sd-mobile-hero-indicator-counter-text">
            {activeIndex + 1} / {slideCount}
          </span>
        </div>
      )}
    </>
  );
}

export const ServiceDetailMobilePhotoMapHero: React.FC<ServiceDetailMobilePhotoMapHeroProps> = ({
  images,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
  onOpenImage,
  location,
  locationLabel,
  rangeKm = 25,
  overlay,
}) => {
  const isWorkshopOnly = rangeKm === 0;
  const radius = isWorkshopOnly ? 0 : Math.max(5, rangeKm);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = 1 + images.length;

  const syncIndexFromScroll = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel || slideCount <= 1) return;
    const width = carousel.offsetWidth;
    if (width <= 0) return;
    const next = Math.min(slideCount - 1, Math.max(0, Math.round(carousel.scrollLeft / width)));
    setActiveIndex((prev) => (prev === next ? prev : next));
  }, [slideCount]);

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
  }, [images.length, location?.latitude, location?.longitude]);

  const photoTotal = images.length;

  return (
    <div className="sd-mobile-hero relative w-full overflow-hidden bg-ink-strong">
      <div className="sd-mobile-hero-top-scrim" aria-hidden />

      <div
        ref={carouselRef}
        className="sd-mobile-hero-track scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
        aria-roledescription="carrusel"
        aria-label={
          photoTotal > 0
            ? `Mapa de cobertura y ${photoTotal} fotos del servicio`
            : 'Mapa de cobertura del servicio'
        }
      >
        <MapSlide
          location={location}
          locationLabel={locationLabel}
          radius={radius}
          isWorkshopOnly={isWorkshopOnly}
        />

        {images.map((src, idx) => (
          <PhotoSlide
            key={`${src}-${idx}`}
            src={src}
            index={idx}
            alt={
              photoTotal > 1
                ? `Foto ${idx + 1} de ${photoTotal}, abrir galería`
                : 'Foto del servicio, abrir galería'
            }
            loadingImages={loadingImages}
            failedImages={failedImages}
            onImageError={onImageError}
            onImageLoad={onImageLoad}
            onImageLoadStart={onImageLoadStart}
            onOpen={onOpenImage}
            eager={idx === 0}
          />
        ))}
      </div>

      <HeroSlideIndicator
        activeIndex={activeIndex}
        slideCount={slideCount}
        photoCount={photoTotal}
      />

      {overlay}
    </div>
  );
};
