import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

// Interfaz específica para SearchHire
export interface SearchHire {
    id: number;
    expertId: number;
    status: string;
    statusTranslated?: string; // ✅ NUEVO: Estado traducido del backend
    createdAt: string;
    expert?: {
        name: string;
        profilePictureUrl: string;
    };
    service?: {
        id: number;
        serviceTypeId: number;
        serviceTypeName: string;
        serviceTypeCategoryId: number;
        serviceTypeCategoryName: string;
        requiresAppointment: boolean;
        price: number;
    };
}

export interface SearchItem {
    id: number;
    title: string;
    description: string;
    category: number;
    frequency: number;
    isActive: boolean;
    isRevised: boolean;
    lastExecution: string;
    createdAt: string;
    startDate: string;
    userId: number;
    locationName?: string; // ✅ NUEVO: Nombre de la ubicación
    searchHire?: SearchHire;
    user?: {
        email: string;
        name: string;
        profilePictureUrl?: string;
    };
    // ✅ NUEVOS: Indicadores de notificaciones
    unreadMessagesCount: number; // Número de mensajes sin leer
    hasPendingAppointment: boolean; // Si hay cita pendiente
    pendingAppointmentStatus?: string; // Estado de la cita pendiente
}

// ✅ NUEVO: Interfaz para metadatos de paginación
export interface PaginationMetadata {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

// ✅ NUEVO: Interfaz para estadísticas de usuario
export interface UserStats {
    activeSearches: number;
    inactiveSearches: number;
    searchesWithHire: number;
    searchesWithoutHire: number;
    unreadMessages: number;
    pendingAppointments: number;
}

// ✅ NUEVO: Interfaz para la respuesta de admin (sin stats)
export interface AdminSearchListResponse {
    searches: SearchItem[];
    pagination: PaginationMetadata;
}

// ✅ NUEVO: Interfaz para la respuesta de usuario (con stats)
export interface UserSearchListResponse {
    searches: SearchItem[];
    pagination: PaginationMetadata;
    stats: UserStats;
}

// ✅ COMPLETO: Interfaz para filtros de búsqueda (5 filtros principales)
export interface SearchFilters {
    page?: number;
    pageSize?: number;
    searchTerm?: string;        // ✅ Búsqueda por texto
    category?: number;          // ✅ Filtro por categoría
    isActive?: boolean;         // ✅ Filtrar por estado activo/inactivo
    isRevised?: boolean;        // ✅ Filtrar por estado revisado/no revisado
    searchHireStatus?: string;  // ✅ Filtrar por estado de contratación
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface SearchParameters {
    category: number | null;
    keywords: string;
    userSearch: string;
    latitude: string;
    longitude: string;
    locationRange: number;
    frequency: number;
    minPrice: number | null;
    maxPrice: number | null;
    shippingAvailable: boolean;
    strictMatchOnly: boolean;
    platformIds: number[];
    serviceTypeId: number | null;
    brandId: number | null;
    modelId: number | null;
    locationName?: string; // ✅ NUEVO: Nombre de la ubicación
}

export interface SearchResult {
    id: string;
    title: string;
    description: string;
    price: number;
    url: string;
    images: string[];
    publishDate: string;
    goodThings: string[];
    badThings: string[];
    adScore: number;
    finalScore: number;
    category: string;
    province: string;
    city: string;
    sellerType: string;
    isNew: boolean;
    highlighted: boolean;
}

export interface FilteredResult {
    id: number;
    ad: SearchResult;
    filteredAt: string;
    filterNotes: string;
}

interface SearchData {
    title: string;
    description: string;
    frequency: number;
    isActive: boolean;
    startDate: string;
    serviceId: number;
}

interface CreateSearchWithHireData {
    searchData: SearchData;
    parameters: SearchParameters;
}

export const useSearch = (options: { enableQueries?: boolean } = {}) => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const { enableQueries = true } = options;

    // Queries - only enabled when specifically requested
    const searchesQuery = useQuery({
        queryKey: ['searches'],
        queryFn: () => fetchApi<SearchItem[]>(API_CONFIG.endpoints.search.list),
        enabled: enableQueries,
    });

    const adminSearchesQuery = useQuery({
        queryKey: ['searches', 'admin'],
        queryFn: () => fetchApi<SearchItem[]>(API_CONFIG.endpoints.search.listAll),
        enabled: enableQueries,
    });

    const getSearch = (searchId: number) =>
        useQuery({
            queryKey: ['search', searchId],
            queryFn: () => fetchApi<SearchItem>(API_CONFIG.endpoints.search.get(searchId)),
        });

    // Mutations
    const createSearchMutation = useMutation({
        mutationFn: (data: SearchData) =>
            fetchApi<{ id: number }>(API_CONFIG.endpoints.search.create, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['searches'] });
        },
    });

    const updateSearchMutation = useMutation({
        mutationFn: ({ searchId, data }: { searchId: number; data: Partial<SearchData> }) =>
            fetchApi(API_CONFIG.endpoints.search.update(searchId), {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { searchId }) => {
            queryClient.invalidateQueries({ queryKey: ['searches'] });
            queryClient.invalidateQueries({ queryKey: ['search', searchId] });
        },
    });

    const deleteSearchMutation = useMutation({
        mutationFn: (searchId: number) =>
            fetchApi(API_CONFIG.endpoints.search.delete(searchId), {
                method: 'DELETE',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['searches'] });
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: (searchId: number) =>
            fetchApi(API_CONFIG.endpoints.search.toggleActive(searchId), {
                method: 'PUT',
            }),
        onSuccess: (_, searchId) => {
            queryClient.invalidateQueries({ queryKey: ['searches'] });
            queryClient.invalidateQueries({ queryKey: ['search', searchId] });
        },
    });

    const reviseSearchMutation = useMutation({
        mutationFn: (searchId: number) =>
            fetchApi(API_CONFIG.endpoints.search.revise(searchId), {
                method: 'PUT',
            }),
        onSuccess: (_, searchId) => {
            queryClient.invalidateQueries({ queryKey: ['searches'] });
            queryClient.invalidateQueries({ queryKey: ['search', searchId] });
        },
    });

    const createSearchWithHireMutation = useMutation({
        mutationFn: ({ searchData, parameters }: CreateSearchWithHireData) =>
            fetchApi<{ url?: string; searchId?: number; searchHireId?: number }>(
                API_CONFIG.endpoints.search.createWithHire,
                {
                    method: 'POST',
                    body: JSON.stringify({ searchDto: searchData, parameterDto: parameters }),
                }
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['searches'] });
        },
        onError: (error) => {
            console.error('Error creating search with hire:', error);
            throw error; // Re-throw to allow SearchForm to handle specific errors
        },
    });

    // Search Parameters
    const createParametersMutation = useMutation({
        mutationFn: ({ searchId, data }: { searchId: number; data: SearchParameters }) =>
            fetchApi<void>(API_CONFIG.endpoints.searchParameters.create(searchId), {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    });

    const getParameters = (searchId: number) =>
        useQuery({
            queryKey: ['searchParameters', searchId],
            queryFn: () => fetchApi(API_CONFIG.endpoints.searchParameters.get(searchId)),
        });

    const updateParametersMutation = useMutation({
        mutationFn: ({ searchId, data }: { searchId: number; data: Partial<SearchParameters> }) =>
            fetchApi(API_CONFIG.endpoints.searchParameters.update(searchId), {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { searchId }) => {
            queryClient.invalidateQueries({ queryKey: ['searchParameters', searchId] });
        },
    });

    // Search Results
    const getResults = (searchId: number) =>
        useQuery({
            queryKey: ['searchResults', searchId],
            queryFn: () => fetchApi<SearchResult[]>(API_CONFIG.endpoints.searchResults.list(searchId)),
        });

    const getFilteredResults = (searchId: number) =>
        useQuery({
            queryKey: ['searchResults', searchId, 'filtered'],
            queryFn: () =>
                fetchApi<FilteredResult[]>(API_CONFIG.endpoints.searchResults.filtered.list(searchId)),
        });

    const addToFilteredMutation = useMutation({
        mutationFn: ({ searchId, adId, notes }: { searchId: number; adId: string; notes: string }) =>
            fetchApi(API_CONFIG.endpoints.searchResults.filtered.add(searchId, adId), {
                method: 'POST',
                body: JSON.stringify({ notes }),
            }),
        onSuccess: (_, { searchId }) => {
            queryClient.invalidateQueries({ queryKey: ['searchResults', searchId, 'filtered'] });
        },
    });

    const removeFromFilteredMutation = useMutation({
        mutationFn: (id: number) =>
            fetchApi(API_CONFIG.endpoints.searchResults.filtered.remove(id), {
                method: 'DELETE',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey[0] === 'searchResults' && query.queryKey[2] === 'filtered',
            });
        },
    });

    // ✅ NUEVO: Hook para búsquedas con filtros y paginación (para admin y usuarios)
    const useSearchesWithFilters = (filters: SearchFilters = {}, isAdmin: boolean = false, enabled: boolean = true) => {
        return useQuery({
            queryKey: ['searches', 'filtered', filters, isAdmin],
            queryFn: async () => {
                const params = new URLSearchParams();
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== null && value !== undefined && value !== '') {
                        params.append(key, value.toString());
                    }
                });

                // ✅ Usar endpoint correcto según el tipo de usuario
                const endpoint = isAdmin ? API_CONFIG.endpoints.search.listAll : API_CONFIG.endpoints.search.list;
                const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
                
                // ✅ Usar tipo correcto según el endpoint
                if (isAdmin) {
                    return fetchApi<AdminSearchListResponse>(url);
                } else {
                    return fetchApi<UserSearchListResponse>(url);
                }
            },
            enabled: enableQueries && enabled,
        });
    };

    return {
        searches: searchesQuery,
        adminSearches: adminSearchesQuery,
        searchesWithFilters: useSearchesWithFilters, // ✅ NUEVO: Hook unificado para admin y usuarios
        getSearch,
        getParameters,
        getResults,
        getFilteredResults,
        createSearch: createSearchMutation,
        updateSearch: updateSearchMutation,
        deleteSearch: deleteSearchMutation,
        toggleActive: toggleActiveMutation,
        reviseSearch: reviseSearchMutation,
        createParameters: createParametersMutation,
        updateParameters: updateParametersMutation,
        addToFiltered: addToFilteredMutation,
        removeFromFiltered: removeFromFilteredMutation,
        createSearchWithHire: createSearchWithHireMutation,
    };
};