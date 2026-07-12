/** Viewport < 768px (Tailwind md). */
export function isMobileViewport(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
}

/**
 * Ruta de chat pre-contratación para clientes.
 * Móvil → página dedicada. Desktop → bandeja de mensajes con panel derecho.
 */
export function buildClientPreHireChatPath(
    serviceId: number,
    options?: { conversationId?: number; mobile?: boolean },
): string {
    const mobile = options?.mobile ?? isMobileViewport();
    const conversationId = options?.conversationId;

    if (mobile) {
        return conversationId
            ? `/inquiry/${serviceId}?conversationId=${conversationId}`
            : `/inquiry/${serviceId}`;
    }

    const params = new URLSearchParams({ serviceId: String(serviceId) });
    if (conversationId) params.set('conversationId', String(conversationId));
    return `/messages?${params.toString()}`;
}
