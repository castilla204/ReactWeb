import React, { lazy, Suspense } from 'react';
import { MapPin } from 'lucide-react';
import { ServiceDetailDesktopGallery } from './ServiceDetailDesktopGallery';
import {
  SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS,
  SD_DESKTOP_PHOTO_MAP_HERO_MIN_HEIGHT_PX,
} from '../../constants/homepageTypography';

const ServiceDetailCoverageMap = lazy(() =>
  import('./ServiceDetailCoverageMap').then((m) => ({
    default: m.ServiceDetailCoverageMap,
  })),
);

interface ServiceDetailDesktopPhotoMapHeroProps {
  images: string[];
  onOpen: (index: number) => void;
  loadingImages: Set<string>;
  failedImages: Set<string>;
  onImageError: (url: string) => void;
  onImageLoad: (url: string) => void;
  onImageLoadStart: (url: string) => void;
  location: { latitude: number; longitude: number } | null;
  locationLabel?: string;
  rangeKm?: number;
  className?: string;
}

export const ServiceDetailDesktopPhotoMapHero: React.FC<ServiceDetailDesktopPhotoMapHeroProps> = ({
  images,
  onOpen,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
  location,
  locationLabel,
  rangeKm = 25,
  className = '',
}) => {
  // rangeKm === 0: el experto atiende solo en su taller (punto fijo) — etiqueta
  // distinta y el mapa dibuja solo el pin, sin círculo de cobertura.
  const isWorkshopOnly = rangeKm === 0;
  const radius = isWorkshopOnly ? 0 : Math.max(5, rangeKm);

  return (
    <div
      className={`grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-2 lg:gap-3 ${className}`}
      style={{ minHeight: SD_DESKTOP_PHOTO_MAP_HERO_MIN_HEIGHT_PX }}
    >
      <div className={`relative min-h-0 min-w-0 ${SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS}`}>
        <ServiceDetailDesktopGallery
          layout="split"
          className="h-full"
          images={images}
          onOpen={onOpen}
          loadingImages={loadingImages}
          failedImages={failedImages}
          onImageError={onImageError}
          onImageLoad={onImageLoad}
          onImageLoadStart={onImageLoadStart}
        />
      </div>

      <div
        className={`sd-gallery-shell relative min-h-0 min-w-0 overflow-hidden ${SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS}`}
      >
        {location ? (
          <>
            <div className="absolute inset-0 min-h-0">
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5]">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#ddd] border-t-brand" />
                  </div>
                }
              >
                <ServiceDetailCoverageMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                  rangeKm={radius}
                  variant="preview"
                  expandable
                  className="h-full min-h-0 w-full rounded-none border-0"
                />
              </Suspense>
            </div>
            {(locationLabel || radius || isWorkshopOnly) && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-black/50 via-black/20 to-transparent px-3 pb-3 pt-8"
                aria-hidden
              >
                <p className="text-sm font-semibold text-white">
                  {locationLabel || 'Zona del experto'}
                </p>
                <p className="mt-0.5 text-xs text-white/85">
                  {isWorkshopOnly ? 'Solo en su taller · el cliente se desplaza' : `Cobertura · ${radius} km de radio`}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#f7f7f7] px-6 text-center">
            <MapPin className="h-8 w-8 text-[#a3a3a3]" strokeWidth={1.5} aria-hidden />
            <p className="text-sm font-medium text-[#1c1c1c]">
              {locationLabel || 'Ubicación no disponible'}
            </p>
            <p className="text-xs text-[#6a6a6a]">
              El experto aún no ha indicado su zona en el mapa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
