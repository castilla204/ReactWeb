import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '../config/api';
import { DeliverableType } from '../types/deliverable';

export const useDeliverableTypes = () => {
    const {
        data: deliverableTypes = [],
        isLoading,
        error,
        refetch
    } = useQuery<DeliverableType[]>({
        queryKey: ['deliverableTypes'],
        queryFn: async () => {
            console.log('🔍 useDeliverableTypes: Starting fetch from:', `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.deliverableTypes.getAll}`);
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.deliverableTypes.getAll}`);
            console.log('🔍 useDeliverableTypes: Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                console.error('🔍 useDeliverableTypes: Response not ok:', response.status, response.statusText);
                throw new Error('Error fetching deliverable types');
            }
            const data = await response.json();
            console.log('🔍 useDeliverableTypes: Fetched data:', data);
            console.log('🔍 useDeliverableTypes: Data type:', typeof data, 'Array?', Array.isArray(data));
            if (Array.isArray(data)) {
                console.log('🔍 useDeliverableTypes: Data length:', data.length);
                data.forEach((item, index) => {
                    console.log(`🔍 useDeliverableTypes: Item ${index}:`, item);
                });
            }
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    console.log('🔍 useDeliverableTypes: Current state:', {
        deliverableTypes,
        isLoading,
        error,
        deliverableTypesLength: deliverableTypes.length
    });

    return {
        deliverableTypes,
        isLoading,
        error,
        refetch
    };
};
