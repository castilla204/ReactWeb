import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { HERO_BANNER_AVIF, HERO_BANNER_WEBP } from '../constants/homepageHeroMap';

interface HeroBannerPhotoProps {
  className?: string;
  imgClassName?: string;
}

/** Foto hero homepage — AVIF/WebP con reveal suave (blur→nítido) al cargar. */
export const HeroBannerPhoto: React.FC<HeroBannerPhotoProps> = ({
  className,
  imgClassName,
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <picture className={cn('block h-full w-full', className)}>
      <source srcSet={HERO_BANNER_AVIF} type="image/avif" />
      <img
        src={HERO_BANNER_WEBP}
        alt=""
        aria-hidden
        onLoad={() => setLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-[opacity,filter] duration-500 ease-out motion-reduce:transition-none',
          loaded ? 'opacity-100 blur-0' : 'opacity-85 blur-[2px]',
          imgClassName,
        )}
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
};

