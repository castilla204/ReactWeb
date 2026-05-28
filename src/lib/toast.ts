import { toast, ToastOptions } from 'sonner';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type ToastSurface = 'app' | 'homepage';

export interface ToastNotificationOptions extends Omit<ToastOptions, 'duration'> {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Por defecto `app`: solo errores (y warnings en dev). `homepage`: también success e info. */
  surface?: ToastSurface;
}

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

function isTypeAllowed(type: NotificationType, surface: ToastSurface): boolean {
  if (surface === 'homepage') {
    return type === 'success' || type === 'info' || type === 'error';
  }
  if (type === 'error') return true;
  if (type === 'warning' && isDevelopment) return true;
  return false;
}

/**
 * Toasts alineados con la homepage (Sonner top-right).
 */
export const showToast = (
  type: NotificationType,
  message: string,
  duration?: number,
  options?: ToastNotificationOptions,
) => {
  const surface = options?.surface ?? 'app';

  if (!isTypeAllowed(type, surface)) {
    return;
  }

  const baseOptions: ToastOptions = {
    duration: duration || (type === 'error' ? 5000 : 3500),
    ...options,
    className: ['hp-toast', `hp-toast--${type}`, options?.className].filter(Boolean).join(' '),
  };

  if (type === 'error' && message.includes('Error de conexión')) {
    baseOptions.duration = duration || 6000;
    baseOptions.description = options?.description || 'Verifica tu conexión a internet';
  }

  switch (type) {
    case 'error':
      toast.error(message, {
        ...baseOptions,
        description: options?.description,
        action: options?.action,
      });
      break;
    case 'warning':
      toast.warning(message, {
        ...baseOptions,
        description: options?.description,
        action: options?.action,
      });
      break;
    case 'success':
      toast.success(message, {
        ...baseOptions,
        description: options?.description,
        action: options?.action,
      });
      break;
    case 'info':
      toast.info(message, {
        ...baseOptions,
        description: options?.description,
        action: options?.action,
      });
      break;
    default:
      break;
  }
};

/** Atajos para el muro / favoritos en homepage */
export const homepageToast = {
  loginRequired: () =>
    showToast('info', 'Inicia sesión para guardar favoritos', 3500, { surface: 'homepage' }),
  favoriteUpdated: (message: string) =>
    showToast('success', message, 2500, { surface: 'homepage' }),
  error: (message: string, duration = 4000) =>
    showToast('error', message, duration, { surface: 'homepage' }),
};

export const showNotification = (notification: {
  type: NotificationType;
  message: string;
  duration?: number;
  description?: string;
  surface?: ToastSurface;
}) => {
  showToast(notification.type, notification.message, notification.duration, {
    description: notification.description,
    surface: notification.surface,
  });
};
