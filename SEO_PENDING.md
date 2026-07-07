# SEO — Estado y trabajo pendiente

Resumen de la reescritura SEO de junio 2026. La auditoría de 3 agentes detectó
9 problemas críticos en `inspecciono.com`. Esta Fase 0 resuelve los de impacto
inmediato en la SERP (lo que Google muestra antes del clic). Las Fases 1 y 2
quedan documentadas aquí para abordarlas más adelante.

---

## ✅ Fase 0 — Quick wins APLICADOS

| Archivo | Cambio |
|---|---|
| `index.html` | Title nuevo: `Antes de comprar, inspecciona · Peritos verificados \| Inspecciono` (60 chars, hook + USP + marca) |
| `index.html` | Description nueva: pregunta-hook + USP + escrow (148 chars, no se trunca en SERP) |
| `index.html` | OG/Twitter con title más humano para WhatsApp/LinkedIn (≠ del SEO title, intencional) |
| `index.html` | 4 bloques `application/ld+json`: Organization, WebSite, Service+OfferCatalog, FAQPage |
| `index.html` | `<html lang="es-ES">` (antes `es`) — señaliza España específicamente a Google |
| `index.html` | `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">` |
| `index.html` | Eliminado `<meta name="keywords">` (ruido inútil — Google las ignora desde 2009) |
| `index.html` | Eliminados los `<meta http-equiv="Cache-Control" no-cache>` (eran para dev, perjudicaban CDN en prod) |
| `public/robots.txt` | `Disallow` de 18 rutas privadas detectadas en `App.tsx` (admin, dashboard, checkout, mfa…) |
| `public/sitemap.xml` | Creado con 9 URLs públicas. Antes daba 404→HTML (Search Console no podía leerlo) |
| `public/site.webmanifest` | `name`: `inspecciono.com` → `Inspecciono`; icons en tamaños 192/512 |

**Lo que verá Google a partir del próximo deploy** (en lugar de la actual `inspecciono.com - Plataforma de Contratación de Servicios de Verificación Profesional`):

```
inspecciono.com
https://inspecciono.com
Antes de comprar, inspecciona · Peritos verificados | Inspecciono
¿Vas a comprar un coche, un piso o una moto de segunda mano? Un experto
verificado lo revisa por ti y te entrega un informe. Pago seguro en escrow.
```

---

## ✅ Imágenes OG — CREADAS (2026-07-07)

- `public/og-image.jpg` — 1200x630 JPG q85 mozjpeg, **94 KB**. Composición: banner real
  del sitio (`src/media/imagenbanner.png`, peritos + coche) cover-crop a la derecha,
  scrim blanco por la izquierda, wordmark erizo + "Inspecciono.", claim
  "Antes de comprar, / inspecciona.", pills "Peritos verificados" / "Pago en escrow",
  dominio. Twitter reutiliza la misma imagen desde `index.html` (no hay twitter-image.jpg).
- Regenerable: script sharp (composición SVG + composite) — si hay que retocarla, pedir
  que se regenere con sharp en vez de editar el JPG.
- `public/icon-512.png` — erizo reescalado a 512 (lanczos) para el manifest PWA;
  `site.webmanifest` corregido (declaraba 512/1024 sobre ficheros de 192/180).

---

## ✅ Fase 1 — COMPLETADA (2026-07-07)

- `<SEO>` en todas las páginas públicas: HomePage, CentroAyudaPage (/ayuda absorbe
  quienes-somos/como-funciona/faq), ServiceDetailPage, BecomeExpertPage, LegalDocumentPage,
  SearchCreationPage (/crear-busqueda) y NotFoundPage.
- `noindex` en: LoginPage, PaymentSuccess/CancelPage, SellerBookingPage y
  ExpertConfirmationPage (enlaces con token), FavoritesPage, StatusPage.
- **SEO.tsx reescrito a upsert imperativo** (estilo helmet): React 19 hoisting NO deduplica
  contra los tags estáticos de index.html → había DOS title/description/canonical por ruta
  (canonicals contradictorios = Google los ignora). Ahora muta los tags estáticos; verificado
  en DOM: 1 solo juego de tags por ruta, actualización correcta en navegación SPA, JSON-LD
  se monta/desmonta por ruta.
- `sitemap.xml`: quitados /explorar (canonical=/) y /quienes-somos, /como-funciona, /faq
  (redirigen a /ayuda); añadido /ayuda.
- `robots.txt`: añadidos /coordinar-cita/, /confirmar-cita/, /status.

## 🗑️ Fase 1 original (referencia histórica)

Hoy `index.html` es estático: TODAS las rutas (`/quienes-somos`, `/como-funciona`, `/faq`,
`/service/:id`, etc.) heredan el mismo title y description. Google indexa solo la home.

**Solución**: usar React 19 nativo (sin librería). React 19 hoistea `<title>`/`<meta>`/`<link>`
y `<script type="application/ld+json">` al `<head>` automáticamente cuando se renderizan
en cualquier componente.

### Pasos

1. Crear `src/components/SEO.tsx` con props `{ title, description, canonical, ogImage?, jsonLd? }`.
   Detecta `Capacitor.isNativePlatform()` para omitir canonical en app móvil.
2. Añadir `<SEO ... />` en cada page (`HomePage`, `ComoFuncionaPage`, `QuienesSomosPage`,
   `FAQPage`, `ServiceDetailPage`, `BecomeExpertPage`, `LoginPage`, `NotFoundPage`).
3. `ServiceDetailPage`: JSON-LD `Service` con datos reales del backend (precio, descripción).
4. `FAQPage`: JSON-LD `FAQPage` con todas las preguntas.
5. **Eliminar de `index.html` los meta tags + JSON-LD que se mueven a per-route** — quedaría
   solo el fallback para la home.
6. Añadir **canonical dinámico**: `<link rel="canonical" href="https://inspecciono.com${pathname}">`
   sin `?utm_*`, `?fbclid`, etc.

### Las 5 FAQ visibles en la HomePage

El bloque `FAQPage` JSON-LD ya está en `index.html`. Pero **Google desde agosto 2023 deja de
mostrar el rich snippet FAQ si las preguntas NO están visibles en el HTML de la página**.

Añadir un `<section>` "Preguntas frecuentes" en `HomePage.tsx` con las 5 preguntas (literal):
- ¿Cuánto cuesta una inspección en Inspecciono?
- ¿Cuánto tarda en hacerse la inspección?
- ¿Qué incluye el informe que me entrega el experto?
- ¿Cómo funciona el pago seguro?
- ¿Qué pasa si el experto no detecta un fallo importante?

Las respuestas deben coincidir LITERALMENTE con las del JSON-LD.

---

## 🟢 Fase 2 — Prerendering + landings de categoría (1-3 días, ROI 1-3 meses)

### El problema

Los scrapers de WhatsApp/LinkedIn/Bing/DuckDuckGo **no ejecutan JavaScript**. La SPA
les sirve un `<div id="root"></div>` vacío. Cualquier URL compartida muestra meta de
la home aunque el usuario hubiera enviado un link a `/service/123`.

### La solución

`vite-plugin-prerender` (Puppeteer en build) renderiza N rutas a HTML estático en `dist/`.
La SPA sigue siendo SPA en cliente — solo el HTML inicial está ya pintado para los bots.

### Capacitor: NO romper

El build móvil necesita `base: './'` (vite.config.ts actual). El build web necesita
`base: '/'` para prerendering. Solución: **builds duales**:

```
vite.config.ts        → para Capacitor (base: './', sin prerender) — el actual
vite.config.web.ts    → para web (base: '/', output: dist-web/, prerender activo)
```

```json
"scripts": {
  "build:cap": "vite build",                          // = build actual
  "build:web": "vite build -c vite.config.web.ts",
  "build": "npm run build:web",                       // default
  "cap:run:android": "npm run build:cap && npx cap sync && npx cap run android"
}
```

`Dockerfile` cambia a `RUN npm run build:web` y `COPY dist-web → dist`.

### Rutas a prerenderizar

- `/`, `/explorar`, `/quienes-somos`, `/como-funciona`, `/faq`, `/become-expert`
- `/privacy-policy.html`, `/terms.html`
- Categorías nuevas (ver siguiente sección)
- **NO** prerenderizar: `/login`, `/admin/*`, `/busquedas/*`, `/checkout/*`, etc.

### Landings de categoría (oro SEO long-tail)

Crear rutas estáticas con keyword exacta:

| Ruta | Title | Description |
|---|---|---|
| `/inspeccion-coche-segunda-mano` | Inspección de coche de segunda mano antes de comprar \| Inspecciono | Un mecánico verificado revisa el coche por ti, comprueba kms, siniestros y mecánica, y te entrega un informe. Pago retenido hasta tu visto bueno. |
| `/peritaje-piso` | Peritaje de piso antes de firmar la compra \| Inspecciono | Un perito verificado inspecciona el piso (humedades, instalación, estructura) y te entrega un informe técnico antes de que firmes. Pago en escrow. |
| `/inspeccion-moto-segunda-mano` | Inspección de moto de segunda mano por un experto \| Inspecciono | Antes de pagar por una moto usada, un mecánico verificado la revisa: chasis, motor, kms reales y siniestros. Informe en pocos días. |
| `/peritaje-maquinaria-segunda-mano` | Peritaje de maquinaria de segunda mano en toda España \| Inspecciono | Tractor, carretilla o maquinaria industrial: un técnico verificado la inspecciona in situ y te entrega un informe antes de cerrar la compra. |
| `/inspeccion-bici-electrica-segunda-mano` | Inspección de bici eléctrica de 2ª mano (batería, motor) \| Inspecciono | Un técnico verificado comprueba el estado real de la batería, el motor y la electrónica de tu bici eléctrica usada antes de que pagues. |

Cada landing necesita además su BreadcrumbList JSON-LD.

### Sitemap dinámico desde NewApi

Añadir endpoint `[HttpGet("/sitemap-services.xml")]` en `NewApi/Controllers/...` que recorra
`SearchServices` activos y `ExpertProfiles` publicados, genere XML con `XmlWriter`,
`Cache-Control: max-age=3600`. Sitemap-index referencia `sitemap.xml` (estático) y
`sitemap-services.xml` (dinámico).

---

## 🔵 Fase 3 — Soft-404 (requiere nginx)

Hoy `/cualquier-ruta-inexistente` devuelve HTTP 200 con el `index.html` (porque `serve -s`
y `nginx try_files` hacen SPA fallback universal). Google ve cientos de URLs basura
indexables → desperdicio de crawl budget.

Fix: en `nginx.conf`, añadir un `location` que liste las rutas válidas conocidas y devuelva
HTTP 404 real para las demás. Alternativa: edge worker en Cloudflare.

No urgente pero conviene cuando haya tiempo.

---

## 📊 Verificación post-deploy

1. **Google Search Console** → confirmar que `sitemap.xml` ya no da error.
2. **Rich Results Test** (https://search.google.com/test/rich-results) → pegar `https://inspecciono.com` y validar los 4 JSON-LD (Organization, WebSite, Service, FAQPage).
3. **PageSpeed Insights / Lighthouse** → confirmar Core Web Vitals.
4. **Facebook Sharing Debugger** y **Twitter Card Validator** → confirmar OG preview con la nueva imagen.
5. **`curl -A "Googlebot" https://inspecciono.com | grep -E "(title|description|og:|json-ld)"`** → confirmar HTML estático correcto.

---

## Referencias rápidas

- Marca: **Inspecciono** (`inspecciono.com`)
- Idioma: español de España (`es-ES`)
- Tema color: `#0066cc`
- Email soporte: `soporte@inspecciono.com`
- Backend: `https://newapi-yn9v.onrender.com`
