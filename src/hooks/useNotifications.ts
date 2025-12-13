import { useQuery } from '@tanstack/react-query';
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

    // Query para obtener la lista de notificaciones (sin polling automático, se invalida manualmente)
    const notificationsQuery = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await fetchApi<any>(API_CONFIG.endpoints.notifications.list);
            
            // Manejar diferentes formatos de respuesta del endpoint
            // 1. Si es un array directamente, devolverlo
            if (Array.isArray(response)) {
                return response as Notification[];
            }
            
            // 2. Si viene en formato { notifications: [...], pagination: {...} }
            if (response?.notifications && Array.isArray(response.notifications)) {
                return response.notifications as Notification[];
            }
            
            // 3. Si viene en formato { data: [...] }
            if (response?.data && Array.isArray(response.data)) {
                return response.data as Notification[];
            }
            
            // 4. Si viene en formato { success: true, data: [...] }
            if (response?.success && Array.isArray(response.data)) {
                return response.data as Notification[];
            }
            
            // 5. Fallback: devolver array vacío si no se puede parsear
            console.warn('[useNotifications] Unexpected response format:', response);
            return [] as Notification[];
        },
        enabled: isAuthenticated, // Solo ejecutar si el usuario está autenticado
        retry: false, // No reintentar si falla (evita spam de requests)
    });

    // Asegurar que siempre sea un array
    const notifications = Array.isArray(notificationsQuery.data) 
        ? notificationsQuery.data 
        : [];
    
    // Usar el contador del endpoint dedicado, fallback al cálculo local si falla la query
    const unreadCount = unreadCountQuery.data ?? notifications.filter(n => !n.read).length;

    return {
        notifications,
        isLoading: notificationsQuery.isLoading,
        error: notificationsQuery.error,
        unreadCount,
        refetchUnreadCount: unreadCountQuery.refetch,
        refetchNotifications: notificationsQuery.refetch,
    };
};
