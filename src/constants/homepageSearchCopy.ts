/** Pill sticky móvil — entrada al mapa de peritos (paridad desktop «Buscar en el mapa»). */
export const MOBILE_SEARCH_PILL_TITLE = 'Buscar en el mapa';

/**
 * Paso «qué» antes del mapa — compartido entre el modal móvil de pantalla
 * completa y el drawer/side-panel desktop, para que la misma decisión del
 * usuario no se redacte de dos formas distintas según el ancho de pantalla.
 */
export const CATEGORY_PICKER_TITLE = 'Elige qué quieres revisar';

export const CATEGORY_PICKER_SUBTITLE = 'Elige una categoría y te llevamos al mapa con los expertos disponibles.';

export function getMobileSearchPillSubtitle(categoryLabel: string): string {
  return `${categoryLabel} · peritos verificados`;
}

export function getMobileSearchPillAriaLabel(categoryLabel: string): string {
  return `Abrir mapa de peritos. Categoría: ${categoryLabel}.`;
}
