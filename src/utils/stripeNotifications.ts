import { STRIPE_STATUS } from '../constants/stripeStatus';
import i18n from '../i18n';

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
                    title: i18n.t('stripe.status.approved.notificationTitle'),
                    message: baseMessage,
                    duration: 8000 // Longer duration for success
                };

            case STRIPE_STATUS.REJECTED:
                return {
                    type: 'error' as const,
                    title: i18n.t('stripe.status.rejected.notificationTitle'),
                    message: baseMessage,
                    duration: 10000 // Longer duration for errors
                };

            case STRIPE_STATUS.PENDING:
                return {
                    type: 'info' as const,
                    title: i18n.t('stripe.status.pending.notificationTitle'),
                    message: baseMessage,
                    duration: 6000
                };

            case STRIPE_STATUS.ACTION_REQUIRED:
                return {
                    type: 'warning' as const,
                    title: i18n.t('stripe.status.actionRequired.notificationTitle'),
                    message: baseMessage,
                    duration: 8000
                };

            case STRIPE_STATUS.PENDING_VERIFICATION:
                return {
                    type: 'info' as const,
                    title: i18n.t('stripe.status.pendingVerification.notificationTitle'),
                    message: baseMessage,
                    duration: 6000
                };

            // 🛡️ Round 29 — FIX-UNDER-REVIEW: revisión manual del equipo Stripe (no automática
            // como PendingVerification). Mismo tono info/azul, distinto título para distinguir.
            case STRIPE_STATUS.UNDER_REVIEW:
                return {
                    type: 'info' as const,
                    title: i18n.t('stripe.status.underReview.notificationTitle'),
                    message: baseMessage,
                    duration: 6000
                };

            case STRIPE_STATUS.REQUIREMENTS_DUE:
            case STRIPE_STATUS.RESTRICTED_SOON:
                return {
                    type: 'warning' as const,
                    title: i18n.t('stripe.status.requirementsDue.notificationTitle'),
                    message: baseMessage,
                    duration: 7000
                };

            case STRIPE_STATUS.REQUIREMENTS_PAST_DUE:
                return {
                    type: 'error' as const,
                    title: i18n.t('stripe.status.requirementsPastDue.notificationTitle'),
                    message: baseMessage,
                    duration: 9000
                };

            case STRIPE_STATUS.RESTRICTED:
                return {
                    type: 'warning' as const,
                    title: i18n.t('stripe.status.restricted.notificationTitle'),
                    message: baseMessage,
                    duration: 9000
                };

            case STRIPE_STATUS.DISABLED:
                return {
                    type: 'error' as const,
                    title: i18n.t('stripe.status.disabled.notificationTitle'),
                    message: baseMessage,
                    duration: 10000
                };

            case STRIPE_STATUS.DEAUTHORIZED:
                return {
                    type: 'warning' as const,
                    title: i18n.t('stripe.status.deauthorized.notificationTitle'),
                    message: baseMessage,
                    duration: 8000
                };

            case STRIPE_STATUS.NOT_REQUESTED:
                return {
                    type: 'info' as const,
                    title: i18n.t('stripe.status.notRequested.notificationTitle'),
                    message: baseMessage,
                    duration: 5000
                };

            default:
                return {
                    type: 'info' as const,
                    title: i18n.t('stripe.status.unknown.notificationTitle'),
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
            return i18n.t('stripe.status.approved.notificationMessage');
        case STRIPE_STATUS.REJECTED:
            return i18n.t('stripe.status.rejected.notificationMessage');
        case STRIPE_STATUS.PENDING:
            return i18n.t('stripe.status.pending.notificationMessage');
        case STRIPE_STATUS.ACTION_REQUIRED:
            return i18n.t('stripe.status.actionRequired.notificationMessage');
        case STRIPE_STATUS.PENDING_VERIFICATION:
            return i18n.t('stripe.status.pendingVerification.notificationMessage');
        case STRIPE_STATUS.REQUIREMENTS_DUE:
            return i18n.t('stripe.status.requirementsDue.notificationMessage');
        case STRIPE_STATUS.RESTRICTED_SOON:
            return i18n.t('stripe.status.restrictedSoon.notificationMessage');
        case STRIPE_STATUS.REQUIREMENTS_PAST_DUE:
            return i18n.t('stripe.status.requirementsPastDue.notificationMessage');
        case STRIPE_STATUS.RESTRICTED:
            return i18n.t('stripe.status.restricted.notificationMessage');
        case STRIPE_STATUS.DISABLED:
            return i18n.t('stripe.status.disabled.notificationMessage');
        case STRIPE_STATUS.DEAUTHORIZED:
            return i18n.t('stripe.status.deauthorized.notificationMessage');
        case STRIPE_STATUS.NOT_REQUESTED:
            return i18n.t('stripe.status.notRequested.notificationMessage');
        default:
            return i18n.t('stripe.status.unknown.notificationMessage');
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



































