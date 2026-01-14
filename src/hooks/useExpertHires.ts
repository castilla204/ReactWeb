import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

interface ExpertHire {
    id: number;
    clientId: number;
    expertId: number | null;
    searchServiceId: number;
    searchId: number | null;
    status:
    | 'pending'
    | 'awaiting_client_decision'
    | 'disputed'
    | 'completed'
    | 'cancelled'
    | 'transfer_failed'
    | 'dispute_resolved'
    | 'dispute_resolved_client'
    | 'dispute_resolved_expert';
    amount: number;
    createdAt: string;
    UpdatedAt: string | null;
    // NUEVOS CAMPOS DEL BACKEND
    searchTitle?: string | null;
    searchDescription?: string | null;
    unreadMessagesCount: number;
    client: {
        name: string;
        email: string;
    };
    service: {
        id: number;
        categoryId: number;
        price: number;
        conditions: string;
        durationInHours: number;
        imageUrls: string[];
    };
    serviceType: {
        id: number;
        name: string;
        description: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    } | null;
}

export const useExpertHires = (page: number = 1, pageSize: number = 20) => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();

    const hiresQuery = useQuery({
        queryKey: ['expertHires', page, pageSize],
        queryFn: async () => {
            const response = await fetchApi<any>(`${API_CONFIG.endpoints.expert.hires.listAsExpert}?page=${page}&pageSize=${pageSize}`);
            // Manejar respuesta paginada o no paginada
            if (response.hires && response.pagination) {
                return {
                    hires: response.hires as ExpertHire[],
                    pagination: response.pagination
                };
            } else if (Array.isArray(response)) {
                return {
                    hires: response as ExpertHire[],
                    pagination: null
                };
            } else {
                return {
                    hires: [] as ExpertHire[],
                    pagination: null
                };
            }
        },
        staleTime: 60000, // ✅ Cache por 60 segundos para evitar llamadas repetidas
        gcTime: 120000, // ✅ Mantener en caché por 2 minutos
        retry: 1, // ✅ Solo reintentar una vez
        refetchOnWindowFocus: false, // ✅ No refetch al cambiar de ventana
        refetchOnMount: false, // ✅ No refetch al montar si hay datos en caché
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ hireId, status }: { hireId: number; status: string }) =>
            fetchApi(API_CONFIG.endpoints.expert.hires.updateStatus(hireId), {
                method: 'PUT',
                body: JSON.stringify({ status }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expertHires'] });
            window.dispatchEvent(
                new CustomEvent('showNotification', {
                    detail: {
                        type: 'success',
                        message: '✅ Estado actualizado correctamente',
                    },
                })
            );
        },
    });

    return {
        hires: hiresQuery.data?.hires || [],
        pagination: hiresQuery.data?.pagination || null,
        isLoading: hiresQuery.isLoading,
        error: hiresQuery.error,
        updateStatus: updateStatusMutation.mutate,
        isUpdating: updateStatusMutation.isPending,
    };
};
