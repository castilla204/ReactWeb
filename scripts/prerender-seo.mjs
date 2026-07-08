/**
 * Prerender SEO — genera un index.html por ruta pública con el <head> correcto.
 *
 * Por qué: la SPA sirve `<div id="root"></div>` con el <head> de la HOME a cualquier
 * scraper que no ejecute JS (WhatsApp, LinkedIn, Facebook, Bing, DuckDuckGo). El
 * componente <SEO> corrige el <head> en runtime, pero solo para clientes con JS
 * (Google renderiza JS y sí lo ve). Este script escribe dist/<ruta>/index.html con
 * el <head> ya correcto para que los scrapers sin JS lean el título, la descripción,
 * la OG y el JSON-LD de CADA ruta, no los de la home.
 *
 * - Solo build WEB (base '/'): los assets del index.html base son /index.<hash>.js
 *   (absolutos) → funcionan desde dist/<ruta>/index.html sin importar la profundidad.
 *   NO se ejecuta en el build de Capacitor (base './', y la app móvil no se rastrea).
 * - FAIL-SAFE: cualquier error se registra y sale 0 → NUNCA rompe el deploy. Peor caso:
 *   no hay prerender y el scraper ve la home (comportamiento previo, sin regresión).
 * - Reutiliza los datos reales de las landings y los generadores de JSON-LD (Node 24
 *   importa TS de forma nativa) → sin duplicación ni drift.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://inspecciono.com';

/** Escapa un valor para incrustarlo en atributo/texto HTML. */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Reemplaza el contenido de <title>. */
function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
}

/** Reemplaza (o inserta antes de </head>) un <meta name="..."> o <meta property="..."> */
function setMeta(html, attr, key, content) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (re.test(html)) return html.replace(re, `$1${esc(content)}$2`);
  return html.replace('</head>', `    <meta ${attr}="${key}" content="${esc(content)}" />\n</head>`);
}

/** Reemplaza el href del canonical. */
function setCanonical(html, href) {
  const re = /(<link rel="canonical" href=")[^"]*(")/;
  if (re.test(html)) return html.replace(re, `$1${esc(href)}$2`);
  return html.replace('</head>', `    <link rel="canonical" href="${esc(href)}" />\n</head>`);
}

/** Quita todos los <script type="application/ld+json"> del base y añade los de la ruta. */
function setJsonLd(html, objects) {
  const stripped = html.replace(
    /\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    '',
  );
  const blocks = objects
    .map((o) => `    <script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
  return stripped.replace('</head>', `${blocks}\n</head>`);
}

/** Aplica un objeto de meta {title, description, canonical, ogTitle, ogDescription, jsonLd} */
function render(baseHtml, r) {
  let html = baseHtml;
  const ogTitle = r.ogTitle ?? r.title;
  const ogDescription = r.ogDescription ?? r.description;
  const url = `${SITE}${r.path}`;

  html = setTitle(html, r.title);
  html = setMeta(html, 'name', 'description', r.description);
  html = setCanonical(html, url);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:title', ogTitle);
  html = setMeta(html, 'property', 'og:description', ogDescription);
  html = setMeta(html, 'name', 'twitter:url', url);
  html = setMeta(html, 'name', 'twitter:title', ogTitle);
  html = setMeta(html, 'name', 'twitter:description', ogDescription);
  if (r.jsonLd?.length) html = setJsonLd(html, r.jsonLd);
  return html;
}

/**
 * Genera los index.html por ruta dentro de `distDir`. Reutilizable desde el plugin
 * de Vite (closeBundle) y desde CLI. Devuelve el nº de rutas escritas.
 */
export async function prerenderSeo(distDir) {
  const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf8');

  const { CATEGORY_LANDINGS, LANDING_STEPS } = await import(
    '../src/content/categoryLandingContent.ts'
  );
  const { serviceSchema, breadcrumbSchema, faqPageSchema, organizationSchema, howToSchema } =
    await import('../src/utils/jsonLd.ts');

  const routes = [];

  // Rutas públicas no-landing. Meta espejo de los props <SEO> de sus páginas
  // (CentroAyudaPage / SearchCreationPage) — textos estables.
  routes.push({
    path: '/ayuda',
    title: 'Centro de Ayuda · Inspecciono — quiénes somos, cómo funciona y FAQ',
    description:
      'Todo en un sitio: quiénes somos, cómo funciona Inspecciono en 4 pasos con pago seguro, preguntas frecuentes y acceso a términos y privacidad actualizados.',
    ogTitle: 'Centro de Ayuda — Inspecciono',
    ogDescription:
      'Quiénes somos, cómo funciona, preguntas frecuentes y documentación legal en una sola página.',
    jsonLd: [organizationSchema()],
  });
  routes.push({
    path: '/crear-busqueda',
    title: 'Busca expertos cerca de ti en el mapa | Inspecciono',
    description:
      'Elige qué quieres inspeccionar (coche, piso, moto…) y encuentra peritos verificados cerca de la ubicación del producto. Compara precios y valoraciones.',
    jsonLd: [organizationSchema()],
  });

  // Landings de categoría (datos reales → mismo JSON-LD que CategoryLandingPage).
  for (const c of CATEGORY_LANDINGS) {
    const path = `/${c.slug}`;
    routes.push({
      path,
      title: c.seoTitle,
      description: c.seoDescription,
      ogTitle: c.ogTitle,
      ogDescription: c.seoDescription,
      jsonLd: [
        serviceSchema({ name: c.serviceName, description: c.seoDescription, url: `${SITE}${path}` }),
        breadcrumbSchema([
          { name: 'Inicio', url: '/' },
          { name: c.shortName, url: path },
        ]),
        faqPageSchema(c.faqs),
        howToSchema(
          `Cómo funciona ${c.h1.toLowerCase()}`,
          c.answerFirst,
          LANDING_STEPS.map((s) => ({ name: s.title, text: s.body })),
        ),
      ],
    });
  }

  let n = 0;
  for (const r of routes) {
    const html = render(baseHtml, r);
    // Fichero PLANO `<ruta>.html` (no `<ruta>/index.html`): Cloudflare Pages sirve
    // `foo.html` en `/foo` con 200 (clean URLs), mientras que `foo/index.html`
    // fuerza un 308 de `/foo` → `/foo/` (barra final) que descuadra con el canonical
    // y el sitemap (ambos sin barra). Con el plano, URL servida = canonical = sitemap.
    // r.path empieza por '/', así que slice(1). Todas las rutas son de 1 segmento.
    writeFileSync(join(distDir, `${r.path.slice(1)}.html`), html);
    n++;
  }
  console.log(`[prerender] ${n} rutas prerenderizadas (planas): ${routes.map((r) => r.path).join(', ')}`);
  return n;
}

// CLI: `node scripts/prerender-seo.mjs [distDir]` — útil para pruebas manuales.
// El build lo invoca vía plugin de Vite (vite.config.ts, closeBundle), no por aquí.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('prerender-seo.mjs')) {
  prerenderSeo(join(process.cwd(), 'dist')).catch((e) => {
    console.warn('[prerender] omitido (no bloquea el build):', e?.message ?? e);
    process.exit(0);
  });
}
