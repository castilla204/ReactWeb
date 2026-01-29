import * as React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { Service } from './useServices';

interface UseInfiniteServicesProps {
    categoryId?: number;
    serviceTypeId?: number;
    latitude?: string;
    longitude?: string;
    locationRange?: number;
    pageSize?: number;
    enabled?: boolean; // Nueva opción para controlar si se ejecuta la query
}

interface PaginatedResponse {
    services: Service[];
    pagination?: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export function useInfiniteServices({
    categoryId,
    serviceTypeId,
    latitude,
    longitude,
    locationRange,
    pageSize = 20,
    enabled = true, // Por defecto habilitado para mantener compatibilidad
}: UseInfiniteServicesProps = {}) {
    const { signOut } = useAuth();
    const { fetchApi } = useApi();

    const query = useInfiniteQuery({
        queryKey: ['services-infinite', categoryId, serviceTypeId, latitude, longitude, locationRange, pageSize],
        queryFn: async ({ pageParam = 1 }) => {
            if (!categoryId || categoryId <= 0 || !serviceTypeId || serviceTypeId <= 0 || !latitude || !longitude || !locationRange || locationRange <= 0) {
                throw new Error('Invalid parameters: categoryId, serviceTypeId, latitude, longitude, and locationRange are required');
            }

            const params = new URLSearchParams({
                categoryId: categoryId.toString(),
                serviceTypeId: serviceTypeId.toString(),
                latitude,
                longitude,
                locationRange: locationRange.toString(),
                page: pageParam.toString(),
                pageSize: pageSize.toString(),
            });

            const url = `${API_CONFIG.baseUrl}/api/SearchService/map-experts?${params.toString()}`;
            console.log('🔍 useInfiniteServices: Fetching page', pageParam, 'from:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch services: ${response.statusText}`);
            }

            const data = await response.json();

            // Transformar servicios (mismo código que useServices)
            const transformService = (service: any): Service => {
                return {
                    id: service.Id || service.id,
                    expertProfileId: service.ExpertProfileId || service.expertProfileId,
                    categoryId: service.CategoryId || service.categoryId,
                    serviceTypeId: service.ServiceTypeId || service.serviceTypeId,
                    serviceTypeName: service.ServiceTypeName || service.serviceTypeName,
                    serviceTypeDescription: service.ServiceTypeDescription || service.serviceTypeDescription,
                    serviceTypeCategoryId: service.ServiceTypeCategoryId || service.serviceTypeCategoryId,
                    serviceTypeCategoryName: service.ServiceTypeCategoryName || service.serviceTypeCategoryName,
                    requiresAppointment: service.RequiresAppointment ?? service.requiresAppointment,
                    price: service.Price ?? service.price ?? 0,
                    conditions: service.Conditions || service.conditions || '',
                    durationInHours: service.DurationInHours ?? service.durationInHours,
                    createdAt: service.CreatedAt || service.createdAt,
                    imageUrls: service.ImageUrls || service.imageUrls || [],
                    images: (service.Images || service.images || []).map((img: any) => ({
                        id: img.Id ?? img.id ?? 0,
                        url: img.Url ?? img.url ?? ''
                    })).filter((img: { id: number; url: string }) => img.id > 0),
                    categoryName: service.CategoryName || service.categoryName,
                    completedSearches: service.CompletedSearches ?? service.completedSearches,
                    totalReviews: service.TotalReviews ?? service.totalReviews ?? 0,
                    averageRating: service.AverageRating ?? service.averageRating,
                    isActive: service.IsActive ?? service.isActive ?? true,
                    selectedDeliverableTypes: (service.SelectedDeliverableTypes || service.selectedDeliverableTypes || []).map((dt: any) => ({
                        id: dt.Id || dt.id,
                        name: dt.Name || dt.name,
                        displayName: dt.DisplayName || dt.displayName,
                        description: dt.Description || dt.description,
                        isRequired: dt.IsRequired ?? dt.isRequired,
                        isActive: dt.IsActive ?? dt.isActive,
                        sortOrder: dt.SortOrder ?? dt.sortOrder,
                    })),
                    expert: service.Expert || service.expert ? {
                        id: (service.Expert || service.expert).Id || (service.Expert || service.expert).id,
                        profilePictureUrl: (service.Expert || service.expert).ProfilePictureUrl || (service.Expert || service.expert).profilePictureUrl,
                        description: (service.Expert || service.expert).Description || (service.Expert || service.expert).description,
                        stripeAccountId: (service.Expert || service.expert).StripeAccountId || (service.Expert || service.expert).stripeAccountId,
                        createdAt: (service.Expert || service.expert).CreatedAt || (service.Expert || service.expert).createdAt,
                        user: {
                            name: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.Name || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.name,
                            email: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.Email || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.email,
                            profilePictureUrl: ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.ProfilePictureUrl || ((service.Expert || service.expert).User || (service.Expert || service.expert).user)?.profilePictureUrl,
                        },
                        currentAvailability: (service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability ? {
                            id: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).Id || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).id,
                            daysOfWeek: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).DaysOfWeek || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).daysOfWeek || [],
                            startTime: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).StartTime || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).startTime,
                            endTime: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).EndTime || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).endTime,
                            effectiveFrom: ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).EffectiveFrom || ((service.Expert || service.expert).CurrentAvailability || (service.Expert || service.expert).currentAvailability).effectiveFrom,
                        } : undefined,
                        reviews: ((service.Expert || service.expert).Reviews || (service.Expert || service.expert).reviews || []).map((review: any) => ({
                            id: review.Id || review.id,
                            score: review.Score ?? review.score,
                            description: review.Description || review.description,
                            createdAt: review.CreatedAt || review.createdAt,
                            reviewer: review.Reviewer || review.reviewer ? {
                                id: (review.Reviewer || review.reviewer).Id || (review.Reviewer || review.reviewer).id,
                                name: (review.Reviewer || review.reviewer).Name || (review.Reviewer || review.reviewer).name,
                                email: (review.Reviewer || review.reviewer).Email || (review.Reviewer || review.reviewer).email,
                                profilePictureUrl: (review.Reviewer || review.reviewer).ProfilePictureUrl || (review.Reviewer || review.reviewer).profilePictureUrl,
                            } : undefined,
                            imageUrls: review.ImageUrls || review.imageUrls || [],
                        })),
                        timezone: (service.Expert || service.expert).Timezone || (service.Expert || service.expert).timezone,
                        country: (service.Expert || service.expert).Country || (service.Expert || service.expert).country,
                        city: (service.Expert || service.expert).City || (service.Expert || service.expert).city || null,
                        latitude: (service.Expert || service.expert).Latitude || (service.Expert || service.expert).latitude,
                        longitude: (service.Expert || service.expert).Longitude || (service.Expert || service.expert).longitude,
                        locationRange: (service.Expert || service.expert).LocationRange || (service.Expert || service.expert).locationRange,
                    } : null,
                    expertLatitude: service.ExpertLatitude || service.expertLatitude,
                    expertLongitude: service.ExpertLongitude || service.expertLongitude,
                };
            };

            // Manejar respuesta paginada
            let services: Service[] = [];
            let pagination: PaginatedResponse['pagination'] = null;

            if (data && typeof data === 'object' && !Array.isArray(data)) {
                if (data.services && Array.isArray(data.services)) {
                    services = data.services.map(transformService);
                    pagination = data.pagination ? {
                        page: data.pagination.page || data.pagination.Page || pageParam,
                        pageSize: data.pagination.pageSize || data.pagination.PageSize || pageSize,
                        totalCount: data.pagination.totalCount || data.pagination.TotalCount || 0,
                        totalPages: data.pagination.totalPages || data.pagination.TotalPages || 0,
                        hasNextPage: data.pagination.hasNextPage ?? data.pagination.HasNextPage ?? false,
                        hasPreviousPage: data.pagination.hasPreviousPage ?? data.pagination.HasPreviousPage ?? false,
                    } : null;
                } else if (Array.isArray(data)) {
                    // Fallback: Array directo
                    services = data.map(transformService);
                }
            } else if (Array.isArray(data)) {
                services = data.map(transformService);
            }

            // Filtrar solo servicios activos
            const filteredServices = services.filter(service => service.isActive !== false);

            return {
                services: filteredServices,
                pagination: pagination || {
                    page: pageParam,
                    pageSize,
                    totalCount: filteredServices.length,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            } as PaginatedResponse;
        },
        enabled: enabled && !!(categoryId && categoryId > 0 && serviceTypeId && serviceTypeId > 0 && latitude && longitude && locationRange && locationRange > 0),
        getNextPageParam: (lastPage) => {
            if (lastPage.pagination?.hasNextPage) {
                return (lastPage.pagination.page || 1) + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        staleTime: 30000,
        gcTime: 60000,
    });

    // Aplanar todas las páginas en un solo array
    const allServices = React.useMemo(() => {
        return query.data?.pages.flatMap(page => page.services) || [];
    }, [query.data]);

    return {
        services: allServices,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isFetchingNextPage: query.isFetchingNextPage,
        hasNextPage: query.hasNextPage,
        fetchNextPage: query.fetchNextPage,
        error: query.error,
        pagination: query.data?.pages[query.data.pages.length - 1]?.pagination,
    };
}
