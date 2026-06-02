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
  brand: '#0066CC',
  brandDark: '#005bb5',
  brandDarker: '#004a99',
  border: '#e8e8e8',
  borderSoft: '#ebebeb',
} as const;

/** Mismo gradiente que HomepageMobileHero / HomepageDesktopKayak */
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
  'underline decoration-[#0066CC] underline-offset-2 hover:no-underline transition-all';

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
  'inline-flex items-center justify-center h-12 px-6 min-w-[120px] shrink-0 rounded-full bg-[#0066CC] text-white text-base font-semibold shadow-[0_4px_16px_rgba(0,102,204,0.2)] transition-colors hover:bg-[#005bb5] active:scale-[0.99] disabled:opacity-75 disabled:cursor-wait';

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

/** Paso mapa (crear-busqueda step=map) — gutters y tipografía unificados */
export const MAP_DESKTOP_PANEL_GUTTER = 'px-6 xl:px-8';

export const MAP_DESKTOP_HEADER_CLASS = `shrink-0 border-b border-[#e8e8e8] ${MAP_DESKTOP_PANEL_GUTTER} py-6`;

export const MAP_DESKTOP_LIST_CLASS = `${MAP_DESKTOP_PANEL_GUTTER} pb-8 pt-6`;

export const MAP_DESKTOP_GRID_CLASS =
  'grid w-full grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6';

export const MAP_PAGE_TITLE_CLASS =
  'relative inline-block font-display text-[22px] font-semibold leading-[26px] tracking-[-0.01em] text-[#1c1c1c]';

export const MAP_PAGE_TITLE_MOBILE_CLASS =
  'relative inline-block font-display text-[1.125rem] font-semibold leading-[1.3] tracking-[-0.02em] text-[#1c1c1c]';

export const MAP_PAGE_SUBTITLE_CLASS =
  'mt-2 max-w-md text-sm font-normal leading-[1.45] text-[#6a6a6a]';

export const MAP_PAGE_SUBTITLE_MOBILE_CLASS =
  'mt-1.5 text-sm font-normal leading-[1.45] text-[#6a6a6a]';

export const MAP_MOBILE_DRAWER_HEADER_CLASS = `${SD_MOBILE_GUTTER_CLASS} pb-4 pt-3 pr-12`;

export const MAP_MOBILE_LIST_CLASS = `${SD_MOBILE_GUTTER_CLASS} pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-2`;

export const MAP_CARD_BODY_CLASS = 'px-4 py-3.5 font-display';

export const MAP_CARD_EYEBROW_CLASS =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0066CC]';

export const MAP_CARD_NAME_CLASS =
  'truncate text-[15px] font-semibold leading-5 tracking-[-0.01em] text-[#1c1c1c]';

export const MAP_CARD_HOOK_CLASS = 'text-sm font-normal leading-snug text-[#6a6a6a]';

export const MAP_CARD_CHIP_CLASS =
  'inline-flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2.5 py-1 text-xs font-medium text-[#6a6a6a]';

export const MAP_CARD_PRICE_CLASS = 'text-[17px] font-semibold leading-5 text-[#1c1c1c]';

export const MAP_CARD_PRICE_SUFFIX_CLASS = 'text-sm font-normal text-[#6a6a6a]';

export const MAP_CARD_BADGE_CLASS =
  'inline-flex items-center rounded-lg bg-white/95 px-2 py-1 font-display text-[10px] font-medium leading-3 text-[#222222] shadow-sm backdrop-blur-sm';
