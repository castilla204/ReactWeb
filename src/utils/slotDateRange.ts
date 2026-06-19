/** Inicio del día (00:00 local) de una copia de la fecha dada. */
export function startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

/**
 * Rango de fechas seleccionables del SlotPicker.
 * minDate = hoy + minLeadDays (suelo de antelación); maxDate = minDate + windowDays - 1.
 */
export function computeSlotDateRange(
    today: Date,
    minLeadDays: number,
    windowDays: number,
): { minDate: Date; maxDate: Date } {
    const lead = Math.max(0, minLeadDays);
    const minDate = startOfDay(today);
    minDate.setDate(minDate.getDate() + lead);
    const maxDate = new Date(minDate);
    maxDate.setDate(maxDate.getDate() + windowDays - 1);
    return { minDate, maxDate };
}

/** Día siguiente (mañana) acotado al rango seleccionable — p. ej. consulta en modo vendedor. */
export function resolveNextDayInRange(minDate: Date, maxDate: Date): Date {
    const next = startOfDay(new Date());
    next.setDate(next.getDate() + 1);
    if (next < minDate) return new Date(minDate);
    if (next > maxDate) return new Date(maxDate);
    return next;
}
