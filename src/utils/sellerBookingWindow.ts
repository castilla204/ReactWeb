/** Tope de la ventana de reserva del vendedor (2 semanas). */
export const SELLER_BOOKING_MAX_DAYS = 14;

/** Días de antelación mínima fijos (suelo de la cita). El suelo real efectivo lo marca la
 *  generación de huecos del backend (12h de antelación), así que +1 día es seguro: al experto
 *  siempre le quedan ≥12h para confirmar. Espejo de SellerBookingWindow.MinLeadDays (NewApi). */
export const SELLER_BOOKING_MIN_LEAD_DAYS = 1;

/** Ventana objetivo habitual: cita entre +1 y +5 días tras el pago. */
export const SELLER_BOOKING_TARGET_WINDOW_DAYS = 5;

/** Plazo para que el vendedor use el enlace y reserve (backend: SellerBookingDeadline). */
export const SELLER_BOOKING_LINK_DEADLINE_HOURS = 48;

/** Resumen ventana de fechas — alineado con SellerBookingWindow (NewApi). */
export const CHECKOUT_SELLER_PLAZO_SUMMARY =
    `El vendedor reserva entre ${SELLER_BOOKING_MIN_LEAD_DAYS} y ${SELLER_BOOKING_TARGET_WINDOW_DAYS} días tras el pago (máx. ${SELLER_BOOKING_MAX_DAYS}). Si no reserva a tiempo, te devolvemos el dinero.`;

/** Paso contacto vendedor — qué hace el enlace. */
export const SELLER_COORD_ENLACE_DETAILED =
    `Tras pagar, le enviamos un enlace al vendedor para que reserve día y hora entre los huecos libres del experto. Suele ser entre ${SELLER_BOOKING_MIN_LEAD_DAYS} y ${SELLER_BOOKING_TARGET_WINDOW_DAYS} días después del pago.`;

/** Tarjeta paso 1 — modo el vendedor elige la fecha (texto visible en la card). */
export const COORD_OPTION_SELLER_DESC =
    `El vendedor reserva un hueco libre del experto, normalmente en ${SELLER_BOOKING_MIN_LEAD_DAYS}–${SELLER_BOOKING_TARGET_WINDOW_DAYS} días. Tú no tienes que hablar con nadie.`;

/** Popover «más info» en la tarjeta Inspecciono lo coordina. */
export const SELLER_COORD_CARD_NOTE =
    `Necesitamos móvil o email del vendedor. Le mandamos un enlace para que elija un hueco libre del experto, normalmente entre ${SELLER_BOOKING_MIN_LEAD_DAYS} y ${SELLER_BOOKING_TARGET_WINDOW_DAYS} días tras el pago (hasta ${SELLER_BOOKING_MAX_DAYS} si tiene poca agenda). Si no reserva a tiempo, te reembolsamos el importe.`;

/** Calendario solo consulta (preview) en checkout modo vendedor. */
export const SELLER_COORD_CALENDAR_PREVIEW_NOTE =
    `Vista previa de la agenda del experto: el vendedor elegirá un hueco al reservar. ${CHECKOUT_SELLER_PLAZO_SUMMARY}`;

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
