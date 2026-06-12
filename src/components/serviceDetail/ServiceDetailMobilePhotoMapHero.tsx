import React, { lazy, Suspense } from 'react';
import { Image, MapPin } from 'lucide-react';

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
      className="relative h-full w-full min-h-0 overflow-hidden border-0 bg-[#1c1c1c] p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/80"
      aria-label={alt}
    >
      {loadingImages.has(src) ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1c1c1c]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        </div>
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
        <div className="absolute inset-0 flex items-center justify-center bg-[#f0f0f0]">
          <Image className="h-8 w-8 text-[#b0b0b0]" strokeWidth={1.5} aria-hidden />
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
      <div className="flex h-full flex-col items-center justify-center bg-[#f5f5f5] px-3 text-center">
        <Image className="mb-2 h-8 w-8 text-[#b0b0b0]" strokeWidth={1.5} aria-hidden />
        <p className="text-xs font-medium text-[#484848]">Sin imágenes</p>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="h-full w-full">
      <PhotoCell
        src={images[0]}
        index={0}
        alt="Imagen del servicio"
        loadingImages={loadingImages}
        failedImages={failedImages}
        onImageError={onImageError}
        onImageLoad={onImageLoad}
        onImageLoadStart={onImageLoadStart}
        onOpen={onOpenImage}
        eager
      />
      </div>
    );
  }

  const extras = images.length - 2;

  return (
    <div className="grid h-full min-h-0 grid-rows-2 gap-px bg-[#1c1c1c]">
      <PhotoCell
        src={images[0]}
        index={0}
        alt="Imagen 1 del servicio"
        loadingImages={loadingImages}
        failedImages={failedImages}
        onImageError={onImageError}
        onImageLoad={onImageLoad}
        onImageLoadStart={onImageLoadStart}
        onOpen={onOpenImage}
        eager
      />
      <PhotoCell
        src={images[1]}
        index={1}
        alt={extras > 0 ? `Imagen 2 del servicio, ${extras} más` : 'Imagen 2 del servicio'}
        loadingImages={loadingImages}
        failedImages={failedImages}
        onImageError={onImageError}
        onImageLoad={onImageLoad}
        onImageLoadStart={onImageLoadStart}
        onOpen={onOpenImage}
        overlay={
          extras > 0 ? (
            <span
              className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black/40 text-sm font-semibold text-white"
              aria-hidden
            >
              +{extras}
            </span>
          ) : undefined
        }
      />
    </div>
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
}) => {
  const isWorkshopOnly = rangeKm === 0;
  const radius = isWorkshopOnly ? 0 : Math.max(5, rangeKm);

  return (
    <div className="grid aspect-[4/3] w-full grid-cols-2 bg-[#1c1c1c]">
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
      </div>

      <div className="relative min-h-0 min-w-0 overflow-hidden border-l border-black/10">
        {location ? (
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-[#dce9f2]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ddd] border-t-brand" />
              </div>
            }
          >
            <ServiceDetailCoverageMap
              latitude={location.latitude}
              longitude={location.longitude}
              rangeKm={radius}
              variant="preview"
              expandable
              expandButtonPosition="bottom"
              className="h-full min-h-0 w-full rounded-none border-0"
            />
          </Suspense>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 bg-[#f0f0f0] px-3 text-center">
            <MapPin className="h-6 w-6 text-[#b0b0b0]" strokeWidth={1.5} aria-hidden />
            <p className="text-[11px] font-medium leading-snug text-[#484848]">
              {locationLabel || 'Sin ubicación'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
