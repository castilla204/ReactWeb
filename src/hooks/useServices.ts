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
    serviceTypeCategoryId?: number;
    serviceTypeCategoryName?: string;
    requiresAppointment?: boolean;
    price: number;
    conditions: string;
    durationInHours: number | null;
    createdAt: string;
    imageUrls: string[];
    categoryName?: string;
    completedSearches?: number;
    averageRating?: number;
    isActive?: boolean;
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
        reviews?: {
            id: number;
            score: number;
            description: string;
            createdAt: string;
        }[];
    } | null;
}

interface UseServicesProps {
    categoryId?: number;
    serviceTypeId?: number;
    latitude?: string;
    longitude?: string;
    locationRange?: number;
    expertProfileId?: number;
}

export function useServices({
    categoryId,
    serviceTypeId,
    latitude,
    longitude,
    locationRange,
    expertProfileId,
}: UseServicesProps = {}) {
    const { signOut } = useAuth();
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [isCreatingService, setIsCreatingService] = useState(false);
    const [isDeletingService, setIsDeletingService] = useState(false);
    const [isUpdatingService, setIsUpdatingService] = useState(false);

    const servicesQuery = useQuery({
        queryKey: ['services', expertProfileId || categoryId, serviceTypeId, latitude, longitude, locationRange],
        queryFn: async () => {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            let url: string;
            if (expertProfileId) {
                url = `/api/SearchService/expert/${expertProfileId}`;
                if (serviceTypeId && serviceTypeId > 0) {
                    url += `?serviceTypeId=${serviceTypeId}`;
                }
            } else {
                if (!categoryId || categoryId <= 0 || !serviceTypeId || serviceTypeId <= 0 || !latitude || !longitude || !locationRange || locationRange <= 0) {
                    console.warn('Invalid parameters:', { categoryId, serviceTypeId, latitude, longitude, locationRange });
                    throw new Error('Invalid parameters: categoryId, serviceTypeId, latitude, longitude, and locationRange are required when not using expertProfileId');
                }

                const params = new URLSearchParams({
                    categoryId: categoryId.toString(),
                    serviceTypeId: serviceTypeId.toString(),
                    latitude,
                    longitude,
                    locationRange: locationRange.toString(),
                });
                url = `/api/SearchService?${params.toString()}`;
            }

            console.log('Fetching services with URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
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
            console.log('Fetched services:', data);
            // Filtrar solo servicios activos para el panel de experto
            const filteredData = expertProfileId 
                ? (data as Service[]).filter(service => service.isActive !== false)
                : data as Service[];
            return filteredData;
        },
        enabled: expertProfileId ? !!expertProfileId : (categoryId > 0 && serviceTypeId > 0 && !!latitude && !!longitude && locationRange > 0),
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
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
        }) => {
            setIsCreatingService(true);
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            formData.append('expertProfileId', serviceData.expertProfileId.toString());
            formData.append('categoryId', serviceData.categoryId.toString());
            formData.append('serviceTypeId', serviceData.serviceTypeId.toString());
            formData.append('price', serviceData.price.toString());
            formData.append('conditions', serviceData.conditions);
            if (serviceData.durationInHours !== null) {
                formData.append('durationInHours', serviceData.durationInHours.toString());
            }
            serviceData.images.forEach((image) => {
                formData.append('Images', image);
            });

            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`FormData ${key} = ${value.name}, ${value.size} bytes, ${value.type}`);
                } else {
                    console.log(`FormData ${key} = ${value}`);
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
                throw new Error(errorData.message || `Failed to create service: ${response.statusText}`);
            }

            return await response.json();
        },
        onSuccess: () => {
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
        }) => {
            setIsUpdatingService(true);
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            formData.append('serviceId', serviceData.serviceId.toString());
            formData.append('categoryId', serviceData.categoryId.toString());
            formData.append('serviceTypeId', serviceData.serviceTypeId.toString());
            formData.append('price', serviceData.price.toString());
            formData.append('conditions', serviceData.conditions);
            if (serviceData.durationInHours !== null) {
                formData.append('durationInHours', serviceData.durationInHours.toString());
            }
            if (serviceData.images && serviceData.images.length > 0) {
                serviceData.images.forEach((image) => {
                    formData.append('Images', image);
                });
            }

            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`FormData ${key} = ${value.name}, ${value.size} bytes, ${value.type}`);
                } else {
                    console.log(`FormData ${key} = ${value}`);
                }
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
        onSuccess: () => {
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