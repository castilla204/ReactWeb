import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

interface SubscriptionLimits {
    maxSearches: number;
    minSearchInterval: number;
}

export const useSubscriptionLimits = () => {
    const { fetchApi } = useApi();

    const limitsQuery = useQuery({
        queryKey: ['subscriptionLimits'],
        queryFn: () => fetchApi<SubscriptionLimits>('/api/Subscription/limits'),
    });

    return {
        maxSearches: limitsQuery.data?.maxSearches ?? 1,
        minSearchInterval: limitsQuery.data?.minSearchInterval ?? 6,
        currentSearchCount: 0,
        maxSearchesReached: false,
        isLoading: limitsQuery.isLoading,
    };
};