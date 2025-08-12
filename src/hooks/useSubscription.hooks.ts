// useSubscription.hooks.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

interface LoadMoneyRequest {
    Amount: number; // Match backend's LoadMoneyDto property name
}

interface LoadMoneyResponse {
    url: string; // Expected response from /api/Subscription/load-money
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
    Reason: string;
}

interface ResolveDisputeRequest {
    SearchHireId: number;
    ResolveInFavorOfClient: boolean;
    Resolution: string;
}

interface DisputeDetailsResponse {
    SearchHireId: number;
    Reason: string;
    Resolution: string;
    Status: string;
    ResolvedInFavorOfClient: boolean | null;
    CreatedAt: string;
}

export const useSubscription = () => {
    const { fetchApi } = useApi();

    const loadMoneyMutation = useMutation<LoadMoneyResponse, Error, LoadMoneyRequest>({
        mutationFn: async (data: LoadMoneyRequest) => {
            console.log('Received data in loadMoneyMutation:', data); // Debug log
            // Validate amount before sending the request
            if (!data || typeof data.Amount !== 'number' || isNaN(data.Amount) || data.Amount <= 0 || data.Amount > 1000) {
                throw new Error('Amount must be a number between 0.01 and 1000');
            }
            console.log('Sending loadMoney payload:', data); // Debug log
            const response = await fetchApi('/api/Subscription/load-money', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return response as LoadMoneyResponse; // Return the response with the URL
        },
        onSuccess: (data) => {
            console.log('loadMoneyMutation success:', data); // Debug log
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Redirigiendo a la página de pago'
                }
            }));
        },
        onError: (error: any) => {
            const errorMessage = error.response?.errors
                ? `Validation errors: ${JSON.stringify(error.response.errors)}`
                : error.message || 'Unknown error';
            console.error('Load money error:', errorMessage); // Log detailed error
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: `❌ Error al cargar dinero: ${errorMessage}`
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
                    message: '✅ Servicio finalizado exitosamente'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al finalizar el servicio'
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

    const resolveDisputeMutation = useMutation({
        mutationFn: (data: ResolveDisputeRequest) =>
            fetchApi('/api/Subscription/resolve-dispute', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
        onSuccess: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Disputa resuelta exitosamente'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al resolver la disputa'
                }
            }));
        }
    });

    const getDisputeDetails = (searchHireId: number) => useQuery<DisputeDetailsResponse | null>({
        queryKey: ['disputeDetails', searchHireId],
        queryFn: async () => {
            const data: unknown = await fetchApi(`/api/Dispute/details/${searchHireId}`, {
                method: 'GET'
            });
            console.log('getDisputeDetails Response:', { searchHireId, data });

            // Handle null or non-object responses
            if (!data || typeof data !== 'object') {
                console.warn('No dispute details found for searchHireId:', searchHireId);
                return null;
            }

            // Log all available fields for debugging
            const availableFields = Object.keys(data);
            console.log('Available fields in response:', { searchHireId, availableFields });

            // Check for missing fields
            const requiredFields: (keyof DisputeDetailsResponse)[] = [
                'SearchHireId',
                'Reason',
                'Resolution',
                'Status',
                'ResolvedInFavorOfClient',
                'CreatedAt'
            ];
            const missingFields = requiredFields.filter(field => !(field in data || field.toLowerCase() in data));
            if (missingFields.length > 0) {
                console.warn('Missing or mismatched fields in dispute details response:', {
                    missingFields,
                    data
                });
            }

            // Critical validation: SearchHireId must exist
            if (!('SearchHireId' in data || 'searchHireId' in data)) {
                console.error('Invalid dispute details response: SearchHireId missing', data);
                throw new Error('Invalid dispute details response: SearchHireId missing');
            }

            // Transform response to match DisputeDetailsResponse
            const transformedData: DisputeDetailsResponse = {
                SearchHireId: (data as any).SearchHireId ?? (data as any).searchHireId ?? 0,
                Reason: (data as any).Reason ?? (data as any).reason ?? '',
                Resolution: (data as any).Resolution ?? (data as any).resolution ?? '',
                Status: (data as any).Status ?? (data as any).status ?? '',
                ResolvedInFavorOfClient: (data as any).ResolvedInFavorOfClient ?? (data as any).resolvedInFavorOfClient ?? null,
                CreatedAt: (data as any).CreatedAt ?? (data as any).createdAt ?? ''
            };

            console.log('Transformed dispute details:', { searchHireId, transformedData });

            return transformedData;
        },
        enabled: !!searchHireId,
        retry: false,
        staleTime: 0
    });

    return {
        loadMoney: loadMoneyMutation.mutateAsync,
        forceFinalize: forceFinalizeMutation.mutateAsync,
        completeService: completeServiceMutation.mutateAsync,
        disputeService: disputeServiceMutation.mutateAsync,
        resolveDispute: resolveDisputeMutation.mutateAsync,
        getDisputeDetails,
        isLoading:
            loadMoneyMutation.isPending ||
            forceFinalizeMutation.isPending ||
            completeServiceMutation.isPending ||
            disputeServiceMutation.isPending ||
            resolveDisputeMutation.isPending
    };
};