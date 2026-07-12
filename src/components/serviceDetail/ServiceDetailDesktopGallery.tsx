import React from 'react';
import { Image, LayoutGrid } from 'lucide-react';
import { SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS } from '../../constants/homepageTypography';
import { SileoSkeleton } from '../ui/sileo-skeleton';
import { cn } from '../../lib/utils';

interface ServiceDetailDesktopGalleryPrimaryOverlays {
  /** Arriba-izquierda de la foto principal (p. ej. volver) */
  topLeft?: React.ReactNode;
  /** Arriba-derecha de la foto principal (p. ej. guardar/favorito) */
  topRight?: React.ReactNode;
  /** Abajo con degradado (p. ej. título del servicio) — solo celda principal */
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
  primaryOverlays?: ServiceDetailDesktopGalleryPrimaryOverlays;
  className?: string;
}

const GAP = 'gap-0.5';

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
  const shellClass = cn('sd-gallery-shell', isSplit && '!rounded-none');
  const hasPrimaryOverlays = Boolean(
    primaryOverlays?.topLeft || primaryOverlays?.topRight || primaryOverlays?.bottom,
  );
  const showGalleryFab = images.length > 1;

  const showAllButton = showGalleryFab ? (
    <button
      type="button"
      onClick={() => onOpen(0)}
      className={cn(
        'sd-gallery-show-all pointer-events-auto inline-flex items-center gap-1.5 font-semibold transition-colors active:scale-[0.99]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        isSplit
          ? 'rounded-sm border border-ink/12 bg-white px-2.5 py-1.5 text-kicker text-ink shadow-[0_1px_3px_rgba(0,0,0,0.14)] hover:bg-surface-tinted'
          : 'bottom-4 right-4 gap-2 rounded-lg border border-ink bg-white px-4 py-2.5 text-sm text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-surface-tinted',
      )}
      aria-label={`Ver las ${images.length} fotos del servicio`}
    >
      <LayoutGrid
        className={cn('shrink-0', isSplit ? 'h-3 w-3' : 'h-4 w-4')}
        strokeWidth={2}
        aria-hidden
      />
      Ver las {images.length} fotos
    </button>
  ) : null;

  const wrapPrimaryCell = (node: React.ReactNode, cellClassName: string) => {
    if (!hasPrimaryOverlays && !showGalleryFab) {
      return node;
    }
    return (
      <div className={cn('relative min-h-0', cellClassName)}>
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
        {/* Scrim superior suave — legibilidad de botones sin oscurecer toda la foto */}
        {hasPrimaryOverlays ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-16 bg-gradient-to-b from-black/20 to-transparent"
            aria-hidden
          />
        ) : null}
        {showGalleryFab ? (
          <div className="pointer-events-none absolute bottom-3 right-3 z-20">
            {showAllButton}
          </div>
        ) : null}
        {primaryOverlays?.bottom ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 max-h-[38%]">
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
    isSecondary = false,
  ) => (
    <button
      type="button"
      key={`${src}-${idx}`}
      className={cn('sd-gallery-cell', isSecondary && 'sd-gallery-cell--secondary', cellClassName)}
      onClick={() => onOpen(idx)}
      aria-label={alt}
    >
      <span className="sd-gallery-cell-overlay" aria-hidden />
      {loadingImages.has(src) && (
        <SileoSkeleton className="absolute inset-0 z-10 h-full w-full bg-line-soft" rounded="none" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          loadingImages.has(src) ? 'opacity-0' : 'opacity-100',
        )}
        onError={() => onImageError(src)}
        onLoad={() => onImageLoad(src)}
        onLoadStart={() => onImageLoadStart(src)}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      {overlay}
    </button>
  );

  if (images.length === 0) {
    return (
      <div
        className={cn(
          shellClass,
          'relative flex items-center justify-center border border-line',
          shellHeight,
          className,
        )}
      >
        <div className="text-center">
          <Image className="mx-auto mb-2 h-8 w-8 text-ink-soft" strokeWidth={1.5} />
          <p className="text-sm text-ink-muted">Sin imágenes</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn(shellClass, 'relative', shellHeight, className)}>
        {wrapPrimaryCell(
          cell(images[0], 'Imagen principal del servicio', 0, 'h-full w-full', true),
          'h-full w-full',
        )}
      </div>
    );
  }

  /* Split + mapa: una sola foto a ancho completo; el resto en el lightbox */
  if (images.length === 2 && isSplit) {
    return (
      <div className={cn(shellClass, 'relative', shellHeight, className)}>
        {wrapPrimaryCell(
          cell(images[0], 'Imagen principal del servicio', 0, 'h-full w-full', true),
          'h-full w-full',
        )}
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className={cn('relative h-full min-h-0', className)}>
        <div className={cn(shellClass, 'grid', shellHeight, 'grid-cols-2', GAP)}>
          {wrapPrimaryCell(cell(images[0], 'Imagen 1', 0, 'h-full min-h-0', true), 'h-full min-h-0')}
          {cell(images[1], 'Imagen 2', 1, 'h-full min-h-0', true, undefined, true)}
        </div>
      </div>
    );
  }

  if (images.length === 3 && isSplit) {
    return (
      <div className={cn('relative h-full min-h-0', className)}>
        <div
          className={cn(
            shellClass,
            'grid h-full min-h-0',
            shellHeight,
            GAP,
            'grid-cols-2 grid-rows-2',
          )}
        >
          {wrapPrimaryCell(
            cell(images[0], 'Imagen principal', 0, 'row-span-2 h-full min-h-0', true),
            'row-span-2 h-full min-h-0',
          )}
          {cell(images[1], 'Imagen 2', 1, 'h-full min-h-0', true, undefined, true)}
          {cell(images[2], 'Imagen 3', 2, 'h-full min-h-0', true, undefined, true)}
        </div>
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className={cn('relative h-full min-h-0', className)}>
        <div className={cn(shellClass, 'grid', shellHeight, 'grid-cols-4 grid-rows-2', GAP)}>
          {wrapPrimaryCell(
            cell(images[0], 'Imagen principal', 0, 'col-span-2 row-span-2 h-full min-h-0', true),
            'col-span-2 row-span-2 h-full min-h-0',
          )}
          {cell(images[1], 'Imagen 2', 1, 'col-span-2 h-full min-h-0', true, undefined, true)}
          {cell(images[2], 'Imagen 3', 2, 'col-span-2 h-full min-h-0', true, undefined, true)}
        </div>
      </div>
    );
  }

  if (images.length === 4) {
    return (
      <div className={cn('relative h-full min-h-0', className)}>
        <div className={cn(shellClass, 'grid', shellHeight, 'grid-cols-4 grid-rows-2', GAP)}>
          {wrapPrimaryCell(
            cell(images[0], 'Imagen principal', 0, 'col-span-2 row-span-2 h-full min-h-0', true),
            'col-span-2 row-span-2 h-full min-h-0',
          )}
          {cell(images[1], 'Imagen 2', 1, 'h-full min-h-0', true, undefined, true)}
          {cell(images[2], 'Imagen 3', 2, 'h-full min-h-0', true, undefined, true)}
          {cell(images[3], 'Imagen 4', 3, 'col-span-2 h-full min-h-0', true, undefined, true)}
        </div>
      </div>
    );
  }

  const extras = images.length - 5;

  return (
    <div className={cn('relative h-full min-h-0', className)}>
      <div className={cn(shellClass, 'grid', shellHeight, 'grid-cols-4 grid-rows-2', GAP)}>
        {wrapPrimaryCell(
          cell(images[0], 'Imagen principal', 0, 'col-span-2 row-span-2 h-full min-h-0', true),
          'col-span-2 row-span-2 h-full min-h-0',
        )}
        {cell(images[1], 'Imagen 2', 1, 'h-full min-h-0', true, undefined, true)}
        {cell(images[2], 'Imagen 3', 2, 'h-full min-h-0', true, undefined, true)}
        {cell(images[3], 'Imagen 4', 3, 'h-full min-h-0', true, undefined, true)}
        {cell(
          images[4],
          extras > 0 ? `Imagen 5 y ${extras} más` : 'Imagen 5',
          4,
          'h-full min-h-0',
          true,
          extras > 0 ? (
            <span
              className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black/30 text-base font-semibold text-white"
              aria-hidden
            >
              +{extras}
            </span>
          ) : undefined,
          true,
        )}
      </div>
    </div>
  );
};
