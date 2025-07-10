import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

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
    categoryName: string;
    completedSearches: number;
    averageRating: number;
    expert: {
        id: number;
        profilePictureUrl: string;
        description: string;
        createdAt: string;
        user: {
            name: string;
            email: string;
        };
    } | null;
}

export function useServices(categoryId: number, serviceTypeId: number) {
    const { fetchApi } = useApi();

    const servicesQuery = useQuery({
        queryKey: ['services', categoryId, serviceTypeId],
        queryFn: async () => {
            console.log('useServices called with:', { categoryId, serviceTypeId });
            if (categoryId <= 0) {
                console.warn('Invalid categoryId:', categoryId);
                throw new Error('Categoría no válida');
            }
            if (serviceTypeId <= 0) {
                console.warn('Invalid serviceTypeId:', serviceTypeId);
                throw new Error('Tipo de servicio no válido');
            }
            const url = `/api/SearchService?categoryId=${categoryId}&serviceTypeId=${serviceTypeId}`;
            console.log('Fetching services with URL:', url);
            const response = await fetchApi<Service[]>(url);
            console.log('Fetched services:', response);
            if (!response || response.length === 0) {
                console.warn('No services returned for:', { categoryId, serviceTypeId });
            }
            return response;
        },
        enabled: categoryId > 0 && serviceTypeId > 0,
    });

    return {
        services: servicesQuery.data || [],
        isLoading: servicesQuery.isLoading,
        error: servicesQuery.error,
    };
}