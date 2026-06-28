import React, { lazy, Suspense } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
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
  /** Título/meta superpuesto sobre la imagen principal (columna izquierda) */
  titleOverlay?: React.ReactNode;
  /** Volver — disco flotante arriba-derecha de la galería (desktop) */
  onBack?: () => void;
  /** Acción flotante arriba-derecha del hero (p. ej. guardar/favorito) */
  topRight?: React.ReactNode;
  /** Acción anclada arriba-derecha de la SEGUNDA foto de la galería (p. ej. favorito) */
  secondPhotoTopRight?: React.ReactNode;
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
  titleOverlay,
  onBack,
  topRight,
  secondPhotoTopRight,
  className = '',
}) => {
  // rangeKm === 0: el experto atiende solo en su taller (punto fijo) — etiqueta
  // distinta y el mapa dibuja solo el pin, sin círculo de cobertura.
  const isWorkshopOnly = rangeKm === 0;
  const radius = isWorkshopOnly ? 0 : Math.max(5, rangeKm);

  return (
    <div
      className={`relative grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 lg:gap-4 ${className}`}
      style={{ minHeight: SD_DESKTOP_PHOTO_MAP_HERO_MIN_HEIGHT_PX }}
    >
      {topRight ? (
        <div className="absolute right-3 top-3 z-30">{topRight}</div>
      ) : null}
      <div className={`relative min-h-0 min-w-0 ${SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS}`}>
        <ServiceDetailDesktopGallery
          layout="split"
          className="h-full"
          images={images}
          secondPhotoTopRight={secondPhotoTopRight}
          onOpen={onOpen}
          loadingImages={loadingImages}
          failedImages={failedImages}
          onImageError={onImageError}
          onImageLoad={onImageLoad}
          onImageLoadStart={onImageLoadStart}
          primaryOverlays={{
            topLeft: onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="sd-mobile-topbar-btn"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.1} aria-hidden />
              </button>
            ) : undefined,
            bottom: titleOverlay ? (
              <div className="bg-gradient-to-t from-black/70 via-black/35 to-transparent px-5 pb-4 pt-16">
                <div className="flex flex-col items-start gap-2">
                  {titleOverlay ? (
                    <div className="pointer-events-auto w-full">{titleOverlay}</div>
                  ) : null}
                </div>
              </div>
            ) : undefined,
          }}
        />
      </div>

      <div
        className={`relative min-h-0 min-w-0 overflow-hidden rounded-none ring-1 ring-inset ring-[#aeb8c4] ${SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS}`}
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
