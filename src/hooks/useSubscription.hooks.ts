import { useMutation } from '@tanstack/react-query';
import { useApi } from './useApi';

interface LoadMoneyResponse {
    url: string;
}

interface ForceFinalizeRequest {
    searchId: number;
    favorExpert: boolean;
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

    const forceFinalizeMutation = useMutation({
        mutationFn: (data: ForceFinalizeRequest) =>
            fetchApi('/api/Subscription/force-finalize', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
        onSuccess: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Búsqueda finalizada exitosamente'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al finalizar la búsqueda'
                }
            }));
        }
    });

    return {
        loadMoney: loadMoneyMutation.mutateAsync,
        forceFinalize: forceFinalizeMutation.mutateAsync,
        isLoading: loadMoneyMutation.isPending || forceFinalizeMutation.isPending
    };
};