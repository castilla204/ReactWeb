import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import {
    useNotificationList,
    useUnreadNotificationCount,
    USER_NOTIFICATIONS_LIST_KEY,
    NOTIFICATIONS_UNREAD_COUNT_KEY,
    type Notification,
} from '../hooks/useNotifications';
import { API_CONFIG } from '../config/api';
import { ErrorDisplay } from './ErrorDisplay';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import {
    getNotificationDisplay,
    getNotificationTone,
    getNotificationToneClass,
} from '../utils/notificationTypeMeta';
import '../styles/notification-center.css';

export interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

function NotificationItem({
    notification,
    onClose,
}: {
    notification: Notification;
    onClose: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isUnread = !notification.read;
    const tone = getNotificationTone(notification.type, notification.title);
    const toneClass = getNotificationToneClass(tone);
    const { headline, body } = getNotificationDisplay(
        notification.title || 'Notificación',
        notification.message,
    );
    const isLongHeadline = headline.length > 160;
    const isLongBody = body != null && body.length > 160;

    return (
        <li
            className={`nc-item ${toneClass}${body ? '' : ' nc-item--headline-only'}${isUnread ? ' nc-item--unread' : ' nc-item--read'}${expanded ? ' nc-item--expanded' : ''}`}
        >
            <div className="nc-item-head">
                <h3 className="nc-item-title">{headline}</h3>
                {notification.createdAt && (
                    <time className="nc-item-date" dateTime={notification.createdAt}>
                        {formatNotificationDate(notification.createdAt)}
                    </time>
                )}
            </div>

            {body && <p className="nc-item-message">{body}</p>}

            {(isLongHeadline || isLongBody) && !expanded && (
                <button
                    type="button"
                    className="nc-item-expand"
                    onClick={() => setExpanded(true)}
                >
                    Ver más
                </button>
            )}

            {notification.imageUrl && (
                <div className="nc-item-image">
                    <img src={notification.imageUrl} alt="" loading="lazy" />
                </div>
            )}

            {notification.url && (
                <a
                    href={notification.url}
                    target={notification.url.startsWith('/') ? '_self' : '_blank'}
                    rel={notification.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                    className="nc-item-link"
                    onClick={notification.url.startsWith('/') ? onClose : undefined}
                >
                    Ver detalles
                </a>
            )}
        </li>
    );
}

function formatNotificationDate(createdAt: string) {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays < 7) {
        return date.toLocaleDateString('es-ES', { weekday: 'short' });
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const markedAllOnOpenRef = useRef(false);

    const { data: unreadCount = 0 } = useUnreadNotificationCount();
    const {
        notifications,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useNotificationList({ enabled: isOpen });

    const scrollSentinelRef = useRef<HTMLDivElement>(null);

    const markAllAsReadMutation = useMutation({
        mutationFn: () =>
            fetchApi(API_CONFIG.endpoints.notifications.markAllAsRead, {
                method: 'PUT',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: USER_NOTIFICATIONS_LIST_KEY });
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_KEY });
        },
    });

    useEffect(() => {
        if (!isOpen) {
            markedAllOnOpenRef.current = false;
            return;
        }
        if (unreadCount > 0 && !markedAllOnOpenRef.current && !markAllAsReadMutation.isPending) {
            markedAllOnOpenRef.current = true;
            markAllAsReadMutation.mutate();
        }
    }, [isOpen, unreadCount, markAllAsReadMutation.isPending]);

    useEffect(() => {
        if (!isOpen) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );

        const sentinel = scrollSentinelRef.current;
        if (sentinel) observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="nc-overlay" role="presentation">
            <button
                type="button"
                className="nc-overlay-backdrop"
                onClick={onClose}
                aria-label="Cerrar notificaciones"
            />

            <aside className="nc-drawer" role="dialog" aria-modal="true" aria-labelledby="nc-drawer-title">
                <header className="nc-header">
                    <div className="nc-header-text">
                        <h2 id="nc-drawer-title" className="nc-header-title">
                            Notificaciones
                        </h2>
                        <p className="nc-header-subtitle">
                            Avisos de cuenta, pagos, contrataciones y mensajes
                        </p>
                        {unreadCount > 0 && (
                            <div className="nc-header-meta">
                                <span className="nc-unread-badge">
                                    {unreadCount} sin leer
                                </span>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="nc-close-btn h-8 w-8"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </header>

                <ScrollArea className="nc-body">
                    <div className="nc-body-inner">
                        {isLoading && notifications.length === 0 ? (
                            <div className="nc-state">
                                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" aria-hidden />
                                <p className="nc-state-text mt-3">Cargando avisos…</p>
                            </div>
                        ) : error ? (
                            <div className="nc-error-wrap">
                                <ErrorDisplay
                                    message={
                                        error instanceof Error
                                            ? error.message
                                            : 'Error al cargar notificaciones'
                                    }
                                    fullScreen={false}
                                    noBackground={true}
                                    compact={true}
                                />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="nc-state">
                                <p className="nc-state-title">Todo al día</p>
                                <p className="nc-state-text">
                                    No tienes notificaciones pendientes en este momento.
                                </p>
                            </div>
                        ) : (
                            <ul className="nc-list">
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id || `${notification.title}-${notification.createdAt}`}
                                        notification={notification}
                                        onClose={onClose}
                                    />
                                ))}

                                <li ref={scrollSentinelRef} className="nc-load-more" aria-hidden>
                                    {isFetchingNextPage && (
                                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                                    )}
                                </li>
                            </ul>
                        )}
                    </div>
                </ScrollArea>
            </aside>
        </div>
    );
}
