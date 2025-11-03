import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { SystemStatusDto } from '../types/searchDetails';

export const useSearchHireStatuses = () => {
    const { fetchApi } = useApi();
    
    return useQuery({
        queryKey: ['search-hire-statuses'],
        queryFn: async () => {
            const response = await fetchApi<SystemStatusDto[]>(
                API_CONFIG.endpoints.systemStatus.statusesByType('SearchHireStatus')
            );
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000, // 10 minutos
    });
};

