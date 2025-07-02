// src/hooks/useExpertHires.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

interface ExpertHire {
    id: number;
    clientId: number;
    expertId: number | null;
    searchServiceId: number;
    searchId: number | null;
    status: string;
    amount: number;
    createdAt: string;
    completedAt: string | null;
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
}

export const useExpertHires = () => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();

    const hiresQuery = useQuery({
        queryKey: ['expertHires'],
        queryFn: () => fetchApi<ExpertHire[]>(API_CONFIG.endpoints.expert.hires.listAsExpert),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ hireId, status }: { hireId: number; status: string }) =>
            fetchApi(API_CONFIG.endpoints.expert.hires.updateStatus(hireId), {
                method: 'PUT',
                body: JSON.stringify({ status }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expertHires'] });
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✅ Estado actualizado correctamente'
                }
            }));
        },
    });

    return {
        hires: hiresQuery.data || [],
        isLoading: hiresQuery.isLoading,
        error: hiresQuery.error,
        updateStatus: updateStatusMutation.mutate,
        isUpdating: updateStatusMutation.isPending,
    };
};
