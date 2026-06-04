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
