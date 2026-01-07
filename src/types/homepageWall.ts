// ✅ ACTUALIZADO: La respuesta es un array de secciones, no un objeto
export interface HomepageSection {
  title: string;                    // Título ya formateado (ej: "Revisiones Coches cerca de mí")
  services: SearchServiceHomepageDto[];
  categoryName?: string;            // Solo presente en secciones específicas por país
  country?: string;                 // Solo presente en secciones específicas por país
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ✅ La respuesta es un array de secciones
export type HomepageWallResponse = HomepageSection[];

// ✅ Servicio en formato PascalCase (como viene del backend)
export interface HomepageExpertAvailabilityDto {
  DaysOfWeek: string[];  // ["Monday", "Tuesday", ...]
  StartTime: string;     // "09:00:00"
  EndTime: string;       // "18:00:00"
}

export interface SearchServiceHomepageDto {
  Id: number;
  CategoryId: number;
  CategoryName: string;
  ServiceTypeId: number;
  ServiceTypeName: string;
  ServiceTypeDescription?: string; // ✅ NUEVO: Descripción del tipo de servicio
  Price: number;
  ImageUrls: string[];  // URLs firmadas, listas para usar
  Expert: {
    Id: number;
    Name: string;
    ProfilePictureUrl: string;
    Country: string;
    Availability?: HomepageExpertAvailabilityDto | null; // ✅ NUEVO: Horario del experto
  };
  CompletedSearches: number;
  AverageRating: number;
}

// ✅ Mantener interfaces antiguas para compatibilidad (si se necesitan)
export interface SearchServiceDetailDto {
  id: number;
  categoryId: number;
  serviceTypeId: number;
  serviceTypeName: string;
  serviceTypeDescription?: string;
  serviceTypeCategoryId?: number;
  requiresAppointment: boolean;
  price: number;
  conditions: string;
  durationInHours: number;
  createdAt: string;
  isActive: boolean;
  imageUrls: string[];
  categoryName: string;
  completedSearches: number;
  averageRating: number;
  expert?: ExpertProfileDto;
  selectedDeliverableTypes: DeliverableTypeDto[];
}

export interface ExpertProfileDto {
  id: number;
  profilePictureUrl: string;
  description: string;
  latitude: string;
  longitude: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  reviews: ReviewDto[];
  currentAvailability?: {
    id: number;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    effectiveFrom: string;
  };
  timezone?: string;
  country?: string;
}

export interface ReviewDto {
  id: number;
  score: number;
  description: string;
  createdAt: string;
  reviewer?: {
    id: number;
    name: string;
    email: string;
    profilePictureUrl?: string;
  };
  imageUrls?: string[];
}

export interface DeliverableTypeDto {
  id: number;
  name: string;
  description?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
