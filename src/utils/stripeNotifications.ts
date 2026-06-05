import { STRIPE_STATUS } from '../constants/stripeStatus';

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

            case STRIPE_STATUS.ACTION_REQUIRED:
                return {
                    type: 'warning' as const,
                    title: 'Acción requerida en Stripe',
                    message: baseMessage,
                    duration: 8000
                };

            case STRIPE_STATUS.PENDING_VERIFICATION:
                return {
                    type: 'info' as const,
                    title: 'Stripe está verificando tu cuenta',
                    message: baseMessage,
                    duration: 6000
                };

            // 🛡️ Round 29 — FIX-UNDER-REVIEW: revisión manual del equipo Stripe (no automática
            // como PendingVerification). Mismo tono info/azul, distinto título para distinguir.
            case STRIPE_STATUS.UNDER_REVIEW:
                return {
                    type: 'info' as const,
                    title: 'Stripe revisa manualmente tu cuenta',
                    message: baseMessage,
                    duration: 6000
                };

            case STRIPE_STATUS.REQUIREMENTS_DUE:
            case STRIPE_STATUS.RESTRICTED_SOON:
                return {
                    type: 'warning' as const,
                    title: 'Actualiza tus datos en Stripe',
                    message: baseMessage,
                    duration: 7000
                };

            case STRIPE_STATUS.REQUIREMENTS_PAST_DUE:
                return {
                    type: 'error' as const,
                    title: 'Pagos bloqueados en Stripe',
                    message: baseMessage,
                    duration: 9000
                };

            case STRIPE_STATUS.RESTRICTED:
                return {
                    type: 'warning' as const,
                    title: 'Stripe restringió tu cuenta',
                    message: baseMessage,
                    duration: 9000
                };

            case STRIPE_STATUS.DISABLED:
                return {
                    type: 'error' as const,
                    title: 'Stripe deshabilitó pagos/payouts',
                    message: baseMessage,
                    duration: 10000
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
        case STRIPE_STATUS.ACTION_REQUIRED:
            return 'Stripe necesita información adicional para continuar. Completa los requisitos marcados.';
        case STRIPE_STATUS.PENDING_VERIFICATION:
            return 'Stripe está verificando tus documentos. Te avisaremos en cuanto finalice.';
        case STRIPE_STATUS.REQUIREMENTS_DUE:
            return 'Stripe detectó requisitos futuros. Actualiza tus datos para evitar bloqueos.';
        case STRIPE_STATUS.RESTRICTED_SOON:
            return 'Stripe restringirá tu cuenta pronto si no completas los requisitos.';
        case STRIPE_STATUS.REQUIREMENTS_PAST_DUE:
            return 'Algunos requisitos vencieron y tus cobros están bloqueados.';
        case STRIPE_STATUS.RESTRICTED:
            return 'Stripe limitó temporalmente tu cuenta; revisa tu panel para resolverlo.';
        case STRIPE_STATUS.DISABLED:
            return 'Stripe deshabilitó tu cuenta por un incidente grave. Contacta a soporte.';
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
          STRIPE_STATUS.DEAUTHORIZED,
          STRIPE_STATUS.ACTION_REQUIRED,
          STRIPE_STATUS.REQUIREMENTS_PAST_DUE,
          STRIPE_STATUS.RESTRICTED,
          STRIPE_STATUS.DISABLED
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



































