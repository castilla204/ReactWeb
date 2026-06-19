export type CheckoutCoordinationMode = 'self' | 'seller';

export interface CheckoutCoordinationPayload {
    coordinationMode: CheckoutCoordinationMode;
    sellerPhone?: string | null;
    sellerEmail?: string | null;
    sellerListingUrl?: string | null;
}

export interface CheckoutRouteState {
    hireSearchLocation?: {
        locationName?: string | null;
        latitude?: string | null;
        longitude?: string | null;
    };
    coordinationMode?: CheckoutCoordinationMode;
    sellerPhone?: string | null;
    sellerEmail?: string | null;
    sellerListingUrl?: string | null;
}

export function readCheckoutCoordinationFromState(
    state: unknown,
): CheckoutCoordinationPayload | null {
    if (!state || typeof state !== 'object') return null;
    const s = state as CheckoutRouteState;
    if (s.coordinationMode !== 'self' && s.coordinationMode !== 'seller') return null;
    return {
        coordinationMode: s.coordinationMode,
        sellerPhone: s.sellerPhone ?? null,
        sellerEmail: s.sellerEmail ?? null,
        sellerListingUrl: s.sellerListingUrl ?? null,
    };
}
