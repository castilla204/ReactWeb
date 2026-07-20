import React from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

import revisionCasa from '../media/revisioncasa.jpg';

import { HP_FONT } from '../constants/homepageTypography';
import { useAccountIdentity } from './accountMenuShared';

/* ── Misma tipografía y paleta que hero / HomepageWall ── */
const FONT = HP_FONT;

const C = {
  // Sistema según DESIGN.md ("El gabinete del perito" — plano por defecto,
  // el azul firma, no decora). Sin gradientes ni washes decorativos.
  bg: 'hsl(var(--surface-tinted))',
  bgAlt: 'hsl(var(--surface))',
  text: 'hsl(var(--ink-strong))',
  textBody: 'hsl(var(--ink-muted))',
  textMuted: 'hsl(var(--ink-muted))',
  brand: 'hsl(var(--brand))',
  brandHover: 'hsl(var(--brand-hover))',
  border: 'hsl(var(--line))',
  borderLight: 'hsl(var(--line))',
} as const;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

const viewportOnce = { once: true, margin: '-80px' } as const;

const FAQS = [
  {
    q: '¿Cuánto cuesta una revisión?',
    a: 'Desde 25€. El precio depende de la categoría, la distancia y si quieres también búsqueda online. Lo ves cerrado antes de aceptar — no hay sorpresas después.',
  },
  {
    q: '¿En cuánto tiempo recibo el informe?',
    a: 'La media es 24 horas desde que el experto hace la inspección. En urgencias, el mismo día. Se entrega como PDF con fotos y un vídeo corto.',
  },
  {
    q: '¿Y si el informe no me convence?',
    a: 'Si el experto no cumple lo que prometió o el informe está incompleto, abrimos disputa y te devolvemos el pago. Por eso lo retenemos hasta que tú confirmas.',
  },
  {
    q: '¿Cómo verificáis a los expertos?',
    a: 'Validación de DNI, comprobación de experiencia profesional (mecánico, perito, agente colegiado…) y revisión de sus 3 primeras inspecciones antes de promocionarles. Las reseñas hacen el resto.',
  },
  {
    q: '¿El pago es seguro?',
    a: 'Sí. Pasa por Stripe y queda retenido. Ni nosotros ni el experto tocamos el dinero hasta que tú aceptas el informe.',
  },
  {
    q: '¿Hacéis revisiones fuera de España?',
    a: 'Sí, ya operamos en 50+ países. La cobertura más densa está en España, Portugal, Francia, Italia y México. Si tu zona no aparece, escríbenos y la abrimos.',
  },
] as const;

/* Un solo techo tipográfico para toda la página: el mismo token "headline"
   que usa el H1 del hero (index.css .hp-hero-title-lg lg:), en vez de un
   valor suelto que escalaba por encima de él (2rem → sensación de "grande"
   sin escalón real entre hero y secciones). */
const sectionTitle =
  'text-headline font-semibold leading-[1.12] tracking-[-0.035em] text-ink-strong';

const sectionSubtitle = 'mt-3 text-lead lg:text-[16px] leading-snug text-ink-muted';

const SectionHeading: React.FC<{
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  id: string;
  align?: 'center' | 'left';
}> = ({ eyebrow, title, subtitle, id, align = 'center' }) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    whileInView="visible"
    viewport={viewportOnce}
    className={align === 'center' ? 'text-center max-w-2xl mx-auto' : 'max-w-xl'}
  >
    {eyebrow && (
      <p className="text-meta font-medium text-ink-muted">{eyebrow}</p>
    )}
    <h2 id={id} className={`${eyebrow ? 'mt-2' : ''} ${sectionTitle}`}>
      {title}
    </h2>
    {subtitle && <p className={sectionSubtitle}>{subtitle}</p>}
  </motion.div>
);

const ExpertsBand: React.FC = () => (
  <section
    aria-labelledby="experts-title"
    className="py-16 lg:py-20 border-t border-line/80 bg-white"
  >
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">
      <div className="grid grid-cols-12 gap-10 items-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="col-span-7"
        >
          <motion.p variants={fadeUp} className="text-meta font-medium text-ink-muted">
            Para expertos
          </motion.p>

          <motion.h2 variants={fadeUp} id="experts-title" className={`mt-2 ${sectionTitle}`}>
            ¿Mecánico, perito o agente inmobiliario?{' '}
            <span className="text-brand">Tu experiencia, en ingresos.</span>
          </motion.h2>

          <motion.ul
            variants={fadeUp}
            className="mt-6 space-y-2 text-lead leading-snug text-ink-muted list-disc pl-5 marker:text-line"
          >
            <li>Cobra por inspección — desde 25€ por una revisión rápida.</li>
            <li>Eliges tú las zonas, los horarios y las categorías que aceptas.</li>
            <li>Pagos automáticos vía Stripe en tu cuenta cada semana.</li>
          </motion.ul>

          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              to="/expert/join"
              className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-meta font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] hover:bg-brand-hover transition-colors"
            >
              Hazte experto
            </Link>
            <span className="text-meta text-ink-muted">Alta gratis · sin permanencia</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.45, ease: EASE }}
          className="col-span-5"
        >
          <div className="relative aspect-[5/6] rounded-2xl overflow-hidden border border-line">
            <img
              src={revisionCasa}
              alt="Experto inmobiliario inspeccionando una vivienda"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const FAQ: React.FC = () => (
  <section
    aria-labelledby="faq-title"
    className="py-16 lg:py-20 border-t border-line/80"
    style={{ background: C.bg }}
  >
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-5">
          <SectionHeading
            id="faq-title"
            align="left"
            eyebrow="Preguntas frecuentes"
            title="Lo que nos preguntan antes de pedir una revisión"
            subtitle="Si no encuentras lo que buscas, escríbenos. Respondemos en menos de un día."
          />
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="col-span-7"
        >
          <Accordion.Root
            type="single"
            collapsible
            defaultValue="faq-0"
            className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden"
          >
            {FAQS.map((f, i) => (
              <Accordion.Item key={f.q} value={`faq-${i}`}>
                <Accordion.Header asChild>
                  <h3>
                    <Accordion.Trigger className="group w-full flex items-center justify-between gap-6 text-left px-5 py-4 hover:bg-surface-tinted transition-colors">
                      <span className="text-lead font-medium text-ink">{f.q}</span>
                      <ChevronDown
                        className="w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-brand"
                        aria-hidden
                      />
                    </Accordion.Trigger>
                  </h3>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <p className="px-5 pb-4 text-lead leading-snug text-ink-muted">{f.a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </motion.div>
      </div>
    </div>
  </section>
);

const FinalCTA: React.FC = () => (
  <section
    aria-labelledby="cta-final-title"
    className="py-14 lg:py-16 border-t border-line/80"
    style={{ background: C.bgAlt }}
  >
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div className="max-w-xl">
          <h2 id="cta-final-title" className={sectionTitle}>
            Empieza con tu primera revisión
          </h2>
          <p className={sectionSubtitle}>
            Desde 25€ y en 24h. Cuéntanos qué quieres comprar y te emparejamos con un
            experto local hoy mismo.
          </p>
        </div>
        <Link
          to="/hire"
          className="inline-flex w-fit shrink-0 items-center rounded-full bg-brand px-5 py-2.5 text-meta font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] hover:bg-brand-hover transition-colors"
        >
          Pedir una revisión
        </Link>
      </motion.div>
    </div>
  </section>
);

const DesktopLanding: React.FC = () => {
  // Un experto ya registrado no debe ver la banda de captación "Hazte experto"
  // (le ofrecería darse de alta de algo que ya es). El resto de la landing
  // —FAQ, CTA final— sí le sirve: un experto también puede contratar a otro perito.
  const { isExpert } = useAccountIdentity();
  return (
    <div className="hidden md:block" style={{ fontFamily: FONT, background: C.bg }}>
      {!isExpert && <ExpertsBand />}
      <FAQ />
      <FinalCTA />
    </div>
  );
};

export default DesktopLanding;
