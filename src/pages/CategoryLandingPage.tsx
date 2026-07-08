import React, { Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { HP_PANEL_GRADIENT, SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';
import { breadcrumbSchema, faqPageSchema, serviceSchema, howToSchema } from '../utils/jsonLd';
import {
  CATEGORY_LANDINGS,
  CATEGORY_LANDING_BY_SLUG,
  LANDING_STEPS,
} from '../content/categoryLandingContent';

const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

interface CategoryLandingPageProps {
  /** Slug de la landing (la ruta es estática, el slug llega como prop desde App.tsx). */
  slug: string;
}

/**
 * Landing de categoría (SEO long-tail): /inspeccion-coche-segunda-mano, /peritaje-piso…
 * Página 100% estática (sin fetch) con la keyword en URL/H1/title, contenido real
 * y JSON-LD Service + BreadcrumbList + FAQPage. CTA único → /crear-busqueda.
 */
const CategoryLandingPage: React.FC<CategoryLandingPageProps> = ({ slug }) => {
  const navigate = useNavigate();
  const config = CATEGORY_LANDING_BY_SLUG[slug];

  // Guard: slug desconocido (error de rutas) → no reventar, mandar a la home.
  if (!config) {
    navigate('/', { replace: true });
    return null;
  }

  const path = `/${config.slug}`;
  const related = CATEGORY_LANDINGS.filter((c) => c.slug !== config.slug);

  const jsonLd = [
    serviceSchema({
      name: config.serviceName,
      description: config.seoDescription,
      url: `https://inspecciono.com${path}`,
    }),
    breadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: config.shortName, url: path },
    ]),
    faqPageSchema(config.faqs),
    howToSchema(
      `Cómo funciona ${config.h1.toLowerCase()}`,
      config.answerFirst,
      LANDING_STEPS.map((s) => ({ name: s.title, text: s.body })),
    ),
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] font-display text-[#1c1c1c]">
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        canonical={path}
        ogTitle={config.ogTitle}
        ogDescription={config.seoDescription}
        jsonLd={jsonLd}
      />

      {/* Header propio SOLO en móvil (en desktop el topbar global ya es la cabecera). */}
      <header className="sticky top-0 z-40 border-b border-[#e8e8e8] bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex h-12 items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1c1c1c] hover:bg-[#f5f5f5]"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-base font-semibold tracking-[-0.02em]">{config.shortName}</p>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[#e8e8e8]" style={{ background: HP_PANEL_GRADIENT }}>
        <div className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 md:px-6 md:py-12 lg:py-14`}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            {config.eyebrow}
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#1c1c1c] md:text-[2rem]">
            {config.h1}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#6a6a6a] md:text-base">
            {config.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/crear-busqueda')}
              className="sd-btn-primary min-w-0 px-5"
            >
              Buscar expertos en el mapa
            </button>
            <button
              type="button"
              onClick={() => navigate('/ayuda')}
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#1c1c1c] bg-white px-5 text-sm font-semibold text-[#1c1c1c] transition-colors hover:bg-[#f7f7f7]"
            >
              Cómo funciona
            </button>
          </div>
        </div>
      </section>

      <main className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-16`}>
        {/* Respuesta directa (AEO/GEO): bloque autocontenido de 40-60 palabras que los
            motores de respuesta (AI Overviews, ChatGPT, Perplexity) extraen y citan.
            Coincide LITERALMENTE con el HowTo.description del JSON-LD. */}
        <section aria-label="En resumen" className="mb-10">
          <div className="rounded-xl border border-[#e3ecf6] bg-[#f5f9fe] p-4 md:p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-brand">
              En resumen
            </p>
            <p className="text-sm leading-relaxed text-[#1c1c1c] md:text-base">
              {config.answerFirst}
            </p>
          </div>
        </section>

        {/* Qué revisa el experto */}
        <section aria-labelledby="checks-heading">
          <h2 id="checks-heading" className="hp-section-title mb-2">
            {config.checksTitle}
          </h2>
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[#6a6a6a]">
            Una revisión presencial y a fondo, hecha por un profesional verificado que trabaja
            para ti, no para el vendedor.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {config.checks.map((check) => (
              <li key={check} className="flex gap-3 rounded-lg border border-[#ebebeb] bg-white px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                <p className="text-sm leading-relaxed text-[#1c1c1c]">{check}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Cómo funciona */}
        <section aria-labelledby="steps-heading" className="mt-12 border-t border-[#e8e8e8] pt-8">
          <h2 id="steps-heading" className="hp-section-title mb-6">
            Cómo funciona · en 4 pasos
          </h2>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {LANDING_STEPS.map((step, index) => (
              <li key={step.title} className="relative rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f6fc] text-xs font-bold text-brand">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-[#1c1c1c]">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6a6a6a]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ visibles (deben coincidir con el FAQPage JSON-LD) */}
        <section aria-labelledby="faq-heading" className="mt-12 border-t border-[#e8e8e8] pt-8">
          <h2 id="faq-heading" className="hp-section-title mb-5">
            Preguntas frecuentes
          </h2>
          <div className="grid gap-3">
            {config.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-lg border border-[#ebebeb] bg-white px-4 py-3 open:pb-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#1c1c1c] [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#9ca3af] transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6a6a6a]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mt-12 rounded-xl border border-[#e8e8e8] bg-white p-5 md:p-6">
          <h2 className="text-base font-semibold text-[#1c1c1c]">
            Encuentra un experto cerca y reserva en dos minutos
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6a6a6a]">
            Compara precios y valoraciones de expertos verificados en el mapa, elige hueco en su
            calendario y paga con el dinero protegido en escrow hasta tu visto bueno.
          </p>
          <button
            type="button"
            onClick={() => navigate('/crear-busqueda')}
            className="sd-btn-primary mt-4 min-w-0 px-5"
          >
            Buscar expertos en el mapa
          </button>
        </section>

        {/* Enlazado interno entre landings */}
        <section aria-labelledby="related-heading" className="mt-12 border-t border-[#e8e8e8] pt-8">
          <h2 id="related-heading" className="hp-section-title mb-4">
            Otras inspecciones
          </h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/${c.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[#ebebeb] bg-white px-4 py-2 text-sm font-medium text-[#1c1c1c] transition-colors hover:bg-[#f7f7f7]"
                >
                  {c.shortName}
                  <ChevronRight className="h-3.5 w-3.5 text-[#9ca3af]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />

      <div className="md:hidden">
        <Suspense fallback={null}>
          <MobileBottomBar />
        </Suspense>
      </div>
    </div>
  );
};

export default CategoryLandingPage;
