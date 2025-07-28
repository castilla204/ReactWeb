import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';

interface Service {
    id: number;
    expertProfileId?: number;
    categoryId: number;
    serviceTypeId: number;
    serviceTypeName?: string;
    price: number;
    conditions: string;
    durationInHours: number;
    createdAt: string;
    imageUrls: string[];
    categoryName?: string;
    completedSearches?: number;
    averageRating?: number;
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
    categoryId: number;
    serviceTypeId: number;
    latitude: string;
    longitude: string;
    locationRange: number;
}

export function useServices({ categoryId, serviceTypeId, latitude, longitude, locationRange }: UseServicesProps) {
    const { signOut } = useAuth();
    const queryClient = useQueryClient();
    const [isCreatingService, setIsCreatingService] = useState(false);

    const servicesQuery = useQuery({
        queryKey: ['services', categoryId, serviceTypeId, latitude, longitude, locationRange],
        queryFn: async () => {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            if (categoryId <= 0 || serviceTypeId <= 0) {
                console.warn('Invalid parameters:', { categoryId, serviceTypeId });
                throw new Error('Invalid parameters: categoryId and serviceTypeId must be greater than 0');
            }

            if (!latitude || !longitude || locationRange <= 0) {
                console.warn('Invalid location parameters:', { latitude, longitude, locationRange });
                throw new Error('Invalid parameters: latitude, longitude, and locationRange are required');
            }

            const params = new URLSearchParams({
                categoryId: categoryId.toString(),
                serviceTypeId: serviceTypeId.toString(),
                latitude,
                longitude,
                locationRange: locationRange.toString(),
            });
            const url = `/api/SearchService?${params.toString()}`;
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
            return data as Service[];
        },
        enabled: categoryId > 0 && serviceTypeId > 0 && !!latitude && !!longitude && locationRange > 0,
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
            durationInHours: number;
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
            formData.append('durationInHours', serviceData.durationInHours.toString());
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

            const response = await fetch('/api/SearchService', {
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
            queryClient.invalidateQueries({ queryKey: ['services', categoryId, serviceTypeId] });
        },
        onError: (error) => {
            console.error('Error creating service:', error);
        },
        onSettled: () => {
            setIsCreatingService(false);
        },
    });

    return {
        services: servicesQuery.data || [],
        isLoading: servicesQuery.isLoading,
        error: servicesQuery.error,
        createService: createServiceMutation.mutateAsync,
        isCreatingService,
    };
}