import React, { useState } from 'react';
import { Bell, Info, AlertTriangle, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { ErrorDisplay } from './ErrorDisplay';
import { Pagination } from './Pagination';
import {
  useAdminNotificationList,
  ADMIN_NOTIFICATIONS_QUERY_KEY,
} from '../hooks/useNotifications';
import { API_CONFIG } from '../config/api';

function buildCreatePayload(data: {
  title: string;
  message: string;
  type: string;
  url: string;
  imageUrl: string;
  userId: string;
}) {
  const userIdStr = data.userId.trim();
  let userId: number | null = null;
  if (userIdStr) {
    const parsed = parseInt(userIdStr, 10);
    if (Number.isNaN(parsed)) {
      throw new Error('El ID de usuario debe ser un número válido');
    }
    userId = parsed;
  }

  return {
    Title: data.title.trim(),
    Message: data.message.trim(),
    Type: data.type,
    UserId: userId,
    Url: data.url.trim() || null,
    ImageUrl: data.imageUrl.trim() || null,
  };
}

function formatNotificationDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-ES');
}

function getIcon(type: string) {
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
}

const NotificationManagement: React.FC = () => {
  const { fetchApi } = useApi();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    url: '',
    imageUrl: '',
    userId: '',
  });

  const notificationsQuery = useAdminNotificationList(page, pageSize);

  const createNotificationMutation = useMutation({
    mutationFn: async (data: typeof newNotification) => {
      const payload = buildCreatePayload(data);
      return fetchApi(API_CONFIG.endpoints.notifications.create, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_NOTIFICATIONS_QUERY_KEY] });
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        url: '',
        imageUrl: '',
        userId: '',
      });
      toast.success('Notificación enviada correctamente');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'No se pudo enviar la notificación';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      buildCreatePayload(newNotification);
      createNotificationMutation.mutate(newNotification);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Datos inválidos');
    }
  };

  const notifications = notificationsQuery.data?.notifications ?? [];
  const pagination = notificationsQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Bell className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-600">
            Envía avisos a un usuario concreto o difusión (sin ID de usuario)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nueva notificación</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={newNotification.title}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={newNotification.type}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    type: e.target.value as typeof newNotification.type,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="info">Info</option>
                <option value="success">Éxito</option>
                <option value="warning">Aviso</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea
              value={newNotification.message}
              onChange={(e) =>
                setNewNotification({ ...newNotification, message: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID usuario (opcional)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={newNotification.userId}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, userId: e.target.value })
                }
                placeholder="Vacío = difusión admin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Con ID: solo ese usuario la ve en su campana. Sin ID: difusión (visible en este
                panel; los usuarios no la reciben en su lista).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL (opcional)</label>
              <input
                type="url"
                value={newNotification.url}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, url: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL imagen (opcional)
              </label>
              <input
                type="url"
                value={newNotification.imageUrl}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, imageUrl: e.target.value })
                }
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
            {createNotificationMutation.isPending ? 'Enviando...' : 'Enviar notificación'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial del sistema</h2>
        <div className="space-y-4">
          {notificationsQuery.isLoading ? (
            <div className="text-center text-gray-500 py-8">Cargando notificaciones...</div>
          ) : notificationsQuery.error ? (
            <ErrorDisplay
              message={(() => {
                const err = notificationsQuery.error as { message?: string; status?: number };
                const status = err?.status;
                const base =
                  err?.message ||
                  (notificationsQuery.error instanceof Error
                    ? notificationsQuery.error.message
                    : 'Error al cargar notificaciones');
                if (status === 405) {
                  return `${base} (405). Reinicia la API para cargar GET /Notification/admin.`;
                }
                if (status === 401 || status === 403) {
                  return `${base}. Comprueba que tu usuario tenga rol Admin.`;
                }
                return base;
              })()}
              onRetry={() => notificationsQuery.refetch()}
              retryLabel="Reintentar"
              fullScreen={false}
              noBackground={true}
              compact={true}
            />
          ) : notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No hay notificaciones registradas</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id || `${notification.title}-${notification.createdAt}`}
                className={`relative bg-white rounded-xl p-4 border transition-colors ${
                  notification.read
                    ? 'border-gray-200'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {notification.title || 'Sin título'}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {notification.userId != null
                          ? `Usuario #${notification.userId}`
                          : 'Difusión'}
                      </span>
                      <span className="text-xs text-gray-400">{notification.type}</span>
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    {notification.imageUrl && (
                      <img
                        src={notification.imageUrl}
                        alt=""
                        className="mt-2 rounded-lg w-full max-w-xs h-32 object-cover"
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
                      <span>{formatNotificationDate(notification.createdAt)}</span>
                      {notification.read && (
                        <span className="text-green-600">Leída</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {pagination && (notifications.length > 0 || pagination.totalCount > 0) && (
          <div className="mt-6">
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalCount={pagination.totalCount}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManagement;
