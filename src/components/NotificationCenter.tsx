import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import {
    useNotificationList,
    useUnreadNotificationCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import { ErrorDisplay } from './ErrorDisplay';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { NotificationRow } from './notifications/NotificationRow';
import { NotificationSkeletonRows, NotificationEmptyState } from './notifications/NotificationStates';
import '../styles/notification-center.css';

export interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const { data: unreadCount = 0 } = useUnreadNotificationCount();
    const {
        notifications,
        isLoading,
        error,
        refetchNotifications,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useNotificationList({ enabled: isOpen });

    const scrollSentinelRef = useRef<HTMLLIElement>(null);
    const drawerRef = useRef<HTMLElement>(null);
    const markReadMutation = useMarkNotificationRead();
    const markAllAsReadMutation = useMarkAllNotificationsRead();
    const hadUnreadRef = useRef(false);

    useEffect(() => {
        if (unreadCount > 0) hadUnreadRef.current = true;
    }, [unreadCount]);

    // Marcar todo como leído SOLO al cerrar el panel (red de seguridad para lo que se vio pero no
    // se pulsó) — nunca al abrirlo, para no borrar la señal de "sin leer" antes de que el usuario
    // llegue a leer nada.
    const handleClose = () => {
        if (hadUnreadRef.current && !markAllAsReadMutation.isPending) {
            markAllAsReadMutation.mutate();
            hadUnreadRef.current = false;
        }
        onClose();
    };

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
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    // Mover el foco al diálogo al abrir — antes un usuario de teclado seguía tabulando por el
    // contenido detrás del overlay porque el foco nunca entraba en el panel.
    useEffect(() => {
        if (isOpen) drawerRef.current?.focus();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="nc-overlay" role="presentation">
            <button
                type="button"
                className="nc-overlay-backdrop"
                onClick={handleClose}
                aria-label="Cerrar notificaciones"
            />

            <aside
                ref={drawerRef}
                className="nc-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="nc-drawer-title"
                tabIndex={-1}
            >
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
                        onClick={handleClose}
                        className="nc-close-btn h-11 w-11"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </header>

                <ScrollArea className="nc-body">
                    <div className="nc-body-inner">
                        {isLoading && notifications.length === 0 ? (
                            <NotificationSkeletonRows />
                        ) : error ? (
                            <div className="nc-error-wrap">
                                <ErrorDisplay
                                    message={
                                        error instanceof Error
                                            ? error.message
                                            : 'Error al cargar notificaciones'
                                    }
                                    onRetry={() => refetchNotifications()}
                                    fullScreen={false}
                                    noBackground={true}
                                    compact={true}
                                />
                            </div>
                        ) : notifications.length === 0 ? (
                            <NotificationEmptyState />
                        ) : (
                            <ul className="nc-list">
                                {notifications.map((notification) => (
                                    <NotificationRow
                                        key={notification.id || `${notification.title}-${notification.createdAt}`}
                                        notification={notification}
                                        onInteract={(id) => markReadMutation.mutate(id)}
                                        onNavigateInternal={handleClose}
                                    />
                                ))}

                                <li ref={scrollSentinelRef} className="nc-load-more" aria-hidden>
                                    {isFetchingNextPage && <NotificationSkeletonRows count={1} />}
                                </li>
                            </ul>
                        )}
                    </div>
                </ScrollArea>
            </aside>
        </div>
    );
}
