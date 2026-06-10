/** Fracción del ancho cubierta por el panel de copy (desktop). Centra el mapa en la zona visible. */
export const DESKTOP_HERO_MAP_OVERLAY_PADDING = 0.26;

/** Viñeta suave bajo el copy desktop — no tapa todo el mapa */
export const DESKTOP_HERO_SOFT_OVAL =
  'radial-gradient(ellipse 72% 100% at 20% 48%, #ffffff 0%, #ffffff 36%, rgba(255,255,255,0.92) 48%, rgba(255,255,255,0.55) 58%, transparent 78%)';

/**
 * Hero móvil — fondo "plano técnico": rejilla de puntos + halo agua (mismo tono
 * que el cielo del mapa desktop #dce9f2). Sin azul de marca ni mapa interactivo.
 * (Sigue usándose en ChatbotPanel; el hero de home usa foto real.)
 */
export const MOBILE_HERO_DOT_GRID =
  'radial-gradient(circle at center, rgba(15,23,42,0.042) 0.65px, transparent 0.65px)';

export const MOBILE_HERO_SKY_GLOW =
  'radial-gradient(ellipse 60% 75% at 90% 94%, rgba(220,233,242,0.85) 0%, rgba(220,233,242,0.2) 42%, transparent 68%)';

export const MOBILE_HERO_COPY_WASH =
  'linear-gradient(105deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.55) 48%, transparent 68%)';

/** Foto hero móvil (public/hero-mobile-inspector.jpg) — viñeta izquierda para el copy */
export const MOBILE_HERO_PHOTO_PATH = '/hero-mobile-inspector.jpg';

export const MOBILE_HERO_PHOTO_OVERLAY =
  'linear-gradient(95deg, rgba(255,255,255,0.99) 0%, rgba(255,255,255,0.95) 32%, rgba(255,255,255,0.78) 48%, rgba(255,255,255,0.28) 64%, transparent 82%)';
