import { Bell, X, Check, Info, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import { API_CONFIG } from '../config/api';

export interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const { notifications, isLoading, error } = useNotifications();

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) =>
            fetchApi(API_CONFIG.endpoints.notifications.markAsRead(id), {
                method: 'PUT'
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });


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

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end">
            <div className="w-full max-w-md bg-white h-screen shadow-xl flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="text-center text-gray-500">Loading notifications...</div>
                    ) : error ? (
                        <div className="text-center text-red-500">Error loading notifications</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center text-gray-500">No notifications</div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`relative bg-white rounded-xl p-4 border transition-colors ${notification.read
                                        ? 'border-gray-200'
                                        : 'border-blue-200 bg-blue-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {getIcon(notification.type)}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-gray-900">
                                            {notification.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {notification.message}
                                        </p>
                                        {notification.imageUrl && (
                                            <img
                                                src={notification.imageUrl}
                                                alt=""
                                                className="mt-2 rounded-lg w-full h-32 object-cover"
                                            />
                                        )}
                                        {notification.url && (
                                            <a
                                                href={notification.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                            >
                                                View Details
                                                <ArrowRight className="w-3 h-3" />
                                            </a>
                                        )}
                                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                                            <span>
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </span>
                                            {notification.read && (
                                                <span className="flex items-center gap-1 text-green-500">
                                                    <Check className="w-4 h-4" />
                                                    Read
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4 text-gray-400" />
                                            </button>
                                        )}
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