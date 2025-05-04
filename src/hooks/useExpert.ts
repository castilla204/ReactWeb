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
        mutationFn: (data: CreateServiceData) => {
            const formData = new FormData();
            formData.append('expertProfileId', data.expertProfileId.toString());
            formData.append('categoryId', data.categoryId.toString());
            formData.append('price', data.price.toString());
            formData.append('conditions', data.conditions);
            formData.append('durationInHours', data.durationInHours.toString());

            if (data.images) {
                data.images.forEach(image => {
                    formData.append('images', image);
                });
            }

            return fetchApi(API_CONFIG.endpoints.expert.services.create, {
                method: 'POST',
                body: formData,
                headers: {
                    // Remove Content-Type to let browser set it with boundary
                    'Content-Type': undefined,
                },
            });
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
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al crear el servicio'
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