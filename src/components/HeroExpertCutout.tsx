import React from 'react';
import heroExpertImg from '../media/hero-expert-transparent.png';
import { cn } from '../lib/utils';

const PRESETS = {
  compact: 'h-[152px] translate-y-[22%]',
  mobile: 'h-[148px] translate-y-[20%]',
  /** PNG recortado + espejo en asset (sin scaleX → no recorte lateral) */
  'desktop-hero':
    'h-[400px] md:h-[480px] lg:h-[600px] xl:h-[620px] origin-bottom translate-y-[20%] md:translate-y-[22%] lg:translate-y-[24%] xl:translate-y-[24%]',
} as const;

/**
 * Experto anclado al borde inferior de la sección hero.
 * Las piernas quedan fuera del viewport (recorte del `overflow-hidden` del hero),
 * no un recuadro flotante a media altura.
 */
export const HeroExpertCutout: React.FC<{
  className?: string;
  wrapperClassName?: string;
  preset?: keyof typeof PRESETS;
}> = ({ className, wrapperClassName, preset = 'compact' }) => (
  <div
    className={cn('pointer-events-none shrink-0 self-end leading-[0]', wrapperClassName)}
    aria-hidden
  >
    <img
      src={heroExpertImg}
      alt=""
      className={cn(
        'block w-auto max-w-none select-none',
        'origin-bottom',
        PRESETS[preset],
        className,
      )}
      fetchPriority="high"
      decoding="async"
    />
  </div>
);
