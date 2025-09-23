import { STRIPE_STATUS } from '../hooks/useExpertStripeStatus';

export interface StripeNotificationData {
    stripeStatus: string;
    stripeStatusDetails: string | null;
    previousStatus?: string;
}

export const handleStripeStatusChange = (data: StripeNotificationData) => {
    const { stripeStatus, stripeStatusDetails, previousStatus } = data;
    
    // Only show notification if status actually changed
    if (previousStatus && previousStatus === stripeStatus) {
        return;
    }

    const getNotificationConfig = () => {
        const baseMessage = stripeStatusDetails || getDefaultMessage(stripeStatus);
        
        switch (stripeStatus) {
            case STRIPE_STATUS.APPROVED:
                return {
                    type: 'success' as const,
                    title: '¡Cuenta Aprobada!',
                    message: baseMessage,
                    duration: 8000 // Longer duration for success
                };
                
            case STRIPE_STATUS.REJECTED:
                return {
                    type: 'error' as const,
                    title: 'Cuenta Rechazada',
                    message: baseMessage,
                    duration: 10000 // Longer duration for errors
                };
                
            case STRIPE_STATUS.PENDING:
                return {
                    type: 'info' as const,
                    title: 'Verificación en Proceso',
                    message: baseMessage,
                    duration: 6000
                };
                
            case STRIPE_STATUS.DEAUTHORIZED:
                return {
                    type: 'warning' as const,
                    title: 'Cuenta Desautorizada',
                    message: baseMessage,
                    duration: 8000
                };
                
            case STRIPE_STATUS.NOT_REQUESTED:
                return {
                    type: 'info' as const,
                    title: 'Configuración Requerida',
                    message: baseMessage,
                    duration: 5000
                };
                
            default:
                return {
                    type: 'info' as const,
                    title: 'Estado Actualizado',
                    message: baseMessage,
                    duration: 5000
                };
        }
    };

    const config = getNotificationConfig();
    
    // Dispatch the notification event
    window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
            type: config.type,
            message: config.message
        }
    }));

    // Also dispatch a specific Stripe status change event for components that need it
    window.dispatchEvent(new CustomEvent('stripeStatusChanged', {
        detail: {
            stripeStatus,
            stripeStatusDetails,
            previousStatus,
            notificationConfig: config
        }
    }));
};

const getDefaultMessage = (status: string): string => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return 'Tu cuenta de Stripe ha sido aprobada exitosamente. Ya puedes recibir pagos.';
        case STRIPE_STATUS.REJECTED:
            return 'Tu cuenta de Stripe ha sido rechazada. Por favor, revisa los requisitos e intenta nuevamente.';
        case STRIPE_STATUS.PENDING:
            return 'Tu cuenta está siendo verificada. Te notificaremos cuando esté lista.';
        case STRIPE_STATUS.DEAUTHORIZED:
            return 'Tu cuenta de Stripe ha sido desactivada. Contacta soporte para más información.';
        case STRIPE_STATUS.NOT_REQUESTED:
            return 'Necesitas configurar tu cuenta de Stripe para recibir pagos.';
        default:
            return 'El estado de tu cuenta de Stripe ha sido actualizado.';
    }
};

// Utility function to check if a status change should trigger a notification
export const shouldNotifyStatusChange = (newStatus: string, oldStatus?: string): boolean => {
    if (!oldStatus) return true; // First time setup
    
    // Don't notify if status hasn't changed
    if (newStatus === oldStatus) return false;
    
    // Always notify for these status changes
    const importantStatuses = [
        STRIPE_STATUS.APPROVED,
        STRIPE_STATUS.REJECTED,
        STRIPE_STATUS.DEAUTHORIZED
    ];
    
    return importantStatuses.includes(newStatus as any) || 
           importantStatuses.includes(oldStatus as any);
};

// Hook for managing Stripe status notifications
export const useStripeStatusNotifications = () => {
    const notifyStatusChange = (data: StripeNotificationData) => {
        if (shouldNotifyStatusChange(data.stripeStatus, data.previousStatus)) {
            handleStripeStatusChange(data);
        }
    };

    const notifyApproval = (details?: string | null) => {
        handleStripeStatusChange({
            stripeStatus: STRIPE_STATUS.APPROVED,
            stripeStatusDetails: details
        });
    };

    const notifyRejection = (details?: string | null) => {
        handleStripeStatusChange({
            stripeStatus: STRIPE_STATUS.REJECTED,
            stripeStatusDetails: details
        });
    };

    const notifyPending = (details?: string | null) => {
        handleStripeStatusChange({
            stripeStatus: STRIPE_STATUS.PENDING,
            stripeStatusDetails: details
        });
    };

    return {
        notifyStatusChange,
        notifyApproval,
        notifyRejection,
        notifyPending
    };
};










