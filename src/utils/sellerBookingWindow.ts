/** Tope de la ventana de reserva del vendedor (2 semanas). */
export const SELLER_BOOKING_MAX_DAYS = 14;

/** Días de antelación mínima fijos (suelo de la cita). */
export const SELLER_BOOKING_MIN_LEAD_DAYS = 3;

/** Ventana objetivo habitual: cita entre +3 y +7 días tras el pago. */
export const SELLER_BOOKING_TARGET_WINDOW_DAYS = 7;

/** Plazo para que el vendedor use el enlace y reserve (backend: SellerBookingDeadline). */
export const SELLER_BOOKING_LINK_DEADLINE_HOURS = 48;

/** Resumen ventana de fechas — alineado con SellerBookingWindow (NewApi). */
export const CHECKOUT_SELLER_PLAZO_SUMMARY =
    `Cita habitual entre ${SELLER_BOOKING_MIN_LEAD_DAYS} y ${SELLER_BOOKING_TARGET_WINDOW_DAYS} días tras el pago (máx. ${SELLER_BOOKING_MAX_DAYS} si no hay huecos). Reembolso si no reserva a tiempo.`;

/** Paso contacto vendedor — qué hace el enlace. */
export const SELLER_COORD_ENLACE_DETAILED =
    `Indica el móvil o email del vendedor. Tras pagar, le enviamos un enlace para que reserve día y hora entre los huecos del experto (según su horario en la app), de ${SELLER_BOOKING_MIN_LEAD_DAYS} a ${SELLER_BOOKING_TARGET_WINDOW_DAYS} días después del pago (hasta ${SELLER_BOOKING_MAX_DAYS} si no hay disponibilidad antes).`;

/** Tarjeta paso 1 — modo Inspecciono lo coordina (texto visible en la card). */
export const COORD_OPTION_SELLER_DESC =
    `Necesitamos el móvil o email del vendedor. Tras pagar, le enviamos un enlace para que elija día y hora entre la agenda del experto (huecos de su horario en la app), de ${SELLER_BOOKING_MIN_LEAD_DAYS} a ${SELLER_BOOKING_TARGET_WINDOW_DAYS} días después del pago (hasta ${SELLER_BOOKING_MAX_DAYS} si no hay disponibilidad).`;

/** Popover «más info» en la tarjeta Inspecciono lo coordina. */
export const SELLER_COORD_CARD_NOTE =
    `${SELLER_COORD_ENLACE_DETAILED} Reembolso íntegro si no reserva a tiempo.`;

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
