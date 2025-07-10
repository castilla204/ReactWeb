import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

interface ServiceType {
    id: number;
    name: string;
}

export function useServiceTypes() {
    const { fetchApi } = useApi();

    const serviceTypesQuery = useQuery({
        queryKey: ['serviceTypes'],
        queryFn: async () => {
            const response = await fetchApi<ServiceType[]>('/api/ServiceType');
            console.log('Fetched service types:', response);
            if (!response || response.length === 0) {
                console.warn('No service types returned');
            }
            return response;
        },
    });

    return {
        serviceTypes: serviceTypesQuery.data || [],
        isLoading: serviceTypesQuery.isLoading,
        error: serviceTypesQuery.error,
    };
}