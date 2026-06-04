# Product

## Register

brand

## Users

Compradores de segunda mano en España (coches, motos, motos de agua, inmuebles, cámaras) que están a punto de pagar por una unidad que no han podido inspeccionar en persona, o que no saben qué inspeccionar. Llegan con desconfianza: han leído historias de estafas en Wallapop, Vibbo, idealista, milanuncios. El job-to-be-done es **eliminar el riesgo del clic de "Pagar"**: contratar a un experto certificado que vaya, verifique el anuncio y emita un informe antes de transferir el dinero. Acceden mayoritariamente desde móvil (Capacitor), pero el desktop debe soportar la decisión racional (comparar expertos, ver mapa, leer informes de muestra).

## Product Purpose

Marketplace bilateral (cliente ↔ experto certificado) con pago intermediado por Stripe Connect. El cliente paga la inspección, el experto recibe el encargo, visita el bien, emite el informe; el dinero se libera al cumplirse. La homepage tiene una sola misión: **convertir desconfianza en encargo**. Éxito = el visitante llega al formulario de "Crear búsqueda" con un servicio y categoría elegidos. Métrica norte: % de visitas que terminan en `crear-busqueda` con `serviceTypeId + categoryId`.

## Brand Personality

Tres palabras: **firme, técnico, cercano**. Voz adulta de profesional que sabe lo que mira (perito, técnico de ITV, ingeniero de inspección). Tono: directo, sin condescendencia, sin promesas vacías. Emocionalmente queremos generar **alivio** ("ya no estás solo en esto") y **autoridad** ("este profesional sabe más que tú del riesgo"). Nada de festivo, nada de juvenil, nada de "magia" SaaS.

## Anti-references

- **revisario.com** — competencia directa, NO copiarles ni cargar assets suyos (el `mapa-base-revisario.svg` actual es una fuga).
- **Hero gradiente azul→índigo→violeta + olas SVG + nodos conectados** — el preset AI/SaaS 2024-2026. No queremos parecer un PaaS de IA.
- **Carfax estilo USA muscular** — demasiado agresivo, mensaje "fraud detection" que nos aleja de la confianza serena.
- **Webs estilo Wallapop / Milanuncios** — el problema es lo que les pasa AHÍ; nuestro look debe ser claramente más profesional y menos masivo.
- **Copos de nieve, gradient-text, glitch effects, partículas, efectos snow/winter** — actualmente plagan el código; fuera todos.

## Design Principles

1. **El experto es el héroe, no el formulario.** Caras, manos, herramientas reales en imagen. Stock genérico está prohibido.
2. **Decir el precio antes de pedir el correo.** El usuario llega desconfiando; el primer gesto es transparencia. "Desde 25 €" debe verse antes que cualquier CTA secundario.
3. **Una sola decisión por pliegue.** Hero = "qué quieres revisar". Mapa = "dónde lo tienes". Formulario = "vamos". No tres CTAs primarios compitiendo.
4. **Sobriedad bilingüe del oficio.** Tipografía firme (Manrope semibold/bold), neutros tintados hacia el azul de marca, color de marca usado donde paga (CTA primario, focos), no como decoración.
5. **Movimiento que comunica, no que adorna.** Entradas escalonadas en el primer pintado; hover micro-feedback en CTAs e inputs; cero efecto ambiente (sin partículas, sin olas en bucle, sin gradient shift).

## Accessibility & Inclusion

- WCAG 2.2 AA como mínimo. El contraste body-sobre-azul actual (`text-white/80` sobre `bg-blue-600`) está por debajo; hay que corregirlo.
- `prefers-reduced-motion` debe deshabilitar TODAS las animaciones decorativas (snow, gradient-shift, glitch, líneas conectadas) — hoy solo cubre algunos `data-*` que el hero ni tiene.
- Touch targets ≥ 44×44 en el formulario móvil; el botón circular de la lupa desktop está a 44×44 (`w-11 h-11`), correcto.
- Spanish-first; pensar en lectores con poca tolerancia al inglés (no usar "skip", "claim", "track", "fee").
- El mapa de España no es información esencial: sus alternativas accesibles (lista textual de provincias con experto) deben estar ya servidas, no solo la imagen.
