import React from 'react';
import { AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import { STRIPE_STATUS } from '../constants/stripeStatus';

interface StripeStatusBannerProps {
    stripeStatus: string;
    statusMessage: string;
    canCreateServices: boolean;
    canReceivePayments: boolean;
    futureDueAtIso?: string | null;
    onOpenStripe?: () => void;
}

/**
 * 🛡️ Round 28 MUD-BP — Banner persistente en ExpertPanel cuando hay warnings Stripe.
 *
 * Antes: este componente era código muerto (nunca se importaba en ningún sitio).
 * Estados warning (RequirementsDue, RestrictedSoon, ActionRequired, RequirementsPastDue,
 * PendingVerification con datos pendientes) solo se reflejaban en un micro-badge del
 * sidebar — el experto no entendía que tenía que ir a Stripe ya.
 *
 * Ahora: el panel lo monta arriba siempre que stripeStatus esté en estado warning, NO
 * descartable (preferencia usuario MUD-BP — la dismissibilidad anterior con localStorage
 * era anti-patrón para alertas críticas). Fondo BLANCO siempre (preferencia usuario).
 * Severidad se distingue por el color del icono + texto, no por bg.
 */
export const StripeStatusBanner: React.FC<StripeStatusBannerProps> = ({
    stripeStatus,
    statusMessage,
    canCreateServices,
    canReceivePayments,
    futureDueAtIso,
    onOpenStripe
}) => {
    // 🛡️ MUD-BZ: PendingVerification es DISTINTO de los demás warnings. Stripe está
    // REVISANDO documentos que ya subiste — el experto NO tiene nada que hacer ahora,
    // solo esperar. Title naranja urgente + CTA "resolver" lo invita a ir a Stripe
    // donde no encuentra nada → frustración + tickets soporte. Categorizar como INFO
    // (azul-gris, sin CTA accionable) o no mostrar si puede operar normalmente.
    const isPendingVerificationOk = stripeStatus === STRIPE_STATUS.PENDING_VERIFICATION
                                  && canCreateServices && canReceivePayments;
    const warningStates: string[] = [
        STRIPE_STATUS.REQUIREMENTS_DUE,
        STRIPE_STATUS.RESTRICTED_SOON,
        STRIPE_STATUS.ACTION_REQUIRED,
    ];
    const errorStates: string[] = [
        STRIPE_STATUS.REQUIREMENTS_PAST_DUE,
        STRIPE_STATUS.RESTRICTED,
        STRIPE_STATUS.DISABLED,
        STRIPE_STATUS.REJECTED,
        STRIPE_STATUS.DEAUTHORIZED,
    ];

    const isError = errorStates.includes(stripeStatus) || (!canCreateServices && !canReceivePayments);
    const isInfo = isPendingVerificationOk
                || (stripeStatus === STRIPE_STATUS.PENDING_VERIFICATION && !isError);
    const isWarning = warningStates.includes(stripeStatus) && !isError && !isInfo;

    if (!isError && !isWarning && !isInfo) return null;

    // Colores SOLO en icono + texto, fondo blanco siempre.
    const iconColor = isError ? 'text-red-600' : (isInfo ? 'text-blue-600' : 'text-orange-600');
    const titleColor = isError ? 'text-red-700' : (isInfo ? 'text-blue-700' : 'text-orange-700');
    const title = isError
        ? 'Tu cuenta de pagos necesita atención urgente'
        : isInfo
            ? 'Stripe está revisando tu cuenta'
            : 'Hay datos pendientes en tu cuenta de pagos';

    // Calcular plazo legible.
    let deadlineText: string | null = null;
    if (futureDueAtIso) {
        try {
            const due = new Date(futureDueAtIso);
            const hours = Math.max(0, Math.round((due.getTime() - Date.now()) / 3_600_000));
            if (hours < 48) {
                deadlineText = hours <= 1 ? 'plazo menos de 1 hora' : `plazo ${hours}h`;
            } else {
                const days = Math.round(hours / 24);
                deadlineText = `plazo ${days} día${days === 1 ? '' : 's'}`;
            }
        } catch { /* ignore */ }
    }

    return (
        <div
            className="mb-4 flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
        >
            <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${titleColor}`}>
                    {title}
                    {deadlineText && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                            <Clock className="h-3 w-3" />
                            {deadlineText}
                        </span>
                    )}
                </p>
                <p
                    className="mt-1 text-sm text-gray-700 leading-snug"
                    dangerouslySetInnerHTML={{
                        __html: statusMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }}
                />
                {onOpenStripe && (
                    <button
                        type="button"
                        onClick={onOpenStripe}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                    >
                        Resolver ahora en Stripe
                        <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
};
