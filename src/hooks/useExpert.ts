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

interface OnboardingResponse {
    url: string;
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
        queryKey: ['expertServices', profileQuery.data?.id],
        queryFn: () => profileQuery.data?.id
            ? fetchApi<ExpertService[]>(API_CONFIG.endpoints.expert.services.getByExpert(profileQuery.data.id))
            : Promise.resolve([]),
        enabled: !!profileQuery.data?.id,
    });

    // Expert's Searches Query
    const searchesQuery = useQuery({
        queryKey: ['expertSearches'],
        queryFn: () => fetchApi<ExpertSearch[]>(API_CONFIG.endpoints.expert.hires.listAsExpert),
        enabled: !!profileQuery.data?.id,
    });

    // Create Service Mutation
    const createServiceMutation = useMutation({
        mutationFn: async (data: CreateServiceData) => {
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

            return await fetchApi('/api/SearchService', {
                method: 'POST',
                body: formData
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
        onError: (error: any) => {
            console.error('Error creating service:', error);
            const errorMessage = error.message || error.errors?.Conditions?.[0] || 'Error al crear el servicio';
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: `❌ ${errorMessage}`
                }
            }));
        }
    });

    // Onboarding Mutation
    const startOnboardingMutation = useMutation({
        mutationFn: () => fetchApi<OnboardingResponse>('/api/Subscription/expert-onboarding', {
            method: 'POST'
        }),
        onSuccess: (data) => {
            window.location.href = data.url;
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
        startOnboarding: startOnboardingMutation.mutate,
        isStartingOnboarding: startOnboardingMutation.isPending,
    };
};