import React, { Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { HP_PANEL_GRADIENT, SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';
import { breadcrumbSchema, faqPageSchema, serviceSchema, howToSchema } from '../utils/jsonLd';
import {
  CITY_LANDING_BY_SLUG,
  CITY_INSPECTION_CATEGORIES,
  CITY_LANDING_STEPS,
} from '../content/cityLandingContent';
import { persistHireSearchLocation } from '../utils/hireSearchContext';

const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

interface CityLandingPageProps {
  /** Slug de la landing de ciudad (la ruta es estática, el slug llega como prop). */
  slug: string;
}

const COVERAGE_HUB_PATH = '/inspeccion-segunda-mano-espana';

/**
 * Landing SEO local por provincia: /inspeccion-segunda-mano-<ciudad>.
 * Contenido diferenciado con datos locales reales (provincia, comunidad, población,
 * ciudades cercanas) para NO ser una doorway page. El CTA precentra el mapa del
 * buscador en la ciudad → la página es un destino útil, no un embudo vacío.
 */
const CityLandingPage: React.FC<CityLandingPageProps> = ({ slug }) => {
  const navigate = useNavigate();
  const config = CITY_LANDING_BY_SLUG[slug];

  // Guard: slug desconocido (error de rutas) → no reventar, mandar a la home.
  if (!config) {
    navigate('/', { replace: true });
    return null;
  }

  const path = `/inspeccion-segunda-mano-${config.slug}`;

  /** Abre el buscador con el mapa ya centrado en esta ciudad. */
  const goToMap = () => {
    persistHireSearchLocation({
      locationName: `${config.city}, ${config.province}`,
      latitude: String(config.lat),
      longitude: String(config.lng),
    });
    navigate('/hire', {
      state: {
        hireSearchLocation: {
          locationName: `${config.city}, ${config.province}`,
          latitude: String(config.lat),
          longitude: String(config.lng),
        },
      },
    });
  };

  const nearby = config.nearby
    .map((s) => CITY_LANDING_BY_SLUG[s])
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const jsonLd = [
    serviceSchema({
      name: config.serviceName,
      description: config.seoDescription,
      url: `https://inspecciono.com${path}`,
      areaServed: `${config.city}, ${config.province}`,
    }),
    breadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Cobertura en España', url: COVERAGE_HUB_PATH },
      { name: config.city, url: path },
    ]),
    faqPageSchema(config.faqs),
    howToSchema(
      `Cómo contratar una inspección en ${config.city}`,
      config.answerFirst,
      CITY_LANDING_STEPS.map((s) => ({ name: s.title, text: s.body })),
    ),
  ];

  return (
    <div className="min-h-screen bg-surface-tinted font-display text-ink-strong">
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        canonical={path}
        ogTitle={config.ogTitle}
        ogDescription={config.seoDescription}
        jsonLd={jsonLd}
      />

      {/* Header propio SOLO en móvil (en desktop el topbar global ya es la cabecera). */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex min-h-12 items-center gap-2 px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-strong hover:bg-surface-tinted"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-base font-semibold tracking-[-0.02em]">{config.city}</p>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line" style={{ background: HP_PANEL_GRADIENT }}>
        <div className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 md:px-6 md:py-12 lg:py-14`}>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {config.eyebrow}
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-ink-strong md:text-[2rem]">
            {config.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            {config.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={goToMap} className="sd-btn-primary min-w-0 px-5">
              Ver expertos en {config.city}
            </button>
            <button
              type="button"
              onClick={() => navigate('/help')}
              className="inline-flex h-12 items-center justify-center rounded-full border border-ink-strong bg-white px-5 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-tinted"
            >
              Cómo funciona
            </button>
          </div>
        </div>
      </section>

      <main className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-16`}>
        {/* Respuesta directa (AEO/GEO): coincide LITERALMENTE con HowTo.description. */}
        <section aria-label="En resumen" className="mb-10">
          <div className="rounded-xl border border-brand/15 bg-brand/5 p-4 md:p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-brand">
              En resumen
            </p>
            <p className="text-sm leading-relaxed text-ink-strong md:text-base">
              {config.answerFirst}
            </p>
          </div>
        </section>

        {/* Datos locales reales (diferenciación anti-doorway) */}
        <section aria-labelledby="local-heading">
          <h2 id="local-heading" className="hp-section-title mb-4">
            Cobertura en {config.city}
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-line bg-white px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">Provincia</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-strong">{config.province}</dd>
            </div>
            <div className="rounded-lg border border-line bg-white px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">Comunidad</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-strong">{config.region}</dd>
            </div>
            <div className="rounded-lg border border-line bg-white px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">Población</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-strong">
                ~{config.population.toLocaleString('es-ES')} hab.
              </dd>
            </div>
            <div className="rounded-lg border border-line bg-white px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">Pago</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-strong">Retenido en escrow</dd>
            </div>
          </dl>
        </section>

        {/* Categorías inspeccionables en la ciudad (enlazado interno a categorías) */}
        <section aria-labelledby="cats-heading" className="mt-12 border-t border-line pt-8">
          <h2 id="cats-heading" className="hp-section-title mb-2">
            Qué puedes inspeccionar en {config.city}
          </h2>
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Elige el tipo de inspección; un experto verificado se desplaza a la ubicación del
            producto en {config.city} o su provincia.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CITY_INSPECTION_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to={`/${cat.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 transition-colors hover:bg-surface-tinted"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <span className="text-sm font-medium text-ink-strong">{cat.label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-ink-soft" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Cómo funciona */}
        <section aria-labelledby="steps-heading" className="mt-12 border-t border-line pt-8">
          <h2 id="steps-heading" className="hp-section-title mb-6">
            Cómo funciona · en 4 pasos
          </h2>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {CITY_LANDING_STEPS.map((step, index) => (
              <li key={step.title} className="relative rounded-xl border border-line bg-white p-4 shadow-sm">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-ink-strong">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ visibles (deben coincidir con el FAQPage JSON-LD) */}
        <section aria-labelledby="faq-heading" className="mt-12 border-t border-line pt-8">
          <h2 id="faq-heading" className="hp-section-title mb-5">
            Preguntas frecuentes en {config.city}
          </h2>
          <div className="grid gap-3">
            {config.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-lg border border-line bg-white px-4 py-3 open:pb-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink-strong [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mt-12 rounded-xl border border-line bg-white p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink-strong">
            Encuentra un experto en {config.city} y reserva en dos minutos
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Compara precios y valoraciones de expertos verificados en el mapa, elige hueco en su
            calendario y paga con el dinero protegido en escrow hasta tu visto bueno.
          </p>
          <button type="button" onClick={goToMap} className="sd-btn-primary mt-4 min-w-0 px-5">
            Ver expertos en {config.city}
          </button>
        </section>

        {/* Enlazado interno: ciudades cercanas + hub */}
        <section aria-labelledby="nearby-heading" className="mt-12 border-t border-line pt-8">
          <h2 id="nearby-heading" className="hp-section-title mb-4">
            Inspecciones cerca de {config.city}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {nearby.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/inspeccion-segunda-mano-${c.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink-strong transition-colors hover:bg-surface-tinted"
                >
                  {c.city}
                  <ChevronRight className="h-3.5 w-3.5 text-ink-soft" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={COVERAGE_HUB_PATH}
                className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/5 px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
              >
                Ver todas las provincias
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </li>
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

export default CityLandingPage;
