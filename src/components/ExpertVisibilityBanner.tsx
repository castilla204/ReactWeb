import React from 'react';
import { Eye, EyeOff, AlertTriangle, MapPin, Plane, FileText, Zap } from 'lucide-react';
import { STRIPE_STATUS } from '../constants/stripeStatus';
import { STRIPE_ERROR_STATES, STRIPE_WARNING_STATES } from '../utils/stripeStatusStyles';

interface ExpertVisibilityBannerProps {
    stripeStatus: string | null | undefined;
    onboardingCompleted: boolean | null | undefined;
    isOnVacation: boolean | null | undefined;
    country: string | null | undefined;
    latitude: string | number | null | undefined;
    longitude: string | number | null | undefined;
    servicesCount: number;
    onOpenStripe?: () => void;
    onDisableVacation?: () => void;
    onEditProfile?: () => void;
}

/**
 * 🛡️ Round 29 MUD-DE — Banner ÚNICO que le dice al experto si sus servicios
 * SON o NO son visibles a clientes, y POR QUÉ.
 *
 * El caso real (reportado por el usuario): un experto en ActionRequired tiene
 * `service.IsActive=true` pero NO sale en el mapa porque
 * `SearchServiceService.cs:461-462` solo permite Approved+OnboardingCompleted
 * o PendingVerification. El sidebar dice "Atención requerida" + el banner
 * Stripe dice "Hay datos pendientes" — pero ninguno conecta con la
 * consecuencia comercial real: "no apareces en búsquedas, no recibes nuevas
 * contrataciones".
 *
 * Auditoría adversarial de 5 agentes detectó este gap como CRÍTICO P0 —
 * patrón canónico de la industria (Amazon Suppressed listings, Airbnb
 * Snoozed vs Unlisted, Stripe notification_banner). DSA Art. 17 obliga a
 * dar Statement of Reasons cuando una plataforma oculta el contenido de
 * un seller.
 *
 * Razones por orden de severidad (la primera "blocking" se muestra):
 *   1. !onboardingCompleted → "Termina tu onboarding para empezar a aparecer"
 *   2. stripeStatus en ERROR_STATES → "Bloqueado por Stripe"
 *   3. stripeStatus en WARNING_STATES → "Pendiente de resolución Stripe"
 *   4. isOnVacation → "Modo vacaciones activo"
 *   5. !country → "Configura tu país"
 *   6. (!latitude || !longitude) → "Sin ubicación en mapa"
 *   7. servicesCount === 0 → "Crea tu primer servicio"
 *   8. caso OK → confirmación verde "Visible en búsquedas"
 */
export const ExpertVisibilityBanner: React.FC<ExpertVisibilityBannerProps> = ({
    stripeStatus,
    onboardingCompleted,
    isOnVacation,
    country,
    latitude,
    longitude,
    servicesCount,
    onOpenStripe,
    onDisableVacation,
    onEditProfile
}) => {
    // Detectar la razón blocking dominante (orden importa).
    const status = (stripeStatus || '').toString();
    const isStripeError = STRIPE_ERROR_STATES.includes(status);
    const isStripeWarning = STRIPE_WARNING_STATES.includes(status) && !isStripeError;
    const hasLatLng = Boolean(
        latitude !== null && latitude !== undefined && latitude !== '' &&
        longitude !== null && longitude !== undefined && longitude !== ''
    );

    type Reason = {
        severity: 'error' | 'warning' | 'info' | 'ok';
        icon: React.ElementType;
        title: string;
        body: string;
        cta?: { label: string; onClick: () => void };
    };

    let reason: Reason;

    if (onboardingCompleted === false || status === STRIPE_STATUS.NOT_REQUESTED || status === STRIPE_STATUS.PENDING) {
        reason = {
            severity: 'warning',
            icon: FileText,
            title: 'Termina tu onboarding para aparecer en búsquedas',
            body: 'Tus servicios NO están visibles a clientes hasta que completes el registro de tu cuenta de pagos. Tampoco recibirás nuevas contrataciones mientras tanto.',
            cta: onOpenStripe ? { label: 'Continuar onboarding', onClick: onOpenStripe } : undefined,
        };
    } else if (isStripeError) {
        reason = {
            severity: 'error',
            icon: AlertTriangle,
            title: 'Tus servicios están OCULTOS por tu cuenta de Stripe',
            body: 'NO apareces en búsquedas y NO recibes nuevas contrataciones. Resuelve los requisitos de Stripe para que tus servicios vuelvan a ser visibles automáticamente.',
            cta: onOpenStripe ? { label: 'Resolver en Stripe', onClick: onOpenStripe } : undefined,
        };
    } else if (isStripeWarning) {
        reason = {
            severity: 'warning',
            icon: AlertTriangle,
            title: 'Tus servicios están OCULTOS — Stripe te pide acciones',
            body: 'Mientras tu cuenta de Stripe tenga datos pendientes, NO apareces en búsquedas a clientes. Cuando completes los requisitos, volverás a ser visible automáticamente (sin pasos extra).',
            cta: onOpenStripe ? { label: 'Resolver en Stripe', onClick: onOpenStripe } : undefined,
        };
    } else if (isOnVacation === true) {
        reason = {
            severity: 'info',
            icon: Plane,
            title: 'Modo vacaciones activo — tus servicios están ocultos voluntariamente',
            body: 'Tus servicios NO aparecen en búsquedas mientras estés en vacaciones. Cuando vuelvas, desactívalo y tus servicios reaparecerán automáticamente.',
            cta: onDisableVacation ? { label: 'Volver de vacaciones', onClick: onDisableVacation } : undefined,
        };
    } else if (!country || country.trim().length === 0) {
        reason = {
            severity: 'warning',
            icon: MapPin,
            title: 'Configura tu país para empezar a aparecer',
            body: 'Sin país asignado a tu perfil, tus servicios NO pueden mostrarse a clientes locales. Edita tu perfil para indicar tu país.',
            cta: onEditProfile ? { label: 'Editar perfil', onClick: onEditProfile } : undefined,
        };
    } else if (!hasLatLng) {
        reason = {
            severity: 'warning',
            icon: MapPin,
            title: 'Sin ubicación en mapa — tus servicios están ocultos',
            body: 'Tu perfil no tiene coordenadas válidas. El mapa de búsqueda no puede mostrarte a clientes sin una ubicación. Edita tu perfil y selecciona tu zona en el mapa.',
            cta: onEditProfile ? { label: 'Añadir ubicación', onClick: onEditProfile } : undefined,
        };
    } else if (servicesCount === 0) {
        reason = {
            severity: 'info',
            icon: Zap,
            title: 'Crea tu primer servicio para empezar a recibir clientes',
            body: 'Tu cuenta está lista pero aún no has creado ningún servicio. Cuando crees uno, aparecerá en el mapa para los clientes de tu zona.',
        };
    } else {
        reason = {
            severity: 'ok',
            icon: Eye,
            title: `Tus ${servicesCount === 1 ? 'servicio aparece' : `${servicesCount} servicios aparecen`} en búsquedas`,
            body: 'Tus servicios son visibles a clientes en tu zona y puedes recibir nuevas contrataciones. Mantén tu cuenta y datos actualizados para seguir apareciendo.',
        };
    }

    // Estilos por severidad (fondo blanco siempre, color solo en icono + título).
    const iconColor =
        reason.severity === 'ok' ? 'text-emerald-600'
        : reason.severity === 'error' ? 'text-red-600'
        : reason.severity === 'warning' ? 'text-orange-600'
        : 'text-blue-600';
    const titleColor =
        reason.severity === 'ok' ? 'text-emerald-700'
        : reason.severity === 'error' ? 'text-red-700'
        : reason.severity === 'warning' ? 'text-orange-700'
        : 'text-blue-700';
    const ariaRole = reason.severity === 'error' ? 'alert' : 'status';
    const ariaLive = reason.severity === 'error' ? 'assertive' : 'polite';
    const Icon = reason.icon;
    const isHidden = reason.severity !== 'ok';
    const StatusIcon = isHidden ? EyeOff : Eye;

    return (
        <div
            className="mb-4 flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
            role={ariaRole}
            aria-live={ariaLive}
        >
            <div className={`flex items-center gap-1 flex-shrink-0 ${iconColor}`}>
                <StatusIcon className="h-5 w-5 mt-0.5" />
                <Icon className="h-4 w-4 mt-1 opacity-70" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${titleColor}`}>{reason.title}</p>
                <p className="mt-1 text-sm text-gray-700 leading-snug">{reason.body}</p>
                {reason.cta && (
                    <button
                        type="button"
                        onClick={reason.cta.onClick}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                    >
                        {reason.cta.label} →
                    </button>
                )}
            </div>
        </div>
    );
};
