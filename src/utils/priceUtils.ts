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
      formattedTotal: '€0.00',
      formattedBase: null,
      formattedTax: null,
    };
  }

  // Obtener valores (soporta tanto camelCase como PascalCase)
  const total = priceInfo.amount ?? priceInfo.Amount ?? 0;
  const base = priceInfo.baseAmount ?? priceInfo.BaseAmount ?? null;
  const tax = priceInfo.taxAmount ?? priceInfo.TaxAmount ?? null;

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
 * @param amount - Cantidad a formatear
 * @returns String formateado (ej: "€110.00")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
  const amount = priceInfo.amount ?? priceInfo.Amount ?? 0;

  // Si no hay información de tax, no validar
  if (baseAmount == null || taxAmount == null) {
    return true;
  }

  const calculatedTotal = baseAmount + taxAmount;
  const difference = Math.abs(calculatedTotal - amount);

  // Permitir pequeñas diferencias por redondeo (ej: 0.01€)
  return difference < 0.02;
}

