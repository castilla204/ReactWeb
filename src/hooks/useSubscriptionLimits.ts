
import { useSubscription } from './useSubscription.hooks';
import { useSearch } from './useSearch.hooks';

export const useSubscriptionLimits = () => {
    const { currentPlan } = useSubscription();
    const { searches } = useSearch();

    const activeSearchesCount = searches.data?.filter(s => s.isActive).length ?? 0;
    const maxSearchesReached = currentPlan.data ? activeSearchesCount >= currentPlan.data.maxSearches : false;
    const minSearchInterval = currentPlan.data?.minSearchInterval ?? 6;
    const maxSearches = currentPlan.data?.maxSearches ?? 1;

    return {
        maxSearches,
        minSearchInterval,
        currentSearchCount: activeSearchesCount,
        maxSearchesReached,
        isLoading: currentPlan.isLoading || searches.isLoading,
    };
};