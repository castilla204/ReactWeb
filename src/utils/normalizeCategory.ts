import type { CategoryWithDetailsDto, ParentCategoryDto } from '../types/category';

/** API .NET devuelve PascalCase; el frontend usa camelCase. */
export function normalizeCategoryWithDetailsDto(cat: Record<string, unknown>): CategoryWithDetailsDto {
  const parentId = (cat.parentId ?? cat.ParentId ?? null) as number | null;
  return {
    id: Number(cat.id ?? cat.Id ?? 0),
    name: String(cat.name ?? cat.Name ?? ''),
    parentId,
    isActive: (cat.isActive ?? cat.IsActive ?? true) as boolean,
    createdAt: String(cat.createdAt ?? cat.CreatedAt ?? ''),
    updatedAt: String(cat.updatedAt ?? cat.UpdatedAt ?? ''),
    isParent: (cat.isParent ?? cat.IsParent ?? parentId == null) as boolean,
    hasSubcategories: (cat.hasSubcategories ?? cat.HasSubcategories ?? false) as boolean,
    subcategoriesCount: Number(cat.subcategoriesCount ?? cat.SubcategoriesCount ?? 0),
  };
}

export function normalizeCategoryWithDetailsList(raw: unknown): CategoryWithDetailsDto[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeCategoryWithDetailsDto(item as Record<string, unknown>));
}

export function normalizeParentCategoryDto(cat: Record<string, unknown>): ParentCategoryDto {
  return {
    id: Number(cat.id ?? cat.Id ?? 0),
    name: String(cat.name ?? cat.Name ?? ''),
    isActive: (cat.isActive ?? cat.IsActive ?? true) as boolean,
    createdAt: String(cat.createdAt ?? cat.CreatedAt ?? ''),
    updatedAt: String(cat.updatedAt ?? cat.UpdatedAt ?? ''),
    subcategoriesCount: Number(cat.subcategoriesCount ?? cat.SubcategoriesCount ?? 0),
  };
}

export function normalizeParentCategoryList(raw: unknown): ParentCategoryDto[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeParentCategoryDto(item as Record<string, unknown>));
}
