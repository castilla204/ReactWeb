import { useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useApi } from './useApi';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import { getSupabaseClient } from '../lib/supabase';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    url?: string;
    imageUrl?: string;
    read: boolean;
    createdAt: string;
    readAt: string | null;
    /** Destinatario (null = broadcast / sistema). Útil en panel admin. */
    userId?: number | null;
}

interface Pagination {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface NotificationsResponse {
    notifications: Notification[];
    pagination: Pagination;
}

export const USER_NOTIFICATIONS_LIST_KEY = ['user-notifications'] as const;
export const NOTIFICATIONS_UNREAD_COUNT_KEY = ['notifications-unread-count'] as const;
export const ADMIN_NOTIFICATIONS_QUERY_KEY = 'admin-notifications';

/** Normaliza un ítem de notificación (API devuelve PascalCase en entidades EF). */
export function normalizeNotification(raw: Record<string, unknown>): Notification {
    const id = String(raw.id ?? raw.Id ?? '');
    const read = Boolean(raw.read ?? raw.Read ?? false);
    const createdAt = String(raw.createdAt ?? raw.CreatedAt ?? '');
    const readAtRaw = raw.readAt ?? raw.ReadAt;
    return {
        id,
        title: String(raw.title ?? raw.Title ?? ''),
        message: String(raw.message ?? raw.Message ?? ''),
        type: String(raw.type ?? raw.Type ?? 'info'),
        url: (raw.url ?? raw.Url) as string | undefined,
        imageUrl: (raw.imageUrl ?? raw.ImageUrl) as string | undefined,
        read,
        createdAt,
        readAt: readAtRaw != null ? String(readAtRaw) : null,
        userId:
            raw.userId != null || raw.UserId != null
                ? Number(raw.userId ?? raw.UserId)
                : null,
    };
}

function normalizePagination(raw: Record<string, unknown> | undefined, fallbackSize: number): Pagination {
    const p = raw ?? {};
    const page = Number(p.page ?? p.Page ?? 1);
    const pageSize = Number(p.pageSize ?? p.PageSize ?? fallbackSize);
    const totalCount = Number(p.totalCount ?? p.TotalCount ?? fallbackSize);
    const totalPages = Number(p.totalPages ?? p.TotalPages ?? 1);
    return {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: Boolean(p.hasNextPage ?? p.HasNextPage ?? false),
        hasPreviousPage: Boolean(p.hasPreviousPage ?? p.HasPreviousPage ?? false),
    };
}

/** Carga historial admin: intenta /admin y hace fallback a GET estándar si la API no lo expone aún. */
export async function fetchAdminNotificationsPage(
    fetchApi: <T>(endpoint: string, config?: object) => Promise<T>,
    page: number,
    pageSize: number
): Promise<NotificationsResponse> {
    const adminUrl = `${API_CONFIG.endpoints.notifications.adminList}?page=${page}&pageSize=${pageSize}`;
    const scopedUrl = `${API_CONFIG.endpoints.notifications.list}?page=${page}&pageSize=${pageSize}`;

    const getStatus = (err: unknown): number | undefined => {
        if (err && typeof err === 'object' && 'status' in err) {
            const s = (err as { status?: unknown }).status;
            return typeof s === 'number' ? s : undefined;
        }
        return undefined;
    };

    const shouldFallback = (err: unknown) => {
        const status = getStatus(err);
        if (status === 404 || status === 405) return true;
        const msg = String((err as { message?: string })?.message ?? '');
        return msg.includes('405') || msg.includes('404');
    };

    try {
        const response = await fetchApi<unknown>(adminUrl);
        return normalizeNotificationsPage(response);
    } catch (adminError) {
        if (!shouldFallback(adminError)) {
            console.error('[fetchAdminNotificationsPage] admin list failed:', adminError);
            throw adminError;
        }
        console.warn(
            '[fetchAdminNotificationsPage] GET /Notification/admin no disponible; usando listado con alcance de admin',
            adminError
        );
        const response = await fetchApi<unknown>(scopedUrl);
        return normalizeNotificationsPage(response);
    }
}

export function normalizeNotificationsPage(response: unknown): NotificationsResponse {
    if (!response || typeof response !== 'object') {
        return {
            notifications: [],
            pagination: normalizePagination(undefined, 20),
        };
    }

    const data = response as Record<string, unknown>;
    const rawList =
        data.notifications ??
        data.Notifications ??
        (Array.isArray(data.data) ? data.data : null) ??
        (Array.isArray(response) ? response : null);

    if (Array.isArray(rawList)) {
        const notifications = rawList.map((item) =>
            normalizeNotification(item as Record<string, unknown>)
        );
        return {
            notifications,
            pagination: normalizePagination(
                (data.pagination ?? data.Pagination) as Record<string, unknown> | undefined,
                notifications.length
            ),
        };
    }

    console.warn('[useNotifications] Unexpected response format:', response);
    return {
        notifications: [],
        pagination: normalizePagination(undefined, 20),
    };
}

function parseUnreadCount(response: unknown): number {
    if (response == null) return 0;
    if (typeof response === 'number') return response;
    const data = response as Record<string, unknown>;
    const count = data.unreadCount ?? data.UnreadCount;
    return typeof count === 'number' ? count : 0;
}

// 🔔 NOTIF-RT: refcount por canal — la campana está montada dos veces (top bar
// desktop + bottom bar móvil) y no queremos suscripciones duplicadas al mismo canal.
const activeNotifChannels = new Map<string, { count: number; channel: RealtimeChannel }>();

/**
 * 🔔 NOTIF-RT: suscripción Supabase Realtime a las notificaciones del usuario
 * (canal `notifications:user:{id}`; los admins escuchan además `notifications:admins`).
 * El backend emite un trigger MÍNIMO (id + timestamp) al crear cada notificación;
 * aquí solo invalidamos las queries — el contenido siempre se lee del endpoint
 * autenticado. El polling de 30s del badge queda como respaldo si el realtime cae.
 */
export function useNotificationsRealtime(enabled: boolean) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const rawUser = user as { id?: number; Id?: number; role?: string; Role?: string } | null;
    const userId = Number(rawUser?.id ?? rawUser?.Id ?? 0);
    const isAdmin = String(rawUser?.role ?? rawUser?.Role ?? '').toLowerCase() === 'admin';

    useEffect(() => {
        if (!enabled || !userId) return;

        const client = getSupabaseClient();
        const channelNames = [
            `notifications:user:${userId}`,
            ...(isAdmin ? ['notifications:admins'] : []),
        ];

        const onNewNotification = () => {
            void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_KEY });
            void queryClient.invalidateQueries({ queryKey: USER_NOTIFICATIONS_LIST_KEY });
            if (isAdmin) {
                void queryClient.invalidateQueries({ queryKey: [ADMIN_NOTIFICATIONS_QUERY_KEY] });
            }
        };

        const subscribedNames: string[] = [];
        for (const name of channelNames) {
            const existing = activeNotifChannels.get(name);
            if (existing) {
                existing.count += 1;
                subscribedNames.push(name);
                continue;
            }
            const channel = client
                .channel(name)
                .on('broadcast', { event: 'new_notification' }, onNewNotification)
                .subscribe();
            activeNotifChannels.set(name, { count: 1, channel });
            subscribedNames.push(name);
        }

        return () => {
            for (const name of subscribedNames) {
                const entry = activeNotifChannels.get(name);
                if (!entry) continue;
                entry.count -= 1;
                if (entry.count <= 0) {
                    activeNotifChannels.delete(name);
                    void client.removeChannel(entry.channel);
                }
            }
        };
    }, [enabled, userId, isAdmin, queryClient]);
}

/** Solo contador (badge). No carga la lista paginada. */
export function useUnreadNotificationCount(options?: { enabled?: boolean }) {
    const { fetchApi } = useApi();
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const onAdminRoute = location.pathname.startsWith('/admin');
    const enabled =
        options?.enabled ?? (isAuthenticated && !onAdminRoute);

    // 🔔 NOTIF-RT: la campana se vuelve reactiva — el broadcast invalida el contador
    // y la lista al instante; el polling de 30s queda como red de seguridad.
    useNotificationsRealtime(enabled);

    return useQuery({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_KEY,
        queryFn: async () => {
            const response = await fetchApi<unknown>(API_CONFIG.endpoints.notifications.unreadCount);
            return parseUnreadCount(response);
        },
        enabled,
        refetchInterval: enabled ? 30000 : false,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: 'always',
        retry: false,
    });
}

/** Lista paginada; activar solo cuando el panel está abierto. */
/** Lista paginada para panel admin (/admin/notifications). */
export function useAdminNotificationList(page: number, pageSize: number) {
    const { fetchApi } = useApi();
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: [ADMIN_NOTIFICATIONS_QUERY_KEY, page, pageSize],
        queryFn: () => fetchAdminNotificationsPage(fetchApi, page, pageSize),
        enabled: isAuthenticated,
        staleTime: 60_000,
        retry: (failureCount, error) => {
            const status =
                error && typeof error === 'object' && 'status' in error
                    ? (error as { status?: number }).status
                    : undefined;
            if (status === 401 || status === 403) return false;
            return failureCount < 1;
        },
    });
}

export function useNotificationList(options?: { enabled?: boolean }) {
    const { fetchApi } = useApi();
    const { isAuthenticated } = useAuth();
    const listEnabled = options?.enabled ?? false;

    const notificationsQuery = useInfiniteQuery({
        queryKey: USER_NOTIFICATIONS_LIST_KEY,
        queryFn: async ({ pageParam = 1 }) => {
            const url = `${API_CONFIG.endpoints.notifications.list}?page=${pageParam}&pageSize=20`;
            const response = await fetchApi<unknown>(url);
            return normalizeNotificationsPage(response);
        },
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
        initialPageParam: 1,
        enabled: isAuthenticated && listEnabled,
        retry: false,
    });

    const notifications =
        notificationsQuery.data?.pages.flatMap((page) => page.notifications) ?? [];

    return {
        notifications,
        isLoading: notificationsQuery.isLoading,
        error: notificationsQuery.error,
        refetchNotifications: notificationsQuery.refetch,
        fetchNextPage: notificationsQuery.fetchNextPage,
        hasNextPage: notificationsQuery.hasNextPage,
        isFetchingNextPage: notificationsQuery.isFetchingNextPage,
    };
}

/** Compatibilidad: preferir hooks separados en componentes nuevos. */
export const useNotifications = (options?: { listEnabled?: boolean }) => {
    const { isAuthenticated } = useAuth();
    const unreadQuery = useUnreadNotificationCount();
    const list = useNotificationList({
        enabled: options?.listEnabled ?? isAuthenticated,
    });

    return {
        notifications: list.notifications,
        isLoading: list.isLoading,
        error: list.error,
        unreadCount: unreadQuery.data ?? 0,
        refetchUnreadCount: unreadQuery.refetch,
        refetchNotifications: list.refetchNotifications,
        fetchNextPage: list.fetchNextPage,
        hasNextPage: list.hasNextPage,
        isFetchingNextPage: list.isFetchingNextPage,
    };
};
