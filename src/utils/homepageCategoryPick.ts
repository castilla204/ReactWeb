/** Sincroniza cambio de categoría desde HomepageWall (estado vacío) con AirbnbSearchBar */
export const HOMEPAGE_PICK_CATEGORY = 'inspecciono:homepage-pick-category';

export type HomepagePickCategoryDetail = {
  categoryId: number;
  categoryName?: string;
};

export function dispatchHomepagePickCategory(categoryId: number, categoryName?: string) {
  window.dispatchEvent(
    new CustomEvent<HomepagePickCategoryDetail>(HOMEPAGE_PICK_CATEGORY, {
      detail: { categoryId, categoryName },
    })
  );
}

/** Abre el picker "Elige qué quieres revisar" desde componentes fuera de AirbnbSearchBar (p.ej. HomepageMobileHero). */
export const HOMEPAGE_OPEN_SEARCH = 'inspecciono:homepage-open-search';

export function dispatchHomepageOpenSearch() {
  window.dispatchEvent(new CustomEvent(HOMEPAGE_OPEN_SEARCH));
}
