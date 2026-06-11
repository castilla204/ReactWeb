import heroBannerAvif from '../media/imagenbanner.avif';
import heroBannerWebp from '../media/imagenbanner.webp';

/** Foto hero homepage — peritos a la derecha, zona clara a la izquierda para el copy */
export const HERO_BANNER_AVIF = heroBannerAvif;
export const HERO_BANNER_WEBP = heroBannerWebp;

/** @deprecated Usar HERO_BANNER_WEBP — alias móvil */
export const MOBILE_HERO_PHOTO_PATH = HERO_BANNER_WEBP;

/** Fracción del ancho cubierta por el panel de copy (desktop). Legacy map hero. */
export const DESKTOP_HERO_MAP_OVERLAY_PADDING = 0.26;

/** Viñeta suave bajo el copy desktop — legibilidad sobre el mapa */
export const DESKTOP_HERO_SOFT_OVAL =
  'radial-gradient(ellipse 72% 100% at 20% 48%, #ffffff 0%, #ffffff 36%, rgba(255,255,255,0.92) 48%, rgba(255,255,255,0.55) 58%, transparent 78%)';

/** Máscara columna foto desktop — foto más transparente, fade largo hacia el mapa */
export const DESKTOP_HERO_BANNER_MASK =
  'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.48) 38%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.04) 86%, transparent 100%)';

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

/**
 * Scrim móvil — blanco solo bajo el copy; foto visible antes (~58% ancho).
 */
export const MOBILE_HERO_PHOTO_SCRIM = [
  'linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 26%, rgba(255,255,255,0.82) 36%, rgba(255,255,255,0.48) 46%, rgba(255,255,255,0.14) 56%, transparent 68%)',
  'radial-gradient(ellipse 72% 92% at 0% 50%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.55) 44%, transparent 72%)',
].join(', ');
