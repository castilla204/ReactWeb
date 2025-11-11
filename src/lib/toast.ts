import { toast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'info';

/**
 * Helper function to show toast notifications
 * Replaces the old Notification component system
 */
export const showToast = (type: NotificationType, message: string, duration?: number) => {
  const options = duration ? { duration } : {};
  
  switch (type) {
    case 'success':
      toast.success(message, options);
      break;
    case 'error':
      toast.error(message, options);
      break;
    case 'info':
      toast.info(message, options);
      break;
    default:
      toast(message, options);
  }
};

/**
 * Legacy support: Convert old notification format to toast
 */
export const showNotification = (notification: { type: NotificationType; message: string; duration?: number }) => {
  showToast(notification.type, notification.message, notification.duration);
};

