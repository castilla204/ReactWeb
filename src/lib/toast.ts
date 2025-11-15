import { toast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'info';

/**
 * Helper function to show toast notifications
 * Replaces the old Notification component system
 */
export const showToast = (type: NotificationType, message: string, duration?: number) => {
  const baseOptions: any = duration ? { duration } : {};
  
  // ✅ Mejorar opciones para errores de red
  if (type === 'error' && message.includes('Error de conexión')) {
    baseOptions.duration = duration || 6000;
    baseOptions.description = 'Verifica tu conexión a internet';
  }
  
  switch (type) {
    case 'success':
      toast.success(message, baseOptions);
      break;
    case 'error':
      toast.error(message, baseOptions);
      break;
    case 'info':
      toast.info(message, baseOptions);
      break;
    default:
      toast(message, baseOptions);
  }
};

/**
 * Legacy support: Convert old notification format to toast
 */
export const showNotification = (notification: { type: NotificationType; message: string; duration?: number }) => {
  showToast(notification.type, notification.message, notification.duration);
};

