import { describe, it, expect } from 'vitest';
import { computeSlotDateRange, startOfDay } from './slotDateRange';

describe('computeSlotDateRange', () => {
    const today = new Date(2026, 5, 19, 14, 30, 0); // 19 jun 2026, 14:30 local

    it('minDate = hoy + minLeadDays a medianoche', () => {
        const { minDate } = computeSlotDateRange(today, 3, 5);
        expect(minDate).toEqual(new Date(2026, 5, 22, 0, 0, 0, 0));
    });

    it('maxDate = minDate + windowDays - 1', () => {
        const { maxDate } = computeSlotDateRange(today, 3, 5);
        expect(maxDate).toEqual(new Date(2026, 5, 26, 0, 0, 0, 0)); // 22 + (5-1) = 26
    });

    it('minLeadDays=0 deja minDate = hoy a medianoche (sin regresion checkout)', () => {
        const { minDate } = computeSlotDateRange(today, 0, 14);
        expect(minDate).toEqual(startOfDay(today));
    });

    it('minLeadDays negativo se trata como 0', () => {
        const { minDate } = computeSlotDateRange(today, -5, 14);
        expect(minDate).toEqual(startOfDay(today));
    });
});
