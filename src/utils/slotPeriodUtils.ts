/** Hasta las 14:00 (excl.) = mañana; desde las 14:00 = tarde. */
export const SLOT_AFTERNOON_START_HOUR = 14;

export type SlotDayPeriod = 'morning' | 'afternoon';

export interface SlotTimeLike {
    label: string;
}

export function parseSlotHour(label: string): number {
    const [h] = label.split(':');
    const hour = Number(h);
    return Number.isFinite(hour) ? hour : 0;
}

export function slotPeriod(label: string): SlotDayPeriod {
    return parseSlotHour(label) < SLOT_AFTERNOON_START_HOUR ? 'morning' : 'afternoon';
}

export function splitSlotsByPeriod<T extends SlotTimeLike>(slots: T[]) {
    const morning: T[] = [];
    const afternoon: T[] = [];
    for (const slot of slots) {
        if (slotPeriod(slot.label) === 'morning') morning.push(slot);
        else afternoon.push(slot);
    }
    return { morning, afternoon };
}

export function filterSlotsByPeriod<T extends SlotTimeLike>(slots: T[], period: SlotDayPeriod | 'all') {
    if (period === 'all') return slots;
    return slots.filter((s) => slotPeriod(s.label) === period);
}

export const SLOT_PERIOD_LABELS: Record<SlotDayPeriod, string> = {
    morning: 'Mañana',
    afternoon: 'Tarde',
};

export const SLOT_PERIOD_HINTS: Record<SlotDayPeriod, string> = {
    morning: 'Antes de las 14:00',
    afternoon: 'Desde las 14:00',
};
