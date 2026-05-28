import React from 'react';
import heroExpertImg from '../media/hero-expert-cutout.png';
import { cn } from '../lib/utils';

/**
 * Experto anclado al borde inferior de la sección hero.
 * Las piernas quedan fuera del viewport (recorte del `overflow-hidden` del hero),
 * no un recuadro flotante a media altura.
 */
export const HeroExpertCutout: React.FC<{
  className?: string;
  wrapperClassName?: string;
}> = ({ className, wrapperClassName }) => (
  <div
    className={cn('pointer-events-none shrink-0 self-end leading-[0]', wrapperClassName)}
    aria-hidden
  >
    <img
      src={heroExpertImg}
      alt=""
      className={cn(
        'block w-auto max-w-none select-none',
        'h-[152px] md:h-[248px] lg:h-[292px]',
        /* Empuja piernas bajo el borde inferior del hero */
        'origin-bottom translate-y-[22%] md:translate-y-[26%] lg:translate-y-[28%]',
        className,
      )}
      fetchPriority="high"
      decoding="async"
    />
  </div>
);
