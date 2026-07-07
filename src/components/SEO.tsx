/**
 * SEO Component — Per-route meta tags + JSON-LD.
 *
 * ⚠️ Implementación imperativa (estilo react-helmet), NO React 19 hoisting.
 * Motivo: React 19 hoistea <title>/<meta>/<link> renderizados en JSX al <head>,
 * pero NO deduplica contra los tags ESTÁTICOS de index.html → cada ruta acababa
 * con DOS title, DOS description y DOS canonical contradictorios (verificado en
 * el DOM 2026-07-07). Dos canonicals distintos hacen que Google ignore ambos.
 *
 * Estrategia: mutamos los tags estáticos de index.html vía upsert en useEffect.
 * - Scrapers sin JS (WhatsApp/LinkedIn/Bing): ven el estático de index.html (fallback home).
 * - Google (renderiza JS): ve UN único juego de tags, el de la ruta activa.
 * - Páginas sin <SEO> (admin, etc.): conservan el último valor aplicado — sin regresión.
 *
 * El JSON-LD sí se renderiza como JSX (<script> en body): React lo monta/desmonta
 * por ruta y los crawlers leen todo el HTML, no solo el head.
 *
 * Capacitor: en app móvil omitimos canonical (no hay URL indexable) pero
 * mantenemos title/meta para PWA installability.
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
const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1';

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

/** Muta el meta existente (o lo crea) y elimina duplicados sobrantes de la misma clave. */
function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const all = document.head.querySelectorAll<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (all.length === 0) {
    const el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.content = content;
    document.head.appendChild(el);
    return;
  }
  all[0].content = content;
  for (let i = 1; i < all.length; i++) all[i].remove();
}

function removeMeta(attr: 'name' | 'property', key: string) {
  document.head.querySelectorAll(`meta[${attr}="${key}"]`).forEach((el) => el.remove());
}

function upsertCanonical(href: string | undefined) {
  const all = document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    // Sin canonical deseado (rutas noindex): fuera el estático de la home —
    // "canonical=/" + "noindex" en /login sería contradictorio para Google.
    all.forEach((el) => el.remove());
    return;
  }
  if (all.length === 0) {
    const el = document.createElement('link');
    el.rel = 'canonical';
    el.href = href;
    document.head.appendChild(el);
    return;
  }
  all[0].href = href;
  for (let i = 1; i < all.length; i++) all[i].remove();
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

  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : DEFAULT_ROBOTS);

    // Canonical solo en web (Capacitor no tiene URL indexable)
    upsertCanonical(isNative ? undefined : absoluteCanonical);

    // Open Graph
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', finalOgTitle);
    upsertMeta('property', 'og:description', finalOgDescription);
    upsertMeta('property', 'og:image', ogImage);
    if (absoluteCanonical) {
      upsertMeta('property', 'og:url', absoluteCanonical);
    }
    // Los width/height/alt estáticos de index.html describen la OG por defecto;
    // si la ruta usa otra imagen (ficha de servicio), quedarían mintiendo → fuera.
    if (ogImage !== DEFAULT_OG_IMAGE) {
      removeMeta('property', 'og:image:width');
      removeMeta('property', 'og:image:height');
      removeMeta('property', 'og:image:type');
      removeMeta('property', 'og:image:alt');
      removeMeta('name', 'twitter:image:alt');
    }

    // Twitter
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', finalOgTitle);
    upsertMeta('name', 'twitter:description', finalOgDescription);
    upsertMeta('name', 'twitter:image', ogImage);
    if (absoluteCanonical) {
      upsertMeta('name', 'twitter:url', absoluteCanonical);
    }
  }, [
    title,
    description,
    noindex,
    isNative,
    absoluteCanonical,
    ogType,
    finalOgTitle,
    finalOgDescription,
    ogImage,
  ]);

  return (
    <>
      {/* JSON-LD — render en body (crawlers leen todo el HTML). React lo
          desmonta al salir de la ruta, así no se acumulan schemas. */}
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
