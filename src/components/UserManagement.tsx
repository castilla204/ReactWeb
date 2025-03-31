import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { Shield, Trash2, CheckCircle, XCircle, Users, Search, CreditCard, Calendar, ArrowLeft, Bell, Info, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
    phoneVerified: boolean;
    isBlocked: boolean;
    createdAt: string;
    searchCount: number;
    subscriptionPlan: string;
}

interface UserManagementProps {
    onBack: () => void;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    url?: string;
    imageUrl?: string;
    read: boolean;
    createdAt: string;
    readAt: string | null;
}

export function UserManagement({ onBack }: UserManagementProps) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'users' | 'notifications'>('users');
    const [newNotification, setNewNotification] = useState({
        title: '',
        message: '',
        type: 'info' as const,
        url: '',
        imageUrl: '',
        userId: ''
    });

    const usersQuery = useQuery({
        queryKey: ['users'],
        queryFn: () => fetchApi<User[]>(`/api/User/all`),
    });

    const notificationsQuery = useQuery({
        queryKey: ['notifications'],
        queryFn: () => fetchApi<Notification[]>('/api/Notification'),
    });

    const createNotificationMutation = useMutation({
        mutationFn: (data: typeof newNotification) =>
            fetchApi('/api/Notification', {
                method: 'POST',
                body: JSON.stringify({
                    ...data,
                    userId: data.userId ? parseInt(data.userId) : null
                })
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setNewNotification({
                title: '',
                message: '',
                type: 'info',
                url: '',
                imageUrl: '',
                userId: ''
            });
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✉️ Notification sent successfully'
                }
            }));
        }
    });

    const deleteNotificationMutation = useMutation({
        mutationFn: (id: string) =>
            fetchApi(`/api/Notification/${id}`, {
                method: 'DELETE'
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '🗑️ Notification deleted successfully'
                }
            }));
        }
    });

    const blockUserMutation = useMutation({
        mutationFn: (userId: number) =>
            fetchApi(`/api/User/${userId}/block`, {
                method: 'PUT',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '🔒 User status updated successfully'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Failed to update user status'
                }
            }));
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) =>
            fetchApi(`/api/User/${userId}`, {
                method: 'DELETE',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '🗑️ User deleted successfully'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Failed to delete user'
                }
            }));
        }
    });

    const handleBlockUser = async (userId: number) => {
        try {
            await blockUserMutation.mutateAsync(userId);
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteUserMutation.mutateAsync(userId);
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createNotificationMutation.mutate(newNotification);
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
        }
    };

    if (usersQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Loading users...</div>
            </div>
        );
    }

    if (usersQuery.error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-red-500">
                Error loading users
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-500">Manage and monitor user accounts</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'users'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Users className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'notifications'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Bell className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'notifications' ? (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send New Notification</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={newNotification.title}
                                        onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={newNotification.type}
                                        onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="info">Info</option>
                                        <option value="success">Success</option>
                                        <option value="warning">Warning</option>
                                        <option value="error">Error</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={newNotification.message}
                                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        User ID (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newNotification.userId}
                                        onChange={(e) => setNewNotification({ ...newNotification, userId: e.target.value })}
                                        placeholder="Leave empty for broadcast"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        URL (optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={newNotification.url}
                                        onChange={(e) => setNewNotification({ ...newNotification, url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Image URL (optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={newNotification.imageUrl}
                                        onChange={(e) => setNewNotification({ ...newNotification, imageUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Send Notification
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification History</h2>
                        <div className="space-y-4">
                            {notificationsQuery.isLoading ? (
                                <div className="text-center text-gray-500">Loading notifications...</div>
                            ) : notificationsQuery.error ? (
                                <div className="text-center text-red-500">Error loading notifications</div>
                            ) : notificationsQuery.data?.length === 0 ? (
                                <div className="text-center text-gray-500">No notifications</div>
                            ) : (
                                notificationsQuery.data?.map((notification) => (
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
                                                            <CheckCircle className="w-4 h-4" />
                                                            Read
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                                title="Delete notification"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Searches</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {usersQuery.data?.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-medium text-sm">
                                                        {user.name[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {user.isBlocked ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Blocked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <CreditCard className="w-4 h-4 text-blue-500" />
                                                {user.subscriptionPlan}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <Search className="w-4 h-4 text-blue-500" />
                                                {user.searchCount} active
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleBlockUser(user.id)}
                                                    className={`p-2 rounded-lg transition-colors ${user.isBlocked
                                                            ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                        }`}
                                                    title={user.isBlocked ? 'Unblock user' : 'Block user'}
                                                >
                                                    <Shield className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>)}
        </div>
    );
}