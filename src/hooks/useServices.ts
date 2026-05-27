import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';

export interface Service {
    id: number;
    expertProfileId?: number;
    categoryId: number;
    serviceTypeId: number;
    serviceTypeName?: string;
    serviceTypeDescription?: string; // ✅ NUEVO: Descripción del tipo de servicio
    serviceTypeCategoryId?: number;
    serviceTypeCategoryName?: string;
    requiresAppointment?: boolean;
    price: number;
    conditions: string;
    durationInHours: number | null;
    createdAt: string;
    imageUrls: string[];
    images?: Array<{ id: number; url: string }>; // ✅ NUEVO: Imágenes con IDs reales
    categoryName?: string;
    completedSearches?: number;
    totalReviews?: number; // ✅ NUEVO: Total de reseñas del experto
    averageRating?: number;
    isActive?: boolean;
    selectedDeliverableTypes?: {
        id: number;
        name: string;
        displayName: string;
        description?: string;
        isRequired: boolean;
        isActive: boolean;
        sortOrder: number;
    }[];
    expert?: {
        id: number;
        profilePictureUrl: string;
        description: string;
        stripeAccountId?: string;
        createdAt: string;
        user: {
            name: string;
            email: string;
            profilePictureUrl?: string;
        };
        // ✅ NUEVO: Disponibilidad del experto
        currentAvailability?: {
            id: number;
            daysOfWeek: string[];
            startTime: string;
            endTime: string;
            effectiveFrom?: string;
        };
        reviews?: {
            id: number;
            score: number;
            description: string;
            createdAt: string;
            // ✅ Campos opcionales para compatibilidad con backend actual y futuro
            reviewer?: {
                id: number;
                name: string;
                email: string;
                profilePictureUrl?: string;
            };
            imageUrls?: string[];
        }[];
        // ✅ CAMPOS DE PAÍS, CIUDAD Y TIMEZONE
        timezone?: string | null;
        country?: string | null;
        city?: string | null; // ✅ NUEVO: Ciudad del experto
        // ✅ COORDENADAS DEL EXPERTO (para mostrar en el mapa)
        latitude?: string | number | null;
        longitude?: string | number | null;
        locationRange?: number | null;
    } | null;
    // ✅ COORDENADAS A NIVEL DE SERVICIO (alternativa)
    expertLatitude?: string | number | null;
    expertLongitude?: string | number | null;
}

interface UseServicesProps {
    categoryId?: number;
    serviceTypeId?: number;
    latitude?: string;
    longitude?: string;
    locationRange?: number;
    expertProfileId?: number;
    page?: number;
    pageSize?: number;
}

interface PaginatedResponse<T> {
    services?: T[];
    pagination?: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export function useServices({
    categoryId,
    serviceTypeId,
    latitude,
    longitude,
    locationRange,
    expertProfileId,
    page = 1,
    pageSize = 20,
}: UseServicesProps = {}) {
    const { signOut } = useAuth();
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [isCreatingService, setIsCreatingService] = useState(false);
    const [isDeletingService, setIsDeletingService] = useState(false);
    const [isUpdatingService, setIsUpdatingService] = useState(false);

    const servicesQuery = useQuery({
        queryKey: ['services', expertProfileId || categoryId, serviceTypeId, latitude, longitude, locationRange, page, pageSize],
        enabled: expertProfileId ? !!expertProfileId : ((categoryId ?? 0) > 0 && (serviceTypeId ?? 0) > 0 && !!latitude && !!longitude && (locationRange ?? 0) > 0),
        staleTime: 30000, // ✅ Cache por 30 segundos para evitar llamadas repetidas
        gcTime: 60000, // ✅ Mantener en caché por 60 segundos
        refetchOnWindowFocus: false, // ✅ No refetch al cambiar de ventana
        refetchOnMount: false, // ✅ No refetch al montar si hay datos en caché
        queryFn: async () => {
            const token = getAuthToken();
            
            // ✅ Si es para servicios de un experto específico, requiere autenticación
            // ✅ Si es para lista pública de servicios, NO requiere autenticación
            const requiresAuth = !!expertProfileId;
            
            if (requiresAuth && !token) {
                console.log('No token found for expert services, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            let url: string;
            if (expertProfileId) {
                // Construir URL con parámetros de paginación y filtros
                const params = new URLSearchParams();
                if (serviceTypeId && serviceTypeId > 0) {
                    params.append('serviceTypeId', serviceTypeId.toString());
                }
                params.append('page', page.toString());
                params.append('pageSize', pageSize.toString());
                
                url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.getByExpert(expertProfileId)}?${params.toString()}`;
            } else {
                if (!categoryId || categoryId <= 0 || !serviceTypeId || serviceTypeId <= 0 || !latitude || !longitude || !locationRange || locationRange <= 0) {
                    console.warn('Invalid parameters:', { categoryId, serviceTypeId, latitude, longitude, locationRange });
                    throw new Error('Invalid parameters: categoryId, serviceTypeId, latitude, longitude, and locationRange are required when not using expertProfileId');
                }

                // ✅ NUEVO: Usar el endpoint unificado map-experts para búsqueda por ubicación
                const params = new URLSearchParams({
                    categoryId: categoryId.toString(),
                    serviceTypeId: serviceTypeId.toString(),
                    latitude,
                    longitude,
                    locationRange: locationRange.toString(),
                });
                url = `${API_CONFIG.baseUrl}/api/SearchService/map-experts?${params.toString()}`;
            }

            console.log('Fetching services with URL:', url, 'Requires auth:', requiresAuth);

            const headers: Record<string, string> = {};
            if (requiresAuth && token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // ✅ Usar capacitorFetch para evitar CORS en Capacitor
            const { capacitorFetch } = await import('../utils/capacitorFetch');
            const response = await capacitorFetch(url, {
                headers,
            });

            if (!response.ok) {
                if (response.status === 401 && requiresAuth) {
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('Request failed with status 401');
                }
                let errorMessage = `Failed to fetch services: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('🔍 useServices: Fetched services:', data);
            console.log('🔍 useServices: Data type:', typeof data, 'Array?', Array.isArray(data));
            
            // Función para transformar PascalCase a camelCase
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
                    // ✅ NUEVO: Mapear campo Images con IDs reales (PascalCase o camelCase)
                    images: (service.Images || service.images || []).map((img: any) => ({
                        id: img.Id ?? img.id ?? 0,
                        url: img.Url ?? img.url ?? ''
                    })).filter((img: { id: number; url: string }) => img.id > 0), // Solo IDs válidos
                    categoryName: service.CategoryName || service.categoryName,
                    completedSearches: service.CompletedSearches ?? service.completedSearches,
                    totalReviews: (() => {
                        const total = service.TotalReviews ?? service.totalReviews ?? 0;
                        // Debug temporal
                        if (process.env.NODE_ENV === 'development' && total === 0) {
                            console.log('🔍 [useServices] totalReviews mapping:', {
                                serviceId: service.Id || service.id,
                                TotalReviews: service.TotalReviews,
                                totalReviews: service.totalReviews,
                                total,
                                serviceKeys: Object.keys(service).filter(k => k.toLowerCase().includes('review') || k.toLowerCase().includes('total'))
                            });
                        }
                        return total;
                    })(), // ✅ NUEVO: Total de reseñas
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
                        city: (service.Expert || service.expert).City || (service.Expert || service.expert).city || null, // ✅ NUEVO: Mapear City del backend
                        latitude: (service.Expert || service.expert).Latitude || (service.Expert || service.expert).latitude,
                        longitude: (service.Expert || service.expert).Longitude || (service.Expert || service.expert).longitude,
                        locationRange: (service.Expert || service.expert).LocationRange || (service.Expert || service.expert).locationRange,
                    } : null,
                    expertLatitude: service.ExpertLatitude || service.expertLatitude,
                    expertLongitude: service.ExpertLongitude || service.expertLongitude,
                };
            };
            
            // Manejar respuesta paginada (cuando se usa expertProfileId)
            let services: Service[] = [];
            if (expertProfileId) {
                // El endpoint ahora devuelve { services: [...], pagination: {...} }
                const paginatedResponse = data as PaginatedResponse<any>;
                if (paginatedResponse.services && Array.isArray(paginatedResponse.services)) {
                    services = paginatedResponse.services.map(transformService);
                    console.log('🔍 useServices: Paginated response - services count:', services.length);
                    console.log('🔍 useServices: Pagination info:', paginatedResponse.pagination);
                } else if (Array.isArray(data)) {
                    // Fallback: si viene como array directo (compatibilidad hacia atrás)
                    services = data.map(transformService);
                    console.log('🔍 useServices: Array response (fallback) - services count:', services.length);
                } else {
                    console.warn('⚠️ useServices: Unexpected response format for expert services:', data);
                    services = [];
                }
            } else {
                // ✅ NUEVA ESTRUCTURA: La API ahora devuelve { services: [...], pagination: {...} } para búsquedas por ubicación/bounds
                console.log('🔍 useServices: Procesando respuesta para búsqueda por ubicación:', {
                    dataType: typeof data,
                    isArray: Array.isArray(data),
                    hasServices: !!(data && typeof data === 'object' && !Array.isArray(data) && data.services),
                    data: data
                });
                
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    if (data.services && Array.isArray(data.services)) {
                        services = data.services.map(transformService);
                        console.log('✅ useServices: Nueva estructura con paginación - services count:', services.length);
                        console.log('🔍 useServices: Pagination info:', data.pagination);
                    } else {
                        console.warn('⚠️ useServices: Expected services array but got:', data);
                        services = [];
                    }
                } else if (Array.isArray(data)) {
                    // Fallback: Array directo (compatibilidad hacia atrás)
                    services = data.map(transformService);
                    console.log('🔍 useServices: Array response (fallback) - services count:', services.length);
                } else {
                    console.warn('⚠️ useServices: Unexpected response format:', typeof data, data);
                    services = [];
                }
            }
            
            // Filtrar solo servicios activos (tanto para panel de experto como para clientes)
            const filteredData = services.filter(service => {
                const isActive = service.isActive !== false;
                return isActive;
            });
            
            console.log('🔍 useServices: Filtered services count:', filteredData.length);
            
            return filteredData;
        },
        retry: 1,
    });

    const createServiceMutation = useMutation({
        mutationFn: async (serviceData: {
            expertProfileId: number;
            categoryId: number;
            serviceTypeId: number;
            price: number;
            conditions: string;
            durationInHours: number | null;
            images: File[];
            selectedDeliverableTypes?: number[];
        }) => {
            setIsCreatingService(true);
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            // ✅ CRÍTICO: Validar y convertir todos los valores a string de forma segura
            formData.append('ExpertProfileId', serviceData.expertProfileId != null ? String(serviceData.expertProfileId) : '0');
            formData.append('CategoryId', serviceData.categoryId != null ? String(serviceData.categoryId) : '0');
            formData.append('ServiceTypeId', serviceData.serviceTypeId != null ? String(serviceData.serviceTypeId) : '0');
            formData.append('Price', serviceData.price != null ? String(serviceData.price) : '0');
            formData.append('Conditions', serviceData.conditions != null ? String(serviceData.conditions) : '');
            if (serviceData.durationInHours !== null && serviceData.durationInHours !== undefined) {
                formData.append('DurationInHours', String(serviceData.durationInHours));
            }
            if (serviceData.selectedDeliverableTypes && serviceData.selectedDeliverableTypes.length > 0) {
                formData.append('SelectedDeliverableTypes', JSON.stringify(serviceData.selectedDeliverableTypes));
            }
            serviceData.images.forEach((image) => {
                formData.append('Images', image);
            });

            console.log('🔍 useServices: FormData contents (createService):');
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`🔍 FormData ${key} = ${value.name}, ${value.size} bytes, ${value.type}`);
                } else {
                    console.log(`🔍 FormData ${key} = ${value}`);
                }
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.create}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Crear un error personalizado con información adicional
                const error = new Error(errorData.message || `Failed to create service: ${response.statusText}`) as any;
                // Si es un error 400 con información de servicio existente (combinación categoría + tipo)
                const categoryName =
                    errorData.categoryName ||
                    errorData.CategoryName ||
                    errorData.parentCategoryName ||
                    errorData.ParentCategoryName ||
                    errorData.existingCategoryName ||
                    errorData.ExistingCategoryName;
                const serviceTypeName =
                    errorData.serviceTypeName ||
                    errorData.ServiceTypeName;
                const existingServiceId =
                    errorData.existingServiceId ??
                    errorData.ExistingServiceId;
                if (response.status === 400 && existingServiceId && categoryName && serviceTypeName) {
                    error.existingServiceId = existingServiceId;
                    error.categoryName = categoryName;
                    error.serviceTypeName = serviceTypeName;
                    error.isDuplicateComboError = true;
                }
                throw error;
            }

            return await response.json();
        },
        onSuccess: (data) => {
            console.log('🔍 useServices: createService success response:', data);
            
            // Actualizar el cache con la respuesta del servidor
            if (data && data.searchService) {
                const newService = data.searchService;
                console.log('🔍 useServices: New service with selectedDeliverableTypes:', newService.selectedDeliverableTypes);
                // NOTA: Esta es la estructura del endpoint de CREAR:
                // [{ id, deliverableTypeId, isSelected, deliverableType: { id, name, displayName, description } }]
                
                // Actualizar el cache de servicios agregando el nuevo servicio
                queryClient.setQueryData(['services', expertProfileId || categoryId, serviceTypeId], (oldData: any) => {
                    if (!oldData) return [newService];
                    return [...oldData, newService];
                });
            }
            
            // También invalidar para asegurar que se refresquen los datos
            queryClient.invalidateQueries({ queryKey: ['services', expertProfileId || categoryId, serviceTypeId] });
        },
        onError: (error) => {
            console.error('Error creating service:', error);
        },
        onSettled: () => {
            setIsCreatingService(false);
        },
    });

    const updateServiceMutation = useMutation({
        mutationFn: async (serviceData: {
            serviceId: number;
            categoryId: number;
            serviceTypeId: number;
            price: number;
            conditions: string;
            durationInHours: number | null;
            images?: File[];
            imagesToDelete?: number[]; // ✅ NUEVO: IDs de imágenes a eliminar
            selectedDeliverableTypes?: number[];
        }) => {
            setIsUpdatingService(true);
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            // ✅ CRÍTICO: Validar y convertir todos los valores a string de forma segura
            formData.append('ServiceId', serviceData.serviceId != null ? String(serviceData.serviceId) : '0');
            formData.append('CategoryId', serviceData.categoryId != null ? String(serviceData.categoryId) : '0');
            formData.append('ServiceTypeId', serviceData.serviceTypeId != null ? String(serviceData.serviceTypeId) : '0');
            formData.append('Price', serviceData.price != null ? String(serviceData.price) : '0');
            formData.append('Conditions', serviceData.conditions != null ? String(serviceData.conditions) : '');
            if (serviceData.durationInHours !== null && serviceData.durationInHours !== undefined) {
                formData.append('DurationInHours', String(serviceData.durationInHours));
            }
            if (serviceData.selectedDeliverableTypes && serviceData.selectedDeliverableTypes.length > 0) {
                formData.append('SelectedDeliverableTypes', JSON.stringify(serviceData.selectedDeliverableTypes));
            }
            
            // ✅ NUEVO: Agregar imágenes a eliminar (IDs) - DEBE SER STRING JSON
            if (serviceData.imagesToDelete && serviceData.imagesToDelete.length > 0) {
                const imagesToDeleteJson = JSON.stringify(serviceData.imagesToDelete);
                formData.append('ImagesToDelete', imagesToDeleteJson);
                console.log('🔍 useServices: Adding ImagesToDelete (array):', serviceData.imagesToDelete);
                console.log('🔍 useServices: Adding ImagesToDelete (JSON string):', imagesToDeleteJson);
                console.log('🔍 useServices: ImagesToDelete type:', typeof imagesToDeleteJson);
            } else {
                console.log('🔍 useServices: No ImagesToDelete to send (array is empty or undefined)');
            }
            
            // ✅ NUEVO: Agregar nuevas imágenes a agregar
            if (serviceData.images && serviceData.images.length > 0) {
                serviceData.images.forEach((image) => {
                    formData.append('Images', image);
                });
                console.log('🔍 useServices: Adding new Images:', serviceData.images.length);
            }

            console.log('🔍 useServices: FormData contents (updateService):');
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`🔍 FormData ${key} = [File] ${value.name}, ${value.size} bytes, ${value.type}`);
                } else {
                    console.log(`🔍 FormData ${key} = ${value} (type: ${typeof value})`);
                }
            }
            
            // ✅ DEBUG ESPECÍFICO: Verificar ImagesToDelete en FormData
            const imagesToDeleteValue = formData.get('ImagesToDelete');
            if (imagesToDeleteValue) {
                console.log('✅ ImagesToDelete encontrado en FormData:', imagesToDeleteValue);
                console.log('✅ Tipo de ImagesToDelete:', typeof imagesToDeleteValue);
                console.log('✅ Es string JSON válido:', typeof imagesToDeleteValue === 'string');
            } else {
                console.log('⚠️ ImagesToDelete NO encontrado en FormData');
            }

            // Create AbortController for timeout - increased for large files
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for large uploads

            // Retry logic for connection resets
            let lastError;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.create}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        body: formData,
                        signal: controller.signal,
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        let errorMessage = `Failed to update service: ${response.status} ${response.statusText}`;
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.message || errorMessage;
                        } catch (e) {
                            console.error('Could not parse error response as JSON:', e);
                        }
                        throw new Error(errorMessage);
                    }

                    return await response.json();
                } catch (error) {
                    clearTimeout(timeoutId);
                    lastError = error;
                    
                    if (error instanceof Error && error.name === 'AbortError') {
                        throw new Error('Request timeout after 5 minutes - try reducing image sizes or check connection');
                    }
                    
                    // Retry on connection reset or network errors
                    if (attempt < 2 && (
                        error instanceof TypeError && error.message.includes('Failed to fetch')
                    )) {
                        console.log(`Connection failed, retrying... (attempt ${attempt + 1}/3)`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                        continue;
                    }
                    
                    throw error;
                }
            }
            
            throw lastError;
        },
        onSuccess: (data) => {
            console.log('🔍 useServices: updateService success response:', data);
            
            // Actualizar el cache con la respuesta del servidor
            if (data && data.searchService) {
                const updatedService = data.searchService;
                console.log('🔍 useServices: Updated service with selectedDeliverableTypes:', updatedService.selectedDeliverableTypes);
                // NOTA: Esta es la estructura del endpoint de ACTUALIZAR:
                // [{ id, deliverableTypeId, isSelected, deliverableType: { id, name, displayName, description } }]
                
                // Actualizar el cache de servicios
                queryClient.setQueryData(['services', expertProfileId || categoryId, serviceTypeId], (oldData: any) => {
                    if (!oldData) return oldData;
                    
                    return oldData.map((service: any) => 
                        service.id === updatedService.id 
                            ? { ...service, selectedDeliverableTypes: updatedService.selectedDeliverableTypes }
                            : service
                    );
                });
            }
            
            // También invalidar para asegurar que se refresquen los datos
            queryClient.invalidateQueries({ queryKey: ['services', expertProfileId || categoryId, serviceTypeId] });
        },
        onError: (error) => {
            console.error('Error updating service:', error);
        },
        onSettled: () => {
            setIsUpdatingService(false);
        },
    });

    const deleteServiceMutation = useMutation({
        mutationFn: async (serviceId: number) => {
            setIsDeletingService(true);
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}/api/SearchService/${serviceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('No tienes permisos para eliminar este servicio');
                }
                if (response.status === 404) {
                    throw new Error('Servicio no encontrado');
                }
                let errorMessage = `Error al eliminar servicio: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }

            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services', expertProfileId || categoryId, serviceTypeId] });
        },
        onError: (error) => {
            console.error('Error deleting service:', error);
        },
        onSettled: () => {
            setIsDeletingService(false);
        },
    });

    // Export the hook directly - can't call useQuery conditionally
    const useServiceByHireId = (hireId: number | null | undefined) => {
        console.log('[useServices] useServiceByHireId called with hireId:', hireId);
        console.log('[useServices] Query will be enabled?', !!hireId && hireId > 0);
        
        return useQuery({
            queryKey: ['service', 'byHireId', hireId],
            queryFn: async () => {
                const url = API_CONFIG.endpoints.expert.services.getByHireId(hireId!);
                console.log('[useServices] Executing query function with URL:', url);
                const service = await fetchApi<Service>(url);
                
                // Si el servicio no tiene la información completa del ServiceType, la obtenemos por separado
                if (service && service.serviceTypeId && (!service.serviceTypeCategoryId || service.requiresAppointment === undefined)) {
                    try {
                        const serviceTypeUrl = `${API_CONFIG.baseUrl}/api/ServiceType/${service.serviceTypeId}`;
                        console.log('[useServices] Fetching ServiceType details from:', serviceTypeUrl);
                        const serviceTypeResponse = await fetch(serviceTypeUrl);
                        if (serviceTypeResponse.ok) {
                            const serviceTypeData = await serviceTypeResponse.json();
                            if (serviceTypeData.success && serviceTypeData.data) {
                                // Enriquecer el servicio con la información del ServiceType
                                service.serviceTypeCategoryId = serviceTypeData.data.serviceTypeCategoryId;
                                service.serviceTypeCategoryName = serviceTypeData.data.serviceTypeCategoryName;
                                service.requiresAppointment = serviceTypeData.data.requiresAppointment;
                                console.log('[useServices] Service enriched with ServiceType data:', {
                                    serviceTypeCategoryId: service.serviceTypeCategoryId,
                                    serviceTypeCategoryName: service.serviceTypeCategoryName,
                                    requiresAppointment: service.requiresAppointment
                                });
                            }
                        }
                    } catch (error) {
                        console.error('[useServices] Error fetching ServiceType details:', error);
                    }
                }
                
                return service;
            },
            enabled: !!hireId && hireId > 0,
        });
    };

    return {
        services: servicesQuery.data || [],
        isLoading: servicesQuery.isLoading,
        error: servicesQuery.error,
        createService: createServiceMutation.mutateAsync,
        isCreatingService,
        updateService: updateServiceMutation.mutateAsync,
        isUpdatingService,
        deleteService: deleteServiceMutation.mutateAsync,
        isDeletingService,
        useServiceByHireId,
    };
}