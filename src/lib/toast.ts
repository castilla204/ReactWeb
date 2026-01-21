import { toast, ToastOptions } from 'sonner';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ToastNotificationOptions extends Omit<ToastOptions, 'duration'> {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Helper function to show toast notifications
 * Solo muestra notificaciones de error (y warnings en desarrollo)
 */
export const showToast = (
  type: NotificationType, 
  message: string, 
  duration?: number,
  options?: ToastNotificationOptions
) => {
  // Solo mostrar errores y warnings (warnings solo en desarrollo)
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  // Si no es error ni warning (en desarrollo), no mostrar nada
  if (type !== 'error' && (type !== 'warning' || !isDevelopment)) {
    return; // No mostrar notificaciones de success o info
  }
  
  const baseOptions: ToastOptions = {
    duration: duration || 4000,
    ...options,
  };
  
  // ✅ Mejorar opciones para errores de red
  if (type === 'error' && message.includes('Error de conexión')) {
    baseOptions.duration = duration || 6000;
    baseOptions.description = options?.description || 'Verifica tu conexión a internet';
  }
  
  // Aplicar estilos consistentes
  baseOptions.className = 'modern-toast';
  
  switch (type) {
    case 'error':
      toast.error(message, {
        ...baseOptions,
        description: options?.description,
        action: options?.action,
      });
      break;
    case 'warning':
      // Solo en desarrollo
      if (isDevelopment) {
        toast.warning(message, {
          ...baseOptions,
          description: options?.description,
          action: options?.action,
        });
      }
      break;
    // success e info no se muestran
    default:
      break;
  }
};

/**
 * Legacy support: Convert old notification format to toast
 */
export const showNotification = (notification: { 
  type: NotificationType; 
  message: string; 
  duration?: number;
  description?: string;
}) => {
  showToast(
    notification.type, 
    notification.message, 
    notification.duration,
    { description: notification.description }
  );
};

