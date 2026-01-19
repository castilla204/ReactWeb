import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

// ✅ NUEVA INTERFAZ PARA INFORMACIÓN DE ESTADOS
export interface SystemStatusDto {
  id: number;
  statusType: string;
  statusName: string;
  statusValue: string;
  displayName: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  isFinalizationStatus: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Interfaz específica para SearchHire
export interface SearchHire {
    id: number;
    expertId: number;
    status: string;
    statusTranslated?: string; // ✅ NUEVO: Estado traducido del backend
    statusInfo?: SystemStatusDto; // ✅ NUEVO: Información completa del estado
    createdAt: string;
    /**
     * Monto total pagado (con IVA incluido).
     * Este es el precio final que pagó el cliente.
     */
    amount?: number;
    /**
     * Base amount sin IVA/tax (pre-tax).
     * Si es null, usar Amount como fallback (datos antiguos).
     */
    baseAmount?: number;
    /**
     * Monto de IVA/tax calculado por Stripe Tax.
     * Si es null o 0, no hay tax aplicado.
     */
    taxAmount?: number;
    expert?: {
        id: number;
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
    // ✅ NUEVOS CAMPOS: Información del servicio y experto para cards
    serviceImageUrl?: string | null; // Primera imagen del servicio
    expertAvailability?: {
        daysOfWeek: string[]; // ["Monday", "Tuesday", ...]
        startTime: string; // "09:00:00"
        endTime: string; // "18:00:00"
    } | null; // Horario del experto
    expertCity?: string | null; // Ciudad del experto
    categoryName?: string | null; // ✅ NUEVO: Nombre de la categoría (ej: "Hogar", "Coches", "Motos")
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
    // ✅ DESHABILITADO: Query sin parámetros para evitar llamadas duplicadas
    const searchesQuery = useQuery({
        queryKey: ['searches'],
        queryFn: () => fetchApi<SearchItem[]>(API_CONFIG.endpoints.search.list),
        enabled: false, // ✅ DESHABILITADO: Solo usar searchesWithFilters
    });

    // ✅ DESHABILITADO: Query de admin sin parámetros para evitar llamadas duplicadas
    const adminSearchesQuery = useQuery({
        queryKey: ['searches', 'admin'],
        queryFn: () => fetchApi<SearchItem[]>(API_CONFIG.endpoints.search.listAll),
        enabled: false, // ✅ DESHABILITADO: Solo usar searchesWithFilters
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

    // ✅ Función para normalizar SystemStatusDto de PascalCase a camelCase
    const normalizeSystemStatusDto = (status: any): SystemStatusDto | undefined => {
        if (!status) return undefined;
        return {
            id: status.Id ?? status.id,
            statusType: status.StatusType ?? status.statusType,
            statusName: status.StatusName ?? status.statusName,
            statusValue: status.StatusValue ?? status.statusValue,
            displayName: status.DisplayName ?? status.displayName,
            description: status.Description ?? status.description ?? null,
            color: status.Color ?? status.color ?? null,
            isActive: status.IsActive ?? status.isActive ?? true,
            isFinalizationStatus: status.IsFinalizationStatus ?? status.isFinalizationStatus ?? false,
            sortOrder: status.SortOrder ?? status.sortOrder ?? 0,
            createdAt: status.CreatedAt ?? status.createdAt,
            updatedAt: status.UpdatedAt ?? status.updatedAt,
        };
    };

    // ✅ Función para normalizar SearchHire de PascalCase a camelCase
    const normalizeSearchHire = (hire: any): SearchHire | undefined => {
        if (!hire) return undefined;
        return {
            id: hire.Id ?? hire.id,
            expertId: hire.ExpertId ?? hire.expertId,
            status: hire.Status ?? hire.status,
            statusTranslated: hire.StatusTranslated ?? hire.statusTranslated,
            statusInfo: normalizeSystemStatusDto(hire.StatusInfo ?? hire.statusInfo),
            createdAt: hire.CreatedAt ?? hire.createdAt,
            amount: hire.Amount ?? hire.amount,
            baseAmount: hire.BaseAmount ?? hire.baseAmount,
            taxAmount: hire.TaxAmount ?? hire.taxAmount,
            expert: hire.Expert || hire.expert ? {
                id: (hire.Expert ?? hire.expert).Id ?? (hire.Expert ?? hire.expert).id ?? 0,
                name: (hire.Expert ?? hire.expert).Name ?? (hire.Expert ?? hire.expert).name ?? '',
                profilePictureUrl: (hire.Expert ?? hire.expert).ProfilePictureUrl ?? (hire.Expert ?? hire.expert).profilePictureUrl ?? '',
            } : undefined,
            service: hire.Service || hire.service ? {
                id: (hire.Service ?? hire.service).Id ?? (hire.Service ?? hire.service).id,
                serviceTypeId: (hire.Service ?? hire.service).ServiceTypeId ?? (hire.Service ?? hire.service).serviceTypeId,
                serviceTypeName: (hire.Service ?? hire.service).ServiceTypeName ?? (hire.Service ?? hire.service).serviceTypeName,
                serviceTypeCategoryId: (hire.Service ?? hire.service).ServiceTypeCategoryId ?? (hire.Service ?? hire.service).serviceTypeCategoryId,
                serviceTypeCategoryName: (hire.Service ?? hire.service).ServiceTypeCategoryName ?? (hire.Service ?? hire.service).serviceTypeCategoryName,
                requiresAppointment: (hire.Service ?? hire.service).RequiresAppointment ?? (hire.Service ?? hire.service).requiresAppointment ?? false,
                price: (hire.Service ?? hire.service).Price ?? (hire.Service ?? hire.service).price,
            } : undefined,
        };
    };

    // ✅ Función para normalizar SearchItem de PascalCase a camelCase
    const normalizeSearchItem = (item: any): SearchItem => {
        // ✅ Normalizar ExpertAvailability
        const normalizeExpertAvailability = (availability: any) => {
            if (!availability) return null;
            const avail = availability.ExpertAvailability ?? availability.expertAvailability ?? availability;
            if (!avail) return null;
            return {
                daysOfWeek: avail.DaysOfWeek ?? avail.daysOfWeek ?? [],
                startTime: avail.StartTime ?? avail.startTime ?? '',
                endTime: avail.EndTime ?? avail.endTime ?? '',
            };
        };

        return {
            id: item.Id ?? item.id,
            title: item.Title ?? item.title,
            description: item.Description ?? item.description,
            category: item.Category ?? item.category,
            frequency: item.Frequency ?? item.frequency,
            isActive: item.IsActive ?? item.isActive ?? true,
            isRevised: item.IsRevised ?? item.isRevised ?? false,
            lastExecution: item.LastExecution ?? item.lastExecution,
            createdAt: item.CreatedAt ?? item.createdAt,
            startDate: item.StartDate ?? item.startDate,
            userId: item.UserId ?? item.userId,
            locationName: item.LocationName ?? item.locationName,
            searchHire: normalizeSearchHire(item.SearchHire ?? item.searchHire),
            user: item.User || item.user ? {
                email: (item.User ?? item.user).Email ?? (item.User ?? item.user).email ?? '',
                name: (item.User ?? item.user).Name ?? (item.User ?? item.user).name ?? '',
                profilePictureUrl: (item.User ?? item.user).ProfilePictureUrl ?? (item.User ?? item.user).profilePictureUrl,
            } : undefined,
            unreadMessagesCount: item.UnreadMessagesCount ?? item.unreadMessagesCount ?? 0,
            hasPendingAppointment: item.HasPendingAppointment ?? item.hasPendingAppointment ?? false,
            pendingAppointmentStatus: item.PendingAppointmentStatus ?? item.pendingAppointmentStatus,
            // ✅ NUEVOS CAMPOS: Información del servicio y experto
            // Intentar múltiples variantes del nombre del campo
            serviceImageUrl: item.ServiceImageUrl ?? item.serviceImageUrl ?? item.service_image_url ?? null,
            expertAvailability: normalizeExpertAvailability(item),
            expertCity: item.ExpertCity ?? item.expertCity ?? null,
            categoryName: item.CategoryName ?? item.categoryName ?? null, // ✅ NUEVO: Nombre de la categoría
        };
    };

    // ✅ Función para normalizar PaginationMetadata de PascalCase a camelCase
    const normalizePagination = (pagination: any): PaginationMetadata => {
        return {
            currentPage: pagination.CurrentPage ?? pagination.currentPage ?? 1,
            pageSize: pagination.PageSize ?? pagination.pageSize ?? 20,
            totalCount: pagination.TotalCount ?? pagination.totalCount ?? 0,
            totalPages: pagination.TotalPages ?? pagination.totalPages ?? 0,
            hasPrevious: pagination.HasPrevious ?? pagination.hasPrevious ?? false,
            hasNext: pagination.HasNext ?? pagination.hasNext ?? false,
        };
    };

    // ✅ Función para normalizar UserStats de PascalCase a camelCase
    const normalizeUserStats = (stats: any): UserStats | undefined => {
        if (!stats) return undefined;
        return {
            activeSearches: stats.ActiveSearches ?? stats.activeSearches ?? 0,
            inactiveSearches: stats.InactiveSearches ?? stats.inactiveSearches ?? 0,
            searchesWithHire: stats.SearchesWithHire ?? stats.searchesWithHire ?? 0,
            searchesWithoutHire: stats.SearchesWithoutHire ?? stats.searchesWithoutHire ?? 0,
            unreadMessages: stats.UnreadMessages ?? stats.unreadMessages ?? 0,
            pendingAppointments: stats.PendingAppointments ?? stats.pendingAppointments ?? 0,
        };
    };

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
                
                // ✅ Obtener respuesta cruda de la API
                const rawResponse = await fetchApi<any>(url);
                
                // ✅ Debug: Ver estructura de la respuesta
                console.log('[useSearchesWithFilters] Raw response keys:', Object.keys(rawResponse));
                console.log('[useSearchesWithFilters] Has Searches?', !!rawResponse.Searches);
                console.log('[useSearchesWithFilters] Has searches?', !!rawResponse.searches);
                console.log('[useSearchesWithFilters] Has Pagination?', !!rawResponse.Pagination);
                console.log('[useSearchesWithFilters] Has pagination?', !!rawResponse.pagination);
                
                // ✅ Normalizar respuesta: mapear Searches -> searches, Pagination -> pagination
                const searchesArray = rawResponse.Searches ?? rawResponse.searches ?? [];
                console.log('[useSearchesWithFilters] Searches array length:', searchesArray.length);
                // ✅ Debug: Verificar campos de imagen en el primer item
                if (searchesArray.length > 0) {
                    const firstItem = searchesArray[0];
                    console.log('[useSearchesWithFilters] First item keys:', Object.keys(firstItem));
                    console.log('[useSearchesWithFilters] ServiceImageUrl (PascalCase):', firstItem.ServiceImageUrl);
                    console.log('[useSearchesWithFilters] serviceImageUrl (camelCase):', firstItem.serviceImageUrl);
                }
                const normalizedSearches = searchesArray.map(normalizeSearchItem);
                // ✅ Debug: Verificar después de normalizar
                if (normalizedSearches.length > 0) {
                    console.log('[useSearchesWithFilters] Normalized first item serviceImageUrl:', normalizedSearches[0].serviceImageUrl);
                }
                
                const normalizedPagination = normalizePagination(rawResponse.Pagination ?? rawResponse.pagination ?? {});
                console.log('[useSearchesWithFilters] Normalized searches count:', normalizedSearches.length);
                console.log('[useSearchesWithFilters] Normalized pagination:', normalizedPagination);
                
                // ✅ Construir respuesta normalizada
                if (isAdmin) {
                    const response: AdminSearchListResponse = {
                        searches: normalizedSearches,
                        pagination: normalizedPagination,
                    };
                    return response;
                } else {
                    const normalizedStats = normalizeUserStats(rawResponse.Stats ?? rawResponse.stats);
                    const response: UserSearchListResponse = {
                        searches: normalizedSearches,
                        pagination: normalizedPagination,
                        stats: normalizedStats ?? {
                            activeSearches: 0,
                            inactiveSearches: 0,
                            searchesWithHire: 0,
                            searchesWithoutHire: 0,
                            unreadMessages: 0,
                            pendingAppointments: 0,
                        },
                    };
                    return response;
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