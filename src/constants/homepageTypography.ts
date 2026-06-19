/**
 * Tipografía unificada de la homepage.
 * Manrope (display/cargada) + system — sin depender de Airbnb Cereal VF no cargada.
 */
export const HP_FONT =
  'Manrope, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';

export const HP_COLOR = {
  primary: '#1c1c1c',
  secondary: '#222222',
  muted: '#6a6a6a',
  mutedSoft: '#737373',
  brand: 'hsl(var(--brand))',
  brandDark: 'hsl(var(--brand-hover))',
  brandDarker: '#004a99',
  border: '#e8e8e8',
  borderSoft: '#ebebeb',
} as const;

/** Gradiente legacy — modales móvil / búsqueda (no usado en hero desktop ni HomepageMobileHero) */
export const HP_PANEL_GRADIENT =
  'linear-gradient(155deg, #dceaf8 0%, #e5f0fa 28%, #f5f9fd 52%, #fff9f2 82%, #fafafa 100%)';

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

/** Carrusel de servicios en homepage — solo afecta a móvil (< md). */
export const HP_WALL_CARD_WIDTH_CLASS = 'w-[148px] min-[428px]:w-[160px] md:w-[184px]';

/** Botón icono flotante (hero, modal categorías) */
export const hpIconButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb]/80 bg-white/80 text-[#666666] backdrop-blur-sm transition-colors active:bg-white';

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

/** Subrayado checkout — azul → ámbar de marca (estilos en index.css `.checkout-page-title-underline`) */
export const HP_CHECKOUT_TITLE_UNDERLINE_GRADIENT =
  'linear-gradient(to right, #0066CC 0%, #2563EB 38%, #F59E0B 100%)';

/** @deprecated Usar clase CSS `.checkout-page-title-underline` */
export const hpCheckoutTitleUnderlineStyle = {
  position: 'absolute' as const,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '4px',
  background: HP_CHECKOUT_TITLE_UNDERLINE_GRADIENT,
  borderRadius: '9999px',
};

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
    color: '#000000',
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
  'grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-5 lg:gap-y-0';

/** Ritmo vertical secciones desktop */
export const SD_DESKTOP_SECTION_PY_CLASS = 'py-0';

/** Bloque principal bajo el hero — ritmo entre tarjetas de la columna izquierda */
export const SD_DESKTOP_CONTENT_STACK_CLASS = 'flex flex-col gap-4';

/** Tarjeta blanca columna izquierda — paridad visual con aside */
export const SD_DESKTOP_MAIN_CARD_CLASS =
  'overflow-hidden rounded-2xl border border-[#ebebeb] bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] lg:p-7';

/** Panel desktop ficha servicio — más sobrio que la tarjeta genérica */
export const SD_DESKTOP_PANEL_CLASS =
  'overflow-hidden rounded-xl border border-[#e8e8e8] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_16px_rgba(15,23,42,0.04)] lg:p-7';

/** Título de página bajo el hero */
export const SD_DESKTOP_PAGE_TITLE_BLOCK_CLASS = 'mb-0';

/** Cabecera ficha desktop: título + host */
export const SD_DESKTOP_HEADER_STACK_CLASS = 'flex flex-col';

/** Fila experto dentro de tarjeta — solo separador inferior */
export const SD_DESKTOP_HOST_ROW_CLASS =
  'border-b border-[#ebebeb] pb-5';

/** Nombre del experto en desktop — 15px */
export const SD_DESKTOP_HOST_NAME_CLASS =
  'truncate text-[15px] font-semibold leading-5 tracking-[-0.01em] text-[#222222]';

/** Bio del experto en desktop — 14px */
export const SD_DESKTOP_HOST_BIO_CLASS =
  'sd-user-text mt-0.5 min-w-0 w-full text-sm font-normal leading-[1.5] text-[#6a6a6a]';

/** Meta del experto en desktop — 13px */
export const SD_DESKTOP_HOST_META_CLASS =
  'mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-normal leading-5 text-[#6a6a6a]';

/** Columna nombre + bio */
export const SD_DESKTOP_HOST_CONTENT_CLASS = 'min-w-0 flex-1 overflow-hidden pr-5';

/** Layout interno fila host desktop */
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
  'text-xs font-medium leading-4 text-[#6a6a6a]';

export const SD_ASIDE_SECTION_LABEL_CLASS =
  'text-xs font-medium text-[#6a6a6a]';

/** Sticky del aside — header ~56px + 16px de aire */
export const SD_DESKTOP_STICKY_TOP_CLASS = 'lg:top-[calc(3.5rem+1rem)]';

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
  'mx-auto w-full max-w-[90rem] px-5 lg:px-8 xl:px-10';

/** Altura fija del bloque cita+mapa desktop (sin scroll interno entre columnas) */
export const SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_HEIGHT_CLASS =
  'h-[min(84vh,800px)] max-h-[800px]';

export const SD_CHECKOUT_GRID_CLASS =
  'grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch lg:gap-x-7 lg:gap-y-0';

/** Fondo checkout desktop — gris neutro muy suave (Airbnb/Stripe: tarjetas blancas flotan sin tinte azul) */
export const SD_CHECKOUT_DESKTOP_PAGE_CLASS = 'bg-[#f7f7f7]';

/** Tarjeta checkout desktop — elevación neutra sobre fondo gris claro */
export const SD_CHECKOUT_DESKTOP_CARD_CLASS =
  'overflow-hidden rounded-2xl border border-[#ebebeb] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)]';

/** Bloque cita+mapa desktop — una sola tarjeta */
export const SD_CHECKOUT_DESKTOP_APPOINTMENT_SHELL_CLASS =
  'overflow-hidden rounded-2xl border border-[#eceef2] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.05)]';

/** Cabecera de sección dentro de tarjeta checkout desktop */
export const SD_CHECKOUT_DESKTOP_CARD_HEADER_CLASS =
  'border-b border-[#f0f0f0] bg-white px-4 py-2.5';

/** Cabecera compacta — bloques integrados (coordinación + calendario en la misma tarjeta) */
export const SD_CHECKOUT_EMBEDDED_SECTION_HEADER_CLASS =
  'border-b border-[#f0f0f0] bg-white px-5 py-2.5';

/** Título de sección integrado sin borde (checkout desktop) */
export const SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS = 'px-5 pt-4 pb-1';

/** Encabezado h3 de secciones integradas en checkout desktop */
export const SD_CHECKOUT_EMBEDDED_SECTION_HEADING_CLASS =
  'text-[14px] font-semibold tracking-[-0.02em] text-[#1c1c1c]';

/** Texto explicativo bajo títulos integrados en checkout desktop */
export const SD_CHECKOUT_EMBEDDED_SECTION_DESC_CLASS =
  'mt-1.5 max-w-none text-[13px] font-normal leading-[1.55] text-[#374151]';

/** Sangrado horizontal del chrome respecto al contenido indentado del paso. */
export const SD_CHECKOUT_EMBEDDED_STEP_CONTENT_BLEED_X_CLASS =
  '-ml-[calc(1.25rem+1.5rem+0.625rem)] -mr-5';

/** Contenido alineado con el texto del paso (tras badge + gap en cabecera numerada) */
export const SD_CHECKOUT_EMBEDDED_STEP_CONTENT_CLASS =
  'pl-[calc(1.25rem+1.5rem+0.625rem)] pr-5';

/** Bloque interactivo embebido (calendario, mapa, horas) — contorno unificado */
export const SD_CHECKOUT_EMBEDDED_INTERACTIVE_SHELL_CLASS =
  'overflow-hidden rounded-xl border-2 border-[#cbd5e1] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.09),0_1px_3px_rgba(15,23,42,0.06)]';

/** Padding interior del bloque calendario embebido (compacto). */
export const SD_CHECKOUT_EMBEDDED_CALENDAR_SHELL_PADDING_CLASS = 'p-2.5 lg:p-3';

/** Checkout desktop — columna cita (calendario) */
export const SD_CHECKOUT_DESKTOP_APPOINTMENT_MAIN_CLASS =
  'min-w-0 flex-[0_0_50%] xl:flex-[0_0_48%]';

/** Checkout desktop — columna mapa */
export const SD_CHECKOUT_DESKTOP_MAP_COLUMN_CLASS =
  'min-w-0 flex-1 lg:min-w-[50%]';

/** SearchDetails desktop — layout marketplace (misma paleta que checkout) */
export const SD_SEARCH_DETAILS_DESKTOP_PAGE_CLASS = 'lg:bg-[#f7f7f7]';

export const SD_SEARCH_DETAILS_DESKTOP_CARD_CLASS = SD_CHECKOUT_DESKTOP_CARD_CLASS;

export const SD_SEARCH_DETAILS_DESKTOP_INNER_CLASS =
  'mx-auto flex h-full w-full max-w-[90rem] flex-1 flex-col min-h-0';

export const SD_SEARCH_DETAILS_DESKTOP_LAYOUT_CLASS =
  'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row lg:items-stretch lg:px-6 lg:pb-5';

export const SD_SEARCH_DETAILS_DESKTOP_SIDEBAR_CLASS =
  'hidden lg:flex lg:w-[320px] lg:shrink-0 xl:w-[360px] lg:flex-col lg:min-h-0';

export const SD_SEARCH_DETAILS_DESKTOP_CHAT_CLASS =
  'flex min-h-0 min-w-0 flex-1 flex-col';

/** Gutter checkout móvil */
export const SD_CHECKOUT_MOBILE_GUTTER_CLASS = 'px-5';

/** Cabecera checkout móvil — sin barra divisoria */
export const SD_CHECKOUT_MOBILE_HEADER_CLASS =
  'pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))] ' + SD_CHECKOUT_MOBILE_GUTTER_CLASS;

export const SD_CHECKOUT_MOBILE_HEADER_ROW_CLASS =
  'flex min-h-10 items-center gap-2.5 overflow-visible';

export const SD_CHECKOUT_MOBILE_BACK_BTN_CLASS =
  'sd-icon-btn h-9 w-9 shrink-0';

/** Etiqueta de fila checkout móvil */
export const SD_CHECKOUT_MOBILE_LABEL_CLASS =
  'text-xs font-medium leading-4 text-[#6a6a6a]';

/** Valor principal de fila checkout móvil */
export const SD_CHECKOUT_MOBILE_VALUE_CLASS =
  'text-sm font-normal leading-snug text-[#222222]';

/** Meta secundaria (rango, notas) */
export const SD_CHECKOUT_MOBILE_META_CLASS =
  'text-xs font-normal leading-relaxed text-[#6a6a6a]';

/** Gutter + ritmo vertical filas checkout móvil (legacy full-bleed) */
export const SD_CHECKOUT_MOBILE_ROW_CLASS =
  `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} border-b border-[#ebebeb] py-4`;

/** Contenedor tabla resumen — estilo Airbnb */
export const SD_CHECKOUT_MOBILE_TABLE_WRAP_CLASS =
  `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} pb-3 pt-1`;

export const SD_CHECKOUT_MOBILE_TABLE_CLASS =
  'overflow-hidden rounded-xl border border-[#ebebeb] bg-white';

export const SD_CHECKOUT_MOBILE_TABLE_HEADER_CLASS =
  'px-4 py-3.5';

export const SD_CHECKOUT_MOBILE_TABLE_TITLE_CLASS =
  'text-base font-semibold leading-snug tracking-[-0.01em] text-[#1c1c1c]';

export const SD_CHECKOUT_MOBILE_TABLE_SUBTITLE_CLASS =
  'mt-0.5 text-xs text-[#6a6a6a]';

export const SD_CHECKOUT_MOBILE_TABLE_ROW_CLASS =
  'flex items-start justify-between gap-4 border-t border-[#f5f5f5] px-4 py-3';

export const SD_CHECKOUT_MOBILE_TABLE_LABEL_CLASS =
  'w-[30%] shrink-0 text-xs text-[#6a6a6a]';

export const SD_CHECKOUT_MOBILE_TABLE_VALUE_CLASS =
  'min-w-0 flex-1 text-end text-[13px] leading-snug text-[#1c1c1c]';

export const SD_CHECKOUT_MOBILE_TABLE_VALUE_META_CLASS =
  'mt-0.5 block text-xs leading-snug text-[#6a6a6a]';

export const SD_CHECKOUT_MOBILE_NOTES_CLASS =
  `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} border-b border-[#ebebeb] py-4`;

/** Fila de confianza checkout móvil — icono + una línea */
export const SD_CHECKOUT_MOBILE_TRUST_ITEM_CLASS =
  'flex items-start gap-3 text-sm font-normal leading-snug text-[#222222]';

export const SD_CHECKOUT_MOBILE_TRUST_ICON_CLASS =
  'mt-0.5 h-4 w-4 shrink-0 text-brand';

export const SD_CHECKOUT_MOBILE_LEGAL_CLASS =
  `${SD_CHECKOUT_MOBILE_GUTTER_CLASS} py-4`;

/** Scroll checkout móvil — footer con nota + CTA */
export const SD_CHECKOUT_MOBILE_FOOTER_HEIGHT_EXPR =
  'calc(0.625rem + 2.75rem + max(0.625rem, env(safe-area-inset-bottom, 0px)))';

export const SD_CHECKOUT_MOBILE_SCROLL_PAD_CLASS =
  'pb-[calc(0.625rem+2.75rem+max(0.625rem,env(safe-area-inset-bottom,0px)))]';

export const SD_CHECKOUT_MOBILE_FOOTER_SHELL_CLASS =
  'fixed bottom-0 left-0 right-0 z-50 border-t border-[#ebebeb] bg-white';

/** Offset inferior compartido: drawer, mapa y scroll sobre el footer fijo checkout móvil. */
export const SD_CHECKOUT_MOBILE_FOOTER_BOTTOM_OFFSET = SD_CHECKOUT_MOBILE_FOOTER_HEIGHT_EXPR;

export const SD_CHECKOUT_MOBILE_FOOTER_INSET_BOTTOM_CLASS =
  'bottom-[calc(0.625rem+2.75rem+max(0.625rem,env(safe-area-inset-bottom,0px)))]';

export const SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS =
  'pb-[calc(0.625rem+2.75rem+max(0.625rem,env(safe-area-inset-bottom,0px)))]';

export const SD_CHECKOUT_MOBILE_FOOTER_ACTIONS_CLASS = 'flex items-center gap-2.5';

export const SD_CHECKOUT_MOBILE_BACK_TEXT_BTN_CLASS =
  'inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[#d1d5db] bg-white px-4 text-[13px] font-semibold text-[#4b5563] transition-colors hover:border-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#1c1c1c] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

/** Contenedor calendario checkout — contorno neutro */
export const SD_CHECKOUT_CALENDAR_FRAME_CLASS =
  'rounded-2xl border border-[#d8dce3] bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

/** Contenedor mapa checkout — contorno neutro */
export const SD_CHECKOUT_PICKER_FRAME_CLASS =
  'overflow-hidden rounded-2xl border border-[#d8dce3] bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

/** @deprecated Usar SD_CHECKOUT_PICKER_FRAME_CLASS */
export const SD_CHECKOUT_MAP_FRAME_CLASS = SD_CHECKOUT_PICKER_FRAME_CLASS;

export const SD_CHECKOUT_MOBILE_CTA_CLASS =
  'inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-full bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-75';

/** Separador entre mapa y resumen en checkout móvil paso 2 */
export const SD_CHECKOUT_MOBILE_SUMMARY_SECTION_CLASS =
  'mt-6 border-t border-[#ebebeb] bg-[#fafafa] pb-4 pt-5';

/** Gutter horizontal móvil — 20px */
export const SD_MOBILE_GUTTER_CLASS = 'px-5';

/** Solape de la card blanca sobre el hero */
export const SD_MOBILE_SHEET_OVERLAP_CLASS = '-mt-10';

/** Mapa preview en ficha móvil (cobertura) */
export const SD_MOBILE_MAP_PREVIEW_HEIGHT_CLASS = 'h-24';

/** Altura mínima reservada por LazyMount del mapa móvil (px) */
export const SD_MOBILE_MAP_PREVIEW_MIN_HEIGHT_PX = 96;

/** Separador interno del bloque reserva (mapa → disponibilidad) */
export const SD_MOBILE_BOOKING_DIVIDER_CLASS =
  'border-t border-[#ebebeb] pt-2';

/** Ritmo vertical entre bloques de la sheet móvil */
export const SD_MOBILE_SECTION_GAP_CLASS = 'mb-4';

/** Padding superior de la sheet tras el solape del hero */
export const SD_MOBILE_SHEET_TOP_CLASS = 'pt-4';

/** Aire bajo fila revisor */
export const SD_MOBILE_HEADER_PB_CLASS = 'pb-4';

/** Bloque disponibilidad bajo el host (sin borde; el divisor va antes de tabs) */
export const SD_MOBILE_META_SECTION_CLASS = 'pb-4';

/** Línea full-bleed entre bloque superior y tabs */
export const SD_MOBILE_SHEET_DIVIDER_CLASS = 'border-t border-[#ebebeb]';

/** Contenedor tabs + panel (sin margen extra al final) */
export const SD_MOBILE_SHEET_BOTTOM_CLASS = '';
/** Etiqueta de fila en bloque reserva (Disponibilidad, Cobertura) — no compite con nombre del experto */
export const SD_MOBILE_BOOKING_LABEL_CLASS =
  'text-xs font-medium leading-4 text-[#6a6a6a]';
export const SD_MOBILE_TAB_PANEL_PT_CLASS = 'pt-4 pb-6';

/**
 * Escala tipográfica móvil — tokens DESIGN.md:
 * título página 20px (sd-page-title) · énfasis 14px/600 · cuerpo 14px · meta/caption 12px
 */
export const SD_MOBILE_EYEBROW_CLASS =
  'text-xs font-medium leading-4 normal-case text-[#6a6a6a]';
export const SD_MOBILE_EMPHASIS_CLASS =
  'text-sm font-semibold leading-5 tracking-[-0.01em] text-[#1c1c1c]';
export const SD_MOBILE_BODY_CLASS =
  'text-sm font-normal leading-[1.6] text-[#1c1c1c]';
export const SD_MOBILE_META_CLASS =
  'text-xs font-normal leading-4 text-[#6a6a6a]';
/** @deprecated Usar SD_MOBILE_EYEBROW_CLASS o SD_MOBILE_SUBHEAD_CLASS */
export const SD_MOBILE_LABEL_CLASS = SD_MOBILE_EYEBROW_CLASS;

/** Subsecciones: Disponibilidad, Qué incluye, Cobertura — misma jerarquía */
export const SD_MOBILE_SUBHEAD_CLASS =
  'text-sm font-semibold leading-5 text-[#1c1c1c]';
export const SD_MOBILE_SECTION_TITLE_CLASS = SD_MOBILE_SUBHEAD_CLASS;

/** Stack vertical dentro del panel «Acerca del servicio» */
export const SD_MOBILE_INSET_STACK_CLASS = 'space-y-4';

/** Carruseles horizontales móvil: alinear con gutter sin duplicar en cada card */
export const SD_MOBILE_CAROUSEL_EDGE_CLASS = 'pl-4 pr-4';

/**
 * Reserva inferior del scroll: barra fija compacta + colchón + safe-area.
 * Barra ≈ py-3 + fila 48px + pb safe-area.
 */
export const SD_MOBILE_SCROLL_PAD_CLASS =
  'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]';

/** Como SD_MOBILE_SCROLL_PAD_CLASS pero para la ficha de servicio, cuya barra
 *  fija incluye la línea de escrow (≈20px más alta). */
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
  'fixed inset-x-0 top-0 z-40 border-b border-[#e8e8e8] bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-[transform,opacity] duration-300 ease-out';

export const SD_MOBILE_TOPBAR_COMPACT_INNER_CLASS = `flex min-h-12 items-center gap-3 ${SD_MOBILE_GUTTER_CLASS} pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top,0px))]`;

/** Shell barra fija móvil */
export const SD_MOBILE_FOOTER_SHELL_CLASS =
  'fixed bottom-0 left-0 right-0 z-50 border-t border-[#e8e8e8] bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.09)]';

/** Altura footprint de MobileBottomBar (safe-area ya incluida internamente) */
export const MOBILE_TAB_BAR_HEIGHT_PX = 65;

/** Offset inferior del FAB con tab bar (20px de aire sobre los 65px de la barra) */
export const CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS = 'bottom-[calc(65px+1.25rem)]';

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

/** CTA barra inferior móvil (más alto y legible que h-12 genérico) */
export const SD_MOBILE_FOOTER_CTA_CLASS = 'sd-mobile-footer-cta';

/** CTA principal (desktop / inline) */
export const HP_SERVICE_CTA_CLASS =
  'inline-flex items-center justify-center h-12 px-6 min-w-[120px] shrink-0 rounded-full bg-brand text-white text-base font-semibold shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover hover:shadow-[0_8px_24px_hsl(var(--brand)/0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait';

export const hpCardText = {
  title: {
    ...hpType.bodyMedium,
    lineHeight: '20px',
    color: HP_COLOR.secondary,
  },
  meta: {
    ...hpType.caption,
    color: HP_COLOR.muted,
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
  'shrink-0 border-b border-[#ececec] bg-white px-6 py-3';

/** Barra de resultados: cuenta (izq) + controles de orden/filtro (der), todo el ancho. */
export const MAP_DESKTOP_RESULTS_BAR_CLASS =
  'flex shrink-0 items-center justify-between gap-4 border-b border-[#ececec] bg-white px-6 py-2.5';

/** Chip/botón de filtro desktop — reposo gris relleno (con peso), activo tinta. */
export const MAP_DESKTOP_FILTER_TRIGGER_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f0f1f3] px-3.5 font-display text-[13px] font-semibold text-[#2a2a2a] transition-colors hover:bg-[#e6e7ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';
export const MAP_DESKTOP_FILTER_TRIGGER_ACTIVE_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1c1c1c] px-3.5 font-display text-[13px] font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

export const MAP_DESKTOP_PANEL_HEADER_TITLE_CLASS =
  'font-display text-[15px] font-semibold leading-[1.25] tracking-[-0.015em] text-[#1c1c1c]';

export const MAP_DESKTOP_PANEL_HEADER_META_CLASS =
  'mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-display text-[12.5px] font-medium leading-[1.3] text-[#6a6a6a]';

export const MAP_DESKTOP_PANEL_HEADER_META_STRONG_CLASS =
  'font-semibold text-[#1c1c1c] tabular-nums';

export const MAP_DESKTOP_PANEL_HEADER_META_SEP_CLASS = 'text-[#c8c8c8]';

/** Topbar variant="mapStep" — fusiona la topbar antigua con stepper + chips meta del flow.
 *  Mata el aire muerto del centro de la topbar y ahorra ~50px verticales en el sidebar.  */
export const MAP_STEP_TOPBAR_SHELL_CLASS =
  'sticky top-0 z-50 hidden md:block border-b border-[#ececec] bg-white/95 backdrop-blur-sm';

export const MAP_STEP_TOPBAR_INNER_CLASS =
  'flex min-h-[52px] w-full items-center gap-3 px-4 md:px-5 lg:px-6';

export const MAP_STEP_TOPBAR_PILL_ACTIVE =
  'inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white text-[11px] font-semibold tabular-nums leading-none shadow-[0_1px_4px_hsl(var(--brand)/0.35)]';

export const MAP_STEP_TOPBAR_PILL_DONE =
  'inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 text-brand text-[11px] font-semibold tabular-nums leading-none';

export const MAP_STEP_TOPBAR_PILL_IDLE =
  'inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f3f3f3] text-[#9aa0a6] text-[11px] font-semibold tabular-nums leading-none';

export const MAP_STEP_TOPBAR_LABEL_ACTIVE =
  'text-[12.5px] font-semibold tracking-tight text-[#1c1c1c]';

export const MAP_STEP_TOPBAR_LABEL_IDLE =
  'text-[12.5px] font-medium tracking-tight text-[#6a6a6a]';

export const MAP_STEP_TOPBAR_DIVIDER =
  'mx-2 hidden h-5 w-px bg-[#ececec] xl:block';

export const MAP_STEP_TOPBAR_META_CHIP =
  'inline-flex items-center gap-1 rounded-full bg-[#f6f6f6] ring-1 ring-[#ececec] px-2.5 py-1 text-[11.5px] font-medium text-[#5a5a5a] whitespace-nowrap';

export const MAP_STEP_TOPBAR_META_CHIP_BRAND =
  'inline-flex items-center gap-1 rounded-full bg-brand/[0.08] ring-1 ring-brand/15 px-2.5 py-1 text-[11.5px] font-semibold text-brand whitespace-nowrap';

export const MAP_META_CHIP_CLASS =
  'inline-flex items-center rounded-full bg-brand/[0.08] ring-1 ring-brand/15 px-2.5 py-1 text-[11px] font-semibold text-brand';

export const MAP_META_CHIP_MUTED_CLASS =
  'inline-flex items-center rounded-full bg-[#f5f5f5] ring-1 ring-[#ececec] px-2.5 py-1 text-[11px] font-medium text-[#6a6a6a]';

export const MAP_DESKTOP_LIST_CELL_CLASS =
  // Fondo tintado sutil (#f6f7f8) → las tarjetas blancas resaltan con profundidad
  // (antes todo blanco-sobre-blanco se veía plano y "de juguete").
  'hidden min-h-0 overflow-hidden bg-[#f6f7f8] lg:col-start-1 lg:row-start-1 lg:block';

export const MAP_PANEL_SCROLL_CLASS = 'map-panel-scroll';

export const MAP_DESKTOP_SCROLL_CLASS =
  `${MAP_PANEL_SCROLL_CLASS} h-full min-h-0 overflow-y-auto overscroll-contain`;

/** Mapa — única fila bajo la topbar. Padding superior reducido para que el mapa
 *  arranque casi pegado a la topbar (antes pt-1.5 colaba bajo el header editorial). */
export const MAP_DESKTOP_MAP_WRAP_CLASS =
  'relative hidden min-h-0 flex-col bg-[#f6f7f8] pl-1.5 pr-5 pb-5 pt-4 lg:col-start-2 lg:row-start-1 lg:flex xl:pr-6 xl:pb-6 xl:pt-4';

export const MAP_DESKTOP_MAP_INNER_CLASS =
  // Mapa enmarcado como tarjeta: hairline + sombra suave; fondo #dce9f2 (mismo cielo
  // que el mapa de la ficha) visible mientras cargan los tiles.
  'relative min-h-0 flex-1 w-full overflow-hidden rounded-2xl bg-[#dce9f2] ring-1 ring-black/[0.06] shadow-[0_6px_24px_rgba(16,24,40,0.07)]';

export const MAP_PAGE_TITLE_CLASS =
  'relative inline-block font-display text-[22px] font-semibold leading-[26px] tracking-[-0.01em] text-[#1c1c1c]';

export const MAP_PAGE_TITLE_MOBILE_CLASS =
  'relative inline-block font-display text-[1.125rem] font-semibold leading-[1.3] tracking-[-0.02em] text-[#1c1c1c]';

export const MAP_PAGE_SUBTITLE_CLASS =
  'mt-1 max-w-md text-sm font-normal leading-snug text-[#6a6a6a]';

export const MAP_PAGE_SUBTITLE_MOBILE_CLASS =
  'mt-1.5 text-sm font-normal leading-[1.45] text-[#6a6a6a]';

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
  'mt-1 mb-1.5 h-1 w-9 rounded-full bg-[#d8d8d8]';

export const MAP_MOBILE_META_ROW_CLASS =
  // Sin pr-9: ya no hay X cierre que solape a la derecha → meta usa todo el ancho.
  'flex items-center gap-1.5 text-[12.5px] font-medium leading-[1.3] text-[#6a6a6a] font-display';
export const MAP_MOBILE_META_STRONG_CLASS =
  'font-semibold text-[#1c1c1c] tabular-nums';
export const MAP_MOBILE_META_SEP_CLASS = 'mx-0.5 text-[#c8c8c8]';

export const MAP_MOBILE_FILTER_ROW_CLASS =
  // mt-3 (12px) en lugar de mt-2 (8px): aire claro entre meta y chips, ningún elemento
  //   superior puede dar la sensación de "tapar" la fila de filtros.
  'mt-3 flex items-center gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';
export const MAP_MOBILE_FILTER_CHIP_CLASS =
  // Reposo: blanco con hairline gris neutro, sin tintes de color. Pro y discreto.
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white ring-1 ring-[#dddddd] px-3.5 h-10 text-[13px] font-semibold text-[#3a3a3a] transition-colors hover:ring-[#b0b0b0] active:bg-[#f5f5f5] font-display';
export const MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS =
  // Activo = relleno tinta (casi negro), estilo Airbnb. El azul se reserva para
  // selección en mapa y favorito; el filtro activo usa tinta neutra, sin glow.
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1c1c1c] px-3.5 h-10 text-[13px] font-semibold text-white transition-colors hover:bg-black font-display';

export const MAP_MOBILE_LIST_CLASS = `${SD_MOBILE_GUTTER_CLASS} pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-4`;

/** Lista del drawer en modo tutorial — compacta para dejar más mapa visible. */
export const MAP_MOBILE_LIST_TUTORIAL_CLASS = `${SD_MOBILE_GUTTER_CLASS} pt-2 pb-2`;

export const MAP_CARD_BODY_CLASS = 'px-3.5 py-2.5 font-display';

/** Imagen un poco más baja que 4/3 (desktop y móvil) */
export const MAP_CARD_IMAGE_CLASS = 'relative w-full overflow-hidden aspect-[16/10]'; // usado en card móvil/legacy

export const MAP_CARD_IMAGE_TOP_CLASS = `${MAP_CARD_IMAGE_CLASS} rounded-t-2xl`;

export const MAP_CARD_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-[0.085em] text-[#717171]';

export const MAP_CARD_NAME_CLASS =
  'truncate text-[15px] font-semibold leading-5 tracking-[-0.015em] text-[#1c1c1c]';

export const MAP_CARD_HOOK_CLASS = 'line-clamp-1 text-[13px] font-normal leading-snug text-[#6a6a6a]';

/** Meta de una sola línea: "Ciudad · Disponibilidad" — gris legible (≥4.5:1), sin chips. */
export const MAP_CARD_META_LINE_CLASS =
  'mt-1 truncate text-[13px] font-normal leading-[18px] text-[#525252]';

export const MAP_CARD_CHIP_CLASS =
  'inline-flex items-center gap-1 rounded-full bg-[#f5f5f5] ring-1 ring-[#e8e8e8] px-2 py-0.5 text-[11px] font-medium text-[#5a5a5a]';

export const MAP_CARD_PRICE_CLASS = 'text-[17px] font-semibold leading-5 tabular-nums tracking-tight text-[#1c1c1c]';

export const MAP_CARD_PRICE_SUFFIX_CLASS = 'text-[13px] font-normal text-[#6a6a6a]';

export const MAP_CARD_BADGE_CLASS =
  'inline-flex items-center rounded-lg bg-white/95 px-2 py-1 font-display text-[10px] font-medium leading-3 text-[#222222] shadow-sm backdrop-blur-sm';

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
  'relative h-[96px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-[#f0f0f0]';
export const MAP_CARD_MOBILE_COMPACT_INFO_CLASS =
  'flex min-w-0 flex-1 flex-col justify-between py-0.5';
export const MAP_CARD_MOBILE_NAME_CLASS =
  'truncate text-[15px] font-semibold leading-[1.25] tracking-[-0.015em] text-[#1c1c1c]';
export const MAP_CARD_MOBILE_META_CLASS =
  'mt-0.5 truncate text-[12.5px] font-normal leading-[1.35] text-[#525252]';
export const MAP_CARD_MOBILE_PRICE_CLASS =
  'text-[16px] font-semibold leading-[1.15] tabular-nums tracking-tight text-[#1c1c1c]';
export const MAP_CARD_MOBILE_FAV_BTN_CLASS =
  'absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full text-[#1c1c1c] active:bg-[#f4f4f4] transition-colors';

/**
 * Card DESKTOP en fila horizontal (rediseño 2026): foto izquierda + info derecha,
 * una por fila. Da espacio para evaluar al experto (precio, valoración, distancia,
 * especialidad) sin apelmazar, y hace inequívoca la sincronización con el pin.
 */
export const MAP_CARD_ROW_WRAP_CLASS =
  'relative flex items-stretch gap-3.5 rounded-2xl bg-white p-2.5 font-display transition-[box-shadow,transform,border-color] duration-200';
export const MAP_CARD_ROW_IMG_CLASS =
  'relative h-[132px] w-[156px] shrink-0 overflow-hidden rounded-xl bg-[#eceff3]';
// Columna info: cabecera arriba (eyebrow+nombre+meta) y precio abajo → llena el alto de la foto,
// sin el hueco muerto que dejaba el layout anterior.
export const MAP_CARD_ROW_INFO_CLASS =
  'flex min-w-0 flex-1 flex-col justify-between py-0.5 pr-1';
export const MAP_CARD_ROW_EYEBROW_CLASS =
  'truncate text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#9a9a9a]';
export const MAP_CARD_ROW_NAME_CLASS =
  'truncate text-[16px] font-semibold leading-[1.2] tracking-[-0.015em] text-[#1c1c1c]';
// Meta de una línea: ★ valoración (reseñas) · ciudad · distancia.
export const MAP_CARD_ROW_META_CLASS =
  'mt-1 flex items-center gap-1 truncate text-[12.5px] font-normal leading-[1.3] text-[#525252]';
export const MAP_CARD_ROW_PRICE_CLASS =
  'text-[17px] font-semibold leading-none tabular-nums tracking-tight text-[#1c1c1c]';
export const MAP_CARD_ROW_PRICE_SUFFIX_CLASS =
  'text-[12px] font-normal text-[#737373]';
export const MAP_CARD_ROW_AVAIL_CLASS =
  'inline-flex items-center gap-1 rounded-full bg-[#f4f5f6] px-2 py-0.5 text-[11.5px] font-medium text-[#525252]';

/* Sombras de la fila — base hairline + elevación en hover, anillo de marca al seleccionar. */
export const MAP_CARD_ROW_SHADOW =
  'shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-[#e8e8e8]';
export const MAP_CARD_ROW_SHADOW_HOVER =
  'shadow-[0_8px_22px_rgba(16,24,40,0.13)] ring-1 ring-[#d4d4d4] -translate-y-px';
export const MAP_CARD_ROW_SHADOW_ACTIVE =
  'shadow-[0_8px_24px_hsl(var(--brand)/0.18)] ring-2 ring-brand';
