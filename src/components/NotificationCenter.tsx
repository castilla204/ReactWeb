import { Bell, X, Check, Info, AlertTriangle, AlertCircle, ArrowRight, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import { API_CONFIG } from '../config/api';
import { useEffect, useRef } from 'react';
import { ErrorDisplay } from './ErrorDisplay';

export interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const { notifications, isLoading, error } = useNotifications();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const notificationRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) =>
            fetchApi(API_CONFIG.endpoints.notifications.markAsRead(id), {
                method: 'PUT'
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () =>
            fetchApi(API_CONFIG.endpoints.notifications.markAllAsRead, {
                method: 'PUT'
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    // Auto-mark as read when notification is viewed
    useEffect(() => {
        if (!isOpen || !notifications.length) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const notificationId = entry.target.getAttribute('data-notification-id');
                        const notification = notifications.find(n => n.id === notificationId);
                        
                        if (notification && !notification.read) {
                            // Delay marking as read to ensure user actually saw it
                            setTimeout(() => {
                                markAsReadMutation.mutate(notification.id);
                            }, 1000);
                        }
                    }
                });
            },
            {
                threshold: 0.5,
                root: null
            }
        );

        // Observe all unread notifications
        notificationRefs.current.forEach((element) => {
            if (observerRef.current) {
                observerRef.current.observe(element);
            }
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [isOpen, notifications, markAsReadMutation]);

    const setNotificationRef = (id: string, element: HTMLDivElement | null) => {
        if (element) {
            notificationRefs.current.set(id, element);
        } else {
            notificationRefs.current.delete(id);
        }
    };


    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            case 'success':
                return <Check className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
        }
    };

    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end">
            <div className="w-full max-w-md bg-white h-screen shadow-xl flex flex-col">
                {/* Header mejorado */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Bell className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
                                {unreadCount > 0 && (
                                    <p className="text-sm text-gray-600">{unreadCount} sin leer</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/70 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    
                    {/* Botón marcar todas como leídas */}
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="w-full py-2 px-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {markAllAsReadMutation.isPending ? 'Marcando...' : 'Marcar todas como leídas'}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="text-center text-gray-500">Loading notifications...</div>
                    ) : error ? (
                        <ErrorDisplay
                          message={error instanceof Error ? error.message : 'Error loading notifications'}
                          fullScreen={false}
                          noBackground={true}
                          compact={true}
                        />
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Bell className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">No hay notificaciones</p>
                            <p className="text-sm text-gray-400">Cuando tengas nuevas notificaciones aparecerán aquí</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                ref={(el) => setNotificationRef(notification.id, el)}
                                data-notification-id={notification.id}
                                className={`relative rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${notification.read
                                        ? 'bg-white border-gray-200'
                                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm'
                                    }`}
                            >
                                {/* Indicador de no leído */}
                                {!notification.read && (
                                    <div className="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                                
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${notification.read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                {notification.title}
                                            </h3>
                                            <div className="flex items-center gap-1">
                                                {notification.read && (
                                                    <div className="flex items-center gap-1 text-green-600 text-xs">
                                                        <Check className="w-3 h-3" />
                                                        <span>Leído</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <p className={`text-sm leading-relaxed ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                                            {notification.message}
                                        </p>
                                        
                                        {notification.imageUrl && (
                                            <img
                                                src={notification.imageUrl}
                                                alt=""
                                                className="mt-3 rounded-lg w-full h-32 object-cover border border-gray-200"
                                            />
                                        )}
                                        
                                        {notification.url && (
                                            <a
                                                href={notification.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                            >
                                                Ver detalles
                                                <ArrowRight className="w-4 h-4" />
                                            </a>
                                        )}
                                        
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">
                                                {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                                    title="Marcar como leído"
                                                >
                                                    Marcar como leído
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}