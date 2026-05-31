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
  'grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12';

/** CTA principal ficha servicio (mismo azul que homepage) */
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
