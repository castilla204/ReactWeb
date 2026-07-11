import React from 'react';
import { Image, LayoutGrid } from 'lucide-react';
import { SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS } from '../../constants/homepageTypography';
import { SileoSkeleton } from '../ui/sileo-skeleton';

interface ServiceDetailDesktopGalleryPrimaryOverlays {
  /** Arriba-izquierda de la foto principal (p. ej. volver) */
  topLeft?: React.ReactNode;
  /** Arriba-derecha de la foto principal (p. ej. guardar/favorito) — mismo
      emparejamiento visual que el top bar flotante móvil (volver + favorito
      en las dos esquinas de la MISMA foto). */
  topRight?: React.ReactNode;
  /** Abajo con degradado (p. ej. formación + título del servicio) */
  bottom?: React.ReactNode;
}

interface ServiceDetailDesktopGalleryProps {
  images: string[];
  onOpen: (index: number) => void;
  loadingImages: Set<string>;
  failedImages: Set<string>;
  onImageError: (url: string) => void;
  onImageLoad: (url: string) => void;
  onImageLoadStart: (url: string) => void;
  /** split = mitad izquierda del hero (mosaico adaptado al ancho reducido) */
  layout?: 'default' | 'split';
  /** Overlays anclados SOLO a la celda de la foto principal (índice 0) */
  primaryOverlays?: ServiceDetailDesktopGalleryPrimaryOverlays;
  className?: string;
}

const GAP = 'gap-1';

function resolveShellHeight(className: string): string {
  return className.includes('h-full') ? 'h-full' : SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS;
}

export const ServiceDetailDesktopGallery: React.FC<ServiceDetailDesktopGalleryProps> = ({
  images,
  onOpen,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
  layout = 'default',
  primaryOverlays,
  className = '',
}) => {
  const shellHeight = resolveShellHeight(className);
  const isSplit = layout === 'split';
  const shellClass = `sd-gallery-shell ${isSplit ? '!rounded-none' : ''}`;
  const hasPrimaryOverlays = Boolean(
    primaryOverlays?.topLeft || primaryOverlays?.topRight || primaryOverlays?.bottom,
  );

  const wrapPrimaryCell = (node: React.ReactNode, cellClassName: string) => {
    if (!hasPrimaryOverlays) {
      return node;
    }
    return (
      <div className={`relative min-h-0 ${cellClassName}`}>
        {node}
        {primaryOverlays?.topLeft ? (
          <div className="pointer-events-none absolute left-0 top-0 z-20 p-3">
            <div className="pointer-events-auto">{primaryOverlays.topLeft}</div>
          </div>
        ) : null}
        {primaryOverlays?.topRight ? (
          <div className="pointer-events-none absolute right-0 top-0 z-20 p-3">
            <div className="pointer-events-auto">{primaryOverlays.topRight}</div>
          </div>
        ) : null}
        {primaryOverlays?.bottom ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
            {primaryOverlays.bottom}
          </div>
        ) : null}
      </div>
    );
  };

  const cell = (
    src: string,
    alt: string,
    idx: number,
    cellClassName: string,
    eager = false,
    overlay?: React.ReactNode,
  ) => (
    <button
      type="button"
      key={`${src}-${idx}`}
      className={`sd-gallery-cell ${cellClassName}`}
      onClick={() => onOpen(idx)}
      aria-label={alt}
    >
      <span className="sd-gallery-cell-overlay" aria-hidden />
      {loadingImages.has(src) && (
        <SileoSkeleton className="absolute inset-0 z-10 h-full w-full" rounded="none" />
      )}
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
      />
      {overlay}
    </button>
  );

  const showAllButton =
    images.length > 1 ? (
      <button
        type="button"
        onClick={() => onOpen(0)}
        className={`absolute z-20 inline-flex items-center gap-1.5 rounded-lg border border-[#222222] bg-white font-semibold text-[#222222] shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#f7f7f7] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          isSplit ? 'bottom-3 right-3 px-3 py-2 text-xs' : 'bottom-4 right-4 gap-2 px-4 py-2.5 text-sm'
        }`}
        aria-label={`Ver las ${images.length} fotos del servicio`}
      >
        <LayoutGrid className={`shrink-0 ${isSplit ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} strokeWidth={2} aria-hidden />
        Ver las {images.length} fotos
      </button>
    ) : null;

  if (images.length === 0) {
    return (
      <div
        className={`${shellClass} relative flex ${shellHeight} items-center justify-center border border-[#e8e8e8] ${className}`}
      >
        <div className="text-center">
          <Image className="mx-auto mb-2 h-8 w-8 text-[#a3a3a3]" strokeWidth={1.5} />
          <p className="text-sm text-[#6a6a6a]">Sin imágenes</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={`${shellClass} relative ${shellHeight} ${className}`}>
        {wrapPrimaryCell(
          cell(images[0], 'Imagen principal del servicio', 0, 'h-full w-full', true),
          'h-full w-full',
        )}
      </div>
    );
  }

  if (images.length === 2) {
    const twoColClass = isSplit
      ? 'grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'
      : 'grid-cols-2';

    return (
      <div className={`relative h-full min-h-0 ${className}`}>
        <div className={`${shellClass} grid ${shellHeight} ${twoColClass} ${GAP}`}>
          {wrapPrimaryCell(cell(images[0], 'Imagen 1', 0, 'h-full min-h-0', true), 'h-full min-h-0')}
          {cell(images[1], 'Imagen 2', 1, 'h-full min-h-0')}
        </div>
        {showAllButton}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className={`relative h-full min-h-0 ${className}`}>
        <div className={`${shellClass} grid ${shellHeight} grid-cols-4 grid-rows-2 ${GAP}`}>
          {wrapPrimaryCell(
            cell(images[0], 'Imagen principal', 0, 'col-span-2 row-span-2 h-full min-h-0', true),
            'col-span-2 row-span-2 h-full min-h-0',
          )}
          {cell(images[1], 'Imagen 2', 1, 'col-span-2 h-full min-h-0')}
          {cell(images[2], 'Imagen 3', 2, 'col-span-2 h-full min-h-0')}
        </div>
        {showAllButton}
      </div>
    );
  }

  if (images.length === 4) {
    return (
      <div className={`relative h-full min-h-0 ${className}`}>
        <div className={`${shellClass} grid ${shellHeight} grid-cols-4 grid-rows-2 ${GAP}`}>
          {wrapPrimaryCell(
            cell(images[0], 'Imagen principal', 0, 'col-span-2 row-span-2 h-full min-h-0', true),
            'col-span-2 row-span-2 h-full min-h-0',
          )}
          {cell(images[1], 'Imagen 2', 1, 'h-full min-h-0')}
          {cell(images[2], 'Imagen 3', 2, 'h-full min-h-0')}
          {cell(images[3], 'Imagen 4', 3, 'col-span-2 h-full min-h-0')}
        </div>
        {showAllButton}
      </div>
    );
  }

  const extras = images.length - 5;

  return (
    <div className={`relative h-full min-h-0 ${className}`}>
      <div className={`${shellClass} grid ${shellHeight} grid-cols-4 grid-rows-2 ${GAP}`}>
        {wrapPrimaryCell(
          cell(images[0], 'Imagen principal', 0, 'col-span-2 row-span-2 h-full min-h-0', true),
          'col-span-2 row-span-2 h-full min-h-0',
        )}
        {cell(images[1], 'Imagen 2', 1, 'h-full min-h-0')}
        {cell(images[2], 'Imagen 3', 2, 'h-full min-h-0')}
        {cell(images[3], 'Imagen 4', 3, 'h-full min-h-0')}
        {cell(
          images[4],
          extras > 0 ? `Imagen 5 y ${extras} más` : 'Imagen 5',
          4,
          'h-full min-h-0',
          false,
          extras > 0 ? (
            <span
              className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black/45 text-base font-semibold text-white"
              aria-hidden
            >
              +{extras}
            </span>
          ) : undefined,
        )}
      </div>
      {showAllButton}
    </div>
  );
};
