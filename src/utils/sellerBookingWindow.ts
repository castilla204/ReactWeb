/** Tope de la ventana de reserva del vendedor (2 semanas). */
export const SELLER_BOOKING_MAX_DAYS = 14;

/** Mínimo de días laborables del experto que debe abarcar la ventana. */
export const SELLER_BOOKING_MIN_BUSINESS_DAYS = 3;

export interface SellerDaySummary {
    date: string;
    freeSlots: number;
    isWorking: boolean;
}

export function parseAvailabilitySummary(raw: unknown): SellerDaySummary[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((row) => {
            const item = row as Record<string, unknown>;
            const date = String(item.Date ?? item.date ?? '');
            if (!date) return null;
            const freeSlots = Number(item.FreeSlots ?? item.freeSlots ?? 0);
            const isWorking = Boolean(item.IsWorking ?? item.isWorking ?? freeSlots > 0);
            return { date, freeSlots, isWorking };
        })
        .filter((d): d is SellerDaySummary => d !== null);
}

/**
 * Días de calendario mínimos desde hoy para cubrir N días laborables del experto.
 */
export function computeMinBookingCalendarDays(
    summaries: SellerDaySummary[],
    requiredBusinessDays = SELLER_BOOKING_MIN_BUSINESS_DAYS,
): number {
    if (summaries.length === 0) return requiredBusinessDays;

    let businessCount = 0;
    for (let i = 0; i < summaries.length; i++) {
        if (summaries[i].isWorking) {
            businessCount++;
            if (businessCount >= requiredBusinessDays) {
                return i + 1;
            }
        }
    }

    return Math.min(summaries.length, SELLER_BOOKING_MAX_DAYS);
}

export function clampSellerBookingDays(value: number, minDays: number, maxDays = SELLER_BOOKING_MAX_DAYS) {
    const min = Math.max(1, Math.min(minDays, maxDays));
    return Math.max(min, Math.min(maxDays, value));
}

export function sellerDeadlineHoursFromMaxDays(maxDays: number) {
    return maxDays * 24;
}

export function formatSellerBookingDaysLabel(days: number) {
    return days === 1 ? '1 día' : `${days} días`;
}

const deadlineDateFormatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});

/** Último día incluido en la ventana (día 1 = hoy). */
export function getSellerBookingDeadlineDate(
    windowDays: number,
    summaries: SellerDaySummary[] = [],
): Date {
    const summary = summaries[windowDays - 1];
    if (summary?.date) {
        const [y, m, d] = summary.date.split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + windowDays - 1);
    return date;
}

export function formatSellerBookingDeadlineDate(
    windowDays: number,
    summaries: SellerDaySummary[] = [],
): string {
    const formatted = deadlineDateFormatter.format(getSellerBookingDeadlineDate(windowDays, summaries));
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function countWorkingDaysInWindow(
    windowDays: number,
    summaries: SellerDaySummary[] = [],
): number {
    return summaries.slice(0, windowDays).filter((d) => d.isWorking).length;
}
