import { HP_WALL_CARD_WIDTH_CLASS } from '../../constants/homepageTypography';

/**
 * Clases de layout compartidas — copiadas de AirbnbSearchBar + HomepageWall.
 * Una sola fuente para que el loading reserve el mismo espacio que la UI real.
 */
export const HP_LOADING_LAYOUT = {
  wallOuter:
    'w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-1 md:pb-0',
  sectionFirst: 'pt-1 min-[428px]:pt-2 md:pt-2',
  sectionNext: 'mt-2 md:mt-8',
  sectionBleed: '-mx-4 px-4 md:mx-0 md:px-0',
  sectionHeader: 'mb-1.5 md:mb-3',
  cardsRow:
    'flex gap-4 min-[428px]:gap-[18px] md:gap-3 overflow-hidden -mx-4 px-4 scroll-pl-4 md:mx-0 md:scroll-pl-0 md:px-0',
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
  cardImageMb: 4,
  cardTitleH: 20,
  cardMetaH: 16,
  cardAvatar: 28,
  cardAvatarBottom: 8,
  cardAvatarLeft: 12,
} as const;
