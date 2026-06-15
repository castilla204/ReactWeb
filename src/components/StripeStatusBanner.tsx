import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ExternalLink, Clock, Info } from 'lucide-react';
import { STRIPE_STATUS } from '../constants/stripeStatus';
import { STRIPE_WARNING_STATES, STRIPE_ERROR_STATES, STRIPE_INFO_STATES } from '../utils/stripeStatusStyles';
import { isStaleSuccessDetail } from '../utils/stripeMessageSanitizer';

interface StripeStatusBannerProps {
    stripeStatus: string;
    statusMessage: string;
    canCreateServices: boolean;
    canReceivePayments: boolean;
    futureDueAtIso?: string | null;
    onOpenStripe?: () => void;
}

export const StripeStatusBanner: React.FC<StripeStatusBannerProps> = ({
    stripeStatus,
    statusMessage,
    canCreateServices,
    canReceivePayments,
    futureDueAtIso,
    onOpenStripe
}) => {
    const { t } = useTranslation();
    // Pending gestionado desde StripeStatusCard; no duplicar aquí.
    if (stripeStatus === STRIPE_STATUS.PENDING) return null;

    // 🛡️ A4: los estados INFO (PendingVerification/UnderReview) son revisiones transitorias de
    // Stripe sin acción del experto y NO deben reclasificarse a error por el fallback de capacidades
    // (UnderReview llega con canCreate/canReceive=false → antes se pintaba rojo "atención urgente").
    const isInfo    = STRIPE_INFO_STATES.includes(stripeStatus);
    const isError   = !isInfo && (STRIPE_ERROR_STATES.includes(stripeStatus) || (!canCreateServices && !canReceivePayments));
    const isWarning = STRIPE_WARNING_STATES.includes(stripeStatus) && !isError && !isInfo;

    if (!isError && !isWarning && !isInfo) return null;

    const severity = isError ? 'error' : isInfo ? 'info' : 'warning';

    const title = isError
        ? t('stripe.banner.titleError')
        : isInfo
            ? t('stripe.banner.titleInfo')
            : t('stripe.banner.titleWarning');

    let deadlineText: string | null = null;
    if (futureDueAtIso) {
        try {
            const due = new Date(futureDueAtIso);
            const hours = Math.max(0, Math.round((due.getTime() - Date.now()) / 3_600_000));
            if (hours < 48) {
                deadlineText = hours <= 1 ? t('stripe.banner.deadlineLessThanHour') : t('stripe.banner.deadlineHours', { hours });
            } else {
                const days = Math.round(hours / 24);
                deadlineText = t('stripe.banner.deadlineDays', { count: days });
            }
        } catch { /* ignore */ }
    }

    const IconComponent = isInfo ? Info : AlertTriangle;

    return (
        <div
            className={`ep-alert ep-alert--${severity}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
        >
            <IconComponent className="ep-alert-icon h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
            <div className="ep-alert-body">
                <p className="ep-alert-title">
                    {title}
                    {deadlineText && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium opacity-80">
                            <Clock className="h-3 w-3" aria-hidden />
                            {deadlineText}
                        </span>
                    )}
                </p>
                {!isStaleSuccessDetail(stripeStatus, statusMessage) && (
                    <p className="ep-alert-desc">
                        {statusMessage}
                    </p>
                )}
                {onOpenStripe && (
                    <button
                        type="button"
                        onClick={onOpenStripe}
                        className="ep-alert-cta"
                    >
                        {t('stripe.banner.cta')}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </button>
                )}
            </div>
        </div>
    );
};
