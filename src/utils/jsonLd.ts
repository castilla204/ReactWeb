/**
 * Generadores de JSON-LD para Inspecciono.
 *
 * Por qué importan en 2026 (datos de investigación SEO):
 * - Páginas con schema markup tienen +73% selección en AI Overviews vs sin schema.
 * - Páginas con FAQPage schema citadas 1.9x más que páginas sin él.
 * - Páginas con Breadcrumb schema obtienen rich snippet de migas en SERP
 *   (sustituye la URL larga por una jerarquía legible → mejor CTR).
 *
 * Cada función devuelve un objeto plano que el componente <SEO> serializa a JSON
 * y envuelve en <script type="application/ld+json">.
 */

const SITE_URL = 'https://inspecciono.com';
const ORG_NAME = 'Inspecciono';

/* ────────────────────────────────────────────────────────────────────────────
   Schemas globales (Organization, WebSite) — siguen en index.html, no se
   re-emiten por ruta. Definidos aquí también por completitud / referencia.
   ──────────────────────────────────────────────────────────────────────────── */

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_NAME,
    legalName: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    description:
      'Marketplace español de servicios de inspección y peritaje pre-compra: coches, inmuebles, motos, maquinaria y más, realizados por expertos verificados con pago en escrow.',
    areaServed: { '@type': 'Country', name: 'España' },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'soporte@inspecciono.com',
        availableLanguage: ['Spanish'],
        areaServed: 'ES',
      },
    ],
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   FAQPage — uno de los rich snippets de mayor impacto en CTR/AI Overviews.
   Acepta el array completo de FAQ_ITEMS o un subconjunto curado.
   IMPORTANTE: Google muestra el rich snippet SOLO si las preguntas también
   son visibles en el HTML de la página (no solo en el JSON-LD).
   ──────────────────────────────────────────────────────────────────────────── */

export interface FaqEntry {
  question: string;
  answer: string;
}

export function faqPageSchema(items: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   BreadcrumbList — sustituye la URL larga del SERP por una jerarquía legible.
   ──────────────────────────────────────────────────────────────────────────── */

export interface Crumb {
  name: string;
  /** path relativo (ej. "/quienes-somos") o URL absoluta. Se normaliza. */
  url: string;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url.startsWith('http') ? c.url : `${SITE_URL}${c.url}`,
    })),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Service — usado en ServiceDetailPage. Con datos reales del experto y precio
   captura long-tail tipo "inspección coche segunda mano Madrid 80€".
   ──────────────────────────────────────────────────────────────────────────── */

export interface ServiceSchemaInput {
  /** Nombre del servicio (ej. "Inspección pre-compra coche segunda mano") */
  name: string;
  description: string;
  /** URL canónica de la ficha. */
  url: string;
  /** Precio en EUR (o currency string). Si no hay precio cerrado, omitir. */
  priceEUR?: number;
  /** Nombre del experto que ofrece el servicio. */
  providerName?: string;
  /** URL pública del experto si existe. */
  providerUrl?: string;
  /** Categoría amplia (Vehículos, Inmuebles, Motos, etc.). */
  category?: string;
  /** Rating medio del experto (1-5). Solo incluir si es real. */
  ratingValue?: number;
  /** Nº de reseñas reales. Solo incluir si ratingValue está presente. */
  reviewCount?: number;
  /** Zona de cobertura (ej. "Madrid", "España"). */
  areaServed?: string;
}

export function serviceSchema(input: ServiceSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: input.url,
    serviceType: input.category ?? 'Inspección y peritaje pre-compra',
    provider: input.providerName
      ? {
          '@type': 'Person',
          name: input.providerName,
          ...(input.providerUrl && { url: input.providerUrl }),
        }
      : { '@type': 'Organization', name: ORG_NAME, url: SITE_URL },
    areaServed: input.areaServed
      ? { '@type': 'Place', name: input.areaServed }
      : { '@type': 'Country', name: 'España' },
    brand: { '@type': 'Brand', name: ORG_NAME },
  };

  if (typeof input.priceEUR === 'number' && input.priceEUR > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: input.priceEUR.toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: input.url,
    };
  }

  // AggregateRating solo si los datos son REALES y visibles en la página.
  // Google penaliza self-serving rating sin reseñas reales.
  if (
    typeof input.ratingValue === 'number' &&
    typeof input.reviewCount === 'number' &&
    input.reviewCount > 0
  ) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.ratingValue.toFixed(1),
      reviewCount: input.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/* ────────────────────────────────────────────────────────────────────────────
   HowTo — para /como-funciona. Captura búsquedas "cómo funciona X" y AI Overviews.
   ──────────────────────────────────────────────────────────────────────────── */

export interface HowToStep {
  name: string;
  text: string;
}

export function howToSchema(name: string, description: string, steps: HowToStep[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   AboutPage — para /quienes-somos. Muy ligero pero ayuda al Knowledge Graph
   de Google a identificar la entidad "Inspecciono".
   ──────────────────────────────────────────────────────────────────────────── */

export function aboutPageSchema(url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `Quiénes somos | ${ORG_NAME}`,
    url,
    mainEntity: organizationSchema(),
  };
}
