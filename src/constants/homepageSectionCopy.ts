import type { HomepageSection } from '../types/homepageWall';

const POPULAR_SECTION_TITLE = 'Revisiones populares';
const GEO_SECTION_PREFIX = 'Revisiones en ';

/**
 * Subtítulo de una línea bajo el título de sección del muro.
 * Solo cuando desambigua criterio (geo, ranking o categoría); nunca en todas las filas.
 */
export function getHomepageSectionSubtitle(section: HomepageSection): string | undefined {
  const title = section.title.replace(' >', '').trim();

  if (title === POPULAR_SECTION_TITLE) {
    return 'Los expertos con más reservas';
  }

  if (section.categoryName && section.country) {
    const category = section.categoryName.toLowerCase();
    if (category === 'coches') return 'Solo coches';
    if (category === 'motos') return 'Solo motos';
    return `Solo ${section.categoryName.toLowerCase()}`;
  }

  if (title.startsWith(GEO_SECTION_PREFIX)) {
    return 'Cerca de tu ubicación';
  }

  return undefined;
}
