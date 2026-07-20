import heroBannerAvif from '../media/imagenbanner.avif';
import heroBannerWebp from '../media/imagenbanner.webp';
import { HERO_DESKTOP_MAP_LITERAL, MAP_LITERAL } from './designTokens';

/** Foto hero homepage — peritos a la derecha, zona clara a la izquierda para el copy */
export const HERO_BANNER_AVIF = heroBannerAvif;
export const HERO_BANNER_WEBP = heroBannerWebp;

/** @deprecated Usar HERO_BANNER_WEBP — alias móvil */
export const MOBILE_HERO_PHOTO_PATH = HERO_BANNER_WEBP;

/** Lavado lateral muy suave — usado por ExpertsAreaMap (fuera del hero desde el
 *  rediseño foto-only; se conserva para su posible reutilización, p. ej. una
 *  franja de cobertura dedicada). */
export const DESKTOP_HERO_MAP_INTEGRATION_WASH = [
  `linear-gradient(90deg, rgba(250,250,250,0.5) 0%, rgba(250,250,250,0.16) 26%, transparent 44%)`,
  'linear-gradient(to top, rgba(255,255,255,0.08) 0%, transparent 14%)',
].join(', ');

/** Poster estático mientras carga MapLibre — misma paleta que el mapa vivo */
export const DESKTOP_HERO_MAP_POSTER = [
  `radial-gradient(ellipse 56% 50% at 74% 46%, ${HERO_DESKTOP_MAP_LITERAL.land} 0%, ${HERO_DESKTOP_MAP_LITERAL.sky} 42%, ${HERO_DESKTOP_MAP_LITERAL.skyMuted} 72%, transparent 86%)`,
  DESKTOP_HERO_MAP_INTEGRATION_WASH,
].join(', ');

/** Alturas mínimas del hero desktop — crece si el copy escala (zoom / i18n) */
export const DESKTOP_HERO_MIN_HEIGHT_CLASS =
  'min-h-[400px] lg:min-h-[500px] xl:min-h-[520px]';

/** Costura foto→fondo en el hero desktop — feather corto que funde el borde
 *  izquierdo de la foto (a sangre completa, sin máscara de opacidad) con
 *  `bg-surface-tinted`. La foto ya trae su propia zona clara para el copy;
 *  esto solo evita un corte duro donde empieza la imagen. */
export const DESKTOP_HERO_PHOTO_SEAM_FADE =
  'linear-gradient(90deg, hsl(var(--surface-tinted)) 0%, hsl(var(--surface-tinted) / 0.7) 40%, transparent 100%)';

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
