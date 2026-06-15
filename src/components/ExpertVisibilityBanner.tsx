import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
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
    /** 🧩 Coordinado con el gate del backend: foto y descripción son obligatorias. */
    hasPhoto?: boolean;
    hasDescription?: boolean;
    /** 📱 Móvil verificado (no fijo). undefined = aún cargando (no se evalúa). */
    phoneSmsCapable?: boolean;
    /** ⏰ Deadline real de Stripe (current_deadline) para mostrar urgencia en estados error/warning. */
    futureDueAtIso?: string | null;
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
 *   7. !hasPhoto || !hasDescription → "Completa tu perfil" (gate backend)
 *   8. !phoneSmsCapable → "Verifica tu móvil" (gate backend)
 *   9. servicesCount === 0 → "Crea tu primer servicio"
 *  10. caso OK → confirmación verde "Visible en búsquedas"
 *
 * ⚠️ COORDINACIÓN: los pasos 1-8 replican EXACTAMENTE el Where de visibilidad de
 * SearchServiceService.cs (y GET /api/User/expert-visibility). Si el backend añade
 * o quita un requisito, este banner y ProfileCompletionCard deben actualizarse.
 */
export const ExpertVisibilityBanner: React.FC<ExpertVisibilityBannerProps> = ({
    stripeStatus,
    onboardingCompleted,
    isOnVacation,
    country,
    latitude,
    longitude,
    servicesCount,
    hasPhoto,
    hasDescription,
    phoneSmsCapable,
    futureDueAtIso,
    onOpenStripe,
    onDisableVacation,
    onEditProfile
}) => {
    const { t } = useTranslation();
    // Detectar la razón blocking dominante (orden importa).
    const status = (stripeStatus || '').toString();
    const isStripeError = STRIPE_ERROR_STATES.includes(status);
    const isStripeWarning = STRIPE_WARNING_STATES.includes(status) && !isStripeError;
    const hasLatLng = Boolean(
        latitude !== null && latitude !== undefined && latitude !== '' &&
        longitude !== null && longitude !== undefined && longitude !== ''
    );

    // ⏰ Urgencia del plazo de Stripe (antes solo la mostraba el StripeStatusBanner, ya retirado).
    let stripeDeadlineSuffix = '';
    if ((isStripeError || isStripeWarning) && futureDueAtIso) {
        const d = new Date(futureDueAtIso);
        if (!isNaN(d.getTime())) {
            const date = d.toLocaleDateString(i18n.language || 'es-ES', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
            stripeDeadlineSuffix = t('stripe.visibility.deadlineSuffix', { date });
        }
    }

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
            title: t('stripe.visibility.onboardingTitle'),
            body: t('stripe.visibility.onboardingBody'),
            cta: onOpenStripe ? { label: t('stripe.visibility.ctaContinueOnboarding'), onClick: onOpenStripe } : undefined,
        };
    } else if (isStripeError) {
        reason = {
            severity: 'error',
            icon: AlertTriangle,
            title: t('stripe.visibility.stripeErrorTitle'),
            body: t('stripe.visibility.stripeErrorBody') + stripeDeadlineSuffix,
            cta: onOpenStripe ? { label: t('stripe.visibility.ctaResolveStripe'), onClick: onOpenStripe } : undefined,
        };
    } else if (isStripeWarning) {
        reason = {
            severity: 'warning',
            icon: AlertTriangle,
            title: t('stripe.visibility.stripeWarningTitle'),
            body: t('stripe.visibility.stripeWarningBody') + stripeDeadlineSuffix,
            cta: onOpenStripe ? { label: t('stripe.visibility.ctaResolveStripe'), onClick: onOpenStripe } : undefined,
        };
    } else if (status === STRIPE_STATUS.UNDER_REVIEW) {
        // Stripe revisa la cuenta manualmente → el gate de visibilidad NO la incluye (a diferencia
        // de PendingVerification, que sí aparece y por eso cae al check OK). No requiere acción.
        reason = {
            severity: 'info',
            icon: AlertTriangle,
            title: t('stripe.visibility.underReviewTitle'),
            body: t('stripe.visibility.underReviewBody'),
        };
    } else if (isOnVacation === true) {
        reason = {
            severity: 'info',
            icon: Plane,
            title: t('stripe.visibility.vacationTitle'),
            body: t('stripe.visibility.vacationBody'),
            cta: onDisableVacation ? { label: t('stripe.visibility.ctaBackFromVacation'), onClick: onDisableVacation } : undefined,
        };
    } else if (!country || country.trim().length === 0) {
        reason = {
            severity: 'warning',
            icon: MapPin,
            title: t('stripe.visibility.countryTitle'),
            body: t('stripe.visibility.countryBody'),
            cta: onEditProfile ? { label: t('stripe.visibility.ctaEditProfile'), onClick: onEditProfile } : undefined,
        };
    } else if (!hasLatLng) {
        reason = {
            severity: 'warning',
            icon: MapPin,
            title: t('stripe.visibility.locationTitle'),
            body: t('stripe.visibility.locationBody'),
            cta: onEditProfile ? { label: t('stripe.visibility.ctaAddLocation'), onClick: onEditProfile } : undefined,
        };
    } else if (hasPhoto === false || hasDescription === false) {
        // 🧩 Coordinado con el gate del backend: sin foto o descripción NO se aparece.
        const missing = [
            hasPhoto === false ? t('stripe.visibility.missingPhoto') : null,
            hasDescription === false ? t('stripe.visibility.missingDescription') : null,
        ].filter(Boolean).join(t('stripe.visibility.and'));
        reason = {
            severity: 'warning',
            icon: FileText,
            title: t('stripe.visibility.profileTitle'),
            body: t('stripe.visibility.profileBody', { missing }),
            cta: onEditProfile ? { label: t('stripe.visibility.ctaCompleteProfile'), onClick: onEditProfile } : undefined,
        };
    } else if (phoneSmsCapable === false) {
        // 📱 Coordinado con el gate del backend: sin móvil verificado NO se aparece.
        reason = {
            severity: 'warning',
            icon: AlertTriangle,
            title: t('stripe.visibility.phoneTitle'),
            body: t('stripe.visibility.phoneBody'),
        };
    } else if (servicesCount === 0) {
        reason = {
            severity: 'info',
            icon: Zap,
            title: t('stripe.visibility.noServicesTitle'),
            body: t('stripe.visibility.noServicesBody'),
        };
    } else {
        reason = {
            severity: 'ok',
            icon: Eye,
            title: servicesCount === 1
                ? t('stripe.visibility.visibleTitleOne')
                : t('stripe.visibility.visibleTitleOther', { count: servicesCount }),
            body: t('stripe.visibility.visibleBody'),
        };
    }

    const ariaRole = reason.severity === 'error' ? 'alert' : 'status';
    const ariaLive = reason.severity === 'error' ? 'assertive' : 'polite';
    const Icon = reason.icon;
    const isHidden = reason.severity !== 'ok';
    const StatusIcon = isHidden ? EyeOff : Eye;
    const barClass = isHidden ? 'expert-visibility-bar expert-visibility-bar--hidden' : 'expert-visibility-bar expert-visibility-bar--ok';

    return (
        <div
            className={`mb-4 ${barClass}`}
            role={ariaRole}
            aria-live={ariaLive}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {isHidden ? <StatusIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{reason.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{reason.body}</p>
                {reason.cta && (
                    <button
                        type="button"
                        onClick={reason.cta.onClick}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                    >
                        {reason.cta.label} →
                    </button>
                )}
            </div>
        </div>
    );
};
