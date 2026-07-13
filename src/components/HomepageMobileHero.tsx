import React from 'react';

import { HeroBannerPhoto } from './HeroBannerPhoto';
import { ESCROW_HERO_MOBILE_LEAD } from '../constants/escrowCopy';
import {
  HomepageMobileHeroCopyPlaceholder,
  HomepageMobileHeroLqip,
  HomepageMobileHeroShell,
} from './homepage/HomepageMobileHeroShell';

/**
 * Hero móvil — mensaje de confianza al entrar. Titular + línea de entrega en
 * UNA sola columna a la izquierda (mismo ancho), centrada verticalmente. La
 * foto (perito + coche real a la derecha) se recorta en vertical: a esta
 * proporción `object-cover` muestra todo el ancho, así que el foco vertical
 * (Y) es la palanca real de encuadre.
 *
 * Al montar, el subrayado ámbar de "un experto" se dibuja como un trazo de
 * bolígrafo (el perito "firma" la palabra clave). El copy es siempre visible;
 * con reduced-motion el subrayado queda estático y completo.
 */
export const HomepageMobileHero: React.FC = () => (
  <HomepageMobileHeroShell photoLayer={<HeroBannerPhoto imgClassName="object-[65%_37%]" />}>
    <div className="absolute inset-0 flex flex-col justify-center px-4">
      <div className="relative min-w-0 max-w-[14.5rem] min-[390px]:max-w-[15rem]">
        <h1 className="hp-hero-title leading-[1.02]">
          <span className="block whitespace-nowrap text-caption min-[390px]:text-meta font-semibold tracking-[-0.02em] text-ink-muted">
            Antes de comprar,
          </span>
          <span className="block whitespace-nowrap text-[1.18rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink-strong min-[390px]:text-[1.24rem]">
            que lo revise{' '}
            <span className="hp-hero-underline-ink inline-block text-brand">
              un experto
            </span>
          </span>
        </h1>

        <p className="m-0 mt-1.5 text-balance text-caption min-[390px]:text-meta leading-snug text-ink-muted">
          {ESCROW_HERO_MOBILE_LEAD}
        </p>
      </div>
    </div>
  </HomepageMobileHeroShell>
);

/** Variante skeleton — gradiente + copy placeholder (sin foto blur). */
export const HomepageMobileHeroPlaceholder: React.FC = () => (
  <HomepageMobileHeroShell photoLayer={<HomepageMobileHeroLqip />} photoBacked={false}>
    <HomepageMobileHeroCopyPlaceholder />
  </HomepageMobileHeroShell>
);
