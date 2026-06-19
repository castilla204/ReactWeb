import { describe, it, expect } from 'vitest';
import { hasAvailabilityInWindow, type SellerDaySummary } from './sellerBookingWindow';

const day = (date: string, freeSlots: number): SellerDaySummary => ({ date, freeSlots, isWorking: freeSlots > 0 });

describe('hasAvailabilityInWindow', () => {
    it('false cuando no hay huecos en ningún día', () => {
        expect(hasAvailabilityInWindow([day('2026-06-22', 0), day('2026-06-23', 0)])).toBe(false);
    });
    it('true cuando algún día tiene huecos', () => {
        expect(hasAvailabilityInWindow([day('2026-06-22', 0), day('2026-06-23', 2)])).toBe(true);
    });
    it('false con lista vacía', () => {
        expect(hasAvailabilityInWindow([])).toBe(false);
    });
});
