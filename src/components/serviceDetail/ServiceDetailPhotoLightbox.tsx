import React, { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Image, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

interface ServiceDetailPhotoLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  loadingImages: Set<string>;
  failedImages: Set<string>;
  onImageError: (url: string) => void;
  onImageLoad: (url: string) => void;
  onImageLoadStart: (url: string) => void;
}

export const ServiceDetailPhotoLightbox: React.FC<ServiceDetailPhotoLightboxProps> = ({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
}) => {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const go = useCallback(
    (direction: 'prev' | 'next') => {
      if (images.length <= 1) return;
      onIndexChange(
        direction === 'prev'
          ? index === 0
            ? images.length - 1
            : index - 1
          : index === images.length - 1
            ? 0
            : index + 1,
      );
    },
    [images.length, index, onIndexChange],
  );

  useEffect(() => {
    if (!open || images.length <= 1) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go('next');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, images.length, go]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 48) {
      go(distance > 0 ? 'next' : 'prev');
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = images[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sd-photo-lightbox !fixed !inset-0 !left-0 !top-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 rounded-none border-0 bg-[#0a0a0a] p-0 shadow-none data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 duration-200"
        overlayClassName="bg-black/90"
        hideCloseButton
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogTitle className="sr-only">
          Foto {index + 1} de {images.length} del servicio
        </DialogTitle>
        <DialogDescription className="sr-only">Galería de fotos del servicio</DialogDescription>

        <header className="sd-photo-lightbox-header shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="sd-photo-lightbox-icon-btn"
            aria-label="Cerrar galería"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          {images.length > 1 ? (
            <span className="sd-photo-lightbox-counter tabular-nums">
              {index + 1} / {images.length}
            </span>
          ) : (
            <span className="w-10" aria-hidden />
          )}
        </header>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go('prev')}
                className="sd-photo-lightbox-nav sd-photo-lightbox-nav--prev hidden sm:flex"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => go('next')}
                className="sd-photo-lightbox-nav sd-photo-lightbox-nav--next hidden sm:flex"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={2} />
              </button>
            </>
          ) : null}

          <div className="flex h-full w-full items-center justify-center px-0 sm:px-12">
            {current ? (
              <>
                {loadingImages.has(current) ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                  </div>
                ) : null}
                <img
                  key={current}
                  src={current}
                  alt={`Foto ${index + 1} del servicio`}
                  className={`max-h-[calc(100dvh-4.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] w-full max-w-full object-contain transition-opacity duration-200 ${
                    loadingImages.has(current) ? 'opacity-0' : 'opacity-100'
                  }`}
                  onError={() => onImageError(current)}
                  onLoad={() => onImageLoad(current)}
                  onLoadStart={() => onImageLoadStart(current)}
                  draggable={false}
                />
                {failedImages.has(current) ? (
                  <div className="text-center text-white/70">
                    <Image className="mx-auto mb-2 h-12 w-12 opacity-60" strokeWidth={1.5} aria-hidden />
                    <p className="text-sm">Imagen no disponible</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="text-center text-white/70">
                <Image className="mx-auto mb-2 h-12 w-12 opacity-60" strokeWidth={1.5} aria-hidden />
                <p className="text-sm">No hay imágenes disponibles</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
