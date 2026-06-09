/**
 * SEO Component — Per-route meta tags + JSON-LD via React 19 native hoisting.
 *
 * React 19 hoistea automáticamente al <head> real cualquier <title>, <meta name>,
 * <meta property> y <link> renderizado en JSX. Para JSON-LD usamos <script> en
 * el body — los crawlers leen TODO el HTML (no solo el head), así que funciona
 * igual para SEO sin necesidad de portal a document.head.
 *
 * Reemplaza al meta estático de index.html: cada page importa <SEO ... /> con
 * sus props. React 19 dedupe por property/name → el último renderizado gana
 * (orden: index.html estático → SEO de la ruta activa).
 *
 * Capacitor: en app móvil omitimos canonical (no tiene sentido — no hay URL
 * indexable) pero mantenemos title/meta para PWA installability.
 */

import { useEffect, useState } from 'react';

export interface SeoProps {
  /** <title>. 50-60 chars idealmente. Google trunca a ~60 desktop. */
  title: string;
  /** <meta description>. 140-155 chars idealmente. */
  description: string;
  /** Path relativo (ej. "/faq"). Componente lo hace absoluto. Omitir para no emitir canonical. */
  canonical?: string;
  /** OG title (puede diferir del SEO title — más humano para WhatsApp/LinkedIn). */
  ogTitle?: string;
  /** OG description (más conversacional, menos keyword-stuffed). */
  ogDescription?: string;
  /** URL absoluta de la OG image (1200x630). Default: /og-image.jpg de la home. */
  ogImage?: string;
  /** og:type. "website" para landings, "article" para blog, "product" para fichas, etc. */
  ogType?: 'website' | 'article' | 'product' | 'profile';
  /** Array de objetos JSON-LD. Cada uno se renderiza en su propio <script>. */
  jsonLd?: object[];
  /** True = añade noindex,nofollow (rutas privadas, 404, etc.) */
  noindex?: boolean;
}

const SITE_URL = 'https://inspecciono.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** Detección Capacitor — perezosa, sólo al montar. */
function useIsNative(): boolean {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (mounted) setIsNative(Capacitor.isNativePlatform());
      } catch {
        // @capacitor/core no disponible (build web puro). Asumir no nativo.
        if (mounted) setIsNative(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return isNative;
}

export const SEO: React.FC<SeoProps> = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  jsonLd,
  noindex = false,
}) => {
  const isNative = useIsNative();
  const absoluteCanonical = canonical ? `${SITE_URL}${canonical}` : undefined;
  const finalOgTitle = ogTitle ?? title;
  const finalOgDescription = ogDescription ?? description;

  return (
    <>
      {/* React 19 hoistea estos tags al <head> y dedupe por name/property */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      )}

      {/* Canonical solo en web (Capacitor no tiene URL indexable) */}
      {absoluteCanonical && !isNative && (
        <link rel="canonical" href={absoluteCanonical} />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={ogImage} />
      {absoluteCanonical && <meta property="og:url" content={absoluteCanonical} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD — render en body (crawlers leen todo el HTML). React 19 NO
          hoistea <script type="application/ld+json"> sin async; no pasa nada. */}
      {jsonLd?.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
};

export default SEO;
