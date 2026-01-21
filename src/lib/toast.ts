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
 * Helper function to show toast notifications con diseño moderno y estético
 * Replaces the old Notification component system
 */
export const showToast = (
  type: NotificationType, 
  message: string, 
  duration?: number,
  options?: ToastNotificationOptions
) => {
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
    case 'success':
      toast.success(message, {
        ...baseOptions,
        description: options?.description,
        action: options?.action,
      });
      break;
    case 'error':
      toast.error(message, {
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
    case 'warning':
      toast.warning(message, {
        ...baseOptions,
        description: options?.description,
        action: options?.action,
      });
      break;
    default:
      toast(message, baseOptions);
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

