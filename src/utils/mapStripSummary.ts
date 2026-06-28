type StripService = {
    price?: number | null;
    imageUrls?: string[] | null;
    ImageUrls?: string[] | null;
};

export function getStripPriceFrom(services: StripService[]): number | null {
    const prices = services
        .map((s) => (typeof s.price === 'number' ? s.price : 0))
        .filter((p) => p > 0);
    if (prices.length === 0) return null;
    return Math.round(Math.min(...prices));
}

export function getStripThumbnails(services: StripService[], n = 3): string[] {
    const urls: string[] = [];
    for (const s of services) {
        const imgs = Array.isArray(s.imageUrls)
            ? s.imageUrls
            : Array.isArray(s.ImageUrls)
                ? s.ImageUrls
                : [];
        const first = imgs[0];
        if (first) urls.push(first);
        if (urls.length >= n) break;
    }
    return urls;
}

export function buildStripSummary({
    sortLabel,
    isDefaultSort,
    priceFrom,
}: {
    sortLabel: string;
    isDefaultSort: boolean;
    priceFrom: number | null;
}): string {
    const parts: string[] = [];
    if (!isDefaultSort) parts.push(sortLabel);
    if (priceFrom != null) parts.push(`desde ${priceFrom}€`);
    return parts.join(' · ');
}
