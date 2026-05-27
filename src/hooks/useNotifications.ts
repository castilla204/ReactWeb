import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useApi } from './useApi';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';

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

/** Solo contador (badge). No carga la lista paginada. */
export function useUnreadNotificationCount(options?: { enabled?: boolean }) {
    const { fetchApi } = useApi();
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const onAdminRoute = location.pathname.startsWith('/admin');
    const enabled =
        options?.enabled ?? (isAuthenticated && !onAdminRoute);

    return useQuery({
        queryKey: NOTIFICATIONS_UNREAD_COUNT_KEY,
        queryFn: async () => {
            const response = await fetchApi<unknown>(API_CONFIG.endpoints.notifications.unreadCount);
            return parseUnreadCount(response);
        },
        enabled,
        refetchInterval: enabled ? 30000 : false,
        refetchIntervalInBackground: false,
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
