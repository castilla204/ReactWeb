import React, { useState } from 'react';
import {
  Bell,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Send,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../lib/toast';
import { useApi } from '../hooks/useApi';
import { ErrorDisplay } from './ErrorDisplay';
import { Pagination } from './Pagination';
import {
  useAdminNotificationList,
  ADMIN_NOTIFICATIONS_QUERY_KEY,
} from '../hooks/useNotifications';
import { API_CONFIG } from '../config/api';
import {
  AdminCard,
  AdminCardHeader,
  AdminCardBody,
  AdminButton,
  AdminBadge,
  AdminEmptyState,
  AdminTableSkeleton,
  type AdminTone,
} from './admin/ui';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[hsl(var(--ap-border))] bg-[hsl(var(--ap-surface))] ' +
  'text-[13px] text-[hsl(var(--ap-ink))] focus:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[hsl(var(--ap-brand))] focus:border-[hsl(var(--ap-brand))]';
const labelClass = 'block text-[12px] font-medium text-[hsl(var(--ap-muted))] mb-1.5';
const helpClass = 'mt-1 text-[11px] text-[hsl(var(--ap-muted))]';

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
      return <Info className="w-5 h-5 text-[hsl(var(--ap-info))]" />;
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-[hsl(var(--ap-success))]" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-[hsl(var(--ap-warning))]" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-[hsl(var(--ap-error))]" />;
    default:
      return <Bell className="w-5 h-5 text-[hsl(var(--ap-muted))]" />;
  }
}

function getTone(type: string): AdminTone {
  switch (type) {
    case 'info':
      return 'info';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'neutral';
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
      <AdminCard>
        <AdminCardHeader
          title="Enviar notificación"
          description="Envía un aviso a un usuario concreto o una difusión (sin ID de usuario)."
        />
        <AdminCardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Título</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, title: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Tipo</label>
                <select
                  value={newNotification.type}
                  onChange={(e) =>
                    setNewNotification({
                      ...newNotification,
                      type: e.target.value as typeof newNotification.type,
                    })
                  }
                  className={inputClass}
                >
                  <option value="info">Info</option>
                  <option value="success">Éxito</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Mensaje</label>
              <textarea
                value={newNotification.message}
                onChange={(e) =>
                  setNewNotification({ ...newNotification, message: e.target.value })
                }
                className={inputClass}
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>ID usuario (opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newNotification.userId}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, userId: e.target.value })
                  }
                  placeholder="Vacío = difusión admin"
                  className={inputClass}
                />
                <p className={helpClass}>
                  Con ID: solo ese usuario la ve en su campana. Sin ID: difusión (visible en
                  este panel; los usuarios no la reciben en su lista).
                </p>
              </div>
              <div>
                <label className={labelClass}>URL (opcional)</label>
                <input
                  type="url"
                  value={newNotification.url}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, url: e.target.value })
                  }
                  placeholder="https://..."
                  className={inputClass}
                />
                <p className={helpClass}>Enlace al que lleva la notificación al pulsarla.</p>
              </div>
              <div>
                <label className={labelClass}>URL imagen (opcional)</label>
                <input
                  type="url"
                  value={newNotification.imageUrl}
                  onChange={(e) =>
                    setNewNotification({ ...newNotification, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className={inputClass}
                />
                <p className={helpClass}>Imagen que se mostrará junto al mensaje.</p>
              </div>
            </div>
            <AdminButton
              type="submit"
              variant="brand"
              icon={<Send className="w-4 h-4" />}
              loading={createNotificationMutation.isPending}
              className="w-full"
            >
              {createNotificationMutation.isPending ? 'Enviando...' : 'Enviar notificación'}
            </AdminButton>
          </form>
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader title="Historial del sistema" />
        {notificationsQuery.isLoading ? (
          <AdminTableSkeleton rows={5} cols={3} />
        ) : notificationsQuery.error ? (
          <AdminCardBody>
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
          </AdminCardBody>
        ) : notifications.length === 0 ? (
          <AdminEmptyState
            icon={<Bell className="w-6 h-6" />}
            title="Sin notificaciones"
            description="Aún no se ha registrado ninguna notificación en el sistema."
          />
        ) : (
          <>
            <AdminCardBody className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id || `${notification.title}-${notification.createdAt}`}
                  className={`relative rounded-xl p-4 border transition-colors ${
                    notification.read
                      ? 'border-[hsl(var(--ap-border))] bg-[hsl(var(--ap-surface))]'
                      : 'border-[hsl(var(--ap-brand))]/30 bg-[hsl(var(--ap-brand))]/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-[hsl(var(--ap-ink))]">
                          {notification.title || 'Sin título'}
                        </h3>
                        <AdminBadge tone="neutral">
                          {notification.userId != null
                            ? `Usuario #${notification.userId}`
                            : 'Difusión'}
                        </AdminBadge>
                        <AdminBadge tone={getTone(notification.type)}>
                          {notification.type}
                        </AdminBadge>
                      </div>
                      <p className="text-sm text-[hsl(var(--ap-muted))]">
                        {notification.message}
                      </p>
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
                          className="mt-2 inline-flex items-center text-sm text-[hsl(var(--ap-brand))] hover:underline"
                        >
                          Ver enlace
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </a>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-[hsl(var(--ap-muted))]">
                        <span>{formatNotificationDate(notification.createdAt)}</span>
                        {notification.read && (
                          <span className="text-[hsl(var(--ap-success))]">Leída</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </AdminCardBody>

            {pagination && (notifications.length > 0 || pagination.totalCount > 0) && (
              <AdminCardBody className="pt-0">
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
              </AdminCardBody>
            )}
          </>
        )}
      </AdminCard>
    </div>
  );
};

export default NotificationManagement;
