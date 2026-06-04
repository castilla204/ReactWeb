import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ExternalLink } from 'lucide-react';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { useNotificationList } from '../hooks/useNotifications';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

/**
 * 🛡️ Round 29 MUD-DI — Página full-page para notificaciones del usuario.
 *
 * Razón: el backend (`LoggingService.cs:1053`) envía emails con
 * `actionUrl = "{frontendBaseUrl}/notifications"`. Esa ruta NO estaba registrada
 * en `App.tsx` → los emails caían en 404. Auditoría de 5 agentes lo detectó
 * como gap P0.
 *
 * Diseño: full-page con la misma lista que el drawer pero scroll vertical
 * estándar (mejor para mobile / deep-link desde email / sharing).
 */
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
        <div className="min-h-screen bg-gray-50">
            <HomepageDesktopTopBar variant="plain" pageTitle="Notificaciones" />
            <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
                <div className="mb-6 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Volver"
                        onClick={() => navigate(-1)}
                        className="h-9 w-9"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                            <Bell className="h-6 w-6 text-brand" />
                            Tus notificaciones
                        </h1>
                        <p className="text-sm text-gray-600 mt-0.5">
                            Avisos sobre tu cuenta, pagos, contrataciones y mensajes.
                        </p>
                    </div>
                </div>

                {isLoading && (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-lg" />
                        ))}
                    </div>
                )}

                {error && !isLoading && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        No hemos podido cargar tus notificaciones. Recarga la página o vuelve a intentarlo más tarde.
                    </div>
                )}

                {!isLoading && !error && notifications.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                        <Bell className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm text-gray-600">
                            No tienes notificaciones por ahora. Te avisaremos por aquí cuando haya novedades sobre tu cuenta.
                        </p>
                    </div>
                )}

                {!isLoading && notifications.length > 0 && (
                    <div className="space-y-3">
                        {notifications.map((n) => {
                            const isInternal = n.url && n.url.startsWith('/');
                            return (
                                <article
                                    key={n.id}
                                    className={`rounded-lg border bg-white p-4 shadow-sm ${n.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {n.imageUrl && (
                                            <img
                                                src={n.imageUrl}
                                                alt=""
                                                className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <h2 className={`text-sm font-semibold ${n.read ? 'text-gray-800' : 'text-gray-900'}`}>
                                                    {n.title}
                                                </h2>
                                                <time className="text-xs text-gray-500 flex-shrink-0">
                                                    {new Date(n.createdAt).toLocaleString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </time>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-700 leading-snug">
                                                {n.message}
                                            </p>
                                            {n.url && (
                                                isInternal ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(n.url!)}
                                                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
                                                    >
                                                        Ver detalles →
                                                    </button>
                                                ) : (
                                                    <a
                                                        href={n.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
                                                    >
                                                        Ver detalles <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

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
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotificationsPage;
