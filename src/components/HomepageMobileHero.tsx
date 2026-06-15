import React, { useState } from 'react';
import { HeroBannerPhoto } from './HeroBannerPhoto';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MOBILE_HERO_PHOTO_SCRIM } from '../constants/homepageHeroMap';

/** Altura del hero expandido — texto centrado en banda superior, flecha abajo */
const MOBILE_HERO_EXPANDED_H_CLASS = 'min-h-[168px] min-[390px]:min-h-[178px]';

/**
 * Hero móvil — la imagen ya trae zona clara a la izquierda (IA).
 * Encuadre object-left + scrim full-bleed (sin panel flotante).
 */
export const HomepageMobileHero: React.FC = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <section
      data-homepage-hero
      className={`relative md:hidden overflow-hidden border-b border-[#e8e8e8] ${
        expanded ? MOBILE_HERO_EXPANDED_H_CLASS : ''
      }`}
    >
      <div className="absolute inset-0 z-0">
        <HeroBannerPhoto imgClassName="object-cover object-[62%_42%]" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: MOBILE_HERO_PHOTO_SCRIM }}
      />

      {/* Refuerzo de blanco a la izquierda: blanco sólido hasta ~54% y luego se
          funde, para que el titular a 2 líneas sea legible sin tapar el coche
          (que queda a la derecha). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_right,#ffffff_0%,#ffffff_54%,rgba(255,255,255,0.55)_66%,rgba(255,255,255,0.12)_76%,transparent_86%)]"
      />

      {/* Fundido inferior hacia el panel blanco de servicios (cose la costura) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-7 bg-gradient-to-t from-white via-white/70 to-transparent"
      />

      <div className="relative z-10">
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:opacity-80"
            aria-expanded={false}
            aria-label="Desplegar presentación"
          >
            <p className="hp-eyebrow max-w-[72%] inline-flex items-center">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" aria-hidden="true"></span>
              Inspección antes de comprar
            </p>
            <ChevronDown className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} />
          </button>
        )}

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div className={`relative ${MOBILE_HERO_EXPANDED_H_CLASS}`}>
              <div className="absolute inset-x-0 bottom-7 top-0 flex items-center px-4">
                <div className="relative max-w-[14.25rem] min-[390px]:max-w-[15rem]">
                  <h1 className="hp-hero-title leading-[1.0]">
                    <span className="block whitespace-nowrap text-[0.95rem] min-[390px]:text-[1.05rem] font-semibold tracking-[-0.02em] text-[#1c1c1c]/70">
                      Antes de comprar,
                    </span>
                    <span className="block whitespace-nowrap text-[1.15rem] min-[390px]:text-[1.25rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111827]">
                      que lo revise{' '}
                      <span className="text-brand underline decoration-[#F59E0B] decoration-[3px] underline-offset-[2px] [text-decoration-skip-ink:none]">
                        un experto
                      </span>
                    </span>
                  </h1>
                  <p className="mt-1.5 text-[13px] leading-snug text-[#3a3a3a] min-[390px]:text-sm">
                    Informe con fotos y vídeo.
                    <br />
                    <span className="font-semibold text-[#1c1c1c]">Precio cerrado</span> y{' '}
                    <span className="font-semibold text-[#1c1c1c]">pago retenido</span>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="absolute bottom-0.5 left-1/2 z-20 flex min-h-8 min-w-10 -translate-x-1/2 items-center justify-center p-1 transition-opacity active:opacity-70"
                aria-expanded={true}
                aria-label="Contraer presentación"
              >
                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[#666666]/80" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
