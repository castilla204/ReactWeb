import { useEffect, useMemo, useState } from 'react';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import {
    SELLER_BOOKING_MAX_DAYS,
    computeMinBookingCalendarDays,
    parseAvailabilitySummary,
    type SellerDaySummary,
} from '../utils/sellerBookingWindow';

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function useSellerBookingLimits(serviceId: number | undefined, enabled: boolean) {
    const [summaries, setSummaries] = useState<SellerDaySummary[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled || !serviceId) {
            setSummaries([]);
            return;
        }

        let cancelled = false;
        setLoading(true);

        (async () => {
            try {
                const token = getAuthToken();
                const from = toYmd(new Date());
                const url = `${API_CONFIG.baseUrl}/api/Availability/service/${serviceId}/summary?from=${from}&days=${SELLER_BOOKING_MAX_DAYS}`;
                const res = await fetch(url, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error(String(res.status));
                const data = await res.json();
                if (!cancelled) setSummaries(parseAvailabilitySummary(data));
            } catch {
                if (!cancelled) setSummaries([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled, serviceId]);

    const minDays = useMemo(
        () => computeMinBookingCalendarDays(summaries),
        [summaries],
    );

    return {
        summaries,
        minDays,
        maxDays: SELLER_BOOKING_MAX_DAYS,
        loading,
    };
}
