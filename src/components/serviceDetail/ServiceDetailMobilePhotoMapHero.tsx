import React, { lazy, Suspense } from 'react';
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
  /** Superpuesto sobre la mitad de la foto (p. ej. formación animada). */
  overlay?: React.ReactNode;
}

function PhotoCell({
  src,
  index,
  alt,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
  onOpen,
  overlay,
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
  overlay?: React.ReactNode;
  eager?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="relative h-full w-full min-h-0 overflow-hidden border-0 bg-ink-strong p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/80 active:opacity-[0.97]"
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
      {overlay}
    </button>
  );
}

function MobileHeroPhotoStack({
  images,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
  onOpenImage,
}: Pick<
  ServiceDetailMobilePhotoMapHeroProps,
  | 'images'
  | 'loadingImages'
  | 'failedImages'
  | 'onImageError'
  | 'onImageLoad'
  | 'onImageLoadStart'
  | 'onOpenImage'
>) {
  if (images.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-surface-tinted px-3 text-center">
        <Image className="mb-2 h-8 w-8 text-ink-soft" strokeWidth={1.5} aria-hidden />
        <p className="text-xs font-medium text-ink-muted">Sin imágenes</p>
      </div>
    );
  }

  const total = images.length;

  // Una sola foto protagonista a toda altura. Apilar 2 celdas aquí las dejaba en
  // 188×140 y el solape de la card blanca (-mt-10) tapaba 40px de la segunda:
  // siempre se veía cortada. El resto de fotos vive en la galería (chip "N fotos").
  return (
    <PhotoCell
      src={images[0]}
      index={0}
      alt={total > 1 ? `Imagen del servicio, abrir galería de ${total} fotos` : 'Imagen del servicio'}
      loadingImages={loadingImages}
      failedImages={failedImages}
      onImageError={onImageError}
      onImageLoad={onImageLoad}
      onImageLoadStart={onImageLoadStart}
      onOpen={onOpenImage}
      eager
      overlay={
        total > 1 ? (
          // bottom-12 = por encima del solape de la card (2.5rem) + aire; misma
          // línea base que el botón de ampliar mapa (bottom-raised) en la otra columna.
          <span
            className="pointer-events-none absolute bottom-12 left-2 z-[2] inline-flex h-7 items-center gap-1.5 rounded-sm bg-black/45 px-2.5 text-kicker font-medium text-white backdrop-blur-[2px]"
            aria-hidden
          >
            <Image className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {total} fotos
          </span>
        ) : undefined
      }
    />
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

  return (
    <div className="relative grid aspect-[4/3] w-full grid-cols-2 bg-ink-strong">
      <div className="sd-mobile-hero-top-scrim" aria-hidden />
      <div className="relative min-h-0 min-w-0 overflow-hidden">
        <MobileHeroPhotoStack
          images={images}
          loadingImages={loadingImages}
          failedImages={failedImages}
          onImageError={onImageError}
          onImageLoad={onImageLoad}
          onImageLoadStart={onImageLoadStart}
          onOpenImage={onOpenImage}
        />
        {overlay}
      </div>

      <div className="relative min-h-0 min-w-0 overflow-hidden border-l border-black/10">
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
              rangeKm={radius}
              variant="preview"
              expandable
              expandButtonPosition="bottom-raised"
              className="h-full min-h-0 w-full rounded-none border-0"
            />
          </Suspense>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 bg-line-soft px-3 text-center">
            <MapPin className="h-6 w-6 text-ink-soft" strokeWidth={1.5} aria-hidden />
            <p className="text-kicker font-medium leading-snug text-ink-muted">
              {locationLabel || 'Sin ubicación'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
