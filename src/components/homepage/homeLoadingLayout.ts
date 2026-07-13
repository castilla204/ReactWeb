import { HP_WALL_CARD_WIDTH_CLASS } from '../../constants/homepageTypography';

/**
 * Clases de layout compartidas — copiadas de AirbnbSearchBar + HomepageWall.
 * Una sola fuente para que el loading reserve el mismo espacio que la UI real.
 */
export const HP_LOADING_LAYOUT = {
  wallOuter:
    'w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-0',
  sectionFirst: 'pt-1.5 min-[390px]:pt-2 md:pt-4',
  sectionNext: 'mt-3 min-[390px]:mt-4 md:mt-10',
  sectionBleed: '-mx-4 px-4 md:mx-0 md:px-0',
  sectionHeader: 'mb-2 md:mb-4',
  cardsRow:
    'flex gap-3 min-[390px]:gap-3.5 min-[428px]:gap-4 md:gap-4 overflow-hidden -mx-4 px-4 scroll-pl-4 md:mx-0 md:scroll-pl-0 md:px-0',
  cardWidth: HP_WALL_CARD_WIDTH_CLASS,
} as const;

/** Alturas reales (px) — documentación + estilos inline donde hace falta */
export const HP_LOADING_DIMS = {
  searchPillH: 56,
  searchPillShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  tabIcon: { base: 48, lg: 56 },
  tabLabelH: 13,
  sectionTitleH: 22.5,
  sectionSubtitleH: 20,
  cardImageMb: 6,
  cardTitleH: 18,
  cardMetaH: 14,
  cardAvatar: 28,
  cardAvatarBottom: 8,
  cardAvatarLeft: 12,
} as const;
