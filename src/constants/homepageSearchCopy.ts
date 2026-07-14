/** Pill sticky móvil — entrada al mapa de peritos (paridad desktop «Buscar en el mapa»). */
export const MOBILE_SEARCH_PILL_TITLE = 'Buscar peritos en el mapa';

export const MOBILE_SEARCH_PILL_NEAR_SUFFIX = 'cerca de ti';

/** Modal móvil — paso «qué» antes del mapa. */
export const MOBILE_SEARCH_MODAL_TITLE = 'Elige qué quieres revisar';

export const MOBILE_SEARCH_MODAL_SUBTITLE = 'Luego verás peritos en el mapa';

export function getMobileSearchPillSubtitle(categoryLabel: string): string {
  return `${categoryLabel} · ${MOBILE_SEARCH_PILL_NEAR_SUFFIX}`;
}

export function getMobileSearchPillAriaLabel(categoryLabel: string): string {
  return `Abrir mapa de peritos. Categoría: ${categoryLabel}.`;
}
