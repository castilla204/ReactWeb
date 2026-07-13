import heroBannerAvif from '../media/imagenbanner.avif';
import heroBannerWebp from '../media/imagenbanner.webp';
import mobileHeroBannerSvg from '../media/banner_inspeccion_movil.svg';
import { HERO_DESKTOP_MAP_LITERAL, MAP_LITERAL } from './designTokens';

/** Foto hero homepage — peritos a la derecha, zona clara a la izquierda para el copy */
export const HERO_BANNER_AVIF = heroBannerAvif;
export const HERO_BANNER_WEBP = heroBannerWebp;

/** @deprecated Usar HERO_BANNER_WEBP — alias móvil */
export const MOBILE_HERO_PHOTO_PATH = HERO_BANNER_WEBP;

/** Banner hero móvil — SVG con copy y gráfico integrados */
export const MOBILE_HERO_BANNER_SVG = mobileHeroBannerSvg;

/** Fracción del ancho cubierta por el panel de copy (desktop). Legacy map hero. */
export const DESKTOP_HERO_MAP_OVERLAY_PADDING = 0.26;

/** Viñeta suave bajo el copy desktop — legibilidad sin tapar el mapa derecho */
export const DESKTOP_HERO_SOFT_OVAL =
  `radial-gradient(ellipse 78% 105% at 18% 50%, ${HERO_DESKTOP_MAP_LITERAL.skyMuted} 0%, rgba(255,255,255,0.92) 32%, rgba(255,255,255,0.45) 48%, rgba(255,255,255,0.12) 62%, transparent 76%)`;

/** Lavado lateral muy suave — solo funde copy+foto con el mapa, no apaga el canvas */
export const DESKTOP_HERO_MAP_INTEGRATION_WASH = [
  `linear-gradient(90deg, rgba(250,250,250,0.5) 0%, rgba(250,250,250,0.16) 26%, transparent 44%)`,
  'linear-gradient(to top, rgba(255,255,255,0.08) 0%, transparent 14%)',
].join(', ');

/** Máscara columna foto desktop — foto más transparente, fade largo hacia el mapa */
export const DESKTOP_HERO_BANNER_MASK =
  'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.48) 38%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.04) 86%, transparent 100%)';

/**
 * Hero móvil — fondo "plano técnico": rejilla de puntos + halo agua (mismo tono
 * que el cielo del mapa desktop). Sin azul de marca ni mapa interactivo.
 * (Sigue usándose en ChatbotPanel; el hero de home usa foto real.)
 */
export const MOBILE_HERO_DOT_GRID =
  'radial-gradient(circle at center, rgba(15,23,42,0.042) 0.65px, transparent 0.65px)';

const SKY_RGB = '220, 233, 242';

export const MOBILE_HERO_SKY_GLOW =
  `radial-gradient(ellipse 60% 75% at 90% 94%, rgba(${SKY_RGB},0.85) 0%, rgba(${SKY_RGB},0.2) 42%, transparent 68%)`;

export const MOBILE_HERO_COPY_WASH =
  'linear-gradient(105deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.55) 48%, transparent 68%)';

/**
 * Scrim móvil — blanco solo bajo el copy; foto visible antes (~58% ancho).
 */
export const MOBILE_HERO_PHOTO_SCRIM = [
  'linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 26%, rgba(255,255,255,0.82) 36%, rgba(255,255,255,0.48) 46%, rgba(255,255,255,0.14) 56%, transparent 68%)',
  'radial-gradient(ellipse 72% 92% at 0% 50%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.55) 44%, transparent 72%)',
].join(', ');

/** Fade lateral sobre foto hero móvil — legibilidad del copy izquierdo */
export const MOBILE_HERO_SIDE_FADE =
  `linear-gradient(to right, ${MAP_LITERAL.coastHalo} 0%, ${MAP_LITERAL.coastHalo} 54%, rgba(255,255,255,0.55) 66%, rgba(255,255,255,0.12) 76%, transparent 86%)`;
