import { useMutation } from '@tanstack/react-query';
import { useApi } from './useApi';

interface LoadMoneyResponse {
    url: string;
}

interface ForceFinalizeRequest {
    SearchHireId: number;
    ResolveInFavorOfClient: boolean;
}

interface CompleteServiceRequest {
    SearchHireId: number;
    ClientApproved: boolean;
}

interface DisputeServiceRequest {
    SearchHireId: number;
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

    const completeServiceMutation = useMutation({
        mutationFn: (data: CompleteServiceRequest) =>
            fetchApi('/api/Subscription/complete-service', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
        onSuccess: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Servicio completado exitosamente'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al completar el servicio'
                }
            }));
        }
    });

    const disputeServiceMutation = useMutation({
        mutationFn: (data: DisputeServiceRequest) =>
            fetchApi('/api/Subscription/dispute-service', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
        onSuccess: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Disputa iniciada exitosamente'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al iniciar la disputa'
                }
            }));
        }
    });

    return {
        loadMoney: loadMoneyMutation.mutateAsync,
        forceFinalize: forceFinalizeMutation.mutateAsync,
        completeService: completeServiceMutation.mutateAsync,
        disputeService: disputeServiceMutation.mutateAsync,
        isLoading: loadMoneyMutation.isPending || forceFinalizeMutation.isPending || completeServiceMutation.isPending || disputeServiceMutation.isPending
    };
};