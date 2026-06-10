---
name: Inspecciono
description: Marketplace de inspecciones pre-compra. Confianza experta sobre azul de bolígrafo.
colors:
  brand: "#0066CC"
  brand-hover: "#005CB8"
  brand-deep: "#004A99"
  ink-strong: "#1C1C1C"
  ink: "#222222"
  ink-muted: "#6A6A6A"
  ink-soft: "#737373"
  surface: "#FFFFFF"
  surface-tinted: "#FAFAFA"
  border: "#E8E8E8"
  border-soft: "#EBEBEB"
  destructive: "#DC2626"
  warning: "#D97706"
typography:
  display:
    fontFamily: "Manrope, 'SF Pro Display', system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    fontSize: "clamp(2rem, 8.5vw, 2.85rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Manrope, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "1.65rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Manrope, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "18px"
    letterSpacing: "normal"
  body-strong:
    fontFamily: "Manrope, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
    letterSpacing: "normal"
  caption:
    fontFamily: "Manrope, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "normal"
  eyebrow:
    fontFamily: "Manrope, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  badge:
    fontFamily: "Manrope, 'SF Pro Display', system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "12px"
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-tinted}"
    textColor: "{colors.ink-strong}"
  card-aside:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "24px"
  chip-deliverable:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
    height: "30px"
  eyebrow-brand:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.sm}"
    padding: "0"
  input-airbnb:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 0 10px 28px"
    height: "44px"
  tab-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-strong}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.sm}"
    padding: "12px 0"
    height: "48px"
  tab-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px 0"
    height: "48px"
---

# Design System: Inspecciono

## 1. Overview: El Gabinete del Perito

**Creative North Star: "El gabinete del perito"**

El sistema visual se siente como el despacho de un perito tasador: paredes blancas con luz neutra, papel de informe sin satinar, sellos con tinta azul de bolígrafo (`#0066CC`) que solo aparecen donde algo se firma. La voz visual es la del adulto profesional que sabe lo que mira, no la de una app SaaS que necesita gritar para ser vista.

La densidad está medida: el blanco respira; el azul de marca aparece donde paga (CTA, foco, eyebrow del oficio); el negro casi-negro (`#1c1c1c`) ancla la jerarquía sin lavar a gris. La tipografía Manrope, en peso 600-700 para titulares y 400-500 para texto corrido, sustituye al adorno: no hace falta decorar lo que ya está bien dicho. La escala de radio se inclina al `pill` (9999px) para acciones y al `xl` (16px) para superficies de información; las cards no se anidan, los inputs respetan estilo Airbnb (línea inferior única) o estilo shadcn según el contexto.

Lo que este sistema rechaza, importado palabra por palabra desde el `PRODUCT.md`: el gradiente azul→índigo→violeta del hero genérico AI de 2026; las olas SVG estilo Stripe; los nodos conectados de marketing AI/blockchain; los copos de nieve y el glitch; el estilo Wallapop/Milanuncios; el look agresivo Carfax USA; y el calco visual de `revisario.com` (incluida la carga remota de su SVG del mapa).

**Key Characteristics:**

- Una sola decisión por pliegue. El hero pregunta qué; el mapa pregunta dónde; el formulario es el "vamos".
- El brand `#0066CC` aparece donde paga, no como ambiente.
- Tipografía Manrope única, en cuatro pesos (400/500/600/700) con escala 1.25 mínimo entre niveles.
- Neutros sin tinta gris fría: `#1c1c1c` (ink) y `#6a6a6a` (muted) anclan; el blanco respira.
- Cards solo cuando son la afordancia correcta. Nunca anidadas. Sombras muy bajas y siempre suaves.
- Movimiento que comunica (entrada escalonada, micro-feedback en CTAs), no que adorna. Cero loops ambiente.

## 2. Colors: La paleta del despacho

Tres roles dominan: una tinta azul de marca que aparece solo donde algo se firma; una escala de tinta negra-cálida que ancla la jerarquía; y un blanco que es la mayoría del papel.

### Primary

- **Azul de bolígrafo** (`#0066CC`, OKLCH `oklch(53.4% 0.181 254.4)`): la única tinta de color del sistema. CTA primario, foco visible, subrayado del eyebrow de marca, sello de "verificado". Aparece sobre blanco al ~5-10 % de la superficie y al ~60 % cuando es el lienzo del hero. Nunca aparece como gradiente decorativo.
- **Azul de bolígrafo intenso** (`#005CB8`, OKLCH `oklch(49.2% 0.193 254`): estado `:hover` y `:active` del primario. 4 puntos por debajo en L; suficiente diferencia visible sin volverse otro color.
- **Azul de bolígrafo profundo** (`#004A99`): acento de sello y borde de subrayado del título cuando se necesita firma sobre fondo claro. Reservar.

### Neutral

- **Tinta casi-negra** (`#1c1c1c`): titulares principales, números de precio, copy de body con énfasis. Nunca pure black; el grano cálido del 28 evita que se vea "interfaz dura".
- **Tinta** (`#222222`): titulares secundarios y links activos.
- **Tinta sorda** (`#6a6a6a`): body subordinado, descripciones, helper text. Cumple 4.5:1 sobre `#ffffff`; no usar sobre azul ni sobre `#fafafa` directamente sin verificar.
- **Tinta apagada** (`#737373`): solo metadata efímera (timestamps, contadores).
- **Papel** (`#ffffff`): superficie por defecto.
- **Papel ligado** (`#fafafa`): fondo de ficha de servicio (`service-detail-page`). Único matiz neutral más allá del puro blanco.
- **Línea** (`#e8e8e8`): bordes de cards e inputs.
- **Línea suave** (`#ebebeb`): separadores internos y bordes de toast.

### Tertiary (estado)

- **Rojo destructive** (`#DC2626`): errores, eliminar, toast de error. No se decora con sombra de color.
- **Ámbar warning** (`#D97706`): advertencias y toast de warning. Reservar.

### Named Rules

**La regla del único color.** El brand `#0066CC` se usa donde algo se firma, no donde algo se adorna. Permitido: CTA primario, focus ring, subrayado de eyebrow, sello de verificado, ícono activo, barra lateral 4px de toast. Prohibido: gradientes a otro azul, gradientes a violeta, gradientes a cian, sombras tintadas excesivas, fondos panel de propósito decorativo.

**La regla del contraste sin elegancia.** Body siempre `≥4.5:1`. Sobre `bg-brand` (#0066CC), body es blanco sólido (4.57:1), no `white/90` (3.95:1) por mucho que se vea "suave". Sobre `#fafafa`, body es `#1c1c1c` o `#6a6a6a` verificado, nunca un nuevo gris en el medio.

**La regla del azul que no decora.** Si el azul se usa para "darle color al fondo", está mal. Si decora un borde, está mal. El azul firma.

## 3. Typography

**Display Font:** Manrope (con stack `'SF Pro Display', system-ui, -apple-system, 'Helvetica Neue', sans-serif`)
**Body Font:** Manrope (misma familia, distinto peso)
**Label/Mono Font:** none — el sistema no usa monospace deliberadamente; mono lee como costume de "developer tool".

**Character:** Manrope única en cuatro pesos (400/500/600/700) consigue jerarquía sin ruido de pares mal emparejados. Es una sans humanista geométrica con `g` de doble piso: lo bastante carácter para no parecer Helvetica de oficina, lo bastante neutra para no robar protagonismo al contenido. La escala vertical respeta `≥1.25` entre niveles; nada de pasos planos.

### Hierarchy

- **Display** (700, `clamp(2rem, 8.5vw, 2.85rem)`, line-height 1.1, tracking -0.02em): titular del hero. Usa `text-wrap: balance`. Nunca rebasa la ceiling de 6rem.
- **Headline** (600, `1.65rem`, line-height 1.1, tracking -0.02em): título de página de ficha de servicio (`sd-page-title`). Cap de línea ≤ 12 palabras.
- **Title** (600, `1.125rem` mobile / `1.25rem` desktop, line-height 1.3, tracking -0.01em): títulos de sección del scroll (`hp-section-title`). Acompaña por subtítulo en `body`.
- **Body** (400, `14px`, line-height `18px`): texto corrido por defecto. Cap de línea 65-75ch. Usar `text-wrap: pretty` cuando es prosa larga.
- **Body strong** (500, `14px`, line-height `20px`): énfasis dentro de body, etiquetas de input activo.
- **Caption** (400, `12px`, line-height `16px`): metadata bajo cards, helper text de inputs.
- **Eyebrow** (600, `11px`, uppercase, tracking 0.12em, color `{colors.brand}`): el ÚNICO uppercase del sistema. Usar con moderación (regla siguiente).
- **Badge** (500, `10px`, line-height `12px`): chips de tab bar inferior, etiquetas pequeñas.

### Named Rules

**La regla del único eyebrow.** El eyebrow `text-brand uppercase` está permitido como marcador de oficio en hero o pre-título de sección, pero **nunca encima de tres secciones consecutivas**. Si aparece sobre cuatro h2 seguidos es AI scaffolding, no voz. Aliviar con cambio de cadencia: número de paso, párrafo introductorio, o nada.

**La regla del peso por encima del tamaño.** Si una jerarquía no se lee, primero subir peso (de 500 a 600), no el tamaño. Tres pesos de la misma familia hacen más jerarquía que tres tamaños sin contraste de peso.

**La regla del `clamp` para todos los displays.** Cualquier `font-size` mayor a `1.25rem` lleva `clamp(min, vw, max)`. Tamaños fijos en hero rebosan en S10e (360px) y aparece overflow. Sin excepciones.

## 4. Elevation

El sistema es **plano por defecto**. La profundidad se construye con borde tintado (`#e8e8e8`) y blanco sobre `#fafafa`, no con sombras de ambiente. Las sombras existen en tres roles muy contenidos: cards principales en reposo, hover de cards interactivas, y CTA primario.

### Shadow Vocabulary

- **Card en reposo** (`box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06)`): sombra estructural muy baja para `sd-aside-card` y cards de servicio. Lift visual mínimo; el papel reposa sobre el papel.
- **Card hover desktop** (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)`): respuesta al hover sobre mapa de cards. Acompaña `translate(-2px)` vertical.
- **Card activa** (`box-shadow: 0 4px 18px hsl(var(--brand) / 0.14), 0 2px 8px rgba(0, 0, 0, 0.08)`): tinta brand al 14% de opacidad solo para el card SELECCIONADO en la lista. Es la ÚNICA sombra tintada permitida.
- **CTA primario en reposo** (`box-shadow: 0 4px 16px hsl(var(--brand) / 0.2)`): glow de marca al 20% bajo el botón pill primario. Da gravedad sin pasarse.
- **CTA primario hover** (`box-shadow: 0 8px 24px hsl(var(--brand) / 0.28)`): el mismo glow, 8px más alto. La escalera de hover es siempre +4px en `blur` y +8% en `α`.
- **Toast** (`box-shadow: 0 2px 14px rgba(15, 23, 42, 0.07)`): casi nula. El toast se distingue por el rail lateral de 4px en brand, no por la sombra.

### Named Rules

**La regla del plano por defecto.** Una superficie reposa plana. La sombra responde a estado (hover, foco, activo), nunca como adorno de identidad.

**La regla de la sombra que no tintamos.** Solo las sombras del CTA primario y del card-activo llevan tinta brand. Cards en reposo y toast llevan `rgba(15,23,42,α)` (negro azulado neutro). Tintar al azul un card que no está activo es ruido.

## 5. Components

### Buttons

- **Shape:** pill (`9999px`) para CTA principal y nav, rectangular suave (`8px`) para acciones secundarias inline. Nunca cuadrados rectos.
- **Primary:** fondo `{colors.brand}` (#0066CC), texto blanco sólido, `height: 48px`, padding horizontal `24px`, `font-weight: 600` body-strong, sombra de elevación CTA primario en reposo. Una versión móvil compacta (`sd-mobile-footer-cta`) sube a `min-width: 7.5rem` en pantallas ≥380px para dar el peso visual que la barra fija pide.
- **Hover / Focus:** transición `colors` solo (nunca `box-shadow` animado en layout). Hover sube a `{colors.brand-hover}` y la sombra escala +4px blur. Focus visible es un anillo `outline: 2px solid {colors.brand}` con `outline-offset: 2px`; nunca eliminar foco sin reemplazar.
- **Active:** `scale(0.99)`. Sin más.
- **Disabled:** opacidad `0.75`, cursor `wait` para acciones async (no `not-allowed`, que comunica error donde solo hay espera).
- **Secondary:** `height: 36px`, borde `1px solid {colors.border}`, fondo blanco, texto `{colors.ink-strong}`. Hover a fondo `{colors.surface-tinted}`. Para acciones inline que no compiten con el CTA primario.
- **Ghost icon button** (`sd-icon-btn`): `32×32px`, círculo blanco, borde gris claro, ícono `{colors.ink-soft}`. Único permiso para gris sobre blanco.

### Chips

- **Style:** pill (`9999px`), fondo `rgba(255,255,255,0.7)` con `backdrop-filter: blur(10px) saturate(150%)`, borde `rgba(255,255,255,0.5)`, texto `{colors.ink-strong}` body caption. Solo aparece sobre foto (chip de entregable).
- **Inline chip** (`sd-deliverable-chip-inline`): variante sin blur para listas sobre `{colors.surface}`. Borde sutil `{colors.border}`.
- **State:** seleccionado vira a fondo `{colors.brand}` con texto blanco; no se anima color, se sustituye.

### Cards / Containers

- **Corner Style:** `rounded-xl` (`16px`) para cards de aside y servicio; `rounded-2xl` (`24px`) solo para superficies de máxima jerarquía (modal de URL del anuncio en desktop).
- **Background:** `{colors.surface}` blanco. Excepción: fondo `{colors.surface-tinted}` solo para el body de la página de ficha de servicio, para que las cards blancas reposen sobre ella.
- **Shadow Strategy:** ver §4 (Elevation). Reposo plano + sombra estructural muy baja.
- **Border:** `1px solid {colors.border}` siempre. Las cards no flotan sin frontera.
- **Internal Padding:** `20px` (`p-5`) por defecto; `24px` para cards aside; `16px` para chips compactos.

### Inputs / Fields

Dos variantes coexisten por contexto:

- **Estilo Airbnb** (en el buscador del hero y similares): línea inferior única `border-bottom: 1px solid {colors.border}`, sin fondo, padding inferior `10px`, icono prefix posicionado absoluto a `left: 0`. Font-size `16px` para evitar zoom iOS.
- **Estilo shadcn**: borde completo `border {colors.border}`, fondo `transparent`, focus con `outline: 2px solid {colors.ring}` y `outline-offset: 2px`. Para formularios densos (admin, settings).
- **Focus:** anillo brand en ambas variantes. Nunca eliminar foco. En range sliders el outline se silencia explícitamente porque rompe el thumb.
- **Error:** borde `{colors.destructive}` y helper text en el mismo color. Nunca usar solo color: añadir ícono o texto.

### Navigation

- **Top bar desktop** (`HomepageDesktopTopBar`): fija arriba, fondo blanco con `backdrop-blur-sm`, separador inferior `{colors.border}`. Logo izquierda, navegación centro, avatar/CTA derecha.
- **Tabs** (`sd-tab`): texto `body` en reposo (`text-ink-muted`), `body-strong` activo (`text-ink-strong`) con borde inferior `border-b-2 border-brand`. Cero animación de cambio; el estado es lo que se mueve.
- **Mobile bottom bar fija** (`SD_MOBILE_FOOTER_SHELL_CLASS`): `position: fixed`, `bottom: 0`, fondo blanco, borde superior, sombra `0 -4px 24px rgba(15,23,42,0.09)`. Respeta `env(safe-area-inset-bottom)`.

### Toast (Signature)

El toast (`hp-toast`, Sonner customizado) es la única superficie con riel de color de marca. Fondo blanco, borde `{colors.border-soft}`, sombra prácticamente nula, ancho `360px`. El riel lateral izquierdo de `4px` en `{colors.brand}` (gradiente vertical al `22%` de opacidad abajo) es el tell del sistema: cuando ves ese rail sabes que es Inspecciono. Variantes `--error` cambian el rail a rojo, `--warning` a ámbar, `--info` cambia bg a `#f5f9fd` muy tenue.

## 6. Do's and Don'ts

### Do:

- **Do** usar `bg-brand` (`#0066CC`) como único color de acento. Si una sección quiere "color", el contestation es: ¿hace falta? Casi siempre no.
- **Do** usar Manrope en pesos 400/500/600/700 y ningún otro typeface. Tres pesos hacen jerarquía mejor que tres fuentes.
- **Do** verificar contraste antes de cerrar el commit. Body sobre `#0066CC` es blanco sólido, no `white/80`. Body muted `#6a6a6a` sobre `#fafafa` es 4.5:1 justo; sobre fondos más claros, falla.
- **Do** usar `clamp()` para todo display ≥ `1.25rem`. La viewport es parte del diseño.
- **Do** usar `text-wrap: balance` en h1-h3 y `text-wrap: pretty` en párrafos largos.
- **Do** respetar `prefers-reduced-motion: reduce`. Toda animación tiene su rama de crossfade o instantánea.
- **Do** disuadir cards. Si una lista cabe sin card, sin card. Si un módulo se entiende sin frontera, sin frontera.
- **Do** usar el rail brand de 4px del toast como el sello del sistema. Es el ÚNICO side-stripe permitido en todo el repo.
- **Do** sombras estructurales muy bajas (`α ≤ 0.08`). Si una sombra "se nota", probablemente es demasiada.

### Don't:

- **Don't** introducir el gradiente `from-blue-600 via-indigo-600 to-purple-700` ni ninguna de sus permutaciones (cyan→blue→indigo, blue→cyan→teal, etc.). Es el AI default 2026 saturado y la marca propia desaparece debajo. Tu hero es `bg-brand` sólido.
- **Don't** usar `background-clip: text` con gradiente (gradient text). Nunca decorativo.
- **Don't** usar glassmorphism por defecto. El chip sobre foto y el rail del top bar son las excepciones contadas; cualquier otra cosa con blur es ruido.
- **Don't** usar olas SVG multicolor, redes de líneas con nodos, partículas, copos de nieve, glitch effects, gradient shift loops. Quitar de raíz si aparecen. Vienen del crawl AI saturated, no de la marca.
- **Don't** cargar assets de competidores (en especial `revisario.com/wp-content/...`). Migrar a `src/media/` con asset propio.
- **Don't** mezclar tratamientos de CTA primario en la misma pantalla. Un solo tratamiento: `bg-brand` + sombra brand. El gris `bg-gray-900` y el gradient `from-cyan-600` están prohibidos como primarios.
- **Don't** usar `text-white/80` ni `text-white/90` para body sobre `bg-brand`. Falla WCAG AA. Body es blanco sólido.
- **Don't** usar Inter, Roboto, Space Grotesk, Poppins o cualquier otra. El sistema es Manrope única; cualquier fork es deuda de diseño.
- **Don't** usar el eyebrow `text-brand uppercase` encima de cada sección. Una vez es voz, cuatro es AI grammar.
- **Don't** usar `border-left` ≥ 2px como acento de color en cards. El único side-stripe del sistema es el rail del toast.
- **Don't** usar `bounce` ni `elastic` easing. Easings de exponente: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart) o equivalente. Nada que rebote.
- **Don't** anidar cards. Nunca. Si una card necesita otra card dentro, la jerarquía está mal y hay que rehacer el módulo.
- **Don't** parecer `revisario.com`, ni `Wallapop`, ni `Carfax USA muscular`, ni una landing SaaS con "Empower your purchase with AI-driven inspections". Los buzzwords (`streamline / empower / supercharge / leverage / unleash / transform / seamless`) están vetados en copy.
