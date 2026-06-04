// 🛡️ Round 28 MUD-CA: helpers compartidos de estilos Stripe status.
//
// ANTES: StripeStatusCard.tsx, StripeStatusModal.tsx y StripeStatusBanner.tsx
// tenían COPIAS LOCALES de `getStatusIconClass`, `getStatusBadgeClass` y
// `getButtonClass` con colores divergentes (Card recibió rebrand a fondos
// blancos en R29; Modal seguía con `bg-orange-600`, `bg-amber-600`, etc).
// Resultado: experto veía UI inconsistente entre la card del panel y el
// modal que se abre desde toasts/eventos.
//
// AHORA: un único módulo, fondo blanco siempre (preferencia usuario MUD-),
// color solo en texto + icono. Card / Modal / Banner consumen los mismos
// helpers — futuras tweaks se propagan automáticamente.

import { STRIPE_STATUS } from '../constants/stripeStatus';

// 🛡️ Round 28 MUD-CJ: arrays compartidos de severidad. Antes el banner tenía
// copias locales hardcoded → drift garantizado si se añade un estado nuevo a
// los helpers (Card/Modal lo pintan correcto, banner lo silencia con return null).
// Single source of truth para Banner + Card + Modal.
export const STRIPE_WARNING_STATES: readonly string[] = [
    STRIPE_STATUS.REQUIREMENTS_DUE,
    STRIPE_STATUS.RESTRICTED_SOON,
    STRIPE_STATUS.ACTION_REQUIRED,
] as const;

export const STRIPE_ERROR_STATES: readonly string[] = [
    STRIPE_STATUS.REQUIREMENTS_PAST_DUE,
    STRIPE_STATUS.RESTRICTED,
    STRIPE_STATUS.DISABLED,
    STRIPE_STATUS.REJECTED,
    STRIPE_STATUS.DEAUTHORIZED,
] as const;

// 🛡️ MUD-DA: PENDING NO debería estar en INFO_STATES.
//
// Razón: `PENDING` significa onboarding INCOMPLETO (acción del experto pendiente
// — "Continuar Verificación"). `PENDING_VERIFICATION` significa Stripe revisando
// docs ya subidos (el experto NO tiene nada que hacer). Tratarlos igual provocaba
// que el Banner pintara `PENDING` como azul info "no hagas nada" mientras la Card
// debajo decía ámbar "⏳ Continuar Verificación" → mensaje contradictorio.
//
// Ahora: solo `PENDING_VERIFICATION` es INFO (Stripe trabajando en background).
// `PENDING` cae al `if (!isError && !isWarning && !isInfo) return null;` del
// banner → no se muestra (la Card ya pinta el CTA "Continuar"). Si en el futuro
// queremos un banner específico para `PENDING`, crear `STRIPE_PROGRESS_STATES`.
export const STRIPE_INFO_STATES: readonly string[] = [
    STRIPE_STATUS.PENDING_VERIFICATION,
    // 🛡️ LOTE C-16: UnderReview comparte tratamiento INFO (azul, sin acción) con PendingVerification.
    STRIPE_STATUS.UNDER_REVIEW,
] as const;

/**
 * Clase para el icono circular grande del estado (Card empty state icon).
 * Fondo siempre blanco con borde gris; color en el texto.
 */
export const getStatusIconClass = (status: string): string => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return 'bg-white text-green-600 border border-gray-200';
        case STRIPE_STATUS.PENDING:
        case STRIPE_STATUS.PENDING_VERIFICATION:
        // 🛡️ LOTE C-16: UnderReview comparte estilo INFO con PendingVerification.
        case STRIPE_STATUS.UNDER_REVIEW:
            return 'bg-white text-blue-600 border border-gray-200';
        case STRIPE_STATUS.ACTION_REQUIRED:
        case STRIPE_STATUS.REQUIREMENTS_DUE:
        case STRIPE_STATUS.RESTRICTED_SOON:
            return 'bg-white text-orange-600 border border-gray-200';
        case STRIPE_STATUS.REQUIREMENTS_PAST_DUE:
        case STRIPE_STATUS.RESTRICTED:
            return 'bg-white text-orange-700 border border-gray-200';
        case STRIPE_STATUS.DISABLED:
        case STRIPE_STATUS.REJECTED:
            return 'bg-white text-red-600 border border-gray-200';
        case STRIPE_STATUS.DEAUTHORIZED:
            return 'bg-white text-purple-600 border border-gray-200';
        default:
            return 'bg-white text-gray-600 border border-gray-200';
    }
};

/**
 * Clase para badge inline (chip "Aprobado" / "Restringido" / etc).
 * Fondo siempre blanco con borde gris; color en el texto.
 */
export const getStatusBadgeClass = (status?: string): string => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return 'bg-white text-green-700 border border-gray-200';
        case STRIPE_STATUS.PENDING:
        case STRIPE_STATUS.PENDING_VERIFICATION:
        // 🛡️ LOTE C-16: UnderReview comparte estilo INFO con PendingVerification.
        case STRIPE_STATUS.UNDER_REVIEW:
            return 'bg-white text-blue-700 border border-gray-200';
        case STRIPE_STATUS.ACTION_REQUIRED:
        case STRIPE_STATUS.REQUIREMENTS_DUE:
        case STRIPE_STATUS.RESTRICTED_SOON:
            return 'bg-white text-orange-700 border border-gray-200';
        case STRIPE_STATUS.REQUIREMENTS_PAST_DUE:
        case STRIPE_STATUS.RESTRICTED:
            return 'bg-white text-orange-800 border border-gray-200';
        case STRIPE_STATUS.DISABLED:
        case STRIPE_STATUS.REJECTED:
            return 'bg-white text-red-700 border border-gray-200';
        case STRIPE_STATUS.DEAUTHORIZED:
            return 'bg-white text-purple-700 border border-gray-200';
        default:
            return 'bg-white text-gray-700 border border-gray-200';
    }
};

/**
 * Clase para botones CTA según acción. Aquí SÍ usamos color sólido (son
 * llamadas a acción, no fondos de estado). Harmonizado con `bg-brand` (R29).
 */
export const getButtonClass = (action: string): string => {
    switch (action) {
        case 'setup':
        case 'retry':
        case 'complete_requirements':
        case 'edit_account':
        case 'success':
            return 'bg-brand hover:bg-brand-hover text-white';
        case 'wait':
        case 'contact':
        default:
            return 'bg-gray-700 hover:bg-gray-800 text-white';
    }
};
