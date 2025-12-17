import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    url?: string;
    imageUrl?: string;
    read: boolean;
    createdAt: string;
    readAt: string | null;
}

interface Pagination {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface NotificationsResponse {
    notifications: Notification[];
    pagination: Pagination;
}

export const useNotifications = () => {
    const { fetchApi } = useApi();
    const { isAuthenticated } = useAuth();

    // Query para obtener el conteo de notificaciones no leídas (Polling cada 30s)
    const unreadCountQuery = useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: async () => {
            const response = await fetchApi<any>(API_CONFIG.endpoints.notifications.unreadCount);
            return response?.unreadCount || 0;
        },
        enabled: isAuthenticated,
        refetchInterval: 30000, // Polling cada 30 segundos
        retry: false,
    });

    // Infinite Query para obtener la lista de notificaciones paginada
    const notificationsQuery = useInfiniteQuery({
        queryKey: ['notifications'],
        queryFn: async ({ pageParam = 1 }) => {
            const url = `${API_CONFIG.endpoints.notifications.list}?page=${pageParam}&pageSize=20`;
            const response = await fetchApi<any>(url);
            
            // Normalizar respuesta
            if (response?.notifications && Array.isArray(response.notifications)) {
                return response as NotificationsResponse;
            }
            
            // Fallback para estructura antigua o simple array (simulamos paginación)
            if (Array.isArray(response)) {
                return {
                    notifications: response as Notification[],
                    pagination: {
                        page: 1,
                        pageSize: response.length,
                        totalCount: response.length,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                };
            }
            
            if (response?.data && Array.isArray(response.data)) {
                 return {
                    notifications: response.data as Notification[],
                    pagination: {
                        page: 1,
                        pageSize: 20,
                        totalCount: response.total || response.data.length,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                };
            }

            console.warn('[useNotifications] Unexpected response format:', response);
            return {
                notifications: [],
                pagination: {
                    page: 1,
                    pageSize: 20,
                    totalCount: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        },
        getNextPageParam: (lastPage) => {
            return lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined;
        },
        initialPageParam: 1,
        enabled: isAuthenticated,
        retry: false,
    });

    // Aplanar las páginas en un solo array de notificaciones
    const notifications = notificationsQuery.data?.pages.flatMap(page => page.notifications) || [];
    
    // Usar el contador del endpoint dedicado, fallback al cálculo local si falla la query
    // Nota: El cálculo local solo considerará las notificaciones cargadas, por lo que el endpoint es vital.
    const unreadCount = unreadCountQuery.data ?? notifications.filter(n => !n.read).length;

    return {
        notifications,
        isLoading: notificationsQuery.isLoading,
        error: notificationsQuery.error,
        unreadCount,
        refetchUnreadCount: unreadCountQuery.refetch,
        refetchNotifications: notificationsQuery.refetch,
        fetchNextPage: notificationsQuery.fetchNextPage,
        hasNextPage: notificationsQuery.hasNextPage,
        isFetchingNextPage: notificationsQuery.isFetchingNextPage,
    };
};
