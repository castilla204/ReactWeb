import React from 'react';

import { HeroBannerPhoto } from './HeroBannerPhoto';

import {

  HomepageMobileHeroCopyPlaceholder,

  HomepageMobileHeroLqip,

  HomepageMobileHeroShell,

} from './homepage/HomepageMobileHeroShell';



/**

 * Hero móvil — mensaje de confianza al entrar. Forma parte del scroll natural

 * de la página (no fijo): al explorar expertos se desplaza hacia arriba y

 * deja espacio al catálogo, como en marketplaces tipo Airbnb.

 */

export const HomepageMobileHero: React.FC = () => (

  <HomepageMobileHeroShell photoLayer={<HeroBannerPhoto imgClassName="object-[62%_42%]" />}>

    <div className="absolute inset-x-0 bottom-3 top-0 flex items-center px-4 min-[390px]:bottom-4">

      <div className="relative max-w-[14.25rem] min-[390px]:max-w-[15rem]">

        <h1 className="hp-hero-title leading-[1.0]">

          <span className="block whitespace-nowrap text-[0.95rem] min-[390px]:text-[1.05rem] font-semibold tracking-[-0.02em] text-ink-strong/70">

            Antes de comprar,

          </span>

          <span className="block whitespace-nowrap text-[1.15rem] min-[390px]:text-[1.25rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink-strong">

            que lo revise{' '}

            <span className="text-brand underline decoration-amber-500 decoration-[3px] underline-offset-[2px] [text-decoration-skip-ink:none]">

              un experto

            </span>

          </span>

        </h1>

        <p className="mt-1 text-caption leading-snug text-ink min-[390px]:mt-1.5 min-[390px]:text-meta min-[390px]:text-sm text-pretty">

          Informe con fotos y vídeo.{' '}

          <span className="font-semibold text-ink-strong">Precio cerrado</span> y{' '}

          <span className="font-semibold text-ink-strong">pago retenido</span>.

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


