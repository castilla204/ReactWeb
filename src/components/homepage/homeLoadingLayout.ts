import { HP_WALL_CARD_WIDTH_CLASS } from '../../constants/homepageTypography';
import {
  HP_MOBILE_SEARCH_PILL_HEIGHT_PX,
  HP_MOBILE_SEARCH_PILL_SHADOW,
  HP_MOBILE_WALL_CARD_IMAGE_MB_CLASS,
  HP_MOBILE_WALL_FIRST_SECTION_CLASS,
  HP_MOBILE_WALL_OUTER_CLASS,
  HP_MOBILE_WALL_SECTION_GAP_CLASS,
  HP_MOBILE_WALL_SECTION_HEADER_CLASS,
} from '../../constants/homepageMobileRhythm';

/**
 * Clases de layout compartidas — sincronizadas con homepageMobileRhythm + HomepageWall.
 * Una sola fuente para que el loading reserve el mismo espacio que la UI real.
 */
export const HP_LOADING_LAYOUT = {
  wallOuter: HP_MOBILE_WALL_OUTER_CLASS,
  sectionFirst: HP_MOBILE_WALL_FIRST_SECTION_CLASS,
  sectionNext: HP_MOBILE_WALL_SECTION_GAP_CLASS,
  sectionBleed: '-mx-4 px-4 md:mx-0 md:px-0',
  sectionHeader: HP_MOBILE_WALL_SECTION_HEADER_CLASS,
  cardImageMb: HP_MOBILE_WALL_CARD_IMAGE_MB_CLASS,
  cardsRow:
    'flex gap-3 min-[390px]:gap-3.5 min-[428px]:gap-4 md:gap-4 overflow-hidden -mx-4 px-4 scroll-pl-4 md:mx-0 md:scroll-pl-0 md:px-0',
  cardWidth: HP_WALL_CARD_WIDTH_CLASS,
} as const;

/** Alturas reales (px) — alineadas con .hp-section-title y ServiceCard móvil */
export const HP_LOADING_DIMS = {
  searchPillH: HP_MOBILE_SEARCH_PILL_HEIGHT_PX,
  searchPillShadow: HP_MOBILE_SEARCH_PILL_SHADOW,
  sectionTitleH: 23.75,
  sectionSubtitleH: 18,
  cardImageMb: 8,
  /** Reserva 2 líneas: text-[13px] leading-[1.25] */
  cardTitleH: 32.5,
  /** text-[11px] leading-snug */
  cardMetaH: 15,
  cardAvatar: 28,
  cardAvatarBottom: 8,
  cardAvatarLeft: 12,
} as const;
