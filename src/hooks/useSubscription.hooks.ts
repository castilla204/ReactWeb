import { useMutation } from '@tanstack/react-query';
import { useApi } from './useApi';

interface LoadMoneyResponse {
    url: string;
}

export const useSubscription = () => {
    const { fetchApi } = useApi();

    const loadMoneyMutation = useMutation({
        mutationFn: (amount: number) =>
            fetchApi<LoadMoneyResponse>('/api/Subscription/load-money', {
                method: 'POST',
                body: JSON.stringify({ amount })
            }),
        onSuccess: (data) => {
            window.location.href = data.url;
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al procesar el pago'
                }
            }));
        }
    });

    return {
        loadMoney: loadMoneyMutation.mutateAsync,
        isLoading: loadMoneyMutation.isPending
    };
};