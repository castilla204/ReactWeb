import type { TFunction } from 'i18next';

/**
 * 🛡️ Round 28 — Sprint US-2 (SUS2-9): traduce keys raw de Stripe (snake_case con puntos)
 * a texto humano internacionalizado. Usa el namespace `stripe.requirements.*` de i18next.
 *
 * Si la key no existe en el diccionario, hace fallback formateando el string raw
 * (snake_case + dots → "snake case" lowercase). Esto es robusto a keys nuevas que
 * Stripe pueda añadir en el futuro: la UI no se rompe, solo aparece menos pulido
 * hasta que se añada la traducción.
 *
 * USO:
 *   const { t } = useTranslation();
 *   const label = translateStripeRequirement('individual.ssn_last_4', t);
 *   // ES: "Últimos 4 dígitos del SSN" / EN: "SSN last 4 digits"
 */
export function translateStripeRequirement(rawKey: string | null | undefined, t: TFunction): string {
    if (!rawKey || typeof rawKey !== 'string') return '';
    const trimmed = rawKey.trim();
    if (!trimmed) return '';

    // Stripe a veces incluye un prefijo person_XYZ. → strippearlo para que las keys del
    // i18n.json (sin prefijo person) funcionen para todos los owners de una company.
    // Ej: "person_abc123.verification.document" → "individual.verification.document"
    const normalized = trimmed.replace(/^person_[A-Za-z0-9]+\./, 'individual.');

    // i18next devuelve la propia key si no encuentra traducción (returnNull:false).
    // Por eso comparamos al final: si lo devuelto es el path completo, hacemos fallback.
    const i18nKey = `stripe.requirements.${normalized}`;
    const translated = t(i18nKey);

    if (translated && translated !== i18nKey) {
        return translated;
    }

    // Fallback: snake_case + dots → "snake case" capitalizado.
    return normalized
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Traduce una lista de requirements (separados por comas o array) a un string humano.
 * Útil cuando el backend devuelve `StripeFutureRequirements` como CSV.
 */
export function translateStripeRequirementsList(
    raw: string | string[] | null | undefined,
    t: TFunction
): string {
    if (!raw) return '';
    const list = Array.isArray(raw) ? raw : raw.split(',').map(s => s.trim()).filter(Boolean);
    return list.map(item => translateStripeRequirement(item, t)).filter(Boolean).join(', ');
}
