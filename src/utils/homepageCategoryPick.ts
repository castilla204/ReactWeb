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
