/**
 * Tipografía unificada de la homepage.
 * Manrope (display/cargada) + system — sin depender de Airbnb Cereal VF no cargada.
 *
 * Colores: HP_COLOR reexporta INK/LINE de designTokens.ts (fuente única DESIGN.md).
 */
import { GRADIENT, INK, LINE } from './designTokens';

export const HP_FONT =
  'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';

export const HP_COLOR = {
  primary: INK.strong,
  secondary: INK.DEFAULT,
  muted: INK.muted,
  mutedSoft: INK.soft,
  brand: 'hsl(var(--brand))',
  brandDark: 'hsl(var(--brand-hover))',
  brandDarker: 'hsl(var(--brand-deep))',
  border: LINE.DEFAULT,
  borderSoft: LINE.soft,
} as const;

/** Gradiente legacy — modales móvil / búsqueda (no usado en hero desktop ni HomepageMobileHero) */
export const HP_PANEL_GRADIENT = GRADIENT.panelLegacy;

/**
 * `min-[390px]` — hero + tabs de categoría un poco más grandes (XR 414, 12/13 390).
 * Por debajo: SE (375), S10e (~360) → compacto.
 */
export const HP_MOBILE_MEDIUM = 'min-[390px]:' as const;

/**
 * `min-[428px]` — solo cards de servicios en Plus / Pro Max.
 * XR y SE comparten el mismo ancho de card (148px).
 */
export const HP_MOBILE_WIDE = 'min-[428px]:' as const;

/** Meta de card en muro — una línea con ellipsis */
export const HP_CARD_META_CLASS =
  'm-0 line-clamp-1 min-w-0 text-[11px] min-[428px]:text-xs leading-snug text-ink-muted tabular-nums';

/** Título de card en muro — sin min-height: reservar 2 líneas forzaba hueco muerto en títulos de 1 línea */
export const HP_CARD_TITLE_CLASS =
  'm-0 line-clamp-2 text-[13px] min-[428px]:text-sm leading-[1.25] font-medium tracking-[-0.01em] text-ink';

/** Carrusel de servicios en homepage — solo afecta a móvil (< md). */
export const HP_WALL_CARD_WIDTH_CLASS = 'w-[148px] min-[428px]:w-[160px] md:w-[184px]';

/** Botón icono flotante sobre foto/mapa (hero) — touch target 44px */
export const hpIconButtonClass =
  'flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line/80 bg-white/80 text-ink-muted backdrop-blur-sm transition-colors active:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

/** Subrayado decorativo bajo titulares (checkout / ¿Qué revisamos?) */
export const HP_TITLE_UNDERLINE_GRADIENT =
  `linear-gradient(to right, ${HP_COLOR.brand}, ${HP_COLOR.brandDark}, ${HP_COLOR.brandDarker})`;

export const hpTitleUnderlineBarStyle = {
  position: 'absolute' as const,
  bottom: '-4px',
  left: 0,
  right: 0,
  height: '3px',
  background: HP_TITLE_UNDERLINE_GRADIENT,
  borderRadius: '2px',
  opacity: 0.85,
};

/** Subrayado degradado de marca — usado como `background` inline (p. ej. FavoritesPage). */
export const HP_CHECKOUT_TITLE_UNDERLINE_GRADIENT = GRADIENT.checkoutTitleUnderline;

/** Clase Tailwind para enlaces subrayados de marca */
export const HP_LINK_UNDERLINE_CLASS =
  'underline decoration-brand underline-offset-2 hover:no-underline transition-all';

/** Estilos inline para UI densa (cards, búsqueda) */
export const hpType = {
  modalTitle: {
    fontFamily: HP_FONT,
    fontSize: '22px',
    lineHeight: '26px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  drawerTitle: {
    fontFamily: HP_FONT,
    fontSize: '22px',
    lineHeight: '26px',
    fontWeight: 600,
    letterSpacing: '-0.015em',
  },
  body: {
    fontFamily: HP_FONT,
    fontSize: '14px',
    lineHeight: '18px',
    fontWeight: 400,
  },
  bodyMedium: {
    fontFamily: HP_FONT,
    fontSize: '14px',
    lineHeight: '18px',
    fontWeight: 500,
  },
  bodySemibold: {
    fontFamily: HP_FONT,
    fontSize: '14px',
    lineHeight: '18px',
    fontWeight: 600,
  },
  caption: {
    fontFamily: HP_FONT,
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 400,
  },
  tabLabel: {
    fontFamily: HP_FONT,
    fontSize: '14px',
    lineHeight: '18px',
    fontWeight: 400,
  },
  badge: {
    fontFamily: HP_FONT,
    fontSize: '10px',
    lineHeight: '12px',
    fontWeight: 500,
    color: INK.strong,
  },
  tabBarLabel: {
    fontFamily: HP_FONT,
    fontSize: '10px',
    lineHeight: '12px',
    fontWeight: 500,
  },
} as const;

/** Mismos márgenes que HomepageWall — desktop contenido más ancho en XL */
export const SD_PAGE_INNER_MAX_CLASS =
  'mx-auto w-full max-w-[1280px] px-4 md:px-5 lg:px-6 xl:max-w-[1360px]';

/** Cifras de cobertura en hero (alineado con FAQ / HomePresentation) */
export const HP_HERO_COVERAGE = {
  countriesMin: 50,
  expertsMin: 500,
} as const;

/** Contenido + aside (título dentro de la columna izquierda, alineado con aside) */
export const SD_PAGE_GRID_CLASS =
  'grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-6 lg:gap-y-0';

/** Ritmo vertical secciones desktop */
export const SD_DESKTOP_SECTION_PY_CLASS = 'py-0';

/** Bloque principal bajo el hero — ritmo entre tarjetas de la columna izquierda */
export const SD_DESKTOP_CONTENT_STACK_CLASS = 'flex flex-col gap-4';

/** Tarjeta blanca columna izquierda — paridad visual con aside */
export const SD_DESKTOP_MAIN_CARD_CLASS =
  'overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] lg:p-7';

/** Panel desktop ficha servicio — instrumento: esquinas rectas, sin sombra. */
export const SD_DESKTOP_PANEL_CLASS =
  'overflow-hidden rounded-none border border-line bg-white p-6 lg:p-7';

/** Título de página bajo el hero */
export const SD_DESKTOP_PAGE_TITLE_BLOCK_CLASS = 'mb-0';

/** Cabecera ficha desktop: título + host */
export const SD_DESKTOP_HEADER_STACK_CLASS = 'flex flex-col';

/**
 * Fila experto dentro de tarjeta — separador inferior.
 * min-h-[84px] alinea su separador con el borde inferior del bloque de precio
 * del aside de reserva (ambas tarjetas arrancan a la misma altura), de modo que
 * las dos líneas divisorias quedan a la misma cota aunque la bio sea corta.
 * py-2 (simétrico) centra verticalmente avatar+identidad+Chat dentro de la fila
 * en vez de dejarlos pegados arriba; protege la bio larga de tocar el separador.
 */
export const SD_DESKTOP_HOST_ROW_CLASS =
  'min-h-[84px] border-b border-line py-2';

/** Nombre del experto en desktop — 15px */
export const SD_DESKTOP_HOST_NAME_CLASS =
  'truncate text-[15px] font-semibold leading-5 tracking-[-0.01em] text-ink';

/** Bio del experto en desktop — 14px */
export const SD_DESKTOP_HOST_BIO_CLASS =
  'sd-user-text mt-0.5 min-w-0 w-full text-sm font-normal leading-[1.5] text-ink-muted';

/** Meta del experto en desktop — 13px */
export const SD_DESKTOP_HOST_META_CLASS =
  'mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-normal leading-5 text-ink-muted';

/** Columna nombre + bio */
export const SD_DESKTOP_HOST_CONTENT_CLASS = 'min-w-0 flex-1 overflow-hidden pr-5';

/** Layout interno fila host desktop — anclado arriba (avatar alineado con nombre) */
export const SD_DESKTOP_HOST_INNER_CLASS = 'flex items-start gap-3';

/** Separación extra del botón Chat en desktop */
export const SD_DESKTOP_HOST_CHAT_CLASS = 'ml-2 shrink-0';

/** Reseñas desktop — pegadas al grid principal */
export const SD_DESKTOP_REVIEWS_FULL_SECTION_CLASS =
  'mt-6 w-full lg:mt-7';

/** Hero desktop 50/50 fotos + mapa */
export const SD_DESKTOP_PHOTO_MAP_HERO_HEIGHT_CLASS = 'h-[min(300px,28vh)]';
export const SD_DESKTOP_PHOTO_MAP_HERO_MIN_HEIGHT_PX = 260;

/** Aside reserva desktop */
export const SD_ASIDE_KICKER_CLASS =
  'text-xs font-medium leading-4 text-ink-muted';

export const SD_ASIDE_SECTION_LABEL_CLASS =
  'text-xs font-medium text-ink-muted';

/** Sticky del aside — topbar 48px (min-h-12) + 16px de aire */
export const SD_DESKTOP_STICKY_TOP_CLASS = 'lg:top-[calc(3rem+1rem)]';

/** Altura máx. aside reserva en desktop */
export const SD_DESKTOP_ASIDE_MAX_H_CLASS =
  'lg:max-h-[calc(100dvh-4.75rem)]';

/** Mapa preview en aside desktop (paridad checkout h-36) */
export const SD_ASIDE_MAP_PREVIEW_HEIGHT_CLASS = 'h-36';
export const SD_ASIDE_MAP_PREVIEW_MIN_HEIGHT_PX = 144;

/** Checkout desktop — ancho contenido tipo marketplace, márgenes estándar */
export const SD_CHECKOUT_INNER_MAX_CLASS =
  'mx-auto w-full max-w-[72rem] px-5 lg:px-8';

/** Checkout desktop — paso cita + mapa (más ancho) */
export const SD_CHECKOUT_APPOINTMENT_INNER_MAX_CLASS =
  'mx-auto w-full max-w-[94rem] px-4 sm:px-5 lg:px-6 xl:px-8 2xl:max-w-[100rem]';

/** Altura fija COMPARTIDA por los pasos 1 (cita) y 2 (mapa) del checkout desktop: al
 *  navegar entre pasos la fila no salta de alto (feedback 2026-07-10). Bajado de 620 a
 *  520px (feedback 2026-07-12): 620 estaba calibrado con la tarjeta «Pago protegido» de
 *  relleno bajo el calendario; al quitarla (ver CheckoutPage.tsx paso 1) quedaba un hueco
 *  muerto grande bajo el calendario y bajo las tarjetas de coordinación. 520px ≈ alto
 *  natural del calendario con mes de 6 filas + su padding, con margen para el mapa del
 *  paso 2 (no reducir más sin comprobar que el picker de mapa sigue siendo usable). */
export const SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_HEIGHT_CLASS =
  'h-[min(62vh,520px)] max-h-[520px]';

export const SD_CHECKOUT_GRID_CLASS =
  'grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch lg:gap-x-7 lg:gap-y-0';

/** Fondo checkout desktop — gris suave con ligero tinte cálido */
export const SD_CHECKOUT_DESKTOP_PAGE_CLASS = 'bg-surface-tinted';

/** Tarjeta checkout desktop — elevación neutra sobre fondo gris claro */
export const SD_CHECKOUT_DESKTOP_CARD_CLASS =
  'overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)]';

/** Bloque cita+mapa desktop — una sola tarjeta */
export const SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_CLASS =
  'overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_24px_rgba(15,23,42,0.05)]';

/** Cabecera de sección dentro de tarjeta checkout desktop */
export const SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS =
  'border-b border-line-soft bg-white px-4 py-2.5';

/** Cabecera compacta — bloques integrados (coordinación + calendario en la misma tarjeta) */
export const SD_CHECKOUT_EMBEDDED_SECTION_HEADER_CLASS =
  'border-b border-line-soft bg-white px-5 py-2.5';

/** Título de sección integrado sin borde (checkout desktop) */
export const SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS = 'px-5 pt-4 pb-1';

/** Encabezado h3 de secciones integradas en checkout desktop */
export const SD_CHECKOUT_EMBEDDED_SECTION_HEADING_CLASS =
  'text-[14px] font-semibold tracking-[-0.02em] text-ink-strong';

/** Texto explicativo bajo títulos integrados en checkout desktop */
export const SD_CHECKOUT_EMBEDDED_SECTION_DESC_CLASS =
  'mt-1.5 max-w-none text-[13px] font-normal leading-[1.55] text-ink';

/** Sangrado horizontal del chrome respecto al contenido indentado del paso. */
export const SD_CHECKOUT_EMBEDDED_STEP_CONTENT_BLEED_X_CLASS =
  '-ml-[calc(1.25rem+1.5rem+0.625rem)] -mr-5';

/** Contenido alineado con el texto del paso (tras badge + gap en cabecera numerada) */
export const SD_CHECKOUT_EMBEDDED_STEP_CONTENT_CLASS =
  'pl-[calc(1.25rem+1.5rem+0.625rem)] pr-5';

/** Sombra bloques interactivos checkout (calendario, mapa) — legible sobre surface-tinted */
export const SD_CHECKOUT_INTERACTIVE_SURFACE_SHADOW_CLASS =
  'shadow-[0_4px_24px_rgba(15,23,42,0.13),0_2px_8px_rgba(15,23,42,0.07),0_0_0_1px_rgba(15,23,42,0.06)]';

/** Bloque interactivo embebido (calendario, mapa, horas) — contorno legible sobre surface-tinted */
export const SD_CHECKOUT_EMBEDDED_INTERACTIVE_SHELL_CLASS =
  `overflow-hidden rounded-2xl border border-line bg-white ${SD_CHECKOUT_INTERACTIVE_SURFACE_SHADOW_CLASS}`;

/** Padding interior del bloque calendario embebido (compacto; más ajustado en móvil para dar aire a las celdas del día). */
export const SD_CHECKOUT_EMBEDDED_CALENDAR_SHELL_PADDING_CLASS = 'p-2 lg:p-3';

/** Checkout desktop — columna cita (calendario) */
export const SD_CHECKOUT_DESKTOP_APPOINTMENT_MAIN_CLASS =
  'min-w-0 flex-[0_0_50%] xl:flex-[0_0_48%]';

/** Checkout desktop — columna mapa */
export const SD_CHECKOUT_DESKTOP_MAP_COLUMN_CLASS =
  'min-w-0 flex-1 lg:min-w-[50%]';

/** SearchDetails desktop — layout marketplace (misma paleta que checkout) */
export const SD_SEARCH_DETAILS_DESKTOP_PAGE_CLASS = 'lg:bg-surface-tinted';

export const SD_SEARCH_DETAILS_DESKTOP_CARD_CLASS = SD_CHECKOUT_DESKTOP_CARD_CLASS;

/** Chat SearchDetails desktop — sin sombra; comparte hairline con el sidebar (split pane). */
export const SD_SEARCH_DETAILS_DESKTOP_CHAT_CARD_CLASS =
  'overflow-hidden rounded-none border border-line bg-white';

/** Sidebar SearchDetails desktop — panel operativo: esquinas rectas, sin sombra (contraste con el chat). */
export const SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CARD_CLASS =
  'overflow-hidden rounded-none border border-line bg-white';

export const SD_SEARCH_DETAILS_DESKTOP_INNER_CLASS =
  'mx-auto flex h-full w-full max-w-[90rem] flex-1 flex-col min-h-0';

export const SD_SEARCH_DETAILS_DESKTOP_LAYOUT_CLASS =
  'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row lg:items-stretch lg:gap-4 lg:p-0 lg:px-6 lg:pb-5 lg:pt-4';

export const SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CLASS =
  'hidden lg:flex lg:w-[320px] lg:shrink-0 xl:w-[360px] lg:flex-col lg:min-h-0';

export const SD_SEARCH_DETAILS_DESKTOP_CHAT_CLASS =
  'flex min-h-0 min-w-0 flex-1 flex-col';

/** Gutter checkout móvil */
export const SD_CHECKOUT_MOBILE_GUTTER_CLASS = 'px-5';

/** Título de paso del wizard móvil (rampa DESIGN.md: text-title) */
export const SD_CHECKOUT_MOBILE_STEP_TITLE_CLASS =
  'text-title font-bold leading-[1.15] tracking-[-0.02em] text-ink-strong [text-wrap:balance]';

/** Subrayado de marca en el paso final (Revisa y reserva) */
export const SD_CHECKOUT_MOBILE_STEP_TITLE_UNDERLINE_CLASS =
  'underline decoration-brand decoration-2 underline-offset-[6px]';

/** Descripción bajo el título de paso */
export const SD_CHECKOUT_MOBILE_STEP_DESC_CLASS =
  'mt-2.5 max-w-[46ch] text-meta leading-relaxed text-ink-muted';

/**
 * Superficie del header móvil de checkout — banda ink (chrome del wizard).
 * Separa orientación (pregunta + stepper) del cuerpo blanco de decisión.
 * Precedente: ServiceDetailDesktopBookingAside (banda precio bg-ink-strong).
 */
export const SD_CHECKOUT_MOBILE_WIZARD_HEADER_SURFACE_CLASS =
  'bg-ink-strong';

/** @deprecated Usar SD_CHECKOUT_MOBILE_WIZARD_HEADER_SURFACE_CLASS en el wizard. */
export const SD_CHECKOUT_MOBILE_HEADER_SURFACE_CLASS =
  'border-b border-line-soft bg-surface-tinted';

/**
 * Padding superior del header wizard móvil.
 * safe-area + 0.875rem: aire real bajo el notch sin robar espacio al cuerpo.
 */
export const SD_CHECKOUT_MOBILE_WIZARD_TOP_PAD_CLASS =
  'pt-[calc(env(safe-area-inset-top,0px)+0.875rem)]';

/** Aire bajo título/descripción antes de la ola decorativa */
export const SD_CHECKOUT_MOBILE_WIZARD_HEADER_PB_CLASS = 'pb-6';

/** Aire bajo la ola en el cuerpo scroll del wizard (todos los pasos) */
export const SD_CHECKOUT_MOBILE_WIZARD_BODY_PT_CLASS = 'pt-5';

/** Cuerpo scroll del wizard: gutter + ritmo bajo la ola (un solo lugar, no en hijos) */
export const SD_CHECKOUT_MOBILE_WIZARD_SCROLL_BODY_CLASS =
  `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} ${SD_CHECKOUT_MOBILE_WIZARD_BODY_PT_CLASS}`;

/** Shell mapa full-bleed — fondo blanco para que la ola no muestre tinted en valles */
export const SD_CHECKOUT_MOBILE_WIZARD_FULLBLEED_SHELL_CLASS = 'bg-white';

/** Cuerpo mapa full-bleed — blanco edge-to-edge bajo header ink */
export const SD_CHECKOUT_MOBILE_WIZARD_FULLBLEED_BODY_CLASS =
  'relative z-0 overflow-x-hidden bg-white';

/** Bleed vertical del mapa bajo la ola — pareado con `.checkout-wizard-header-wave` (22px) */
export const SD_CHECKOUT_MOBILE_WIZARD_FULLBLEED_BLEED_CLASS = '-top-[22px]';

/**
 * Anclaje del buscador flotante sobre mapa wizard self:
 * compensa bleed (-22px) + voladizo de ola (16px) + respiro (12px) para quedar
 * claramente bajo la banda ink, fuera del stacking del header (z-10).
 */
export const SD_CHECKOUT_MOBILE_WIZARD_MAP_SEARCH_OVERLAY_TOP_CLASS =
  'top-[calc(22px+16px+0.75rem)]';

/** Padding superior al encuadrar cobertura cuando hay buscador wizard self (px). */
export const SD_CHECKOUT_MOBILE_WIZARD_MAP_SEARCH_BOUNDS_TOP_PX = 132;

/** Superficie interactiva ligera en wizard móvil (calendario sin card anidada) */
export const SD_CHECKOUT_MOBILE_INTERACTIVE_SURFACE_CLASS =
  'overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_4px_rgba(15,23,42,0.06)]';

/** Aviso de confianza / estado — compartido entre pasos y footer sticky */
export const SD_CHECKOUT_MOBILE_STATUS_NOTE_CLASS =
  'flex items-start gap-2.5 rounded-xl border border-brand/12 bg-white px-5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]';

/** Énfasis en descripciones de paso sobre banda oscura */
export const SD_CHECKOUT_MOBILE_STEP_DESC_EMPHASIS_ON_DARK_CLASS =
  'font-semibold text-white';

/** Etiqueta de campo en formularios del checkout móvil */
export const SD_CHECKOUT_MOBILE_FIELD_LABEL_CLASS =
  'block text-caption font-medium text-ink-muted';

/** Título de paso sobre banda oscura — text-title para separarse de labels de tarjeta (text-body) */
export const SD_CHECKOUT_MOBILE_STEP_TITLE_ON_DARK_CLASS =
  'text-title font-bold leading-[1.2] tracking-[-0.02em] text-white [text-wrap:balance]';

/** Descripción sobre banda oscura — misma escala que pasos claros */
export const SD_CHECKOUT_MOBILE_STEP_DESC_ON_DARK_CLASS =
  'mt-2.5 max-w-[46ch] text-meta leading-relaxed text-white/85';

/** Precio en cabecera de pago sobre banda oscura — no superar al título del paso */
export const SD_CHECKOUT_MOBILE_PAYMENT_HEADER_PRICE_ON_DARK_CLASS =
  'text-lead font-bold tabular-nums leading-none tracking-[-0.02em] text-white';

export const SD_CHECKOUT_MOBILE_PAYMENT_HEADER_PRICE_META_ON_DARK_CLASS =
  'mt-1 text-caption text-white/85';

/**
 * Cabecera de paso móvil como BANDA tipo topbar para los pasos con scroll (donde el
 * título vive dentro del gutter, a diferencia de los pasos de mapa que ya tienen su
 * propio `<header>`). Piezas:
 * - `-mx-5 px-5`: rompe el gutter de 20px para que el fondo/línea lleguen de borde a borde.
 * - `-mt/pt` con el mismo calc que SD_CHECKOUT_MOBILE_TOP_PAD_CLASS: la banda SUBE sobre el
 *   padding-top (safe-area) del contenedor padre y lo re-añade DENTRO, para que el fondo
 *   gris llegue al borde superior en vez de dejar una franja blanca arriba. Se hace en la
 *   propia banda (no moviendo el padding del padre) porque el padre lo comparten sub-vistas
 *   sin banda (la vista 'seller' con cabecera propia) que sí necesitan ese offset.
 * - `pb-3` separa la copy de la línea; `mb-5` conserva el aire hasta el contenido.
 */
export const SD_CHECKOUT_MOBILE_STEP_HEADER_BAND_CLASS =
  '-mx-5 -mt-[calc(env(safe-area-inset-top,0px)+1.5rem)] border-b border-line-soft bg-surface-tinted px-5 pb-3 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] mb-5 [@media(min-height:700px)]:mb-6 [@media(min-height:700px)]:-mt-[calc(env(safe-area-inset-top,0px)+2.25rem)] [@media(min-height:700px)]:pt-[calc(env(safe-area-inset-top,0px)+2.25rem)]';

/** Cabecera checkout móvil — superficie blanca plana */
export const SD_CHECKOUT_MOBILE_HEADER_CLASS =
  'pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] ' +
  SD_CHECKOUT_MOBILE_GUTTER_CLASS +
  ' ' +
  SD_CHECKOUT_MOBILE_HEADER_SURFACE_CLASS;

export const SD_CHECKOUT_MOBILE_HEADER_ROW_CLASS =
  'flex min-h-10 items-center gap-2.5 overflow-visible';

export const SD_CHECKOUT_MOBILE_BACK_BTN_CLASS =
  'sd-icon-btn h-9 w-9 shrink-0';

/** Etiqueta de fila checkout móvil */
export const SD_CHECKOUT_MOBILE_LABEL_CLASS =
  'text-xs font-medium leading-4 text-ink-muted';

/** Valor principal de fila checkout móvil */
export const SD_CHECKOUT_MOBILE_VALUE_CLASS =
  'text-sm font-normal leading-snug text-ink';

/** Meta secundaria (rango, notas) */
export const SD_CHECKOUT_MOBILE_META_CLASS =
  'text-xs font-normal leading-relaxed text-ink-muted';

/** Gutter + ritmo vertical filas checkout móvil (legacy full-bleed) */
export const SD_CHECKOUT_MOBILE_ROW_CLASS =
  `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} border-b border-line py-4`;

/** Contenedor tabla resumen — gutter vive en main del shell */
export const SD_CHECKOUT_MOBILE_TABLE_WRAP_CLASS = 'pb-3 pt-1';

/** @deprecated El gutter y pt-5 los aplica CheckoutMobileWizardShell en main */
export const SD_CHECKOUT_MOBILE_PAYMENT_BODY_CLASS = '';

/** Wrapper calendario — mismo z que choose; el aire lo da wave-scroll + pt-5 del shell */
export const SD_CHECKOUT_MOBILE_WIZARD_CALENDAR_STACK_CLASS = 'relative z-[1]';

/** Cuerpo paso calendario self — blanco continuo; pt-5 hereda de SCROLL_BODY_CLASS */
export const SD_CHECKOUT_MOBILE_WIZARD_CALENDAR_BODY_CLASS =
  '!bg-white relative z-[1] pb-5';

/** Shell paso calendario — evita franja tinted en el margen bajo la ola */
export const SD_CHECKOUT_MOBILE_WIZARD_CALENDAR_SHELL_CLASS = 'bg-white';

/** Cuerpo paso elección — solo padding inferior extra (tinte/pt en shell) */
export const SD_CHECKOUT_MOBILE_CHOOSE_BODY_CLASS = 'pb-5';

/** Stack de cards elección — tuck bajo la ola decorativa */
export const SD_CHECKOUT_MOBILE_CHOOSE_CARD_STACK_CLASS =
  'relative z-[1] -mt-2 flex flex-col gap-4 [@media(min-height:700px)]:gap-5';

/** Rail de confianza in-scroll (paso elección) */
export const SD_CHECKOUT_MOBILE_CHOOSE_TRUST_CLASS =
  `mt-5 ${SD_CHECKOUT_MOBILE_STATUS_NOTE_CLASS}`;

/** @deprecated Alias de SD_CHECKOUT_MOBILE_WIZARD_HEADER_PB_CLASS */
export const SD_CHECKOUT_MOBILE_WIZARD_HEADER_CHOOSE_PB_CLASS =
  SD_CHECKOUT_MOBILE_WIZARD_HEADER_PB_CLASS;

/** @deprecated Alias de SD_CHECKOUT_MOBILE_WIZARD_HEADER_SURFACE_CLASS */
export const SD_CHECKOUT_MOBILE_WIZARD_HEADER_CHOOSE_SURFACE_CLASS =
  SD_CHECKOUT_MOBILE_WIZARD_HEADER_SURFACE_CLASS;

/** @deprecated Usar SD_CHECKOUT_MOBILE_WIZARD_HEADER_PB_CLASS (pb-6 unificado) */
export const SD_CHECKOUT_MOBILE_PAYMENT_STEP_HEADER_CLASS =
  SD_CHECKOUT_MOBILE_WIZARD_HEADER_PB_CLASS;

/** Resumen paso pago — gutter en main del shell */
export const SD_CHECKOUT_MOBILE_PAYMENT_TABLE_WRAP_CLASS = 'pb-5 pt-0';

/** Fallback scroll pad cuando el footer incluye línea de confianza (antes de medir con ResizeObserver). */
export const SD_CHECKOUT_MOBILE_FOOTER_WITH_TRUST_PAD_CLASS =
  'pb-[calc(1.25rem+2.75rem+2.75rem+1.75rem+max(0.625rem,env(safe-area-inset-bottom,0px)))]';

/** Tarjeta de resumen en el paso de pago móvil */
export const SD_CHECKOUT_MOBILE_PAYMENT_CARD_CLASS =
  'relative rounded-2xl border border-line bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]';

/** Cabecera de servicio dentro de la tarjeta de pago móvil */
export const SD_CHECKOUT_MOBILE_PAYMENT_CARD_HEADER_CLASS =
  'border-b border-line-soft px-5 py-4';

/** Título de sección en el resumen de pago móvil (Tu reserva, Cita y ubicación, Tu experto…) */
export const SD_CHECKOUT_MOBILE_PAYMENT_SECTION_TITLE_CLASS =
  'text-body font-semibold text-ink-strong';

/** Contenido principal bajo un título de sección (nombre de servicio, valores de fila) */
export const SD_CHECKOUT_MOBILE_PAYMENT_CONTENT_CLASS =
  'text-body font-normal leading-snug text-ink-strong';

export const SD_CHECKOUT_MOBILE_PAYMENT_CARD_TITLE_CLASS =
  SD_CHECKOUT_MOBILE_PAYMENT_SECTION_TITLE_CLASS;

export const SD_CHECKOUT_MOBILE_PAYMENT_CARD_SERVICE_CLASS =
  'mt-1 ' + SD_CHECKOUT_MOBILE_PAYMENT_CONTENT_CLASS + ' [text-wrap:balance]';

export const SD_CHECKOUT_MOBILE_PAYMENT_CARD_META_CLASS =
  'mt-0.5 text-meta text-ink-muted';

/** Precio anclado en la cabecera del paso de pago móvil */
export const SD_CHECKOUT_MOBILE_PAYMENT_HEADER_PRICE_CLASS =
  'text-title font-bold tabular-nums leading-none tracking-[-0.02em] text-ink-strong min-[390px]:text-subtitle min-[390px]:font-semibold';

export const SD_CHECKOUT_MOBILE_PAYMENT_HEADER_PRICE_META_CLASS =
  'mt-1 text-caption text-ink-muted';

/** Cabecera de grupo dentro de la tarjeta de pago (Cita y ubicación, etc.) */
export const SD_CHECKOUT_MOBILE_PAYMENT_GROUP_CLASS =
  'border-t border-line-soft px-5 pb-1 pt-4';

/** Bloque experto + entregables en la tarjeta de pago */
export const SD_CHECKOUT_MOBILE_PAYMENT_TRUST_BLOCK_CLASS =
  'flex flex-col gap-4 border-t border-line-soft px-5 py-4';

/** Pie de la tarjeta de pago (notas legales) */
export const SD_CHECKOUT_MOBILE_PAYMENT_FOOTER_CLASS =
  'space-y-3 border-t border-line-soft px-5 py-4';

/** Inset horizontal compartido en tarjetas de resumen checkout (desktop + móvil) */
export const SD_CHECKOUT_SUMMARY_INSET_X_CLASS = 'px-5';

/** Título de sección del resumen — sentence case, sin eyebrow en mayúsculas */
export const SD_CHECKOUT_SUMMARY_SECTION_TITLE_CLASS =
  'text-body font-semibold text-ink-strong';

/** Cabecera principal del bloque de resumen */
export const SD_CHECKOUT_SUMMARY_HEADER_CLASS =
  'border-b border-line-soft px-5 py-4';

/** Separador de grupo dentro del resumen (Cita y ubicación, Contacto…) */
export const SD_CHECKOUT_SUMMARY_GROUP_CLASS =
  'border-t border-line-soft px-5 pb-1 pt-4';

/** Fila label–valor del resumen desktop (columnas alineadas) */
export const SD_CHECKOUT_SUMMARY_ROW_CLASS =
  'flex items-start justify-between gap-6 border-t border-line-soft px-5 py-3';

export const SD_CHECKOUT_SUMMARY_ROW_LABEL_CLASS =
  'w-[34%] max-w-[8.75rem] shrink-0 text-meta font-medium text-ink-muted';

export const SD_CHECKOUT_SUMMARY_ROW_VALUE_CLASS =
  'min-w-0 flex-1 text-end text-body font-normal leading-snug text-ink-strong';

/** Bloque con borde superior (entregables, experto, total) */
export const SD_CHECKOUT_SUMMARY_BLOCK_CLASS =
  'border-t border-line-soft px-5 py-4';

/** Grid paso pago desktop — columna resumen + panel lateral */
export const SD_CHECKOUT_DESKTOP_PAYMENT_GRID_CLASS =
  'grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8';

/** Shell de página paso pago desktop (mismo gutter que pasos 1–2) */
export const SD_CHECKOUT_DESKTOP_PAYMENT_SHELL_CLASS =
  'mx-auto w-full max-w-[75rem] px-4 pb-12 pt-8 sm:px-5 lg:px-8';

export const SD_CHECKOUT_MOBILE_TABLE_CLASS =
  'overflow-hidden rounded-xl border border-line bg-white';

export const SD_CHECKOUT_MOBILE_TABLE_HEADER_CLASS =
  'px-4 py-3.5';

export const SD_CHECKOUT_MOBILE_TABLE_TITLE_CLASS =
  'text-base font-semibold leading-snug tracking-[-0.01em] text-ink-strong';

export const SD_CHECKOUT_MOBILE_TABLE_SUBTITLE_CLASS =
  'mt-0.5 text-xs text-ink-muted';

export const SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS =
  'flex items-start justify-between gap-4 border-t border-line-soft px-4 py-3';

/** Fila apilada del resumen en paso pago móvil (etiqueta arriba, valor abajo). */
export const SD_CHECKOUT_MOBILE_PAYMENT_ROW_CLASS =
  'border-t border-line-soft px-5 py-3';

export const SD_CHECKOUT_MOBILE_PAYMENT_ROW_LABEL_CLASS =
  'text-meta font-medium text-ink-muted';

export const SD_CHECKOUT_MOBILE_PAYMENT_ROW_VALUE_CLASS =
  'mt-0.5 text-body font-normal leading-snug text-ink-strong';

export const SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS =
  'w-[30%] shrink-0 text-xs text-ink-muted';

export const SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS =
  'min-w-0 flex-1 text-end text-[13px] leading-snug text-ink-strong';

export const SD_CHECKOUT_MOBILE_TABLE_VALUE_META_CLASS =
  'mt-0.5 block text-xs leading-snug text-ink-muted';

export const SD_CHECKOUT_MOBILE_NOTES_CLASS =
  `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} border-b border-line py-4`;

/** Fila de confianza checkout móvil — icono + una línea */
export const SD_CHECKOUT_MOBILE_TRUST_ITEM_CLASS =
  'flex items-start gap-3 text-sm font-normal leading-snug text-ink';

export const SD_CHECKOUT_MOBILE_TRUST_ICON_CLASS =
  'mt-0.5 h-4 w-4 shrink-0 text-brand';

export const SD_CHECKOUT_MOBILE_LEGAL_CLASS =
  `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} py-4`;

/** Scroll checkout móvil — footer base (pt-2.5 + CTA 2.75rem + pb-2.5 + safe-area). */
export const SD_CHECKOUT_MOBILE_FOOTER_HEIGHT_EXPR =
  'calc(1.25rem + 2.75rem + max(0.625rem, env(safe-area-inset-bottom, 0px)))';

export const SD_CHECKOUT_MOBILE_SCROLL_PAD_CLASS =
  'pb-[calc(0.625rem+2.75rem+max(0.625rem,env(safe-area-inset-bottom,0px)))]';

/**
 * Margen superior del contenido del checkout móvil (no hay top bar como en desktop).
 * Suma aire visible POR ENCIMA del safe-area en lugar de `max()` —que sobre un notch
 * dejaba el contenido pegado al borde sin margen real—. Respeta el notch + 1.5rem.
 * En pantallas ALTAS (≥700px de viewport: iPhone XR/11+, no el SE) sube a 2.25rem:
 * top-align + aire progresivo con la altura, en vez de centrar (patrón responsive
 * height; el centrado abría un vacío en mitad del paso de elección).
 */
export const SD_CHECKOUT_MOBILE_TOP_PAD_CLASS =
  'pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] [@media(min-height:700px)]:pt-[calc(env(safe-area-inset-top,0px)+2.25rem)]';

/** Degradado marca — asistente / chat (ámbar → crema → azul) */
export const SD_BRAND_CHAT_GRADIENT_WASH =
  'linear-gradient(90deg, rgba(247,193,75,0.45) 0%, rgba(253,237,205,0.42) 36%, rgba(221,233,250,0.48) 62%, rgba(63,127,224,0.45) 100%)';

export const SD_BRAND_CHAT_GRADIENT_LINE =
  'linear-gradient(90deg, rgba(247,193,75,0.55) 0%, rgba(63,127,224,0.55) 100%)';

/** Variante más suave para checkout y superficies grandes */
export const SD_BRAND_CHAT_GRADIENT_WASH_SUBTLE =
  'linear-gradient(90deg, rgba(247,193,75,0.22) 0%, rgba(253,237,205,0.18) 36%, rgba(221,233,250,0.22) 62%, rgba(63,127,224,0.22) 100%)';

export const SD_BRAND_CHAT_GRADIENT_LINE_SUBTLE =
  'linear-gradient(90deg, rgba(247,193,75,0.42) 0%, rgba(63,127,224,0.42) 100%)';

/** Variante azul (sin ámbar) — degradado de azul claro a azul marca */
export const SD_BRAND_BLUE_GRADIENT_WASH_SUBTLE =
  'linear-gradient(90deg, rgba(63,127,224,0.13) 0%, rgba(99,160,240,0.22) 48%, rgba(63,127,224,0.36) 100%)';

export const SD_BRAND_BLUE_GRADIENT_LINE_SUBTLE =
  'linear-gradient(90deg, rgba(99,160,240,0.30) 0%, rgba(63,127,224,0.55) 100%)';

/** Paso pago / resumen checkout móvil — aire superior y fondo tipo desktop */
export const SD_CHECKOUT_MOBILE_PAYMENT_PAGE_CLASS = 'min-h-[100dvh] bg-surface-tinted';

export const SD_CHECKOUT_MOBILE_PAYMENT_SCROLL_CLASS =
  // pt suma el safe-area en vez de max(): con notch, max() dejaba el título pegado
  // al borde sin aire propio (mismo fix que SD_CHECKOUT_MOBILE_TOP_PAD_CLASS).
  // 1.25rem + el pt-1 de la cabecera del paso = 24px, a la par de los pasos 1-3;
  // en pantallas altas 2rem (+pt-1 = 36px), misma progresión que TOP_PAD.
  'relative pb-[calc(0.625rem+2.75rem+max(0.625rem,env(safe-area-inset-bottom,0px)))] pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] [@media(min-height:700px)]:pt-[calc(env(safe-area-inset-top,0px)+2rem)]';

export const SD_CHECKOUT_MOBILE_FOOTER_SHELL_CLASS =
  'fixed bottom-0 left-0 right-0 z-[60] border-t border-line bg-white';

/** Offset inferior compartido: drawer, mapa y scroll sobre el footer fijo checkout móvil. */
export const SD_CHECKOUT_MOBILE_FOOTER_BOTTOM_OFFSET = SD_CHECKOUT_MOBILE_FOOTER_HEIGHT_EXPR;

export const SD_CHECKOUT_MOBILE_FOOTER_INSET_BOTTOM_CLASS =
  'bottom-[calc(1.25rem+2.75rem+max(0.625rem,env(safe-area-inset-bottom,0px)))]';

export const SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS =
  'pb-[calc(1.25rem+2.75rem+max(0.625rem,env(safe-area-inset-bottom,0px)))]';

export const SD_CHECKOUT_MOBILE_FOOTER_ACTIONS_CLASS = 'flex items-center gap-2.5';

export const SD_CHECKOUT_MOBILE_BACK_TEXT_BTN_CLASS =
  'inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-line bg-white px-4 text-meta font-semibold text-ink-muted transition-[colors,transform,border-color] duration-200 ease-out hover:border-ink-soft hover:bg-surface-tinted hover:text-ink-strong motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100';

/** Contenedor calendario checkout — contorno neutro */
export const SD_CHECKOUT_CALENDAR_FRAME_CLASS =
  `rounded-2xl border border-line bg-white p-2 ${SD_CHECKOUT_INTERACTIVE_SURFACE_SHADOW_CLASS}`;

/** Contenedor mapa checkout — contorno neutro */
export const SD_CHECKOUT_PICKER_FRAME_CLASS =
  `overflow-hidden rounded-2xl border border-line bg-white p-1 ${SD_CHECKOUT_INTERACTIVE_SURFACE_SHADOW_CLASS}`;

/** @deprecated Usar SD_CHECKOUT_PICKER_FRAME_CLASS */
export const SD_CHECKOUT_MAP_FRAME_CLASS = SD_CHECKOUT_PICKER_FRAME_CLASS;

/**
 * CTA de PAGO del wizard móvil ("Reservar y pagar"). Negro, igual que el resto
 * del embudo (ficha → checkout): el azul de marca es acento, no acción. Nunca
 * coexiste en pantalla con el CTA de avance (son ramas del mismo ternario por
 * `mobileStep`), así que compartir color no crea ambigüedad.
 */
// CTA de acción del checkout: azul de marca (mismo primario que SileoButton/login y el
// resto de la app). Antes era negro (bg-ink-strong), un huérfano frente al azul de marca
// de todo lo demás; unificado para que la acción de máxima intención use la identidad.
export const SD_CHECKOUT_MOBILE_CTA_CLASS =
  'inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-full bg-brand text-lead font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.22)] transition-[colors,transform,box-shadow] duration-200 ease-out hover:bg-brand-hover hover:shadow-[0_6px_20px_hsl(var(--brand)/0.28)] motion-safe:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100';

/** CTA de AVANCE del wizard (Continuar/Siguiente). Mismo azul de marca que el de pago. */
export const SD_CHECKOUT_MOBILE_CTA_DARK_CLASS = SD_CHECKOUT_MOBILE_CTA_CLASS;

/** Separador entre mapa y resumen en checkout móvil paso 2 */
export const SD_CHECKOUT_MOBILE_SUMMARY_SECTION_CLASS =
  'mt-6 border-t border-line bg-surface-tinted pb-4 pt-5';

/** Gutter horizontal móvil — 20px */
export const SD_MOBILE_GUTTER_CLASS = 'px-5';

/** Solape de la card blanca sobre el hero */
export const SD_MOBILE_SHEET_OVERLAP_CLASS = '-mt-5';

/** Padding superior de la sheet — simétrico con el solape (−mt-5 ↔ pt-5) */
export const SD_MOBILE_SHEET_TOP_CLASS = 'pt-5';

/** Stack identidad móvil: título → host (escala sm+ = 12px) */
export const SD_MOBILE_IDENTITY_STACK_CLASS = 'flex flex-col gap-3';

/** Bloque identidad (título + host) — gutter; border-t del carril tabs cierra el bloque */
export const SD_MOBILE_IDENTITY_GUTTER_CLASS = `${SD_MOBILE_GUTTER_CLASS} pb-3`;

/** Carril scroll tabs móvil — borde superior; padding-top de badges vive en .sd-tablist (CSS) */
export const SD_MOBILE_TABLIST_SHELL_CLASS =
  'sd-tablist-shell border-t border-line pt-0 pb-2';

export const SD_MOBILE_TAB_PANEL_PT_CLASS = 'pt-2 pb-4';

/** Panel reseñas — mismo ritmo inferior que el resto de tabs */
export const SD_MOBILE_TAB_PANEL_REVIEWS_CLASS = 'pt-2 pb-4';

/** Stack vertical del panel «Acerca del servicio». */
export const SD_MOBILE_INSET_STACK_CLASS = 'flex flex-col gap-4';

/** Sección entregables — mismo gap que INSET_STACK + ancla scroll al tablist */
export const SD_MOBILE_DELIVERABLES_SECTION_CLASS =
  'flex flex-col gap-4 scroll-mt-[4.5rem]';

/** Mapa preview en ficha móvil (cobertura) */
export const SD_MOBILE_MAP_PREVIEW_HEIGHT_CLASS = 'h-24';

/** Altura mínima reservada por LazyMount del mapa móvil (px) */
export const SD_MOBILE_MAP_PREVIEW_MIN_HEIGHT_PX = 96;

/** Separador interno del bloque reserva (mapa → disponibilidad) */
export const SD_MOBILE_BOOKING_DIVIDER_CLASS =
  'border-t border-line pt-2';

/** Ritmo vertical entre bloques de la sheet móvil */
export const SD_MOBILE_SECTION_GAP_CLASS = 'mb-4';

/** Aire bajo fila revisor */
export const SD_MOBILE_HEADER_PB_CLASS = 'pb-0';

/** Fila host móvil: avatar + identidad + chat */
export const SD_MOBILE_HOST_ROW_CLASS = 'flex items-start gap-2';

/** Chat inline en fila host móvil */
export const SD_MOBILE_HOST_CHAT_CLASS =
  'h-9 shrink-0 self-start rounded-full px-3.5';

/** Línea de confianza bajo nombre (revisor verificado) */
export const SD_MOBILE_HOST_TRUST_CLASS =
  'mt-1 truncate text-xs font-medium leading-4 text-brand';

/** Bloque meta bajo el host (sin borde; la separación es espaciado + tarjeta credenciales) */
export const SD_MOBILE_META_SECTION_CLASS = 'mt-3';

/** Zona tabs + panel — carril con border-t en CSS (.service-detail-page .sd-tablist-shell) */
export const SD_MOBILE_TAB_REGION_CLASS = '';

/** @deprecated Sin divisor horizontal — usar SD_MOBILE_TAB_REGION_CLASS */
export const SD_MOBILE_SHEET_DIVIDER_CLASS = SD_MOBILE_TAB_REGION_CLASS;

/** Contenedor tabs + panel (sin margen extra al final) */
export const SD_MOBILE_SHEET_BOTTOM_CLASS = '';

export const SD_MOBILE_TABLIST_CLASS = 'sd-tablist';

/** Etiqueta de fila en bloque reserva (Disponibilidad, Cobertura) — no compite con nombre del experto */
export const SD_MOBILE_BOOKING_LABEL_CLASS =
  'text-xs font-medium leading-4 text-ink-muted';

/** Hora en fila «Horario habitual» — secundaria respecto al label, no compite con los días */
export const SD_MOBILE_AVAILABILITY_TIME_CLASS =
  'text-caption font-medium tabular-nums leading-4 text-ink-strong';

/**
 * Escala tipográfica móvil — tokens DESIGN.md:
 * título página 20px (sd-page-title) · énfasis 14px/600 · cuerpo 14px · meta/caption 12px
 */
export const SD_MOBILE_EYEBROW_CLASS =
  'text-xs font-medium leading-4 normal-case text-ink-muted';
export const SD_MOBILE_EMPHASIS_CLASS =
  'text-sm font-semibold leading-5 tracking-[-0.01em] text-ink-strong';
export const SD_MOBILE_BODY_CLASS =
  'text-sm font-normal leading-[1.6] text-ink-strong';
export const SD_MOBILE_META_CLASS =
  'text-xs font-normal leading-4 text-ink-muted';
/** @deprecated Usar SD_MOBILE_EYEBROW_CLASS o SD_MOBILE_SUBHEAD_CLASS */
export const SD_MOBILE_LABEL_CLASS = SD_MOBILE_EYEBROW_CLASS;

/** Subsecciones: Disponibilidad, Qué incluye, Cobertura — misma jerarquía */
export const SD_MOBILE_SUBHEAD_CLASS =
  'text-sm font-semibold leading-5 text-ink-strong';
export const SD_MOBILE_SECTION_TITLE_CLASS = SD_MOBILE_SUBHEAD_CLASS;

/** Carruseles horizontales móvil: alinear con gutter sin duplicar en cada card */
export const SD_MOBILE_CAROUSEL_EDGE_CLASS = 'pl-4 pr-4';

/**
 * Reserva inferior del scroll: barra fija compacta + colchón md + safe-area.
 * Barra ≈ py-2.5 + fila 44px + pb safe-area (~54px + safe).
 */
export const SD_MOBILE_SCROLL_PAD_CLASS =
  'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]';

/** @deprecated Sin línea de confianza en footer; usar SD_MOBILE_SCROLL_PAD_CLASS */
export const SD_MOBILE_SCROLL_PAD_TRUST_CLASS =
  'pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]';

/** Offset superior botones flotantes (notch / Dynamic Island) */
export const SD_MOBILE_FLOATING_TOP_CLASS =
  'top-[max(1rem,env(safe-area-inset-top,0px))]';

/** Shell flotante — anclado al hero (absolute), no al viewport */
export const SD_MOBILE_TOPBAR_FLOATING_SHELL_CLASS =
  'pointer-events-none absolute inset-x-0 top-0 z-30 transition-opacity duration-300';

export const SD_MOBILE_TOPBAR_FLOATING_INNER_CLASS = `pointer-events-auto flex items-center justify-between ${SD_MOBILE_GUTTER_CLASS} pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))]`;

/** Barra compacta al hacer scroll — back + título + favorito */
export const SD_MOBILE_TOPBAR_COMPACT_SHELL_CLASS =
  'fixed inset-x-0 top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-[transform,opacity] duration-300 ease-out';

export const SD_MOBILE_TOPBAR_COMPACT_INNER_CLASS = `flex min-h-12 items-center gap-3 ${SD_MOBILE_GUTTER_CLASS} pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top,0px))]`;

/** Shell barra fija móvil */
export const SD_MOBILE_FOOTER_SHELL_CLASS =
  'fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.09)]';

/** Altura footprint de MobileBottomBar (safe-area incluida via calc en el componente) */
export const MOBILE_TAB_BAR_HEIGHT_PX = 65;

/** Offset inferior de contenido móvil que respeta la barra + safe-area del dispositivo */
export const MOBILE_CONTENT_PADDING_BOTTOM_CLASS = 'pb-[calc(65px+env(safe-area-inset-bottom,0px))]';

/** Offset inferior del FAB con tab bar (20px de aire sobre los 65px de la barra) */
export const CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS = 'bottom-[calc(65px+1.25rem+env(safe-area-inset-bottom,0px))]';

/** Barra fija «Nuevo servicio» en panel experto (móvil) */
export const CHATBOT_FAB_BOTTOM_WITH_EXPERT_SERVICES_CLASS =
  'bottom-[calc(4.25rem+1rem+env(safe-area-inset-bottom,0px))]';

/** Offset inferior del FAB sin tab bar (respeta safe-area del dispositivo) */
export const CHATBOT_FAB_BOTTOM_STANDALONE_CLASS =
  'bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]';

/** Ficha servicio: barra Reservar compacta + 1rem de aire */
export const CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS =
  'bottom-[calc(5.25rem+1rem+env(safe-area-inset-bottom,0px))]';

/** Esquina inferior derecha en móvil (alineado con gutter px-5) */
export const CHATBOT_FAB_RIGHT_MOBILE_CLASS = 'right-5';

/**
 * Chip de confianza en hero desktop: alineado al contenedor 1280px,
 * inset desde la derecha (no pegado al borde del viewport).
 */
export const HOMEPAGE_TRUST_CHIP_DESKTOP_RIGHT_CLASS =
  'right-[max(2rem,calc((100vw-80rem)/2+8rem))]';

/** CTA barra inferior móvil (más alto y legible que h-12 genérico) */
export const SD_MOBILE_FOOTER_CTA_CLASS = 'sd-mobile-footer-cta';

/** CTA principal (desktop / inline) */
export const HP_SERVICE_CTA_CLASS =
  'inline-flex items-center justify-center h-12 px-6 min-w-[120px] shrink-0 rounded-full bg-brand text-white text-base font-semibold shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover hover:shadow-[0_8px_24px_hsl(var(--brand)/0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait';

/** Pills de categoría — hero desktop. Activo en tinta (no brand): reserva azul para titular y CTA. */
export const HP_DESKTOP_CATEGORY_TAB_BASE_CLASS =
  'inline-flex h-10 min-h-10 items-center gap-1.5 rounded-full px-3.5 text-caption font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

export const HP_DESKTOP_CATEGORY_TAB_ACTIVE_CLASS =
  'bg-ink-strong font-semibold text-white hover:bg-ink-strong';

export const HP_DESKTOP_CATEGORY_TAB_INACTIVE_CLASS =
  'border border-line bg-white text-ink-strong hover:bg-surface-tinted';

/** Variante "Más" — borde discontinuo, sin confundir con selección activa */
export const HP_DESKTOP_CATEGORY_TAB_HIGHLIGHT_CLASS =
  'border border-dashed border-line bg-white text-ink-strong hover:bg-surface-tinted';

export const hpCardText = {
  title: {
    ...hpType.bodyMedium,
    lineHeight: '20px',
    color: HP_COLOR.secondary,
  },
  meta: {
    ...hpType.caption,
    color: INK.muted,
  },
} as const;

/** Paso mapa (crear-busqueda step=map) — gutters y márgenes unificados */
export const MAP_DESKTOP_PANEL_GUTTER = 'px-5 xl:px-6';

export const MAP_DESKTOP_LIST_CLASS = `${MAP_DESKTOP_PANEL_GUTTER} pb-6 pt-4`;

export const MAP_DESKTOP_GRID_CLASS =
  // UNA sola columna de tarjetas verticales (foto arriba, info abajo) al estilo del
  // popover del mapa. El grid de 2 columnas dejaba cada card apretada (anti-patrón
  // Baymard/Booking); una columna da aire para que la tarjeta se vea "pro".
  'grid w-full grid-cols-1 gap-4';

/**
 * Desktop: una sola fila lista + mapa bajo la topbar.
 * Antes había un `auto` extra para el page header editorial — robaba ~110px al mapa
 * y dejaba un hueco blanco a la derecha (mitad de la fila 1). Ahora el mapa nace
 * a +52px (topbar) y ocupa 100dvh-52px; la microcabecera del panel vive DENTRO
 * del scroll de la columna 1, no compite con el mapa.
 * Lista más ancha en pantallas grandes para encajar 3 cards/fila a partir de 2xl.
 */
export const MAP_DESKTOP_SPLIT_CLASS =
  // Lista a la izquierda (1 columna de filas) + mapa PROTAGONISTA a la derecha (~60%).
  // El experto se elige espacialmente ("¿quién está cerca / vendrá a mí?") → el mapa
  // merece la mitad grande. Lista clamp(380–520px); el resto, mapa.
  'grid min-h-0 w-full flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[clamp(380px,36vw,520px)_minmax(0,1fr)]';

/** Cabecera de resultados a TODO el ancho, encima del split → lista y mapa nacen
 *  debajo, a la misma altura. Sobria ("el gabinete del perito"): blanco con hairline
 *  inferior. Sin degradado azul→amarillo decorativo — el color de marca se reserva
 *  para donde paga (CTA, foco, pin seleccionado). */
export const MAP_DESKTOP_PANEL_HEADER_CLASS =
  'shrink-0 border-b border-line bg-white px-6 py-3';

/** Barra de resultados: cuenta (izq) + controles de orden/filtro (der), todo el ancho. */
export const MAP_DESKTOP_RESULTS_BAR_CLASS =
  'flex shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-6 py-2.5';

/** Chip/botón de filtro desktop — reposo gris relleno (con peso), activo tinta. */
export const MAP_DESKTOP_FILTER_TRIGGER_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-tinted px-3.5 font-display text-[13px] font-semibold text-ink-strong transition-colors hover:bg-line/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';
export const MAP_DESKTOP_FILTER_TRIGGER_ACTIVE_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-strong px-3.5 font-display text-[13px] font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

export const MAP_DESKTOP_PANEL_HEADER_TITLE_CLASS =
  'font-display text-[15px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink-strong';

export const MAP_DESKTOP_PANEL_HEADER_META_CLASS =
  'mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-display text-[12.5px] font-medium leading-[1.3] text-ink-muted';

export const MAP_DESKTOP_PANEL_HEADER_META_STRONG_CLASS =
  'font-semibold text-ink-strong tabular-nums';

export const MAP_DESKTOP_PANEL_HEADER_META_SEP_CLASS = 'text-ink-soft';

export const MAP_META_CHIP_CLASS =
  'inline-flex items-center rounded-full bg-brand/[0.08] ring-1 ring-brand/15 px-2.5 py-1 text-[11px] font-semibold text-brand';

export const MAP_META_CHIP_MUTED_CLASS =
  'inline-flex items-center rounded-full bg-surface-tinted ring-1 ring-line-soft px-2.5 py-1 text-[11px] font-medium text-ink-muted';

export const MAP_DESKTOP_LIST_CELL_CLASS =
  'hidden min-h-0 overflow-hidden bg-surface-tinted lg:col-start-1 lg:row-start-1 lg:block';

export const MAP_PANEL_SCROLL_CLASS = 'map-panel-scroll';

export const MAP_DESKTOP_SCROLL_CLASS =
  `${MAP_PANEL_SCROLL_CLASS} h-full min-h-0 overflow-y-auto overscroll-contain`;

/** Mapa — única fila bajo la topbar. Padding superior reducido para que el mapa
 *  arranque casi pegado a la topbar (antes pt-1.5 colaba bajo el header editorial). */
export const MAP_DESKTOP_MAP_WRAP_CLASS =
  'relative hidden min-h-0 flex-col bg-surface-tinted pl-1.5 pr-5 pb-5 pt-4 lg:col-start-2 lg:row-start-1 lg:flex xl:pr-6 xl:pb-6 xl:pt-4';

export const MAP_DESKTOP_MAP_INNER_CLASS =
  'relative min-h-0 flex-1 w-full overflow-hidden rounded-2xl bg-map-sky ring-1 ring-black/[0.06] shadow-[0_6px_24px_rgba(16,24,40,0.07)]';

export const MAP_PAGE_TITLE_CLASS =
  'relative inline-block font-display text-[22px] font-semibold leading-[26px] tracking-[-0.01em] text-ink-strong';

export const MAP_PAGE_TITLE_MOBILE_CLASS =
  'relative inline-block font-display text-[1.125rem] font-semibold leading-[1.3] tracking-[-0.02em] text-ink-strong';

export const MAP_PAGE_SUBTITLE_CLASS =
  'mt-1 max-w-md text-sm font-normal leading-snug text-ink-muted';

export const MAP_PAGE_SUBTITLE_MOBILE_CLASS =
  'mt-1.5 text-sm font-normal leading-[1.45] text-ink-muted';

/**
 * Cabecera drawer móvil — refactor:
 *  - handle visible arriba (grabber 36×4) → affordance de drag clara
 *  - meta inline (N expertos · ciudad · ~radio km) — info útil
 *  - fila de filtros rápidos (chips scrollables) — ordenar/precio/valoración
 *  - sin pr-12 (la X de cierre se reposiciona como pulsador 44×44 fuera del flujo)
 */
export const MAP_MOBILE_DRAWER_HEADER_CLASS = `relative ${SD_MOBILE_GUTTER_CLASS} pb-2.5 pt-1`;

export const MAP_MOBILE_DRAWER_HANDLE_WRAP_CLASS = 'flex w-full justify-center';
export const MAP_MOBILE_DRAWER_HANDLE_CLASS =
  'mt-1 mb-1.5 h-1 w-9 rounded-full bg-line';

export const MAP_MOBILE_META_ROW_CLASS =
  // Sin pr-9: ya no hay X cierre que solape a la derecha → meta usa todo el ancho.
  'flex items-center gap-1.5 text-[12.5px] font-medium leading-[1.3] text-ink-muted font-display';
export const MAP_MOBILE_META_STRONG_CLASS =
  'font-semibold text-ink-strong tabular-nums';
export const MAP_MOBILE_META_SEP_CLASS = 'mx-0.5 text-ink-soft';

export const MAP_MOBILE_FILTER_ROW_CLASS =
  // mt-3 (12px) en lugar de mt-2 (8px): aire claro entre meta y chips, ningún elemento
  //   superior puede dar la sensación de "tapar" la fila de filtros.
  'mt-3 flex items-center gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
export const MAP_MOBILE_FILTER_CHIP_CLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white ring-1 ring-line px-3.5 h-10 text-[13px] font-semibold text-ink transition-colors hover:ring-ink-soft active:bg-surface-tinted font-display';
export const MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS =
  // Activo = relleno tinta (casi negro), estilo Airbnb. El azul se reserva para
  // selección en mapa y favorito; el filtro activo usa tinta neutra, sin glow.
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-strong px-3.5 h-10 text-[13px] font-semibold text-white transition-colors hover:bg-black font-display';

export const MAP_MOBILE_LIST_CLASS = `${SD_MOBILE_GUTTER_CLASS} pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-4`;

/** Lista del drawer en modo tutorial — compacta para dejar más mapa visible. */
export const MAP_MOBILE_LIST_TUTORIAL_CLASS = `${SD_MOBILE_GUTTER_CLASS} pt-2 pb-2`;

export const MAP_CARD_BODY_CLASS = 'px-3.5 py-2.5 font-display';

/** Imagen un poco más baja que 4/3 (desktop y móvil) */
export const MAP_CARD_IMAGE_CLASS = 'relative w-full overflow-hidden aspect-[16/10]'; // usado en card móvil/legacy

export const MAP_CARD_IMAGE_TOP_CLASS = `${MAP_CARD_IMAGE_CLASS} rounded-t-2xl`;

export const MAP_CARD_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-[0.085em] text-ink-muted';

export const MAP_CARD_NAME_CLASS =
  'truncate text-[15px] font-semibold leading-5 tracking-[-0.015em] text-ink-strong';

export const MAP_CARD_HOOK_CLASS = 'line-clamp-1 text-[13px] font-normal leading-snug text-ink-muted';

/** Meta de una sola línea: "Ciudad · Disponibilidad" — gris legible (≥4.5:1), sin chips. */
export const MAP_CARD_META_LINE_CLASS =
  'mt-1 truncate text-[13px] font-normal leading-[18px] text-ink';

export const MAP_CARD_CHIP_CLASS =
  'inline-flex items-center gap-1 rounded-full bg-surface-tinted ring-1 ring-line-soft px-2 py-0.5 text-[11px] font-medium text-ink-muted';

export const MAP_CARD_PRICE_CLASS = 'text-[17px] font-semibold leading-5 tabular-nums tracking-tight text-ink-strong';

export const MAP_CARD_PRICE_SUFFIX_CLASS = 'text-[13px] font-normal text-ink-muted';

export const MAP_CARD_BADGE_CLASS =
  'inline-flex items-center rounded-lg bg-white/95 px-2 py-1 font-display text-[10px] font-medium leading-3 text-ink shadow-sm backdrop-blur-sm';

/** Sombras desktop — un poco más visibles sobre fondo blanco */
export const MAP_CARD_DESKTOP_SHADOW =
  'shadow-[0_2px_10px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]';

export const MAP_CARD_DESKTOP_SHADOW_HOVER =
  'hover:shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5';

export const MAP_CARD_DESKTOP_SHADOW_ACTIVE =
  'shadow-[0_4px_18px_hsl(var(--brand)/0.14),0_2px_8px_rgba(0,0,0,0.08)]';

export const MAP_CARD_DESKTOP_SHADOW_HOVERED =
  'shadow-[0_6px_20px_rgba(0,0,0,0.11),0_2px_6px_rgba(0,0,0,0.06)]';

/**
 * Card móvil COMPACTA — fila horizontal imagen 96×96 + info derecha.
 * Usada en el drawer cuando el servicio NO está seleccionado → densidad alta
 * (2.5–3 cards en deployed 50% vs. 1.1 con layout hero).
 * El servicio seleccionado conserva el layout hero (imagen 16:10 arriba) para
 * destacarlo visualmente.
 */
export const MAP_CARD_MOBILE_COMPACT_WRAP_CLASS =
  'relative flex items-stretch gap-3 p-2.5 font-display';
export const MAP_CARD_MOBILE_COMPACT_IMG_CLASS =
  'relative h-[96px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-line-soft';
export const MAP_CARD_MOBILE_COMPACT_INFO_CLASS =
  'flex min-w-0 flex-1 flex-col justify-between py-0.5';
export const MAP_CARD_MOBILE_NAME_CLASS =
  'truncate text-[15px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink-strong';
export const MAP_CARD_MOBILE_META_CLASS =
  'mt-0.5 truncate text-[12.5px] font-normal leading-[1.35] text-ink';
export const MAP_CARD_MOBILE_PRICE_CLASS =
  'text-subtitle font-semibold leading-[1.15] tabular-nums tracking-tight text-ink-strong';
export const MAP_CARD_MOBILE_FAV_BTN_CLASS =
  'absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full text-ink-strong active:bg-line-soft transition-colors';

/**
 * Card DESKTOP en fila horizontal (rediseño 2026): foto izquierda + info derecha,
 * una por fila. Da espacio para evaluar al experto (precio, valoración, distancia,
 * especialidad) sin apelmazar, y hace inequívoca la sincronización con el pin.
 */
export const MAP_CARD_ROW_WRAP_CLASS =
  'relative flex items-stretch gap-3.5 rounded-2xl bg-white p-2.5 font-display transition-[box-shadow,transform,border-color] duration-200';
export const MAP_CARD_ROW_IMG_CLASS =
  'relative h-[132px] w-[156px] shrink-0 overflow-hidden rounded-xl bg-surface-tinted';
// Columna info: cabecera arriba (eyebrow+nombre+meta) y precio abajo → llena el alto de la foto,
// sin el hueco muerto que dejaba el layout anterior.
export const MAP_CARD_ROW_INFO_CLASS =
  'flex min-w-0 flex-1 flex-col justify-between py-0.5 pr-1';
export const MAP_CARD_ROW_EYEBROW_CLASS =
  'truncate text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-soft';
export const MAP_CARD_ROW_NAME_CLASS =
  'truncate text-subtitle font-semibold leading-[1.2] tracking-[-0.015em] text-ink-strong';
// Meta de una línea: ★ valoración (reseñas) · ciudad · distancia.
export const MAP_CARD_ROW_META_CLASS =
  'mt-1 flex items-center gap-1 truncate text-[12.5px] font-normal leading-[1.3] text-ink';
export const MAP_CARD_ROW_PRICE_CLASS =
  'text-[17px] font-semibold leading-none tabular-nums tracking-tight text-ink-strong';
export const MAP_CARD_ROW_PRICE_SUFFIX_CLASS =
  'text-[12px] font-normal text-ink-muted';
export const MAP_CARD_ROW_AVAIL_CLASS =
  'inline-flex items-center gap-1 rounded-full bg-surface-tinted px-2 py-0.5 text-[11.5px] font-medium text-ink';

/* Sombras de la fila — base hairline + elevación en hover, anillo de marca al seleccionar. */
export const MAP_CARD_ROW_SHADOW =
  'shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-line-soft';
export const MAP_CARD_ROW_SHADOW_HOVER =
  'shadow-[0_8px_22px_rgba(16,24,40,0.13)] ring-1 ring-line -translate-y-px';
export const MAP_CARD_ROW_SHADOW_ACTIVE =
  'shadow-[0_8px_24px_hsl(var(--brand)/0.18)] ring-2 ring-brand';
