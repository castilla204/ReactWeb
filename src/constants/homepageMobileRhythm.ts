/**
 * Ritmo vertical homepage móvil — inspirado en patrón delivery (search → hero → tabs → muro).
 * Escala 4pt alineada con DESIGN.md: xs=4 · sm=8 · md=16 · lg=24 · xl=32.
 *
 * Jerarquía de aire:
 * - Micro (2–8px): título↔subtítulo en cabecera (2), imagen card → texto (8)
 * - Meso (12–20px): cabecera sección → carrusel (16), bloques del pliegue
 * - Macro (32px): entre secciones del muro
 */
export const HP_MOBILE_GUTTER_CLASS = 'px-4';

/** Header sticky: safe-area internalizado (paridad SD_MOBILE_TOPBAR_COMPACT). */
export const HP_MOBILE_HEADER_INSET_CLASS =
  'px-4 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2.5';

/** Hero: respiro bajo la pill (pb-2.5 header + pt-2 hero = 18px, escala meso). */
export const HP_MOBILE_HERO_SECTION_CLASS = 'relative bg-white md:hidden px-4 pt-2 pb-0';

/** Reserva bajo la tarjeta hero (capa clara) — 10px antes de tabs */
export const HP_MOBILE_HERO_PEEK_RESERVE_CLASS = 'h-2.5 shrink-0';

/** Tabs categoría */
export const HP_MOBILE_TABS_NAV_CLASS = 'bg-white md:hidden px-4 pb-1.5 pt-1.5';
export const HP_MOBILE_TABS_SCROLLER_CLASS =
  'flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pr-1 min-[390px]:gap-5';

/** Contenedor del muro (Suspense + live) */
export const HP_MOBILE_WALL_OUTER_CLASS =
  'w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 pt-0 md:pt-0 pb-0 md:pb-0';

/** Muro: primera sección y separación entre carruseles */
export const HP_MOBILE_WALL_FIRST_SECTION_CLASS = 'pt-3 md:pt-4';
export const HP_MOBILE_WALL_SECTION_GAP_CLASS = 'mt-8 md:mt-10';

/** Título + subtítulo en cabecera de sección (proximidad Gestalt) */
export const HP_MOBILE_WALL_SECTION_TITLE_STACK_CLASS = 'space-y-0.5';

/** Cabecera de sección → carrusel — ratio 2:16 vs título↔subtítulo */
export const HP_MOBILE_WALL_SECTION_HEADER_CLASS = 'mb-4 md:mb-5 md:px-0';

/** Imagen de card → texto en carrusel */
export const HP_MOBILE_WALL_CARD_IMAGE_MB_CLASS = 'mb-2 md:mb-1';

/** Altura pill de búsqueda móvil (icono + dos líneas) */
export const HP_MOBILE_SEARCH_PILL_HEIGHT_PX = 52;

/** Sombra mínima pill — elevación instrumento, no card flotante. */
export const HP_MOBILE_SEARCH_PILL_SHADOW = '0 1px 2px 0 rgba(15, 23, 42, 0.06)';

/** Contenedor icono — tinte brand mínimo (identidad sin decorar como input delivery). */
export const HP_MOBILE_SEARCH_PILL_ICON_WRAP_CLASS =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/[0.06]';

export const HP_MOBILE_SEARCH_PILL_ICON_CLASS = 'h-4 w-4 text-brand';

/** Superficie pill — instrumento técnico, un solo borde, feedback al pulsar. */
export const HP_MOBILE_SEARCH_PILL_BASE_CLASS =
  'relative flex w-full cursor-pointer items-center gap-2.5 rounded-full border bg-white px-3.5 transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export const HP_MOBILE_SEARCH_PILL_IDLE_BORDER_CLASS = 'border-line';

export const HP_MOBILE_SEARCH_PILL_ACTIVE_BORDER_CLASS = 'border-brand/25';

/** Modal búsqueda móvil — alineado con header compact (0.5rem safe-area, px-4). */
export const HP_MOBILE_SEARCH_MODAL_FLOATING_BAR_CLASS =
  'absolute left-4 right-4 z-20 flex items-center justify-between top-[max(0.5rem,env(safe-area-inset-top,0px))]';

/** Espacio bajo botones flotantes (≈48px) + safe-area top. */
export const HP_MOBILE_SEARCH_MODAL_HEADER_CLASS =
  'px-4 pb-4 pt-[calc(max(0.5rem,env(safe-area-inset-top,0px))+3rem)]';

export const HP_MOBILE_SEARCH_MODAL_BODY_CLASS =
  'flex-1 overflow-y-auto px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]';
