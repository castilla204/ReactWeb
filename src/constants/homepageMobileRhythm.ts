/**
 * Ritmo vertical homepage móvil — inspirado en patrón delivery (search → hero → tabs → muro).
 * Escala 4pt alineada con DESIGN.md: xs=4 · sm=8 · md=16 · lg=24 · xl=32.
 *
 * Jerarquía de aire:
 * - Micro (8px): imagen card → texto en carrusel
 * - Meso (16–24px): cabecera sección → carrusel, bloques del pliegue (hero↔tabs, tabs↔muro)
 * - Macro (32px): entre secciones del muro
 */
export const HP_MOBILE_GUTTER_CLASS = 'px-4';

/** Header sticky: padding vertical del contenedor de la pill */
export const HP_MOBILE_HEADER_INSET_CLASS = 'px-4 pt-3 pb-3';

/** Hero: aire bajo el header (~24px con pb-3 del header) */
export const HP_MOBILE_HERO_SECTION_CLASS = 'relative bg-white md:hidden px-4 pt-3 pb-0';

/** Reserva bajo la tarjeta hero (capa clara) — 16px antes de tabs */
export const HP_MOBILE_HERO_PEEK_RESERVE_CLASS = 'h-4 shrink-0';

/** Tabs categoría */
export const HP_MOBILE_TABS_NAV_CLASS = 'bg-white md:hidden px-4 pb-2 pt-2';
export const HP_MOBILE_TABS_SCROLLER_CLASS =
  'flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pr-1 min-[390px]:gap-5';

/** Contenedor del muro (Suspense + live) */
export const HP_MOBILE_WALL_OUTER_CLASS =
  'w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-0 md:pb-0';

/** Muro: primera sección y separación entre carruseles */
export const HP_MOBILE_WALL_FIRST_SECTION_CLASS = 'pt-3 md:pt-4';
export const HP_MOBILE_WALL_SECTION_GAP_CLASS = 'mt-8 md:mt-10';

/** Cabecera de sección → carrusel */
export const HP_MOBILE_WALL_SECTION_HEADER_CLASS = 'mb-4 md:mb-4 md:px-0';

/** Imagen de card → texto en carrusel */
export const HP_MOBILE_WALL_CARD_IMAGE_MB_CLASS = 'mb-2 md:mb-1';

/** Altura pill de búsqueda móvil (icono + dos líneas) */
export const HP_MOBILE_SEARCH_PILL_HEIGHT_PX = 52;
