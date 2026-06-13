import React from 'react';
import { Eye, EyeOff, PlaneTakeoff, AlertCircle } from 'lucide-react';
import { STRIPE_STATUS } from '../../constants/stripeStatus';
import { STRIPE_ERROR_STATES, STRIPE_WARNING_STATES } from '../../utils/stripeStatusStyles';

interface ExpertPanelStatusPillProps {
    stripeStatus?: string | null;
    onboardingCompleted?: boolean | null;
    isOnVacation?: boolean | null;
    country?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    servicesCount?: number;
    hasPhoto?: boolean;
    hasDescription?: boolean;
    phoneSmsCapable?: boolean;
}

export function ExpertPanelStatusPill({
    stripeStatus,
    onboardingCompleted,
    isOnVacation,
    country,
    latitude,
    longitude,
    servicesCount = 0,
    hasPhoto,
    hasDescription,
    phoneSmsCapable,
}: ExpertPanelStatusPillProps) {
    const status = (stripeStatus || '').toString();
    const isStripeError   = STRIPE_ERROR_STATES.includes(status);
    const isStripeWarning = STRIPE_WARNING_STATES.includes(status) && !isStripeError;
    const hasLatLng = Boolean(
        latitude  !== null && latitude  !== undefined && latitude  !== ''
        && longitude !== null && longitude !== undefined && longitude !== '',
    );

    let tone: 'visible' | 'hidden' | 'neutral' | 'error' = 'hidden';
    let label = 'Oculto en búsquedas';
    let Icon: React.ElementType = EyeOff;

    if (isStripeError) {
        tone  = 'error';
        label = 'Cuenta bloqueada';
        Icon  = AlertCircle;
    } else if (isOnVacation) {
        tone  = 'neutral';
        label = 'Modo vacaciones';
        Icon  = PlaneTakeoff;
    } else if (
        onboardingCompleted !== false
        && status !== STRIPE_STATUS.NOT_REQUESTED
        && status !== STRIPE_STATUS.PENDING
        && !isStripeWarning
        && country
        && hasLatLng
        && hasPhoto  !== false
        && hasDescription !== false
        && phoneSmsCapable !== false
        && servicesCount > 0
    ) {
        tone  = 'visible';
        label = servicesCount === 1 ? '1 servicio visible' : `${servicesCount} servicios visibles`;
        Icon  = Eye;
    } else if (isStripeWarning) {
        tone  = 'hidden';
        label = 'Pagos pendientes';
        Icon  = AlertCircle;
    } else if (!hasLatLng || hasPhoto === false || hasDescription === false || phoneSmsCapable === false) {
        label = 'Perfil incompleto';
    } else if (servicesCount === 0) {
        tone  = 'neutral';
        label = 'Sin servicios';
        Icon  = EyeOff;
    }

    return (
        <span className={`expert-status-pill expert-status-pill--${tone}`}>
            <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            <span>{label}</span>
        </span>
    );
}
