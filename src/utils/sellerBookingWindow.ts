/** Tope de la ventana de reserva del vendedor (2 semanas). */
export const SELLER_BOOKING_MAX_DAYS = 14;

/** Días de antelación mínima fijos (suelo de la cita). */
export const SELLER_BOOKING_MIN_LEAD_DAYS = 3;

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

/** ¿El experto tiene al menos un hueco libre en la ventana resumida? */
export function hasAvailabilityInWindow(summaries: SellerDaySummary[]): boolean {
    return summaries.some((d) => d.freeSlots > 0);
}
