/**
 * Utilidades para manejar precios con Stripe Tax
 */

/**
 * Interfaz unificada para objetos que tienen información de precio
 */
interface PriceInfo {
  amount?: number;
  Amount?: number;
  baseAmount?: number;
  BaseAmount?: number;
  taxAmount?: number;
  TaxAmount?: number;
}

/**
 * Resultado de la función getPriceDisplay
 */
export interface PriceDisplayInfo {
  total: number;
  base: number;
  tax: number;
  hasTaxInfo: boolean;
  formattedTotal: string;
  formattedBase: string | null;
  formattedTax: string | null;
}

/**
 * 🛡️ Round 10 — P-A FIX: coerción segura a número finito.
 *
 * Si llega NaN, Infinity, null, undefined, string no-parseable o un objeto raro
 * desde el backend (decimal serializado como string, campo ausente, etc.), devolvemos
 * `fallback` (0 por defecto). Sin esto, `Intl.NumberFormat.format(NaN)` devuelve la
 * cadena literal "NaN €" en es-ES — peor que un 0,00 €.
 */
function toFiniteNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    // Aceptar tanto "16.50" como "16,50" (locale español del backend si llegara)
    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Obtiene el precio a mostrar en la UI
 * @param priceInfo - Objeto con información de precios (SearchHireDto, SearchHireResponseDto, etc.)
 * @returns Objeto con precio total, base y tax (si disponible)
 */
export function getPriceDisplay(priceInfo: PriceInfo | null | undefined): PriceDisplayInfo {
  if (!priceInfo) {
    return {
      total: 0,
      base: 0,
      tax: 0,
      hasTaxInfo: false,
      formattedTotal: formatCurrency(0),
      formattedBase: null,
      formattedTax: null,
    };
  }

  // Obtener valores (soporta tanto camelCase como PascalCase) con coerción segura
  const total = toFiniteNumber(priceInfo.amount ?? priceInfo.Amount);
  const baseRaw = priceInfo.baseAmount ?? priceInfo.BaseAmount;
  const taxRaw = priceInfo.taxAmount ?? priceInfo.TaxAmount;
  const base = baseRaw != null ? toFiniteNumber(baseRaw) : null;
  const tax = taxRaw != null ? toFiniteNumber(taxRaw) : null;

  // Si hay información de tax, mostrar desglose
  const hasTaxInfo = base != null && tax != null && tax > 0;

  return {
    total: total,
    base: base ?? total, // Fallback a total si no hay base
    tax: tax ?? 0,
    hasTaxInfo: hasTaxInfo,
    // Helper para formatear
    formattedTotal: formatCurrency(total),
    formattedBase: base != null ? formatCurrency(base) : null,
    formattedTax: tax != null && tax > 0 ? formatCurrency(tax) : null,
  };
}

/**
 * Formatea un número como moneda en euros
 * @param amount - Cantidad a formatear (acepta number, string o null/undefined; se hace coerción segura)
 * @returns String formateado (ej: "16,50 €" en es-ES). Devuelve "0,00 €" si el valor no es un número finito.
 */
// 🛡️ N25 TODO arquitectural: i18n. Hardcodear locale='es-ES' + currency='EUR' es correcto
// MIENTRAS la plataforma sirva solo a España. Cuando se internacionalice (clientes en otros
// países de la whitelist EEA+US+CA+GB+CH), implementar:
//  - react-i18next (o similar) para textos UI.
//  - Hook useLocale() que devuelva el locale del usuario (Accept-Language, preferencia perfil).
//  - Hook useCurrency() para EUR/CHF/GBP/USD según país del cliente.
//  - Cambiar firma a formatCurrency(amount, locale?, currency?).
// Por ahora el currency es fijo EUR (la plataforma cobra siempre en EUR vía Stripe — ver N2
// descartado en ronda 2: decisión de diseño correcta porque Stripe convierte automático al pagar).
//
// 🛡️ Round 10 — P-A FIX: ahora acepta unknown y hace coerción defensiva.
export function formatCurrency(amount: unknown): string {
  const safe = toFiniteNumber(amount);
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * 🛡️ Round 10 — P-B FIX: helper para reemplazar `${amount.toFixed(2)} €` inline.
 *
 * Distinto de formatCurrency: este devuelve SOLO el número con coma decimal
 * española y 2 decimales fijos, SIN símbolo de moneda. Útil cuando el diseño
 * pone el "€" como elemento separado (icono, span con color, etc.).
 *
 * Centraliza la coerción NaN-safe y el locale "es-ES" para que ningún componente
 * tenga que reimplementar `.toFixed(2)` (que usa locale "en-US" por defecto y rompe).
 *
 * Ejemplos:
 *   formatPriceNumber(16.5)       → "16,50"
 *   formatPriceNumber(16.999)     → "17,00"
 *   formatPriceNumber(NaN)        → "0,00"
 *   formatPriceNumber(null)       → "0,00"
 *   formatPriceNumber("16.50")    → "16,50"
 */
export function formatPriceNumber(amount: unknown, locale?: string | null): string {
  const safe = toFiniteNumber(amount);
  return new Intl.NumberFormat(locale || 'es-ES', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * Valida la consistencia de precios (BaseAmount + TaxAmount = Amount)
 * @param priceInfo - Objeto con información de precios
 * @returns true si los precios son consistentes, false si hay discrepancia
 */
export function validatePriceConsistency(priceInfo: PriceInfo | null | undefined): boolean {
  if (!priceInfo) return true;

  const baseAmount = priceInfo.baseAmount ?? priceInfo.BaseAmount;
  const taxAmount = priceInfo.taxAmount ?? priceInfo.TaxAmount;
  const amountRaw = priceInfo.amount ?? priceInfo.Amount;

  // Si no hay información de tax, no validar
  if (baseAmount == null || taxAmount == null) {
    return true;
  }

  // 🛡️ Round 10 — P-A FIX: coerción segura antes de operar
  const baseSafe = toFiniteNumber(baseAmount);
  const taxSafe = toFiniteNumber(taxAmount);
  const amountSafe = toFiniteNumber(amountRaw);

  const calculatedTotal = baseSafe + taxSafe;
  const difference = Math.abs(calculatedTotal - amountSafe);

  // Permitir pequeñas diferencias por redondeo (ej: 0.01€)
  return difference < 0.02;
}
