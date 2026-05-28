import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { HP_PANEL_GRADIENT } from '../constants/homepageTypography';
import { HeroExpertCutout } from './HeroExpertCutout';

const MobileHeroJoy: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    <div
      className="absolute -top-12 -left-10 h-[120px] w-[120px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(255,209,102,0.35) 0%, transparent 72%)' }}
    />
    <div
      className="absolute top-[12%] right-[-1rem] h-[80px] w-[80px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(0,102,204,0.2) 0%, transparent 72%)' }}
    />
    <div
      className="absolute bottom-[-1rem] left-[8%] h-[90px] w-[90px] rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(255,56,92,0.15) 0%, transparent 72%)' }}
    />
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 390 200" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="mobile-hero-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0066CC" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#FF385C" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#0066CC" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M 0 155 C 80 135, 160 170, 260 150 S 390 140, 390 165 L 390 200 L 0 200 Z"
        fill="url(#mobile-hero-wave)"
        opacity="0.6"
      />
    </svg>
  </div>
);

export const HomepageMobileHero: React.FC = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <section
      data-homepage-hero
      className="relative md:hidden overflow-hidden border-b border-[#e8e8e8]/90"
      style={{ background: HP_PANEL_GRADIENT }}
    >
      {expanded && (
        <HeroExpertCutout
          wrapperClassName="absolute bottom-0 right-3 z-[1]"
          className="h-[148px] origin-bottom translate-y-[20%]"
        />
      )}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!expanded}
      >
        <MobileHeroJoy />
      </div>

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
            <ChevronDown className="h-4 w-4 shrink-0 text-[#0066CC]" strokeWidth={2.5} />
          </button>
        )}

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="relative min-h-[148px] px-4 pt-4 pb-0">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb]/80 bg-white/90 text-[#666666] transition-colors active:bg-white"
                aria-label="Plegar presentación"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>

              <div className="relative z-[1] pb-4 pr-[108px]">
                <h1 className="hp-hero-title text-[1.45rem]">
                  Antes de comprar,
                  <span className="block text-[#0066CC]">que lo revise un experto</span>
                </h1>
                <p className="hp-hero-body mt-2">
                  Informe con fotos y vídeo. Precio cerrado y pago retenido hasta recibirlo.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
