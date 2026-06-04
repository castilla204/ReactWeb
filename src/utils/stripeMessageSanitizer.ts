// 🛡️ Round 29 MUD-DJ — Sanitizador compartido para el statusMessage del backend.
//
// El backend persiste `StripeStatusDetails` como string libre y el frontend lo
// consume desde múltiples lugares:
//   - getStatusInfo() en useExpertStripeStatus.ts (cubierto por MUD-CZ con SUCCESS_MARKERS)
//   - StripeStatusBanner.tsx (NO cubierto antes — regresión MUD-CZ detectada por auditoría)
//   - StripeStatusCard.tsx parsea con regex
//
// Bug detectado: backend persistía StripeStatus=ActionRequired pero
// StripeStatusDetails="Tu cuenta está activa y lista para cobrar." (mensaje stale
// del estado Approved). El frontend mostraba banner naranja con texto verde =
// contradicción visual. MUD-CZ lo fix-eó SOLO en getStatusInfo, no en el banner.
//
// Solución: helper compartido — banner y card lo importan e invocan antes de
// renderizar el mensaje crudo del backend.

import { STRIPE_STATUS } from '../constants/stripeStatus';

const ERROR_OR_WARNING_STATUSES = new Set<string>([
    STRIPE_STATUS.ACTION_REQUIRED,
    STRIPE_STATUS.REQUIREMENTS_DUE,
    STRIPE_STATUS.REQUIREMENTS_PAST_DUE,
    STRIPE_STATUS.RESTRICTED_SOON,
    STRIPE_STATUS.RESTRICTED,
    STRIPE_STATUS.DISABLED,
    STRIPE_STATUS.REJECTED,
    STRIPE_STATUS.DEAUTHORIZED,
]);

// Frases del mensaje de Approved que delatan un detail STALE.
// Negative lookahead `(?!.*\bno\b)` evitaría falsos positivos en mensajes
// negativos con palabras positivas, pero JS no soporta lookahead variable-width
// con consistencia cross-browser para "no" antes del marker; usamos un check
// adicional de palabra-de-negación al inicio del fragmento relevante.
const SUCCESS_MARKERS = /(activa\s+y\s+lista|lista\s+para\s+cobrar|cuenta\s+est[áa]\s+activa|approved|verificada|todo\s+est[áa]\s+correcto)/i;
const NEGATION_PREFIX = /\b(no|sin|nunca)\s+\w+\s*$/i;

/**
 * Detecta si el detalle del backend es coherente con el status actual.
 * Si es ERROR/WARNING y el detail tiene marcadores de éxito SIN palabra de
 * negación pegada, lo trata como STALE.
 */
export function isStaleSuccessDetail(stripeStatus: string | null | undefined, detail: string | null | undefined): boolean {
    if (!detail || !stripeStatus) return false;
    if (!ERROR_OR_WARNING_STATUSES.has(stripeStatus)) return false;
    const matchResult = SUCCESS_MARKERS.exec(detail);
    if (!matchResult) return false;
    // Mirar el texto justo antes del match para descartar negación.
    const prefix = detail.slice(0, matchResult.index);
    if (NEGATION_PREFIX.test(prefix)) return false;
    return true;
}

/**
 * Devuelve el mensaje saneado: si el detail es STALE, devuelve el fallback.
 * Si el detail es coherente o no hay defensa que aplicar, devuelve el detail.
 */
export function sanitizeStripeMessage(
    stripeStatus: string | null | undefined,
    detail: string | null | undefined,
    fallback: string
): string {
    if (isStaleSuccessDetail(stripeStatus, detail)) {
        return fallback;
    }
    return detail || fallback;
}
