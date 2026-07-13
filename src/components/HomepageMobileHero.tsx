import React from 'react';

import { MOBILE_HERO_BANNER_SVG } from '../constants/homepageHeroMap';
import { ESCROW_HERO_MOBILE_LEAD } from '../constants/escrowCopy';
import {
  HomepageMobileHeroCopyPlaceholder,
  HomepageMobileHeroLqip,
  HomepageMobileHeroShell,
} from './homepage/HomepageMobileHeroShell';

const MOBILE_HERO_SEO_TITLE =
  'Antes de comprar, que lo revise un experto';

/** Banner SVG a ancho completo — copy y gráfico integrados en el asset. */
const MobileHeroBannerSvg: React.FC = () => (
  <img
    src={MOBILE_HERO_BANNER_SVG}
    alt={`${MOBILE_HERO_SEO_TITLE}. ${ESCROW_HERO_MOBILE_LEAD}`}
    className="h-full w-full object-cover object-center"
    fetchPriority="high"
    decoding="async"
  />
);

/**
 * Hero móvil — banner SVG con mensaje de confianza al entrar.
 * El copy visible vive en el asset; el h1 oculto mantiene SEO y lectores de pantalla.
 */
export const HomepageMobileHero: React.FC = () => (
  <HomepageMobileHeroShell
    variant="svg"
    photoLayer={<MobileHeroBannerSvg />}
    photoBacked={false}
  >
    <h1 className="sr-only">
      {MOBILE_HERO_SEO_TITLE}. {ESCROW_HERO_MOBILE_LEAD}
    </h1>
  </HomepageMobileHeroShell>
);

/** Variante skeleton — gradiente + copy placeholder (sin foto blur). */
export const HomepageMobileHeroPlaceholder: React.FC = () => (
  <HomepageMobileHeroShell photoLayer={<HomepageMobileHeroLqip />} photoBacked={false}>
    <HomepageMobileHeroCopyPlaceholder />
  </HomepageMobileHeroShell>
);
