import React from 'react';
import { cn } from '../lib/utils';
import { HERO_BANNER_AVIF, HERO_BANNER_WEBP } from '../constants/homepageHeroMap';

interface HeroBannerPhotoProps {
  className?: string;
  imgClassName?: string;
}

/** Foto hero homepage — AVIF/WebP optimizados desde src/media/imagenbanner.png */
export const HeroBannerPhoto: React.FC<HeroBannerPhotoProps> = ({
  className,
  imgClassName,
}) => (
  <picture className={cn('block h-full w-full', className)}>
    <source srcSet={HERO_BANNER_AVIF} type="image/avif" />
    <img
      src={HERO_BANNER_WEBP}
      alt=""
      aria-hidden
      className={cn('h-full w-full object-cover', imgClassName)}
      fetchPriority="high"
      decoding="async"
    />
  </picture>
);
