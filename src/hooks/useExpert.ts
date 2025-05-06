// src/hooks/useExpert.ts

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

interface ExpertSearch {
    id: number;
    title: string;
    description: string;
    frequency: number;
    isActive: boolean;
    lastExecution: string;
    nextExecution: string;
    createdAt: string;
    client: {
        name: string;
        email: string;
    };
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
        enabled: !!profileQuery.data?.id,
    });

    // Expert's Searches Query
    const searchesQuery = useQuery({
        queryKey: ['expertSearches'],
        queryFn: () => fetchApi<ExpertSearch[]>('/api/Search/expert'),
        enabled: !!profileQuery.data?.id,
    });

    // Create Service Mutation
    const createServiceMutation = useMutation({
        mutationFn: async (data: CreateServiceData) => {
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

            return await fetchApi('/api/SearchService', {
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

        // Searches data
        searches: searchesQuery.data || [],
        isLoadingSearches: searchesQuery.isLoading,
        searchesError: searchesQuery.error,

        // Mutations
        createService: createServiceMutation.mutate,
        isCreatingService: createServiceMutation.isPending,
    };
};
