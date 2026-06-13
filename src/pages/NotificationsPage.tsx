import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { useNotificationList } from '../hooks/useNotifications';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
    getNotificationDisplay,
    getNotificationTone,
    getNotificationToneClass,
} from '../utils/notificationTypeMeta';
import '../styles/notification-center.css';

function formatNotificationDate(createdAt: string) {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        notifications,
        isLoading,
        isFetching,
        error,
        hasNextPage,
        fetchNextPage,
    } = useNotificationList({ enabled: true });

    return (
        <div className="min-h-screen" style={{ background: 'hsl(var(--nc-canvas))' }}>
            <HomepageDesktopTopBar variant="plain" pageTitle="Notificaciones" />
            <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
                <div className="mb-5 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Volver"
                        onClick={() => navigate(-1)}
                        className="h-9 w-9"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-[15px] font-semibold tracking-tight" style={{ color: 'hsl(var(--nc-ink))' }}>
                            Notificaciones
                        </h1>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(215 14% 38%)' }}>
                            Avisos de cuenta, pagos, contrataciones y mensajes
                        </p>
                    </div>
                </div>

                {isLoading && (
                    <div className="space-y-0 rounded-lg border overflow-hidden" style={{ borderColor: 'hsl(var(--nc-border))' }}>
                        {[0, 1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-none border-b last:border-b-0" />
                        ))}
                    </div>
                )}

                {error && !isLoading && (
                    <div
                        className="rounded-lg border p-4 text-sm"
                        style={{
                            borderColor: 'hsl(var(--ep-error) / 0.35)',
                            background: 'hsl(0 60% 97%)',
                            color: 'hsl(var(--ep-error))',
                        }}
                    >
                        No hemos podido cargar tus notificaciones. Recarga la página o vuelve a intentarlo más tarde.
                    </div>
                )}

                {!isLoading && !error && notifications.length === 0 && (
                    <div className="nc-state rounded-lg border" style={{ borderColor: 'hsl(var(--nc-border))', background: 'hsl(var(--nc-surface))' }}>
                        <p className="nc-state-title">Todo al día</p>
                        <p className="nc-state-text">
                            No tienes notificaciones pendientes en este momento.
                        </p>
                    </div>
                )}

                {!isLoading && notifications.length > 0 && (
                    <>
                        <ul className="nc-list rounded-lg border overflow-hidden" style={{ borderColor: 'hsl(var(--nc-border-strong))' }}>
                            {notifications.map((n) => {
                                const tone = getNotificationTone(n.type, n.title);
                                const toneClass = getNotificationToneClass(tone);
                                const { headline, body } = getNotificationDisplay(n.title, n.message);
                                const isInternal = n.url && n.url.startsWith('/');

                                return (
                                    <li
                                        key={n.id}
                                        className={`nc-item ${toneClass}${body ? '' : ' nc-item--headline-only'}${n.read ? ' nc-item--read' : ' nc-item--unread'}`}
                                    >
                                        <div className="nc-item-head">
                                            <h2 className="nc-item-title">{headline}</h2>
                                            <time className="nc-item-date">
                                                {formatNotificationDate(n.createdAt)}
                                            </time>
                                        </div>
                                        {body && <p className="nc-item-message">{body}</p>}
                                        {n.imageUrl && (
                                            <div className="nc-item-image">
                                                <img src={n.imageUrl} alt="" loading="lazy" />
                                            </div>
                                        )}
                                        {n.url && (
                                            isInternal ? (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(n.url!)}
                                                    className="nc-item-link"
                                                >
                                                    Ver detalles
                                                </button>
                                            ) : (
                                                <a
                                                    href={n.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="nc-item-link"
                                                >
                                                    Ver detalles
                                                </a>
                                            )
                                        )}
                                    </li>
                                );
                            })}
                        </ul>

                        {hasNextPage && (
                            <div className="text-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetching}
                                >
                                    {isFetching ? 'Cargando…' : 'Cargar más'}
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
