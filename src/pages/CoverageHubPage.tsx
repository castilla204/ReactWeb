import React, { Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, MapPin } from 'lucide-react';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { HP_PANEL_GRADIENT, SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';
import { breadcrumbSchema, faqPageSchema, organizationSchema } from '../utils/jsonLd';
import { CITY_LANDINGS, cityLandingsByRegion } from '../content/cityLandingContent';

const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

export const COVERAGE_HUB_PATH = '/inspeccion-segunda-mano-espana';

export const COVERAGE_HUB_SEO = {
  title: 'Inspección de segunda mano en toda España — provincias | Inspecciono',
  description:
    'Contrata un perito verificado que inspecciona en persona coches, pisos, motos y maquinaria de segunda mano en cualquier provincia de España. Elige tu provincia y compara expertos en el mapa.',
  ogTitle: 'Peritos verificados en toda España para revisar lo que vas a comprar',
};

const HUB_FAQS = [
  {
    question: '¿En qué provincias de España está disponible Inspecciono?',
    answer:
      'Inspecciono opera en toda España: las 50 provincias más Ceuta y Melilla. Los expertos verificados se desplazan a la ubicación del producto, así que puedes contratar una inspección esté donde esté el coche, el piso o la maquinaria que quieres comprar.',
  },
  {
    question: '¿Cómo encuentro un experto en mi ciudad?',
    answer:
      'Elige tu provincia en el listado o busca directamente en el mapa: verás los expertos verificados cerca de la ubicación del producto, con su precio, experiencia y valoraciones antes de reservar.',
  },
  {
    question: '¿Qué tipos de inspección puedo contratar?',
    answer:
      'Coches, pisos y viviendas, motos, maquinaria agrícola o industrial y bicicletas eléctricas de segunda mano. En cada caso el experto revisa lo relevante y te entrega un informe con fotos.',
  },
];

/**
 * Hub de cobertura: /inspeccion-segunda-mano-espana. Ancla de jerarquía interna
 * que agrupa las 52 landings de provincia por comunidad autónoma. Da a Google (y
 * a los usuarios) un índice lógico en vez de un "sitemap dump" de páginas sueltas.
 */
const CoverageHubPage: React.FC = () => {
  const navigate = useNavigate();
  const grouped = cityLandingsByRegion();

  const jsonLd = [
    organizationSchema(),
    breadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Cobertura en España', url: COVERAGE_HUB_PATH },
    ]),
    faqPageSchema(HUB_FAQS),
  ];

  return (
    <div className="min-h-screen bg-surface-tinted font-display text-ink-strong">
      <SEO
        title={COVERAGE_HUB_SEO.title}
        description={COVERAGE_HUB_SEO.description}
        canonical={COVERAGE_HUB_PATH}
        ogTitle={COVERAGE_HUB_SEO.ogTitle}
        ogDescription={COVERAGE_HUB_SEO.description}
        jsonLd={jsonLd}
      />

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
          <p className="text-base font-semibold tracking-[-0.02em]">Cobertura en España</p>
        </div>
      </header>

      <section className="border-b border-line" style={{ background: HP_PANEL_GRADIENT }}>
        <div className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 md:px-6 md:py-12 lg:py-14`}>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            Toda España
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-ink-strong md:text-[2rem]">
            Inspección de segunda mano en toda España
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
            Un experto verificado se desplaza a la ubicación del producto —coche, vivienda, moto,
            maquinaria o bici eléctrica— y te entrega un informe antes de que pagues. Elige tu
            provincia o busca directamente en el mapa. El pago queda retenido en escrow hasta tu
            visto bueno.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/hire')} className="sd-btn-primary min-w-0 px-5">
              Buscar en el mapa
            </button>
          </div>
        </div>
      </section>

      <main className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-16`}>
        <p className="mb-8 text-sm text-ink-soft">
          {CITY_LANDINGS.length} provincias con cobertura. Elige la tuya:
        </p>

        <div className="grid gap-8">
          {grouped.map((group) => (
            <section key={group.region} aria-label={group.region}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-ink-soft">
                {group.region}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {group.cities.map((c) => (
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
              </ul>
            </section>
          ))}
        </div>

        <section aria-labelledby="faq-heading" className="mt-12 border-t border-line pt-8">
          <h2 id="faq-heading" className="hp-section-title mb-5">
            Preguntas frecuentes
          </h2>
          <div className="grid gap-3">
            {HUB_FAQS.map((faq) => (
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

export default CoverageHubPage;
