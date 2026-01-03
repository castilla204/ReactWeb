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

export interface HomepageWallResponse {
  nearbyServices: {
    services: SearchServiceDetailDto[];
    pagination: PaginationInfo;
  };
  popularServices: {
    services: SearchServiceDetailDto[];
    pagination: PaginationInfo;
  };
}








