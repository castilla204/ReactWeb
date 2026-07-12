import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import {
    stageFavoriteToggle,
    clearFavoriteToggle,
    getPendingFavoriteToggles,
    resolveFavoriteState,
} from '../utils/favoriteOfflineQueue';

// Tipos según la guía
interface ToggleFavoriteResponse {
    success: boolean;
    message: string;
    isFavorite: boolean;
    searchServiceId: number;
}

interface CheckFavoriteResponse {
    success: boolean;
    data: {
        isFavorite: boolean;
        favoriteId: number | null;
    };
}

interface CheckMultipleResponse {
    success: boolean;
    data: Record<number, boolean>; // { [serviceId]: isFavorite }
}

interface FavoriteWithService {
    id: number;
    createdAt: string;
    service: {
        id: number;
        categoryId: number;
        categoryName: string;
        serviceTypeId: number;
        serviceTypeName: string;
        price: number;
        imageUrls: string[];
        expert: {
            id: number;
            name: string;
            profilePictureUrl: string;
            country?: string;
            city?: string;
        };
        completedSearches: number;
        averageRating: number;
    };
}

interface GetFavoritesResponse {
    success: boolean;
    data: FavoriteWithService[];
    pagination: {
        currentPage: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}

interface FavoriteCountResponse {
    success: boolean;
    searchServiceId: number;
    favoritesCount: number;
}

/**
 * Hook completo para manejar favoritos de servicios según la guía
 */
export const useServiceFavorites = () => {
    const { fetchApi, post, get, del } = useApi();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();

    // Toggle favorito (recomendado)
    const toggleFavoriteMutation = useMutation({
        mutationFn: async (params: number | { searchServiceId: number; optimisticIsFavorite: boolean }): Promise<ToggleFavoriteResponse> => {
            const searchServiceId = typeof params === 'number' ? params : params.searchServiceId;
            const optimisticIsFavorite = typeof params === 'number' ? undefined : params.optimisticIsFavorite;
            if (optimisticIsFavorite !== undefined) {
                stageFavoriteToggle(searchServiceId, optimisticIsFavorite);
            }
            try {
                const result = await post<ToggleFavoriteResponse>(API_CONFIG.endpoints.favorites.toggle, {
                    searchServiceId
                });
                clearFavoriteToggle(searchServiceId);
                return result;
            } catch (error) {
                // Mantener en cola local para sync al reconectar
                throw error;
            }
        },
        onSuccess: (data, params) => {
            const searchServiceId = typeof params === 'number' ? params : params.searchServiceId;
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            queryClient.invalidateQueries({ queryKey: ['favorite', searchServiceId] });
            queryClient.invalidateQueries({ queryKey: ['favorites', 'multiple'] });
            queryClient.invalidateQueries({ queryKey: ['favoriteCount', searchServiceId] });
        },
    });

    /** Sincroniza toggles pendientes tras reconexión o al montar. */
    const syncPendingFavorites = useCallback(async () => {
        if (!isAuthenticated || !navigator.onLine) return;
        const pending = getPendingFavoriteToggles();
        if (pending.length === 0) return;

        for (const item of pending) {
            try {
                const raw = await get<any>(API_CONFIG.endpoints.favorites.check(item.serviceId));
                const inner = raw?.data ?? raw?.Data ?? {};
                const serverFavorite = inner.isFavorite ?? inner.IsFavorite ?? false;
                if (serverFavorite !== item.isFavorite) {
                    await post<ToggleFavoriteResponse>(API_CONFIG.endpoints.favorites.toggle, {
                        searchServiceId: item.serviceId,
                    });
                }
                clearFavoriteToggle(item.serviceId);
            } catch {
                break;
            }
        }
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }, [isAuthenticated, get, post, queryClient]);

    useEffect(() => {
        void syncPendingFavorites();
        const onOnline = () => { void syncPendingFavorites(); };
        window.addEventListener('online', onOnline);
        return () => window.removeEventListener('online', onOnline);
    }, [syncPendingFavorites]);

    // Verificar si un servicio es favorito
    const checkFavorite = (searchServiceId: number, options?: { enabled?: boolean }) => {
        return useQuery({
            queryKey: ['favorite', searchServiceId],
            queryFn: async (): Promise<CheckFavoriteResponse> => {
                // CASING-FIX: el endpoint check responde con wrapper minúscula (`data`) pero interior
                // PascalCase (`IsFavorite`/`FavoriteId`, por PropertyNamingPolicy=null). Leer `.data.isFavorite`
                // daba siempre undefined → el corazón nunca aparecía marcado al cargar. Normalizamos ambos
                // casings en un único punto (igual que ya hacía ServiceReviewPage).
                const raw = await get<any>(API_CONFIG.endpoints.favorites.check(searchServiceId));
                const inner = raw?.data ?? raw?.Data ?? {};
                return {
                    success: raw?.success ?? raw?.Success ?? true,
                    data: {
                        isFavorite: inner.isFavorite ?? inner.IsFavorite ?? false,
                        favoriteId: inner.favoriteId ?? inner.FavoriteId ?? null,
                    },
                } as CheckFavoriteResponse;
            },
            enabled: (options?.enabled !== false) && isAuthenticated && !!searchServiceId,
            staleTime: 30000, // 30 segundos
        });
    };

    // Verificar múltiples servicios (para listas)
    const checkMultipleFavorites = (serviceIds: number[]) => {
        return useQuery({
            queryKey: ['favorites', 'multiple', serviceIds.sort().join(',')],
            queryFn: async (): Promise<CheckMultipleResponse> => {
                return post<CheckMultipleResponse>(API_CONFIG.endpoints.favorites.checkMultiple, serviceIds);
            },
            enabled: isAuthenticated && serviceIds.length > 0,
            staleTime: 30000, // 30 segundos
        });
    };

    // Obtener favoritos del usuario (con paginación)
    const getUserFavorites = (page: number = 1, pageSize: number = 20) => {
        return useQuery({
            queryKey: ['favorites', 'user', page, pageSize],
            queryFn: async (): Promise<GetFavoritesResponse> => {
                const rawResponse = await get<any>(API_CONFIG.endpoints.favorites.list(page, pageSize));
                
                // ✅ Normalizar respuesta de PascalCase a camelCase
                const normalizedData = (rawResponse.data || rawResponse.Data || []).map((item: any) => {
                    const service = item.Service || item.service;
                    return {
                        id: item.Id || item.id,
                        createdAt: item.CreatedAt || item.createdAt,
                        service: service ? {
                            id: service.Id || service.id,
                            categoryId: service.CategoryId || service.categoryId,
                            categoryName: service.CategoryName || service.categoryName,
                            serviceTypeId: service.ServiceTypeId || service.serviceTypeId,
                            serviceTypeName: service.ServiceTypeName || service.serviceTypeName,
                            price: service.Price || service.price,
                            imageUrls: service.ImageUrls || service.imageUrls || [],
                            expert: service.Expert || service.expert ? {
                                id: (service.Expert || service.expert).Id || (service.Expert || service.expert).id,
                                name: (service.Expert || service.expert).Name || (service.Expert || service.expert).name,
                                profilePictureUrl: (service.Expert || service.expert).ProfilePictureUrl || (service.Expert || service.expert).profilePictureUrl,
                                country: (service.Expert || service.expert).Country || (service.Expert || service.expert).country,
                                city: (service.Expert || service.expert).City || (service.Expert || service.expert).city,
                                // ?? (no ||): 0 = "solo en su taller" es un valor válido.
                                workRadiusKm: (service.Expert || service.expert).WorkRadiusKm ?? (service.Expert || service.expert).workRadiusKm,
                            } : undefined,
                            completedSearches: service.CompletedSearches || service.completedSearches || 0,
                            averageRating: service.AverageRating || service.averageRating || 0,
                        } : null,
                    };
                });
                
                return {
                    success: rawResponse.success !== undefined ? rawResponse.success : true,
                    data: normalizedData,
                    pagination: rawResponse.pagination || rawResponse.Pagination || {
                        currentPage: page,
                        pageSize: pageSize,
                        totalCount: normalizedData.length,
                        totalPages: 1,
                    },
                };
            },
            enabled: isAuthenticated,
        });
    };

    // Obtener cantidad de favoritos de un servicio (público)
    const getFavoriteCount = (searchServiceId: number) => {
        return useQuery({
            queryKey: ['favoriteCount', searchServiceId],
            queryFn: async (): Promise<FavoriteCountResponse> => {
                return get<FavoriteCountResponse>(API_CONFIG.endpoints.favorites.count(searchServiceId), {
                    requiresAuth: false, // Público
                });
            },
            enabled: !!searchServiceId,
            staleTime: 60000, // 1 minuto
        });
    };

    return {
        // Mutations
        toggleFavorite: toggleFavoriteMutation.mutate,
        toggleFavoriteAsync: toggleFavoriteMutation.mutateAsync,
        isToggling: toggleFavoriteMutation.isPending,
        resolveFavoriteState,

        // Queries
        checkFavorite,
        checkMultipleFavorites,
        getUserFavorites,
        getFavoriteCount,
    };
};
