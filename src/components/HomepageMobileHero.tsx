import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { motion } from 'framer-motion';
import heroExpertImg from '../media/hero-expert-cutout.png';
import { HP_PANEL_GRADIENT } from '../constants/homepageTypography';

const MobileHeroJoy: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    <div className="absolute -top-12 -left-10 h-[120px] w-[120px] rounded-full bg-[#FFD166]/28 blur-2xl" />
    <div className="absolute top-[12%] right-[-1rem] h-[80px] w-[80px] rounded-full bg-[#0066CC]/16 blur-2xl" />
    <div className="absolute bottom-[-1rem] left-[8%] h-[90px] w-[90px] rounded-full bg-[#FF385C]/12 blur-2xl" />
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
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.22 }}
      >
        <MobileHeroJoy />
      </motion.div>

      <div className="relative">
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:opacity-80"
            aria-expanded={false}
            aria-label="Desplegar presentación"
          >
            <p className="hp-eyebrow">
              Inspección antes de comprar
            </p>
            <ChevronDown className="h-4 w-4 shrink-0 text-[#0066CC]" strokeWidth={2.5} />
          </button>
        )}

        <motion.div
          initial={false}
          animate={{
            height: expanded ? 'auto' : 0,
            opacity: expanded ? 1 : 0,
          }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="relative min-h-[148px] px-4 pt-4 pb-0">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb]/80 bg-white/80 text-[#666666] backdrop-blur-sm transition-colors active:bg-white"
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

            {/* Recorte desde arriba: cabeza+torso visibles, piernas fuera por el borde inferior */}
            <div
              className="pointer-events-none absolute bottom-0 right-4 w-[114px] h-[138px] overflow-hidden"
              aria-hidden
            >
              <img
                src={heroExpertImg}
                alt=""
                className="block w-[118px] max-w-none h-auto"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
