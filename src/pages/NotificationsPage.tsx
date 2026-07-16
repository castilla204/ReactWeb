import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import {
    useNotificationList,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    useUnreadNotificationCount,
} from '../hooks/useNotifications';
import { Button } from '../components/ui/button';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { NotificationRow } from '../components/notifications/NotificationRow';
import { NotificationSkeletonRows, NotificationEmptyState } from '../components/notifications/NotificationStates';
import '../styles/notification-center.css';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        notifications,
        isLoading,
        isFetchingNextPage,
        error,
        refetchNotifications,
        hasNextPage,
        fetchNextPage,
    } = useNotificationList({ enabled: true });

    const { data: unreadCount = 0 } = useUnreadNotificationCount();
    const markReadMutation = useMarkNotificationRead();
    const markAllAsReadMutation = useMarkAllNotificationsRead();
    const unreadCountRef = useRef(unreadCount);
    unreadCountRef.current = unreadCount;

    // Simétrico al drawer: marcar todo como leído al ABANDONAR la página (equivalente a "cerrar el
    // panel" para una vista de página completa), nunca al entrar — así la insignia de "sin leer"
    // sigue siendo fiable mientras el usuario está repasando la lista.
    useEffect(() => {
        return () => {
            if (unreadCountRef.current > 0) {
                markAllAsReadMutation.mutate();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen" style={{ background: 'hsl(var(--nc-canvas))' }}>
            {/* showLogo: mismo topbar unificado que el resto de páginas internas
                (antes caía al layout legado sin logo y con la cuenta a la izquierda).
                Sin pageTitle: el h1 visible de la página ya lo aporta el main. */}
            <HomepageDesktopTopBar variant="plain" showLogo />
            <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
                <div className="mb-5 flex items-center gap-3">
                    {/* Volver es redundante en escritorio: la topbar global + la navegación del
                        navegador ya cubren esa acción (mismo patrón que CentroAyudaPage). */}
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Volver"
                        onClick={() => navigate(-1)}
                        className="h-11 w-11 md:hidden"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-display text-title font-bold tracking-[-0.02em]" style={{ color: 'hsl(var(--nc-ink))' }}>
                            Notificaciones
                        </h1>
                        <p className="font-display text-caption mt-0.5" style={{ color: 'hsl(var(--nc-muted))' }}>
                            Avisos de cuenta, pagos, contrataciones y mensajes
                        </p>
                    </div>
                </div>

                {isLoading && (
                    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'hsl(var(--nc-border))' }}>
                        <NotificationSkeletonRows />
                    </div>
                )}

                {error && !isLoading && (
                    <ErrorDisplay
                        message="No hemos podido cargar tus notificaciones."
                        onRetry={() => refetchNotifications()}
                        fullScreen={false}
                        noBackground
                        compact
                    />
                )}

                {!isLoading && !error && notifications.length === 0 && (
                    <div className="rounded-lg border" style={{ borderColor: 'hsl(var(--nc-border))', background: 'hsl(var(--nc-surface))' }}>
                        <NotificationEmptyState />
                    </div>
                )}

                {!isLoading && notifications.length > 0 && (
                    <>
                        <ul className="nc-list rounded-lg border overflow-hidden" style={{ borderColor: 'hsl(var(--nc-border-strong))' }}>
                            {notifications.map((n) => (
                                <NotificationRow
                                    key={n.id}
                                    notification={n}
                                    onInteract={(id) => markReadMutation.mutate(id)}
                                />
                            ))}
                        </ul>

                        {hasNextPage && (
                            <div className="text-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                >
                                    {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default NotificationsPage;
