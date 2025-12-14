import { Bell, X, ArrowRight, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import { API_CONFIG } from '../config/api';
import { useEffect, useRef } from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const { 
        notifications, 
        isLoading, 
        error, 
        unreadCount, 
        refetchNotifications, 
        refetchUnreadCount,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useNotifications();
    
    const observerRef = useRef<IntersectionObserver | null>(null);
    const notificationRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const scrollSentinelRef = useRef<HTMLDivElement>(null);

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) =>
            fetchApi(API_CONFIG.endpoints.notifications.markAsRead(id), {
                method: 'PUT'
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () =>
            fetchApi(API_CONFIG.endpoints.notifications.markAllAsRead, {
                method: 'PUT'
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            refetchUnreadCount();
        }
    });

    // Auto-fetch and mark all as read when opening panel
    useEffect(() => {
        if (isOpen) {
            refetchNotifications();
            // Si hay notificaciones sin leer, marcarlas todas como leídas automáticamente
            if (unreadCount > 0) {
                markAllAsReadMutation.mutate();
            }
        }
    }, [isOpen]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (scrollSentinelRef.current) {
            observer.observe(scrollSentinelRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isOpen]);

    // Auto-mark as read when notification is viewed (for individual ones, if not handled by mark-all)
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-start justify-end animate-in fade-in duration-200">
            {/* Backdrop close area */}
            <div className="absolute inset-0" onClick={onClose} />
            
            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100">
                {/* Header Clean & Professional */}
                <div className="flex-none px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                                Notificaciones
                            </h2>
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100/50">
                                    {unreadCount} nuevas
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <ScrollArea className="flex-1 bg-white">
                    <div className="px-6 py-4 space-y-4">
                        {isLoading && notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                <span className="text-sm text-gray-500 font-medium">Cargando...</span>
                            </div>
                        ) : error ? (
                            <div className="p-4">
                                <ErrorDisplay
                                  message={error instanceof Error ? error.message : 'Error loading notifications'}
                                  fullScreen={false}
                                  noBackground={true}
                                  compact={true}
                                />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                    <Bell className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 mb-1">
                                    Todo al día
                                </h3>
                                <p className="text-sm text-gray-500 max-w-[200px]">
                                    No tienes notificaciones pendientes en este momento.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        ref={(el) => setNotificationRef(notification.id, el)}
                                        data-notification-id={notification.id}
                                        className={`group relative p-4 rounded-xl transition-all duration-200 border ${
                                            !notification.read
                                                ? 'bg-blue-50/30 border-blue-100 shadow-sm' 
                                                : 'bg-white border-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <h3 className={`text-[15px] font-semibold leading-snug ${
                                                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                                                    }`}>
                                                        {notification.title}
                                                    </h3>
                                                    <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 font-medium">
                                                        {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'short'
                                                        })}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-[14px] text-gray-600 leading-relaxed mb-3">
                                                    {notification.message}
                                                </p>
                                                
                                                {/* Image Attachment */}
                                                {notification.imageUrl && (
                                                    <div className="mb-3 rounded-lg overflow-hidden border border-gray-100 shadow-sm max-w-[200px]">
                                                        <img
                                                            src={notification.imageUrl}
                                                            alt=""
                                                            className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                )}
                                                
                                                {/* Actions */}
                                                {(notification.url || !notification.read) && (
                                                    <div className="flex items-center gap-3 pt-1">
                                                        {notification.url && (
                                                            <a
                                                                href={notification.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center text-[13px] font-medium text-blue-600 hover:text-blue-700 transition-colors group/link"
                                                            >
                                                                Ver detalles
                                                                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/link:translate-x-0.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Unread Indicator Dot */}
                                            {!notification.read && (
                                                <div className="absolute top-5 right-5 w-2 h-2 bg-blue-500 rounded-full shadow-sm ring-2 ring-blue-50" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Loading Spinner for Infinite Scroll */}
                                <div ref={scrollSentinelRef} className="py-4 flex justify-center w-full">
                                    {isFetchingNextPage && (
                                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
