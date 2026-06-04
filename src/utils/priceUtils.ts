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
  // 🛡️ Round 28: divisa snapshot del hire/transacción (ISO 4217). Si no viene, cae a EUR.
  currency?: string;
  Currency?: string;
  chargeCurrency?: string;
  ChargeCurrency?: string;
  priceCurrency?: string;
  PriceCurrency?: string;
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

  // 🛡️ Round 28: leer la divisa del hire/transacción. Antes el formateo caía siempre a EUR
  // por el default de formatCurrency, mostrando "€100" en hires GBP/CHF/etc.
  const currencyRaw = priceInfo.chargeCurrency ?? priceInfo.ChargeCurrency
    ?? priceInfo.priceCurrency ?? priceInfo.PriceCurrency
    ?? priceInfo.currency ?? priceInfo.Currency;
  const currency = (typeof currencyRaw === 'string' && currencyRaw.trim().length === 3)
    ? currencyRaw.trim().toUpperCase()
    : 'EUR';

  // Si hay información de tax, mostrar desglose
  const hasTaxInfo = base != null && tax != null && tax > 0;

  return {
    total: total,
    base: base ?? total, // Fallback a total si no hay base
    tax: tax ?? 0,
    hasTaxInfo: hasTaxInfo,
    // Helper para formatear con divisa real
    formattedTotal: formatCurrency(total, currency),
    formattedBase: base != null ? formatCurrency(base, currency) : null,
    formattedTax: tax != null && tax > 0 ? formatCurrency(tax, currency) : null,
  };
}

/**
 * 🛡️ Round 28: mapping país (ISO 3166-1 alpha-2) → moneda (ISO 4217 MAYÚSCULAS).
 * Espejo lógico del `StripeCurrencyMapping` del backend. Si el país no está mapeado,
 * cae a 'EUR' (mayoría del tráfico EEA).
 */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Zona euro
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR',
  GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR',
  MT: 'EUR', NL: 'EUR', PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR',
  // EU/EEA no eurozona
  SE: 'SEK', DK: 'DKK', NO: 'NOK', PL: 'PLN', HU: 'HUF', CZ: 'CZK', BG: 'BGN', RO: 'RON',
  // Franco suizo
  CH: 'CHF', LI: 'CHF',
  // No-EEA
  GB: 'GBP', US: 'USD', CA: 'CAD',
};

/**
 * 🛡️ Round 28: devuelve el código de divisa ISO 4217 (MAYÚSCULAS) para un país.
 * Null/desconocido → 'EUR' (fallback seguro).
 */
export function getCurrencyForCountry(countryCode: string | null | undefined): string {
  if (!countryCode || typeof countryCode !== 'string') return 'EUR';
  const upper = countryCode.trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[upper] ?? 'EUR';
}

/**
 * 🛡️ Round 28: devuelve el símbolo Unicode para una divisa ISO 4217. Si no
 * lo conocemos, devuelve el propio código (ej. 'SEK', 'PLN') — mejor que un € incorrecto.
 */
export function getCurrencySymbol(currency: string | null | undefined): string {
  const code = (currency ?? 'EUR').trim().toUpperCase();
  const map: Record<string, string> = {
    EUR: '€', GBP: '£', USD: '$', CAD: 'CA$', CHF: 'CHF',
    SEK: 'kr', DKK: 'kr', NOK: 'kr', PLN: 'zł', HUF: 'Ft',
    CZK: 'Kč', BGN: 'лв', RON: 'lei',
  };
  return map[code] ?? code;
}

/**
 * Formatea un número como moneda usando Intl.NumberFormat.
 * @param amount - Cantidad a formatear (acepta number, string o null/undefined; coerción segura)
 * @param currency - Código ISO 4217 (ej. "EUR", "GBP", "CHF"). Default "EUR" para retro-compat.
 * @param locale - Locale BCP47. Default "es-ES" (UI es español).
 * @returns String formateado con el símbolo correcto.
 */
// 🛡️ Round 28: ahora acepta currency y locale opcionales. Mientras la UI siga en es-ES,
// el locale por defecto sigue formateando con "1.234,56 GBP" → £1.234,56 (Intl gestiona
// la posición del símbolo según locale, no según currency). Si en el futuro pasamos el
// locale del usuario, basta con cambiar el default aquí.
//
// 🛡️ Round 10 — P-A FIX: coerción defensiva a número finito.
export function formatCurrency(amount: unknown, currency: string = 'EUR', locale: string = 'es-ES'): string {
  const safe = toFiniteNumber(amount);
  const safeCurrency = (currency ?? 'EUR').trim().toUpperCase() || 'EUR';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    // Currency inválida → fallback a EUR para no romper el render.
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  }
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
