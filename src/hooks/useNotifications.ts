import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
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

    const notificationsQuery = useQuery({
        queryKey: ['notifications'],
        queryFn: () => fetchApi<Notification[]>(API_CONFIG.endpoints.notifications.list),
    });

    const unreadCount = notificationsQuery.data?.filter(n => !n.read).length ?? 0;

    return {
        notifications: notificationsQuery.data ?? [],
        isLoading: notificationsQuery.isLoading,
        error: notificationsQuery.error,
        unreadCount,
    };
};