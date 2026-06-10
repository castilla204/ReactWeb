import React from 'react';
import { cn } from '../lib/utils';

// ⚡ El hero es el candidato a LCP. Vive en public/ con nombre ESTABLE (sin hash)
// para poder precargarlo desde index.html — antes (import hasheado dentro de un
// chunk lazy) el navegador lo descubría tras 3 saltos de red: HTML → JS → chunk → img.
// Variantes generadas por scripts/optimize-images.mjs:
//   AVIF 26 KB · WebP 27 KB · PNG original 109 KB.
const heroExpertAvif = '/hero-expert.avif';
const heroExpertWebp = '/hero-expert.webp';

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
    <picture>
      {/* AVIF gana ~5-20% sobre WebP a calidad equivalente; soporte ≥94% en 2026. */}
      <source srcSet={heroExpertAvif} type="image/avif" />
      <img
        src={heroExpertWebp}
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
    </picture>
  </div>
);
