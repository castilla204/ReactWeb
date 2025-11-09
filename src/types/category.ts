// DTOs para el sistema de categorías y subcategorías

export interface CategoryDto {
  id: number;
  name: string;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithDetailsDto extends CategoryDto {
  isParent: boolean;
  hasSubcategories: boolean;
  subcategoriesCount: number;
}

export interface ParentCategoryDto {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subcategoriesCount: number;
}

export interface CreateCategoryDto {
  name: string;
  parentId?: number | null;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name: string;
  parentId?: number | null;
  isActive: boolean;
}

export interface CreateCategoryResponse {
  success: boolean;
  message: string;
  data: CategoryDto;
}

export interface ParentCategoriesResponse {
  success: boolean;
  data: ParentCategoryDto[];
  count: number;
  message: string;
}

