import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

interface Plan {
    id: number;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    maxSearches: number;
    minSearchInterval: number;
    isActive: boolean;
}

export type { Plan };

interface SubscriptionDetails {
    isYearly: boolean;
    // Add other subscription details as needed
}

export const useSubscription = () => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();

    const plansQuery = useQuery({
        queryKey: ['subscription', 'plans'],
        queryFn: () => fetchApi<Plan[]>(API_CONFIG.endpoints.subscription.plans),
    });

    const currentPlanQuery = useQuery({
        queryKey: ['subscription', 'current'],
        queryFn: () => fetchApi<Plan>(API_CONFIG.endpoints.subscription.current),
    });

    const subscriptionDetailsQuery = useQuery({
        queryKey: ['subscription', 'details'],
        queryFn: () => fetchApi<SubscriptionDetails>(API_CONFIG.endpoints.subscription.details),
    });

    const createCheckoutMutation = useMutation({
        mutationFn: (data: { planId: number; isYearly: boolean }) =>
            fetchApi<{ url: string }>(API_CONFIG.endpoints.subscription.createCheckout, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
        },
    });

    return {
        plans: plansQuery,
        currentPlan: currentPlanQuery,
        subscriptionDetails: subscriptionDetailsQuery,
        createCheckout: createCheckoutMutation,
    };
};