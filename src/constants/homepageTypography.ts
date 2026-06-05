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
 * XR y SE comparten el mismo ancho de card (160px).
 */
export const HP_MOBILE_WIDE = 'min-[428px]:' as const;

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

/** Mismos márgenes que HomepageWall */
export const SD_PAGE_INNER_MAX_CLASS =
  'mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-10';

/** Cifras de cobertura en hero (alineado con FAQ / HomePresentation) */
export const HP_HERO_COVERAGE = {
  countriesMin: 50,
  expertsMin: 500,
} as const;

/** Contenido + barra lateral reserva */
export const SD_PAGE_GRID_CLASS =
  'grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 xl:gap-10';

/** Checkout desktop: más ancho útil y columnas más unidas */
export const SD_CHECKOUT_INNER_MAX_CLASS =
  'mx-auto w-full max-w-[min(90rem,calc(100vw-2.5rem))] px-4 md:px-6 lg:px-8';

export const SD_CHECKOUT_GRID_CLASS =
  'grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 xl:gap-7';

/** Gutter horizontal móvil (mismo que `px-4` de SD_PAGE_INNER_MAX_CLASS) */
export const SD_MOBILE_GUTTER_CLASS = 'px-4';

/** Carruseles horizontales móvil: alinear con gutter sin duplicar en cada card */
export const SD_MOBILE_CAROUSEL_EDGE_CLASS = 'pl-4 pr-4';

/**
 * Reserva inferior del scroll: barra fija compacta + colchón + safe-area.
 * Barra ≈ py-3 + fila 48px + pb safe-area.
 */
export const SD_MOBILE_SCROLL_PAD_CLASS =
  'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]';

/** Offset superior botones flotantes (notch / Dynamic Island) */
export const SD_MOBILE_FLOATING_TOP_CLASS =
  'top-[max(1rem,env(safe-area-inset-top,0px))]';

/** Shell barra fija móvil */
export const SD_MOBILE_FOOTER_SHELL_CLASS =
  'fixed bottom-0 left-0 right-0 z-50 border-t border-[#e8e8e8] bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.09)]';

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

export const MAP_DESKTOP_LIST_CLASS = `${MAP_DESKTOP_PANEL_GUTTER} pb-4 pt-0`;

export const MAP_DESKTOP_GRID_CLASS =
  // Antes: siempre 2 cols a partir de lg → en monitores grandes la lista respiraba
  // poco y cada card era muy estrecha. Ahora: 2 cols en lg/xl, 3 cols en 2xl+.
  'grid w-full grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-4 xl:gap-5 2xl:grid-cols-3';

/**
 * Desktop: una sola fila lista + mapa bajo la topbar.
 * Antes había un `auto` extra para el page header editorial — robaba ~110px al mapa
 * y dejaba un hueco blanco a la derecha (mitad de la fila 1). Ahora el mapa nace
 * a +52px (topbar) y ocupa 100dvh-52px; la microcabecera del panel vive DENTRO
 * del scroll de la columna 1, no compite con el mapa.
 * Lista más ancha en pantallas grandes para encajar 3 cards/fila a partir de 2xl.
 */
export const MAP_DESKTOP_SPLIT_CLASS =
  'grid min-h-0 w-full flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[clamp(480px,46vw,1040px)_minmax(0,1fr)]';

/** Microcabecera DEL PANEL DE CARDS (no full-width). Vive dentro del scroll de
 *  la columna izquierda → no resta altura al mapa. Sticky para que el contexto
 *  ("Compara antes de reservar · N expertos · zona") quede pinned al hacer scroll. */
export const MAP_DESKTOP_PANEL_HEADER_CLASS =
  'sticky top-0 z-10 -mx-5 mb-2 border-b border-[#f0f0f0] bg-white/95 px-5 pb-2.5 pt-3 backdrop-blur-sm xl:-mx-6 xl:px-6';

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
  'hidden min-h-0 overflow-hidden bg-white lg:col-start-1 lg:row-start-1 lg:block';

export const MAP_PANEL_SCROLL_CLASS = 'map-panel-scroll';

export const MAP_DESKTOP_SCROLL_CLASS =
  `${MAP_PANEL_SCROLL_CLASS} h-full min-h-0 overflow-y-auto overscroll-contain`;

/** Mapa — única fila bajo la topbar. Padding superior reducido para que el mapa
 *  arranque casi pegado a la topbar (antes pt-1.5 colaba bajo el header editorial). */
export const MAP_DESKTOP_MAP_WRAP_CLASS =
  'relative hidden min-h-0 flex-col bg-white pl-1.5 pr-5 pb-4 pt-3 lg:col-start-2 lg:row-start-1 lg:flex xl:pr-6 xl:pb-5 xl:pt-3.5';

export const MAP_DESKTOP_MAP_INNER_CLASS =
  'relative min-h-0 flex-1 w-full overflow-hidden rounded-2xl';

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
  // h-10 (40px) en vez de h-8 (32px) → chips más altos, parecen botones reales.
  // px-3.5 + gap-1.5 → más respiración interna. Sombra sutil para "salir" del fondo blanco.
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white ring-1 ring-[#dcdcdc] px-3.5 h-10 text-[13px] font-semibold text-[#1c1c1c] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors active:bg-[#f4f4f4] font-display';
export const MAP_MOBILE_FILTER_CHIP_ACTIVE_CLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand/10 ring-1 ring-brand/40 px-3.5 h-10 text-[13px] font-semibold text-brand shadow-[0_1px_2px_hsl(var(--brand)/0.15)] transition-colors font-display';

export const MAP_MOBILE_LIST_CLASS = `${SD_MOBILE_GUTTER_CLASS} pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-1.5`;

export const MAP_CARD_BODY_CLASS = 'px-3.5 py-2.5 font-display';

/** Imagen un poco más baja que 4/3 (desktop y móvil) */
export const MAP_CARD_IMAGE_CLASS = 'relative w-full overflow-hidden aspect-[16/10]';

export const MAP_CARD_IMAGE_TOP_CLASS = `${MAP_CARD_IMAGE_CLASS} rounded-t-2xl`;

export const MAP_CARD_EYEBROW_CLASS =
  'text-[10px] font-semibold uppercase tracking-[0.085em] text-brand';

export const MAP_CARD_NAME_CLASS =
  'truncate text-[15px] font-semibold leading-5 tracking-[-0.015em] text-[#1c1c1c]';

export const MAP_CARD_HOOK_CLASS = 'line-clamp-1 text-[13px] font-normal leading-snug text-[#6a6a6a]';

export const MAP_CARD_CHIP_CLASS =
  'inline-flex items-center gap-1 rounded-full bg-[#f6f6f6] ring-1 ring-[#ececec] px-2 py-0.5 text-[11px] font-medium text-[#5a5a5a]';

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
  'mt-0.5 truncate text-[12.5px] font-medium leading-[1.35] text-[#6a6a6a]';
export const MAP_CARD_MOBILE_PRICE_CLASS =
  'text-[16px] font-semibold leading-[1.15] tabular-nums tracking-tight text-[#1c1c1c]';
export const MAP_CARD_MOBILE_FAV_BTN_CLASS =
  'absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full text-[#1c1c1c] active:bg-[#f4f4f4] transition-colors';
