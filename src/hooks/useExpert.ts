import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

interface ExpertProfile {
    id: number;
    userId: number;
    profilePictureUrl: string;
    description: string;
    stripeAccountId: string;
    createdAt: string;
}

interface ExpertService {
    id: number;
    categoryId: number;
    price: number;
    conditions: string;
    durationInHours: number;
    createdAt: string;
    imageUrls: string[];
}

interface CreateServiceData {
    expertProfileId: number;
    categoryId: number;
    price: number;
    conditions: string;
    durationInHours: number;
    images?: File[];
}

export const useExpert = () => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();

    // Profile Query
    const profileQuery = useQuery({
        queryKey: ['expertProfile'],
        queryFn: () => fetchApi<ExpertProfile>(API_CONFIG.endpoints.expert.profile),
    });

    // Services Query
    const servicesQuery = useQuery({
        queryKey: ['expertServices'],
        queryFn: () => fetchApi<ExpertService[]>(API_CONFIG.endpoints.expert.services.list),
    });

    // Create Service Mutation
    const createServiceMutation = useMutation({
        mutationFn: async (data: CreateServiceData) => {
            console.log('Creating service with data:', data);

            const formData = new FormData();
            formData.append('ExpertProfileId', data.expertProfileId.toString());
            formData.append('CategoryId', data.categoryId.toString());
            formData.append('Price', data.price.toString());
            formData.append('Conditions', data.conditions);
            formData.append('DurationInHours', data.durationInHours.toString());

            if (data.images) {
                data.images.forEach(image => {
                    formData.append('Images', image);
                });
            }

            // Log FormData contents for debugging
            for (const [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            try {
                const response = await fetch('/api/SearchService', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to create service');
                }

                const result = await response.json();
                console.log('Service created successfully:', result);
                return result;
            } catch (error) {
                console.error('Error in API call:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expertServices'] });
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✨ Servicio creado exitosamente'
                }
            }));
        },
        onError: (error) => {
            console.error('Error creating service:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al crear el servicio: ' + (error instanceof Error ? error.message : 'Error desconocido')
                }
            }));
        }
    });

    return {
        // Profile data
        profile: profileQuery.data,
        isLoadingProfile: profileQuery.isLoading,
        profileError: profileQuery.error,

        // Services data
        services: servicesQuery.data || [],
        isLoadingServices: servicesQuery.isLoading,
        servicesError: servicesQuery.error,

        // Mutations
        createService: createServiceMutation.mutate,
        isCreatingService: createServiceMutation.isPending,
    };
};