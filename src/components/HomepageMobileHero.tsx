import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HeroExpertCutout } from './HeroExpertCutout';

/**
 * Hero móvil de la home.
 *
 * Polish 2026-06: se retira el `HP_PANEL_GRADIENT` (linear-gradient cream→azul
 * de la banda warm-neutral AI saturada que el manual de Impeccable lista como
 * anti-patrón) y el subcomponente `MobileHeroJoy` (tres burbujas radiales
 * amarillo / azul / rosa-Airbnb + ola SVG en miniatura, decoración acumulada
 * que la marca no había decidido). El experto recortado y el copy llevan ahora
 * el peso visual sobre superficie blanca — alineado con DESIGN.md ("plano por
 * defecto", "el azul firma, no decora").
 *
 * Sin línea 50 países / 500 expertos: en móvil compite con el H1, hace wrap feo
 * con el recorte del experto (pr ~100px) y duplica mensaje que ya está en FAQ /
 * quienes-somos. Desktop la mantiene bajo el CTA del mapa.
 */
export const HomepageMobileHero: React.FC = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <section
      data-homepage-hero
      className="relative md:hidden overflow-hidden border-b border-[#e8e8e8] bg-white"
    >
      {expanded && (
        <HeroExpertCutout
          wrapperClassName="absolute bottom-0 right-3 min-[390px]:right-4 z-[1]"
          preset="mobile"
          className="min-[390px]:!h-[158px]"
        />
      )}

      <div className="relative">
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:opacity-80"
            aria-expanded={false}
            aria-label="Desplegar presentación"
          >
            <p className="hp-eyebrow">Inspección antes de comprar</p>
            <ChevronDown className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
          </button>
        )}

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="relative px-4 pt-3 pb-2">
              <div className="relative z-[1] pr-[100px] min-[390px]:pr-[112px]">
                <h1 className="hp-hero-title text-[1.35rem] min-[390px]:text-[1.45rem] leading-[1.12]">
                  Antes de comprar,
                  <span className="block text-brand">que lo revise un experto</span>
                </h1>
                <p className="hp-hero-body mt-1.5 text-[13px] min-[390px]:text-sm leading-snug">
                  Informe con fotos y vídeo. Precio cerrado y pago retenido hasta recibirlo.
                </p>
              </div>

              <div className="relative z-20 -mt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="flex min-h-8 min-w-10 items-center justify-center p-1 transition-opacity active:opacity-70"
                  aria-expanded={true}
                  aria-label="Contraer presentación"
                >
                  <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[#666666]/80" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
