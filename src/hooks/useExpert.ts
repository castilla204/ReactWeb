import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../contexts/AuthContext';

interface ExpertProfile {
    id: number;
    profilePictureUrl: string;
    description: string;
    createdAt: string;
    stripeAccountId: string | null;
}

interface Service {
    id: number;
    categoryId: number;
    serviceTypeId: number;
    serviceTypeName: string;
    price: number;
    conditions: string;
    durationInHours: number;
    createdAt: string;
    imageUrls: string[];
}

interface ServiceType {
    id: number;
    name: string;
}

interface CreateServicePayload {
    expertProfileId: number;
    categoryId: number;
    serviceTypeId: number;
    price: number;
    conditions: string;
    durationInHours: number;
    images: File[];
}

export function useExpert() {
    const { fetchApi } = useApi();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const profileQuery = useQuery({
        queryKey: ['expertProfile'],
        queryFn: async () => {
            const response = await fetchApi<ExpertProfile>('/api/ExpertProfile/me');
            console.log('Fetched expert profile:', response);
            return response;
        },
        enabled: !!user && user.role === 'Expert',
    });

    const servicesQuery = useQuery({
        queryKey: ['expertServices'],
        queryFn: async () => {
            if (!profileQuery.data?.id) {
                throw new Error('Expert profile not found');
            }
            const response = await fetchApi<Service[]>(`/api/SearchService/expert/${profileQuery.data.id}`);
            console.log('Fetched expert services:', response);
            return response;
        },
        enabled: !!profileQuery.data?.id,
    });

    const serviceTypesQuery = useQuery({
        queryKey: ['serviceTypes'],
        queryFn: async () => {
            const response = await fetchApi<ServiceType[]>('/api/ServiceType');
            console.log('Fetched service types:', response);
            return response;
        },
    });

    const createServiceMutation = useMutation({
        mutationFn: async (payload: CreateServicePayload) => {
            const formData = new FormData();
            formData.append('ExpertProfileId', payload.expertProfileId.toString());
            formData.append('CategoryId', payload.categoryId.toString());
            formData.append('ServiceTypeId', payload.serviceTypeId.toString());
            formData.append('Price', payload.price.toString());
            formData.append('Conditions', payload.conditions);
            formData.append('DurationInHours', payload.durationInHours.toString());
            payload.images.forEach((image) => formData.append('Images', image));

            console.log('Creating service with payload:', {
                expertProfileId: payload.expertProfileId,
                categoryId: payload.categoryId,
                serviceTypeId: payload.serviceTypeId,
                price: payload.price,
                conditions: payload.conditions,
                durationInHours: payload.durationInHours,
                imageCount: payload.images.length,
            });

            const response = await fetchApi<any>('/api/SearchService', {
                method: 'POST',
                body: formData,
            });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expertServices'] });
        },
    });

    const startOnboardingMutation = useMutation({
        mutationFn: async () => {
            const response = await fetchApi<any>('/api/Stripe/onboarding');
            return response;
        },
        onSuccess: (data) => {
            if (data.url) {
                window.location.href = data.url;
            }
        },
    });

    return {
        profile: profileQuery.data,
        isLoadingProfile: profileQuery.isLoading,
        profileError: profileQuery.error,
        services: servicesQuery.data || [],
        isLoadingServices: servicesQuery.isLoading,
        serviceTypes: serviceTypesQuery.data || [],
        isLoadingServiceTypes: serviceTypesQuery.isLoading,
        createService: createServiceMutation.mutateAsync,
        isCreatingService: createServiceMutation.isPending,
        startOnboarding: startOnboardingMutation.mutateAsync,
        isStartingOnboarding: startOnboardingMutation.isPending,
        fetchProfile: profileQuery.refetch,
    };
}