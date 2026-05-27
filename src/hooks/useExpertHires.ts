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
    // ✅ NUEVO: statusInfo del backend
    statusInfo?: {
        id: number;
        statusType: string;
        statusName: string;
        statusValue: string;
        displayName: string;
        description: string | null;
        color: string | null;
        isActive: boolean;
        isFinalizationStatus: boolean;
        sortOrder: number;
        createdAt: string;
        updatedAt: string;
    };
}

export const useExpertHires = (
    page: number = 1,
    pageSize: number = 20,
    options?: { enabled?: boolean }
) => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const enabled = options?.enabled ?? true;

    const hiresQuery = useQuery({
        queryKey: ['expertHires', page, pageSize],
        enabled,
        queryFn: async () => {
            const rawResponse = await fetchApi<any>(`${API_CONFIG.endpoints.expert.hires.listAsExpert}?page=${page}&pageSize=${pageSize}`);
            
            console.log('[useExpertHires] Raw response keys:', Object.keys(rawResponse));
            
            // ✅ Normalizar respuesta de PascalCase a camelCase
            const normalizeUser = (user: any) => {
                if (!user) return null;
                return {
                    name: user.Name ?? user.name ?? '',
                    email: user.Email ?? user.email ?? '',
                };
            };
            
            const normalizeStatusInfo = (statusInfo: any) => {
                if (!statusInfo) return undefined;
                return {
                    id: statusInfo.Id ?? statusInfo.id,
                    statusType: statusInfo.StatusType ?? statusInfo.statusType ?? '',
                    statusName: statusInfo.StatusName ?? statusInfo.statusName ?? '',
                    statusValue: statusInfo.StatusValue ?? statusInfo.statusValue ?? '',
                    displayName: statusInfo.DisplayName ?? statusInfo.displayName ?? '',
                    description: statusInfo.Description ?? statusInfo.description ?? null,
                    color: statusInfo.Color ?? statusInfo.color ?? null,
                    isActive: statusInfo.IsActive ?? statusInfo.isActive ?? true,
                    isFinalizationStatus: statusInfo.IsFinalizationStatus ?? statusInfo.isFinalizationStatus ?? false,
                    sortOrder: statusInfo.SortOrder ?? statusInfo.sortOrder ?? 0,
                    createdAt: statusInfo.CreatedAt ?? statusInfo.createdAt ?? '',
                    updatedAt: statusInfo.UpdatedAt ?? statusInfo.updatedAt ?? '',
                };
            };
            
            const normalizeService = (service: any) => {
                if (!service) return null;
                return {
                    id: service.Id ?? service.id,
                    categoryId: service.CategoryId ?? service.categoryId,
                    price: service.Price ?? service.price ?? 0,
                    conditions: service.Conditions ?? service.conditions ?? '',
                    durationInHours: service.DurationInHours ?? service.durationInHours ?? 0,
                    imageUrls: service.ImageUrls ?? service.imageUrls ?? [],
                };
            };
            
            const normalizeServiceType = (serviceType: any) => {
                if (!serviceType) return null;
                return {
                    id: serviceType.Id ?? serviceType.id,
                    name: serviceType.Name ?? serviceType.name ?? '',
                    description: serviceType.Description ?? serviceType.description ?? '',
                    isActive: serviceType.IsActive ?? serviceType.isActive ?? true,
                    createdAt: serviceType.CreatedAt ?? serviceType.createdAt ?? '',
                    updatedAt: serviceType.UpdatedAt ?? serviceType.updatedAt ?? '',
                };
            };
            
            const normalizeHire = (hire: any): ExpertHire => {
                return {
                    id: hire.Id ?? hire.id,
                    clientId: hire.ClientId ?? hire.clientId,
                    expertId: hire.ExpertId ?? hire.expertId ?? null,
                    searchServiceId: hire.SearchServiceId ?? hire.searchServiceId,
                    searchId: hire.SearchId ?? hire.searchId ?? null,
                    status: (hire.Status ?? hire.status ?? 'pending') as ExpertHire['status'],
                    amount: hire.Amount ?? hire.amount ?? 0,
                    createdAt: hire.CreatedAt ?? hire.createdAt ?? '',
                    UpdatedAt: hire.UpdatedAt ?? hire.updatedAt ?? null,
                    searchTitle: hire.SearchTitle ?? hire.searchTitle ?? null,
                    searchDescription: hire.SearchDescription ?? hire.searchDescription ?? null,
                    unreadMessagesCount: hire.UnreadMessagesCount ?? hire.unreadMessagesCount ?? 0,
                    client: normalizeUser(hire.Client ?? hire.client) ?? {
                        name: '',
                        email: '',
                    },
                    service: normalizeService(hire.Service ?? hire.service) ?? {
                        id: 0,
                        categoryId: 0,
                        price: 0,
                        conditions: '',
                        durationInHours: 0,
                        imageUrls: [],
                    },
                    serviceType: normalizeServiceType(hire.ServiceType ?? hire.serviceType),
                    statusInfo: normalizeStatusInfo(hire.StatusInfo ?? hire.statusInfo),
                };
            };
            
            // Manejar respuesta paginada o no paginada
            let hiresArray: any[] = [];
            let paginationData: any = null;
            
            if (rawResponse.hires && rawResponse.pagination) {
                hiresArray = rawResponse.hires;
                paginationData = {
                    page: rawResponse.pagination.Page ?? rawResponse.pagination.page ?? 1,
                    pageSize: rawResponse.pagination.PageSize ?? rawResponse.pagination.pageSize ?? 20,
                    totalCount: rawResponse.pagination.TotalCount ?? rawResponse.pagination.totalCount ?? 0,
                    totalPages: rawResponse.pagination.TotalPages ?? rawResponse.pagination.totalPages ?? 0,
                    hasNextPage: rawResponse.pagination.HasNextPage ?? rawResponse.pagination.hasNextPage ?? false,
                    hasPreviousPage: rawResponse.pagination.HasPreviousPage ?? rawResponse.pagination.hasPreviousPage ?? false,
                };
            } else if (Array.isArray(rawResponse)) {
                hiresArray = rawResponse;
            }
            
            const normalizedHires = hiresArray.map(normalizeHire);
            
            console.log('[useExpertHires] Normalized hires count:', normalizedHires.length);
            
            return {
                hires: normalizedHires,
                pagination: paginationData
            };
        },
        staleTime: 30000,
        gcTime: 120000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
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
