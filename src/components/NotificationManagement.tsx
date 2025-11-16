import React, { useState } from 'react';
import { Bell, Info, AlertTriangle, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { ErrorDisplay } from './ErrorDisplay';

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

const NotificationManagement: React.FC = () => {
  const { fetchApi } = useApi();
  const queryClient = useQueryClient();
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    url: '',
    imageUrl: '',
    userId: ''
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
          userId: data.userId || null,
        }),
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
    },
  });

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
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Bell className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestionar notificaciones del sistema</p>
        </div>
      </div>

      {/* Formulario de Nueva Notificación */}
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
            disabled={createNotificationMutation.isPending}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {createNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>

      {/* Historial de Notificaciones */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification History</h2>
        <div className="space-y-4">
          {notificationsQuery.isLoading ? (
            <div className="text-center text-gray-500">Loading notifications...</div>
          ) : notificationsQuery.error ? (
            <ErrorDisplay
              message={notificationsQuery.error instanceof Error ? notificationsQuery.error.message : 'Error loading notifications'}
              fullScreen={false}
              noBackground={true}
              compact={true}
            />
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
                        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        Ver enlace
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </a>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      {notification.read && (
                        <span className="text-green-600">✓ Read</span>
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
};

export default NotificationManagement;
