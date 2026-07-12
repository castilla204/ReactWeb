import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { Search, UserCheck, ClipboardCheck, ShieldCheck } from 'lucide-react';

import { HP_FONT, HP_HERO_COVERAGE } from '../constants/homepageTypography';

/* ── Mismo sistema que DesktopLanding / hero: plano, el azul firma ── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
};

const viewportOnce = { once: true, margin: '-60px' } as const;

const STEPS = [
  {
    icon: Search,
    step: '01',
    title: 'Cuéntanos qué vas a comprar',
    body: 'Pega el enlace del anuncio o describe el coche, piso o moto. Eliges la zona y en minutos te emparejamos con un experto local verificado.',
  },
  {
    icon: UserCheck,
    step: '02',
    title: 'Un experto lo revisa en persona',
    body: 'Va a ver el artículo, lo inspecciona a fondo y comprueba lo que un anuncio nunca cuenta. Tú sigues el proceso desde el chat.',
  },
  {
    icon: ClipboardCheck,
    step: '03',
    title: 'Recibes el informe y decides',
    body: 'Un PDF con fotos y vídeo en 24h de media. El pago queda retenido: el experto no cobra hasta que tú das el visto bueno.',
  },
] as const;

const METRICS = [
  { value: `${HP_HERO_COVERAGE.countriesMin}+`, label: 'países con cobertura' },
  { value: `${HP_HERO_COVERAGE.expertsMin}+`, label: 'expertos verificados' },
  { value: '24h', label: 'media de entrega' },
  { value: '25€', label: 'desde, precio cerrado' },
] as const;

export const HomepageHowItWorks: React.FC = () => (
  <section
    aria-labelledby="how-it-works-title"
    className="border-t border-[#e8e8e8]/80 bg-white"
    style={{ fontFamily: HP_FONT }}
  >
    <div className="mx-auto w-full max-w-[1280px] px-4 py-12 md:px-6 md:py-16 lg:px-10 lg:py-20">
      {/* Cabecera */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="max-w-2xl"
      >
        <p className="text-[13px] font-medium text-[#737373]">Cómo funciona</p>
        <h2
          id="how-it-works-title"
          className="mt-2 text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.035em] text-[#1c1c1c] lg:text-[2rem] text-balance"
        >
          De la duda al informe en <span className="text-brand">tres pasos</span>
        </h2>
        <p className="mt-3 text-[15px] leading-snug text-[#666666] lg:text-[16px]">
          Sin desplazarte, sin fiarte solo de las fotos del anuncio. Un profesional lo comprueba por ti.
        </p>
      </motion.div>

      {/* Pasos */}
      <motion.ol
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6"
      >
        {STEPS.map(({ icon: Icon, step, title, body }) => (
          <motion.li
            key={step}
            variants={fadeUp}
            className="relative flex flex-col rounded-2xl border border-[#ebebeb] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:p-7"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--brand)/0.08)] text-brand">
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-[#d4d4d4]">
                {step}
              </span>
            </div>
            <h3 className="mt-5 text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#1c1c1c]">
              {title}
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#666666]">{body}</p>
          </motion.li>
        ))}
      </motion.ol>

      {/* Banda de métricas / confianza */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-6 rounded-2xl border border-[#ebebeb] bg-[#fafafa] px-4 py-6 sm:px-6 lg:mt-8"
      >
        <div className="grid grid-cols-2 gap-y-6 lg:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="flex flex-col items-center text-center">
              <span className="text-[1.5rem] font-bold leading-none tracking-[-0.03em] text-[#1c1c1c] lg:text-[1.75rem]">
                {m.value}
              </span>
              <span className="mt-1.5 text-[12.5px] leading-snug text-[#737373]">
                {m.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#ececec] pt-5 text-[13px] text-[#666666]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand" strokeWidth={2} aria-hidden />
          <span>
            Pago protegido con Stripe · retenido hasta que aceptas el informe
          </span>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HomepageHowItWorks;
