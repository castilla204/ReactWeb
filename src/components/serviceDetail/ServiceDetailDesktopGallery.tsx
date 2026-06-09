import React from 'react';
import { Image } from 'lucide-react';

interface ServiceDetailDesktopGalleryProps {
  images: string[];
  onOpen: (index: number) => void;
  loadingImages: Set<string>;
  failedImages: Set<string>;
  onImageError: (url: string) => void;
  onImageLoad: (url: string) => void;
  onImageLoadStart: (url: string) => void;
}

const SHELL = 'overflow-hidden rounded-2xl border border-[#e8e8e8] shadow-[0_2px_12px_rgba(15,23,42,0.05)]';
/** Altura contenida: la galería vive en la columna izquierda del grid, no a ancho completo */
const HEIGHT = 'h-[min(400px,42vh)]';

export const ServiceDetailDesktopGallery: React.FC<ServiceDetailDesktopGalleryProps> = ({
  images,
  onOpen,
  loadingImages,
  failedImages,
  onImageError,
  onImageLoad,
  onImageLoadStart,
}) => {
  const cell = (src: string, alt: string, idx: number, className: string, eager = false) => (
    <button
      type="button"
      key={`${src}-${idx}`}
      className={`relative bg-[#f0f0f0] text-left ${className}`}
      onClick={() => onOpen(idx)}
    >
      {loadingImages.has(src) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f5f5f5]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#ddd] border-t-brand" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${loadingImages.has(src) ? 'opacity-0' : 'opacity-100'}`}
        onError={() => onImageError(src)}
        onLoad={() => onImageLoad(src)}
        onLoadStart={() => onImageLoadStart(src)}
        loading={eager ? 'eager' : 'lazy'}
      />
    </button>
  );

  if (images.length === 0) {
    return (
      <div className={`flex ${HEIGHT} items-center justify-center ${SHELL} bg-[#f7f7f7]`}>
        <div className="text-center">
          <Image className="mx-auto mb-2 h-8 w-8 text-[#a3a3a3]" strokeWidth={1.5} />
          <p className="text-sm text-[#6a6a6a]">Sin imágenes</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return <div className={SHELL}>{cell(images[0], 'Imagen', 0, `block w-full ${HEIGHT}`, true)}</div>;
  }

  if (images.length === 2) {
    return (
      <div className={`grid ${HEIGHT} grid-cols-2 gap-px ${SHELL} bg-[#e8e8e8]`}>
        {cell(images[0], 'Imagen 1', 0, 'h-full', true)}
        {cell(images[1], 'Imagen 2', 1, 'h-full')}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className={`grid ${HEIGHT} grid-cols-3 gap-px ${SHELL} bg-[#e8e8e8]`}>
        {cell(images[0], 'Imagen 1', 0, 'col-span-2 row-span-2 h-full', true)}
        {cell(images[1], 'Imagen 2', 1, 'h-full')}
        {cell(images[2], 'Imagen 3', 2, 'h-full')}
      </div>
    );
  }

  const extras = images.length - 5;

  return (
    <div className={`grid ${HEIGHT} grid-cols-4 grid-rows-2 gap-px ${SHELL} bg-[#e8e8e8]`}>
      {cell(images[0], 'Principal', 0, 'col-span-2 row-span-2 h-full', true)}
      {cell(images[1], 'Imagen 2', 1, 'h-full')}
      {cell(images[2], 'Imagen 3', 2, 'h-full')}
      {images.length >= 5 ? (
        <button
          type="button"
          className="relative h-full bg-[#f0f0f0]"
          onClick={() => onOpen(4)}
        >
          <img src={images[4]} alt="" className="h-full w-full object-cover" loading="lazy" />
          {extras > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
              +{extras}
            </span>
          )}
        </button>
      ) : (
        images[3] && cell(images[3], 'Imagen 4', 3, 'h-full')
      )}
    </div>
  );
};
